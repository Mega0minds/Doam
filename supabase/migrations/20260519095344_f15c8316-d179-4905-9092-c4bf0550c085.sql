
-- Add language + sleep/wake + activity tracking + intelligent-nudge gating
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS wake_time time NOT NULL DEFAULT '06:00:00',
  ADD COLUMN IF NOT EXISTS sleep_time time NOT NULL DEFAULT '22:00:00',
  ADD COLUMN IF NOT EXISTS wake_alarm boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sleep_alarm boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS last_intelligent_sent_date date;

-- Track which task reminders we've already pushed (avoids duplicate sends every 15min)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS overdue_reminder_sent_at timestamptz;
