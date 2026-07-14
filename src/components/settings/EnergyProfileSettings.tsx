import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, Clock, Save, Loader2 } from 'lucide-react';

interface EnergyProfileSettingsProps {
  userId: string;
}

export function EnergyProfileSettings({ userId }: EnergyProfileSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    chronotype: 'neutral',
    wakeTime: '07:00',
    sleepTime: '23:00',
    highFocusStart: '09:00',
    highFocusEnd: '12:00',
    lowEnergyStart: '14:00',
    lowEnergyEnd: '15:30',
  });

  const chronotypes = [
    { value: 'early_bird', label: 'Early Bird', icon: Sun, description: 'I wake up early and feel most productive in the morning' },
    { value: 'night_owl', label: 'Night Owl', icon: Moon, description: 'I come alive in the evening and work best at night' },
    { value: 'neutral', label: 'Somewhere in Between', icon: Clock, description: 'My energy is fairly consistent throughout the day' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('energy_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setProfile({
          chronotype: data.chronotype || 'neutral',
          wakeTime: data.wake_time || '07:00',
          sleepTime: data.sleep_time || '23:00',
          highFocusStart: data.high_focus_start || '09:00',
          highFocusEnd: data.high_focus_end || '12:00',
          lowEnergyStart: data.low_energy_start || '14:00',
          lowEnergyEnd: data.low_energy_end || '15:30',
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('energy_profiles').upsert({
        user_id: userId,
        chronotype: profile.chronotype,
        wake_time: profile.wakeTime,
        sleep_time: profile.sleepTime,
        high_focus_start: profile.highFocusStart,
        high_focus_end: profile.highFocusEnd,
        low_energy_start: profile.lowEnergyStart,
        low_energy_end: profile.lowEnergyEnd,
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast({ title: 'Energy profile updated!' });
    } catch (error: unknown) {
      toast({ 
        title: 'Error saving profile', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Chronotype</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Are you a morning person or night owl?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={profile.chronotype} 
            onValueChange={v => setProfile(p => ({ ...p, chronotype: v }))}
            className="space-y-3"
          >
            {chronotypes.map(type => (
              <div key={type.value} className="flex items-center space-x-3">
                <RadioGroupItem value={type.value} id={`settings-${type.value}`} />
                <Label htmlFor={`settings-${type.value}`} className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                  <type.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-sm sm:text-base">{type.label}</span>
                    <p className="text-xs text-muted-foreground hidden sm:block">{type.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Sleep Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="settings-wake-time" className="text-sm">Wake Up Time</Label>
            <Input
              id="settings-wake-time"
              type="time"
              value={profile.wakeTime}
              onChange={e => setProfile(p => ({ ...p, wakeTime: e.target.value }))}
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="settings-sleep-time" className="text-sm">Bedtime</Label>
            <Input
              id="settings-sleep-time"
              type="time"
              value={profile.sleepTime}
              onChange={e => setProfile(p => ({ ...p, sleepTime: e.target.value }))}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Focus Periods</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            When do you typically have the most energy for deep work?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              High Focus Period
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Input
                type="time"
                value={profile.highFocusStart}
                onChange={e => setProfile(p => ({ ...p, highFocusStart: e.target.value }))}
                className="h-10"
              />
              <Input
                type="time"
                value={profile.highFocusEnd}
                onChange={e => setProfile(p => ({ ...p, highFocusEnd: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              Low Energy Period
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Input
                type="time"
                value={profile.lowEnergyStart}
                onChange={e => setProfile(p => ({ ...p, lowEnergyStart: e.target.value }))}
                className="h-10"
              />
              <Input
                type="time"
                value={profile.lowEnergyEnd}
                onChange={e => setProfile(p => ({ ...p, lowEnergyEnd: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Energy Profile
          </>
        )}
      </Button>
    </div>
  );
}
