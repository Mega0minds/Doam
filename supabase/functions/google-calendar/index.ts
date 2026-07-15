import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GCAL = 'https://www.googleapis.com/calendar/v3';

async function getValidToken(supabase: any, userId: string): Promise<string> {
  const { data: row, error } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !row) throw new Error('Google Calendar not connected. Please sign in with Google again.');

  // Token still valid
  if (row.expires_at && new Date(row.expires_at) > new Date(Date.now() + 60_000)) {
    return row.access_token;
  }

  // Refresh it
  if (!row.refresh_token) throw new Error('No refresh token. Please sign in with Google again.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: row.refresh_token,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh Google token. Please reconnect Google Calendar.');
  const refreshed = await res.json();

  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from('google_tokens')
    .update({ access_token: refreshed.access_token, expires_at: expiresAt })
    .eq('user_id', userId);

  return refreshed.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    const body = await req.json();
    const { action } = body;

    // ── EXCHANGE auth code — runs before token check ────────────────────
    if (action === 'exchange_code') {
      const { code, redirect_uri } = body;

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          redirect_uri,
          grant_type: 'authorization_code',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Token exchange failed: ${err}`);
      }

      const tokens = await res.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase.from('google_tokens' as any).upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
      }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getValidToken(supabase, user.id);
    const gcalHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // ── CREATE or UPDATE event ──────────────────────────────────────────
    if (action === 'create') {
      const { title, date, description, gcal_event_id } = body;

      // Build event body — all-day if only a date, timed if ISO timestamp
      const isDateTime = date.includes('T');
      const eventBody: any = {
        summary: title,
        description: description || 'Added from DoAm',
        ...(isDateTime
          ? { start: { dateTime: date, timeZone: 'UTC' }, end: { dateTime: date, timeZone: 'UTC' } }
          : { start: { date }, end: { date } }),
      };

      const url = gcal_event_id
        ? `${GCAL}/calendars/primary/events/${gcal_event_id}`
        : `${GCAL}/calendars/primary/events`;

      const res = await fetch(url, {
        method: gcal_event_id ? 'PUT' : 'POST',
        headers: gcalHeaders,
        body: JSON.stringify(eventBody),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Calendar error: ${err}`);
      }

      const event = await res.json();
      return new Response(JSON.stringify({ success: true, event_id: event.id, html_link: event.htmlLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── LIST events in a date range ─────────────────────────────────────
    if (action === 'list') {
      const { time_min, time_max } = body;
      const params = new URLSearchParams({
        timeMin: time_min,
        timeMax: time_max,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const res = await fetch(`${GCAL}/calendars/primary/events?${params}`, { headers: gcalHeaders });
      if (!res.ok) throw new Error('Failed to fetch Google Calendar events');

      const data = await res.json();
      const events = (data.items || []).map((e: any) => ({
        id: e.id,
        title: e.summary || '(No title)',
        date: e.start?.date || e.start?.dateTime?.slice(0, 10),
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        is_all_day: !!e.start?.date,
        html_link: e.htmlLink,
      }));

      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE event ────────────────────────────────────────────────────
    if (action === 'delete') {
      const { gcal_event_id } = body;
      const res = await fetch(`${GCAL}/calendars/primary/events/${gcal_event_id}`, {
        method: 'DELETE',
        headers: gcalHeaders,
      });
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        throw new Error('Failed to delete Google Calendar event');
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CHECK connection status ─────────────────────────────────────────
    if (action === 'status') {
      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DEBUG: check what scopes the stored token actually has ──────────
    if (action === 'debug_scopes') {
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
      );
      const info = await res.json();
      return new Response(JSON.stringify(info), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (err: any) {
    const isNotConnected = err.message?.includes('not connected') || err.message?.includes('reconnect');
    return new Response(JSON.stringify({ error: err.message }), {
      status: isNotConnected ? 400 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
