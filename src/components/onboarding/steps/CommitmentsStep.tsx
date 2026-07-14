import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2, ChevronLeft, ChevronRight, Lock, Info } from 'lucide-react';

interface CommitmentsStepProps {
  userId: string;
  onNext: (commitmentsData: any[]) => void;
  onBack: () => void;
  savedData?: any[];
}

interface Commitment {
  id: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  category: string;
  isLocked: boolean;
}

const days = [
  { value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
];

const categories = [
  { value: 'class', label: 'Class/Lecture' }, { value: 'work', label: 'Work' },
  { value: 'commute', label: 'Commute' }, { value: 'family', label: 'Family' },
  { value: 'sleep', label: 'Sleep' }, { value: 'other', label: 'Other' },
];

const defaultCommitment: Commitment = {
  id: crypto.randomUUID(),
  title: 'Sleep',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  startTime: '23:00',
  endTime: '07:00',
  category: 'sleep',
  isLocked: true,
};

export function CommitmentsStep({ userId, onNext, onBack, savedData }: CommitmentsStepProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [commitments, setCommitments] = useState<Commitment[]>(
    savedData && savedData.length > 0 ? savedData : [defaultCommitment]
  );

  const addCommitment = () => {
    setCommitments(prev => [...prev, {
      id: crypto.randomUUID(), title: '', daysOfWeek: [],
      startTime: '09:00', endTime: '10:00', category: 'class', isLocked: false,
    }]);
  };

  const removeCommitment = (id: string) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  const updateCommitment = (id: string, field: keyof Commitment, value: unknown) => {
    setCommitments(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const toggleDay = (commitmentId: string, day: number) => {
    setCommitments(prev => prev.map(c => {
      if (c.id !== commitmentId) return c;
      const newDays = c.daysOfWeek.includes(day)
        ? c.daysOfWeek.filter(d => d !== day)
        : [...c.daysOfWeek, day];
      return { ...c, daysOfWeek: newDays };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validCommitments = commitments.filter(c => c.title.trim() && c.daysOfWeek.length > 0);
      const toInsert = validCommitments.flatMap(c =>
        c.daysOfWeek.map(day => ({
          user_id: userId, title: c.title, day_of_week: day,
          start_time: c.startTime, end_time: c.endTime,
          category: c.category, is_locked: c.isLocked,
        }))
      );

      if (toInsert.length > 0) {
        const { error } = await supabase.from('fixed_commitments').insert(toInsert);
        if (error) throw error;
      }

      toast({ title: 'Commitments saved!', description: `${toInsert.length} time blocks created.` });
      onNext(commitments);
    } catch (error: unknown) {
      toast({ title: 'Error saving commitments', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{t.onboardingCommitmentsTitle}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t.onboardingCommitmentsDesc}</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">{t.onboardingCommitmentsWhy}</p>
      </div>

      <div className="space-y-4 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-1 sm:pr-2">
        {commitments.map((commitment) => (
          <Card key={commitment.id} className={commitment.isLocked ? 'border-primary/50' : ''}>
            <CardContent className="pt-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input placeholder="e.g., Math Class" value={commitment.title}
                    onChange={e => updateCommitment(commitment.id, 'title', e.target.value)} className="h-10" />
                </div>
                <div className="flex gap-2">
                  <Select value={commitment.category} onValueChange={v => updateCommitment(commitment.id, 'category', v)}>
                    <SelectTrigger className="w-full sm:w-32 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeCommitment(commitment.id)}
                    disabled={commitment.category === 'sleep'} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {days.map(day => (
                  <Button key={day.value} type="button"
                    variant={commitment.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                    size="sm" className="w-9 h-8 sm:w-10 text-xs"
                    onClick={() => toggleDay(commitment.id, day.value)}>
                    {day.label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label className="text-xs">{t.startTime}</Label>
                  <Input type="time" value={commitment.startTime}
                    onChange={e => updateCommitment(commitment.id, 'startTime', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Label className="text-xs">{t.endTime}</Label>
                  <Input type="time" value={commitment.endTime}
                    onChange={e => updateCommitment(commitment.id, 'endTime', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id={`locked-${commitment.id}`} checked={commitment.isLocked}
                  onCheckedChange={v => updateCommitment(commitment.id, 'isLocked', v)} />
                <Label htmlFor={`locked-${commitment.id}`} className="text-xs sm:text-sm flex items-center gap-1 cursor-pointer">
                  <Lock className="h-3 w-3" />
                  <span className="hidden sm:inline">{t.lockCommitment}</span>
                  <span className="sm:hidden">Lock</span>
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addCommitment} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {t.addCommitment}
      </Button>

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
