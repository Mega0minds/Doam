// Sends task-due reminders + overdue reminders.
// Cron: every 15 minutes (*/15 * * * *).
//
// IMPORTANT: tasks.due_time is stored as a local time in WAT (UTC+1). We
// convert (due_date + due_time) WAT -> UTC by subtracting 1 hour before
// comparing to the cron's "now" in UTC.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WAT_OFFSET_MS = 60 * 60 * 1000; // UTC+1

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
      .select('user_id, enabled, task_reminders')
      .eq('enabled', true)
      .eq('task_reminders', true);
    if (prefsErr) throw prefsErr;

    const userIds = (prefs ?? []).map((p: any) => p.user_id);
    console.log('[task-reminders] eligible users:', userIds.length);
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

    const subsByUser = new Map<string, any[]>();
    for (const s of (subs ?? []) as any[]) {
      const arr = subsByUser.get(s.user_id) ?? [];
      arr.push(s);
      subsByUser.set(s.user_id, arr);
    }

    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('id, user_id, title, status, due_date, due_time, reminder_enabled, reminder_sent_at, overdue_reminder_sent_at')
      .in('user_id', userIds)
      .eq('reminder_enabled', true)
      .not('due_date', 'is', null);
    if (tasksErr) throw tasksErr;

    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    console.log('[task-reminders] candidate tasks:', tasks?.length ?? 0, 'now UTC:', new Date(now).toISOString());

    type Job = {
      taskId: string;
      userId: string;
      kind: 'due' | 'overdue';
      title: string;
    };
    const jobs: Job[] = [];

    for (const t of (tasks ?? []) as any[]) {
      if (!t.due_date) continue;
      const timeStr = (t.due_time ?? '09:00:00').slice(0, 8);
      // due_date + due_time are in WAT (UTC+1). Parse as if UTC then subtract
      // 1 hour to get the real UTC moment.
      const watMs = Date.parse(`${t.due_date}T${timeStr}Z`);
      if (Number.isNaN(watMs)) continue;
      const dueMs = watMs - WAT_OFFSET_MS;
      const diff = dueMs - now;

      // Due-time reminder: due within next 15min, or already past but never sent (up to 24h ago).
      if (!t.reminder_sent_at && diff <= windowMs && diff > -24 * 60 * 60 * 1000) {
        console.log('[task-reminders] DUE job', { id: t.id, title: t.title, diffMin: Math.round(diff / 60000) });
        jobs.push({ taskId: t.id, userId: t.user_id, kind: 'due', title: t.title });
        continue;
      }

      // Overdue reminder: more than 15min past, still incomplete, not yet sent.
      if (
        t.status !== 'Complete' &&
        !t.overdue_reminder_sent_at &&
        diff < -windowMs &&
        diff > -7 * 24 * 60 * 60 * 1000
      ) {
        console.log('[task-reminders] OVERDUE job', { id: t.id, title: t.title, diffMin: Math.round(diff / 60000) });
        jobs.push({ taskId: t.id, userId: t.user_id, kind: 'overdue', title: t.title });
      }
    }

    console.log('[task-reminders] total jobs:', jobs.length);

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];
    const markedDue: string[] = [];
    const markedOverdue: string[] = [];

    for (const job of jobs) {
      const userSubs = subsByUser.get(job.userId) ?? [];
      if (userSubs.length === 0) {
        console.warn('[task-reminders] no subscriptions for user', job.userId);
        continue;
      }

      const title = job.kind === 'due' ? 'Task Reminder ⏰' : "You've got an overdue task 👀";
      const body =
        job.kind === 'due'
          ? `Time to work on: ${job.title}. You've got this!`
          : `${job.title} is overdue. Still time to get it done.`;

      const payload = JSON.stringify({ title, body, url: '/tasks', kind: 'task' });

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
          console.error('[task-reminders] push failed', { user: job.userId, status: err?.statusCode, body: err?.body });
        }
      }
      if (anySent) {
        if (job.kind === 'due') markedDue.push(job.taskId);
        else markedOverdue.push(job.taskId);
      }
    }

    const nowIso = new Date().toISOString();
    if (markedDue.length > 0) {
      await supabase.from('tasks').update({ reminder_sent_at: nowIso }).in('id', markedDue);
    }
    if (markedOverdue.length > 0) {
      await supabase.from('tasks').update({ overdue_reminder_sent_at: nowIso }).in('id', markedOverdue);
    }
    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired);
    }

    return new Response(
      JSON.stringify({ sent, failed, eligible: userIds.length, jobs: jobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[task-reminders] error', e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
