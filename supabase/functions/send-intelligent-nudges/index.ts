// Intelligent contextual nudges. Cron: hourly. Only fires between 09:00 and
// 21:00 WAT (08:00 and 20:00 UTC) and sends at most ONE nudge per user per day.
// The message depends on the user's task state and activity:
//   - No activity today  → "Haven't seen you today..."
//   - All tasks complete → "You cleared everything today..."
//   - Has incomplete tasks → "Hey, you still have pending tasks today..."
// Tracked via notification_preferences.last_intelligent_sent_date.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function todayWAT(): string {
  const now = new Date();
  const wat = new Date(now.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}

function hourWAT(): number {
  const now = new Date();
  const wat = new Date(now.getTime() + 60 * 60 * 1000);
  return wat.getUTCHours();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const hour = hourWAT();
  if (hour < 9 || hour > 21) {
    return new Response(JSON.stringify({ skipped: 'outside-window', hour }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

    const today = todayWAT();

    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('user_id, last_active_date, last_intelligent_sent_date')
      .eq('enabled', true);
    if (error) throw error;

    const eligible = (prefs ?? []).filter(
      (p: any) => p.last_intelligent_sent_date !== today
    ) as any[];
    if (eligible.length === 0) {
      return new Response(JSON.stringify({ sent: 0, eligible: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Roll a probability so we don't spam every eligible user every hour.
    // Hours remaining in window = 21 - hour + 1, so probability ≈ 1/remaining,
    // which roughly evens out distribution across the active window.
    const hoursLeft = Math.max(1, 22 - hour);
    const shouldFire = (id: string) => {
      // Deterministic per user+day+hour so retries don't double-send.
      let h = 0;
      const str = `${id}-${today}-${hour}`;
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
      const r = (Math.abs(h) % 1000) / 1000;
      return r < 1 / hoursLeft;
    };

    const targets = eligible.filter((p) => shouldFire(p.user_id));
    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0, eligible: eligible.length, deferred: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetIds = targets.map((p) => p.user_id);

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', targetIds);
    const subsByUser = new Map<string, any[]>();
    for (const s of (subs ?? []) as any[]) {
      const arr = subsByUser.get(s.user_id) ?? [];
      arr.push(s);
      subsByUser.set(s.user_id, arr);
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('user_id, status, due_date')
      .in('user_id', targetIds)
      .eq('due_date', today);
    const stats = new Map<string, { total: number; incomplete: number }>();
    for (const t of (tasks ?? []) as any[]) {
      const s = stats.get(t.user_id) ?? { total: 0, incomplete: 0 };
      s.total++;
      if (t.status !== 'Complete') s.incomplete++;
      stats.set(t.user_id, s);
    }

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];
    const sentUserIds: string[] = [];

    for (const p of targets) {
      const userSubs = subsByUser.get(p.user_id) ?? [];
      if (userSubs.length === 0) continue;

      const userStats = stats.get(p.user_id) ?? { total: 0, incomplete: 0 };
      let title: string;
      let body: string;

      if (p.last_active_date !== today) {
        title = 'Missing you 👀';
        body = "Haven't seen you today. Your goals are waiting for you.";
      } else if (userStats.total > 0 && userStats.incomplete === 0) {
        title = 'You did it! 🎉';
        body = "You cleared everything today! Rest well, you earned it.";
      } else if (userStats.incomplete > 0) {
        title = "DoAm's checking in 💪";
        body = `Hey, you still have ${userStats.incomplete} pending task${userStats.incomplete === 1 ? '' : 's'} today. Let's knock them out.`;
      } else {
        // Active but no tasks scheduled today — give a soft nudge.
        title = "Plan your day 📝";
        body = "Drop a quick task or two into DoAm — momentum loves a plan.";
      }

      const payload = JSON.stringify({ title, body, url: '/dashboard' });
      let anySent = false;
      for (const s of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          sent++;
          anySent = true;
        } catch (err: any) {
          failed++;
          if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.id);
          console.error('intelligent push failed', err?.statusCode);
        }
      }
      if (anySent) sentUserIds.push(p.user_id);
    }

    if (sentUserIds.length > 0) {
      // Upsert one row per user marking today as sent.
      for (const uid of sentUserIds) {
        await supabase
          .from('notification_preferences')
          .update({ last_intelligent_sent_date: today })
          .eq('user_id', uid);
      }
    }
    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired);
    }

    return new Response(
      JSON.stringify({ sent, failed, eligible: eligible.length, fired: targets.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('send-intelligent-nudges error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
