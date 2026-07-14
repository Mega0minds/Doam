// Sends daily push notifications to subscribers whose local "preferred_time"
// matches the current hour. Designed to be invoked hourly via pg_cron.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const MESSAGES = [
  { title: 'DoAm', body: "Good morning! DoAm is up and ready — are you? Let's make today count. 🕐" },
  { title: 'DoAm', body: "You didn't come this far to only come this far. Open DoAm and keep going. 💪" },
  { title: 'DoAm', body: "Hey, your goals aren't going to chase themselves. DoAm believes in you though. 🚀" },
  { title: 'DoAm', body: 'Small steps every day = massive results over time. Check in on your tasks today. ✅' },
  { title: 'DoAm', body: 'Even on weekends, your future self is watching. Make it count. 🌟' },
];

interface PrefRow {
  user_id: string;
  enabled: boolean;
  preferred_time: string;
  timezone: string;
  last_message_index: number;
  last_sent_at: string | null;
}

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function localHourMinute(tz: string): { hour: number; minute: number; dateKey: string } {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
    return {
      hour: parseInt(get('hour'), 10) % 24,
      minute: parseInt(get('minute'), 10),
      dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    };
  } catch {
    const now = new Date();
    return {
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      dateKey: now.toISOString().slice(0, 10),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@doam.app';

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'VAPID keys missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let url: URL;
    try { url = new URL(req.url); } catch { url = new URL('http://x/'); }
    const force = url.searchParams.get('force') === '1';
    const targetUserId = url.searchParams.get('user_id');

    // Fetch enabled prefs
    let prefQuery = supabase
      .from('notification_preferences')
      .select('user_id, enabled, preferred_time, timezone, last_message_index, last_sent_at')
      .eq('enabled', true);
    if (targetUserId) prefQuery = prefQuery.eq('user_id', targetUserId);

    const { data: prefs, error: prefsErr } = await prefQuery;
    if (prefsErr) throw prefsErr;

    const dueUsers: { pref: PrefRow; messageIdx: number }[] = [];
    for (const p of (prefs ?? []) as PrefRow[]) {
      const tz = p.timezone || 'Africa/Lagos';
      const { hour, minute, dateKey } = localHourMinute(tz);
      const [pHour, pMinute] = (p.preferred_time || '08:00:00').split(':').map((x) => parseInt(x, 10));

      // Match within the same hour, allow a 0-59 minute window (cron runs hourly)
      const hourMatches = hour === pHour;
      // Avoid double-sending in the same local day
      const lastDateKey = p.last_sent_at
        ? localHourMinute(tz).dateKey === new Date(p.last_sent_at).toISOString().slice(0, 10)
          ? new Date(p.last_sent_at).toISOString().slice(0, 10)
          : null
        : null;
      const alreadySentToday =
        p.last_sent_at &&
        new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(p.last_sent_at)) === dateKey;

      if (force || (hourMatches && !alreadySentToday)) {
        const nextIdx = ((p.last_message_index ?? -1) + 1) % MESSAGES.length;
        dueUsers.push({ pref: p, messageIdx: nextIdx });
      }
      // silence unused lint
      void pMinute;
      void minute;
      void lastDateKey;
    }

    if (dueUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: prefs?.length ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch subs for those users
    const userIds = dueUsers.map((d) => d.pref.user_id);
    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);
    if (subsErr) throw subsErr;

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    for (const due of dueUsers) {
      const userSubs = ((subs ?? []) as SubRow[]).filter((s) => s.user_id === due.pref.user_id);
      if (userSubs.length === 0) continue;

      const msg = MESSAGES[due.messageIdx];
      const payload = JSON.stringify({ title: msg.title, body: msg.body, url: '/dashboard' });

      for (const s of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          failed++;
          if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.id);
          console.error('push failed', s.endpoint, err?.statusCode, err?.body);
        }
      }

      await supabase
        .from('notification_preferences')
        .update({
          last_message_index: due.messageIdx,
          last_sent_at: new Date().toISOString(),
        })
        .eq('user_id', due.pref.user_id);
    }

    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired);
    }

    return new Response(
      JSON.stringify({ sent, failed, due: dueUsers.length, expired: expired.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('send-daily-notifications error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
