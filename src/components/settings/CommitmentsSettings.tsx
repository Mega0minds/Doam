import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Lock, Save, Loader2 } from 'lucide-react';

interface CommitmentsSettingsProps {
  userId: string;
}

interface Commitment {
  id: string;
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  category: string;
  isLocked: boolean;
  isNew?: boolean;
}

const days = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const categories = [
  { value: 'class', label: 'Class/Lecture' },
  { value: 'work', label: 'Work' },
  { value: 'commute', label: 'Commute' },
  { value: 'family', label: 'Family' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'other', label: 'Other' },
];

export function CommitmentsSettings({ userId }: CommitmentsSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  useEffect(() => {
    const fetchCommitments = async () => {
      const { data, error } = await supabase
        .from('fixed_commitments')
        .select('*')
        .eq('user_id', userId);

      if (data) {
        // Group by title to merge days
        const grouped = data.reduce((acc, item) => {
          const key = `${item.title}-${item.start_time}-${item.end_time}-${item.category}`;
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              title: item.title,
              daysOfWeek: [item.day_of_week],
              startTime: item.start_time,
              endTime: item.end_time,
              category: item.category || 'other',
              isLocked: item.is_locked,
            };
          } else {
            acc[key].daysOfWeek.push(item.day_of_week);
          }
          return acc;
        }, {} as Record<string, Commitment>);
        
        setCommitments(Object.values(grouped));
      }
      setLoading(false);
    };
    fetchCommitments();
  }, [userId]);

  const addCommitment = () => {
    setCommitments(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '10:00',
        category: 'class',
        isLocked: false,
        isNew: true,
      },
    ]);
  };

  const removeCommitment = async (id: string, isNew?: boolean) => {
    if (!isNew) {
      // Delete from database
      const commitment = commitments.find(c => c.id === id);
      if (commitment) {
        await supabase
          .from('fixed_commitments')
          .delete()
          .eq('user_id', userId)
          .eq('title', commitment.title)
          .eq('start_time', commitment.startTime)
          .eq('end_time', commitment.endTime);
      }
    }
    setCommitments(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Commitment removed' });
  };

  const updateCommitment = (id: string, field: keyof Commitment, value: unknown) => {
    setCommitments(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const toggleDay = (commitmentId: string, day: number) => {
    setCommitments(prev =>
      prev.map(c => {
        if (c.id !== commitmentId) return c;
        const newDays = c.daysOfWeek.includes(day)
          ? c.daysOfWeek.filter(d => d !== day)
          : [...c.daysOfWeek, day];
        return { ...c, daysOfWeek: newDays };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing commitments
      await supabase
        .from('fixed_commitments')
        .delete()
        .eq('user_id', userId);

      // Insert all commitments
      const validCommitments = commitments.filter(
        c => c.title.trim() && c.daysOfWeek.length > 0
      );

      const toInsert = validCommitments.flatMap(c =>
        c.daysOfWeek.map(day => ({
          user_id: userId,
          title: c.title,
          day_of_week: day,
          start_time: c.startTime,
          end_time: c.endTime,
          category: c.category,
          is_locked: c.isLocked,
        }))
      );

      if (toInsert.length > 0) {
        const { error } = await supabase.from('fixed_commitments').insert(toInsert);
        if (error) throw error;
      }

      toast({ title: 'Commitments saved!', description: `${toInsert.length} time blocks updated.` });
      
      // Mark all as not new
      setCommitments(prev => prev.map(c => ({ ...c, isNew: false })));
    } catch (error: unknown) {
      toast({ 
        title: 'Error saving commitments', 
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
          <CardTitle className="text-base sm:text-lg">Your Fixed Commitments</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            These time blocks will never be overwritten by AI suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commitments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No commitments yet. Add your first one below.
            </p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {commitments.map((commitment) => (
                <Card key={commitment.id} className={commitment.isLocked ? 'border-primary/50' : ''}>
                  <CardContent className="pt-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="e.g., Math Class"
                          value={commitment.title}
                          onChange={e => updateCommitment(commitment.id, 'title', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={commitment.category}
                          onValueChange={v => updateCommitment(commitment.id, 'category', v)}
                        >
                          <SelectTrigger className="w-full sm:w-32 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCommitment(commitment.id, commitment.isNew)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {days.map(day => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={commitment.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-8 sm:w-10 text-xs"
                          onClick={() => toggleDay(commitment.id, day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={commitment.startTime}
                          onChange={e => updateCommitment(commitment.id, 'startTime', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={commitment.endTime}
                          onChange={e => updateCommitment(commitment.id, 'endTime', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`settings-locked-${commitment.id}`}
                        checked={commitment.isLocked}
                        onCheckedChange={v => updateCommitment(commitment.id, 'isLocked', v)}
                      />
                      <Label htmlFor={`settings-locked-${commitment.id}`} className="text-xs sm:text-sm flex items-center gap-1 cursor-pointer">
                        <Lock className="h-3 w-3" />
                        <span className="hidden sm:inline">Lock this commitment (cannot be moved)</span>
                        <span className="sm:hidden">Lock commitment</span>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={addCommitment} className="flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Add Commitment
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
