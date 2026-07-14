import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isPushSupported,
  requestPermissionAndSubscribe,
  unsubscribePush,
  sendTestNotification,
} from '@/lib/pushNotifications';

interface Props {
  userId: string;
}

interface Prefs {
  enabled: boolean;
  morning_motivation: boolean;
  task_reminders: boolean;
  wake_alarm: boolean;
  sleep_alarm: boolean;
  wake_time: string; // HH:MM
  sleep_time: string; // HH:MM
  timezone: string;
}

const DEFAULTS: Prefs = {
  enabled: false,
  morning_motivation: true,
  task_reminders: true,
  wake_alarm: true,
  sleep_alarm: true,
  wake_time: '06:00',
  sleep_time: '22:00',
  timezone: 'Africa/Lagos',
};

const trimSec = (t?: string | null) => (t ? t.slice(0, 5) : '');

export function NotificationSettings({ userId }: Props) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    ...DEFAULTS,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos',
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notification_preferences' as any)
      .select('enabled, morning_motivation, task_reminders, wake_alarm, sleep_alarm, wake_time, sleep_time, timezone')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setPrefs({
        enabled: !!d.enabled,
        morning_motivation: d.morning_motivation ?? true,
        task_reminders: d.task_reminders ?? true,
        wake_alarm: d.wake_alarm ?? true,
        sleep_alarm: d.sleep_alarm ?? true,
        wake_time: trimSec(d.wake_time) || DEFAULTS.wake_time,
        sleep_time: trimSec(d.sleep_time) || DEFAULTS.sleep_time,
        timezone: d.timezone || 'Africa/Lagos',
      });
    }
    setLoading(false);
  };

  const persist = async (next: Prefs) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || next.timezone;
    const { error } = await supabase
      .from('notification_preferences' as any)
      .upsert(
        {
          user_id: userId,
          enabled: next.enabled,
          morning_motivation: next.morning_motivation,
          task_reminders: next.task_reminders,
          wake_alarm: next.wake_alarm,
          sleep_alarm: next.sleep_alarm,
          wake_time: next.wake_time,
          sleep_time: next.sleep_time,
          timezone: tz,
          language,
        },
        { onConflict: 'user_id' }
      );
    if (error) {
      toast.error('Could not save preference');
      return false;
    }
    return true;
  };

  const handleMasterToggle = async (next: boolean) => {
    setSaving(true);
    if (next) {
      const res = await requestPermissionAndSubscribe();
      if (!res.ok) {
        toast.error(
          res.reason === 'denied'
            ? 'Notifications blocked. Enable them in your browser settings.'
            : "Couldn't enable notifications."
        );
        setSaving(false);
        return;
      }
      const updated = { ...prefs, enabled: true };
      setPrefs(updated);
      await persist(updated);
      toast.success('Daily notifications enabled');
    } else {
      await unsubscribePush();
      const updated = { ...prefs, enabled: false };
      setPrefs(updated);
      await persist(updated);
      toast.success('Notifications turned off');
    }
    setSaving(false);
  };

  const handleTypeToggle = async (
    key: 'morning_motivation' | 'task_reminders' | 'wake_alarm' | 'sleep_alarm',
    next: boolean
  ) => {
    const updated = { ...prefs, [key]: next };
    setPrefs(updated);
    setSaving(true);
    const ok = await persist(updated);
    setSaving(false);
    if (ok) toast.success('Preference saved');
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    const ok = await persist(prefs);
    setSavingSchedule(false);
    if (ok) toast.success('Sleep & wake schedule saved');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base sm:text-lg">Daily Notifications</CardTitle>
            <CardDescription>Get a daily nudge from DoAm to keep you on track.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !isPushSupported() ? (
          <p className="text-sm text-muted-foreground">
            Push notifications aren't supported on this device or browser.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Enable notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Master switch for all push notifications from DoAm.
                </p>
              </div>
              <Switch
                checked={prefs.enabled}
                onCheckedChange={handleMasterToggle}
                disabled={saving}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Daily morning motivation</Label>
                  <p className="text-xs text-muted-foreground">
                    A motivational nudge from DoAm at 8:00 AM (WAT).
                  </p>
                </div>
                <Switch
                  checked={prefs.morning_motivation}
                  onCheckedChange={(v) => handleTypeToggle('morning_motivation', v)}
                  disabled={!prefs.enabled || saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Daily task reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Pushes when a task's due time arrives, plus overdue nudges.
                  </p>
                </div>
                <Switch
                  checked={prefs.task_reminders}
                  onCheckedChange={(v) => handleTypeToggle('task_reminders', v)}
                  disabled={!prefs.enabled || saving}
                />
              </div>
            </div>

            {/* Sleep & Wake Schedule */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold text-sm">Sleep & Wake Schedule</h4>
                <p className="text-xs text-muted-foreground">
                  DoAm will send you a good-morning and good-night nudge at these times.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wake-time" className="flex items-center gap-2 text-sm">
                    <Sun className="h-4 w-4 text-amber-500" /> I wake up at
                  </Label>
                  <Input
                    id="wake-time"
                    type="time"
                    value={prefs.wake_time}
                    onChange={(e) => setPrefs({ ...prefs, wake_time: e.target.value })}
                    disabled={!prefs.enabled}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep-time" className="flex items-center gap-2 text-sm">
                    <Moon className="h-4 w-4 text-indigo-500" /> I sleep at
                  </Label>
                  <Input
                    id="sleep-time"
                    type="time"
                    value={prefs.sleep_time}
                    onChange={(e) => setPrefs({ ...prefs, sleep_time: e.target.value })}
                    disabled={!prefs.enabled}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Wake-up alarm</Label>
                <Switch
                  checked={prefs.wake_alarm}
                  onCheckedChange={(v) => handleTypeToggle('wake_alarm', v)}
                  disabled={!prefs.enabled || saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Sleep alarm</Label>
                <Switch
                  checked={prefs.sleep_alarm}
                  onCheckedChange={(v) => handleTypeToggle('sleep_alarm', v)}
                  disabled={!prefs.enabled || saving}
                />
              </div>

              <Button
                onClick={handleSaveSchedule}
                disabled={!prefs.enabled || savingSchedule}
                className="w-full sm:w-auto"
              >
                {savingSchedule ? 'Saving…' : 'Save'}
              </Button>

              <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                💡 For a guaranteed alarm, we recommend also setting this time
                in your phone's clock app. DoAm will send you a notification
                reminder too.
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!prefs.enabled}
                onClick={async () => {
                  const res = await sendTestNotification();
                  if (res.ok) {
                    toast.success('Test notification sent — check your device 🔔');
                  } else if ((res.info as any)?.reason === 'no-subscriptions') {
                    toast.error('No active push subscription. Toggle notifications off and on, then retry.');
                  } else {
                    toast.error(res.error || 'Could not send test notification');
                  }
                }}
              >
                Send test notification
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Morning motivation & task-reminder times are fixed to West Africa Time (WAT, UTC+1).
              Sleep & wake alarms follow your device timezone.
            </p>
          </>

        )}
      </CardContent>
    </Card>
  );
}

export default NotificationSettings;
