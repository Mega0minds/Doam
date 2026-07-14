import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface EnergyStepProps {
  userId: string;
  onNext: (energyData: Record<string, any>) => void;
  onBack: () => void;
  savedData?: Record<string, any>;
}

export function EnergyStep({ userId, onNext, onBack, savedData }: EnergyStepProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(savedData?.profile || {
    chronotype: 'neutral',
    wakeTime: '07:00',
    sleepTime: '23:00',
    highFocusStart: '09:00',
    highFocusEnd: '12:00',
    lowEnergyStart: '14:00',
    lowEnergyEnd: '15:30',
  });

  const chronotypes = [
    { value: 'early_bird', label: t.earlyBird, icon: Sun, description: t.earlyBirdDesc },
    { value: 'night_owl', label: t.nightOwl, icon: Moon, description: t.nightOwlDesc },
    { value: 'neutral', label: t.neutral, icon: Clock, description: t.neutralDesc },
  ];

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
      toast({ title: 'Energy profile saved!' });
      onNext({ profile });
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{t.onboardingEnergyTitle}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t.onboardingEnergyDesc}</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">{t.onboardingEnergyWhy}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{t.onboardingChronotypeTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={profile.chronotype} onValueChange={v => setProfile((p: any) => ({ ...p, chronotype: v }))} className="space-y-3">
            {chronotypes.map(type => (
              <div key={type.value} className="flex items-center space-x-3">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label htmlFor={type.value} className="flex items-center gap-3 cursor-pointer flex-1">
                  <type.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{type.label}</span>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{t.sleepSchedule}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="wake-time" className="text-sm">{t.wakeTime}</Label>
            <Input id="wake-time" type="time" value={profile.wakeTime}
              onChange={e => setProfile((p: any) => ({ ...p, wakeTime: e.target.value }))} className="h-10" />
          </div>
          <div>
            <Label htmlFor="sleep-time" className="text-sm">{t.bedtime}</Label>
            <Input id="sleep-time" type="time" value={profile.sleepTime}
              onChange={e => setProfile((p: any) => ({ ...p, sleepTime: e.target.value }))} className="h-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">{t.focusPeriods}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.focusPeriodsDesc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              {t.highFocusPeriod}
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Input type="time" value={profile.highFocusStart}
                onChange={e => setProfile((p: any) => ({ ...p, highFocusStart: e.target.value }))} className="h-10" />
              <Input type="time" value={profile.highFocusEnd}
                onChange={e => setProfile((p: any) => ({ ...p, highFocusEnd: e.target.value }))} className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              {t.lowEnergyPeriod}
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Input type="time" value={profile.lowEnergyStart}
                onChange={e => setProfile((p: any) => ({ ...p, lowEnergyStart: e.target.value }))} className="h-10" />
              <Input type="time" value={profile.lowEnergyEnd}
                onChange={e => setProfile((p: any) => ({ ...p, lowEnergyEnd: e.target.value }))} className="h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t.back}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t.saving : t.saveAndContinue}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
