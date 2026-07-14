ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS morning_motivation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS task_reminders boolean NOT NULL DEFAULT true;