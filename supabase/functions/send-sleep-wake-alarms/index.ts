// Per-minute sleep & wake alarm sender.
// Cron: * * * * *
//
// notification_preferences.wake_time / sleep_time are stored as local WAT
// (UTC+1). We compare them to the current WAT HH:MM, computed by adding
// 1 hour to UTC now.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Current time in WAT (UTC+1) — compare HH:MM only.
    const watNow = new Date(Date.now() + 60 * 60 * 1000);
    const hhmm = `${String(watNow.getUTCHours()).padStart(2, '0')}:${String(watNow.getUTCMinutes()).padStart(2, '0')}`;

    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('user_id, enabled, wake_alarm, sleep_alarm, wake_time, sleep_time')
      .eq('enabled', true);
    if (error) throw error;

    type Job = { userId: string; kind: 'wake' | 'sleep' };
    const jobs: Job[] = [];

    for (const p of (prefs ?? []) as any[]) {
      const w = (p.wake_time ?? '').slice(0, 5);
      const s = (p.sleep_time ?? '').slice(0, 5);
      if (p.wake_alarm && w === hhmm) jobs.push({ userId: p.user_id, kind: 'wake' });
      if (p.sleep_alarm && s === hhmm) jobs.push({ userId: p.user_id, kind: 'sleep' });
    }

    console.log('[sleep-wake] WAT', hhmm, 'eligible prefs:', prefs?.length ?? 0, 'matched jobs:', jobs.length);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, watMinute: hhmm }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = Array.from(new Set(jobs.map((j) => j.userId)));
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    const subsByUser = new Map<string, any[]>();
    for (const s of (subs ?? []) as any[]) {
      const arr = subsByUser.get(s.user_id) ?? [];
      arr.push(s);
      subsByUser.set(s.user_id, arr);
    }

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    for (const job of jobs) {
      const userSubs = subsByUser.get(job.userId) ?? [];
      if (userSubs.length === 0) continue;

      const payload = JSON.stringify(
        job.kind === 'wake'
          ? {
              title: 'Good morning! 🌅',
              body: "Time to rise. Your goals are waiting. Let's make today count.",
              url: '/dashboard?alarm=wake',
              kind: 'wake',
              requireInteraction: true,
            }
          : {
              title: 'Time to rest 🌙',
              body: 'You showed up today. Rest well and come back stronger tomorrow.',
              url: '/dashboard?alarm=sleep',
              kind: 'sleep',
              requireInteraction: true,
            }
      );

      for (const s of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          sent++;
          console.log('[sleep-wake] sent', job.kind, 'to user', job.userId);
        } catch (err: any) {
          failed++;
          if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.id);
          console.error('[sleep-wake] push failed', { user: job.userId, status: err?.statusCode, body: err?.body });
        }
      }
    }

    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired);
    }

    return new Response(
      JSON.stringify({ sent, failed, jobs: jobs.length, watMinute: hhmm }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[sleep-wake] error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
