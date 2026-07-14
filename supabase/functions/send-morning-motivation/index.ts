// Sends a daily morning motivational push to all opted-in users.
// Scheduled via pg_cron at 07:00 UTC (08:00 WAT).
// Message list is chosen by the user's preferred language.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MESSAGES: Record<'en' | 'pidgin', string[]> = {
  en: [
    "You're building momentum 🔥",
    "Small wins become big results.",
    "Locked in. Keep going.",
    "Consistency looks good on you.",
    "Another step closer.",
    "That's how it's done. Keep going.",
    "One task down. You're on a roll.",
  ],
  pidgin: [
    "You dey try 🔥",
    "Small small, you go reach there.",
    "No loose guard, you don almost finish am.",
    "Na consistency dey carry person go far.",
    "You show up today. That one matter.",
    "Sharp! Another task don clear.",
    "You too active abeg 😭🔥",
    "Steady grinding. We see you.",
    "Your future self go thank you for this.",
    "No give up now, momentum dey build.",
    "You don pass yesterday's version of yourself.",
    "One step closer. Keep moving.",
    "DoAm dey proud of you 😎",
    "You lock in today.",
    "Nothing do you. Continue.",
    "Rest small if you need am, then bounce back.",
    "You fit do am.",
    "Today never waste.",
    "Progress na progress, no matter how small.",
    "You dey enter your productive era 😭🔥",
  ],
};

function dayOfYearWAT(): number {
  const now = new Date();
  const wat = new Date(now.getTime() + 60 * 60 * 1000);
  const start = Date.UTC(wat.getUTCFullYear(), 0, 0);
  return Math.floor((wat.getTime() - start) / 86400000);
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

    const { data: prefs, error: prefsErr } = await supabase
      .from('notification_preferences')
      .select('user_id, language')
      .eq('enabled', true)
      .eq('morning_motivation', true);
    if (prefsErr) throw prefsErr;

    const prefsByUser = new Map<string, 'en' | 'pidgin'>();
    for (const p of (prefs ?? []) as any[]) {
      prefsByUser.set(p.user_id, p.language === 'pidgin' ? 'pidgin' : 'en');
    }
    const userIds = Array.from(prefsByUser.keys());
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, eligible: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);
    if (subsErr) throw subsErr;

    const day = dayOfYearWAT();
    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    for (const s of (subs ?? []) as any[]) {
      const lang = prefsByUser.get(s.user_id) ?? 'en';
      const list = MESSAGES[lang];
      const body = list[day % list.length];
      const payload = JSON.stringify({
        title: 'Good morning! ☀️',
        body,
        url: '/dashboard',
      });
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.id);
        console.error('morning push failed', s.endpoint, err?.statusCode, err?.body);
      }
    }

    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired);
    }

    return new Response(
      JSON.stringify({ sent, failed, eligible: userIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('send-morning-motivation error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
