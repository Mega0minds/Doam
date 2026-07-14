import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  Heart, 
  TrendingUp, 
  Users, 
  Brain, 
  Coffee,
  Plus,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type GoalCategory = Database['public']['Enums']['goal_category'];

interface GoalsSettingsProps {
  userId: string;
}

interface Goal {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  targetDate: string;
  priorityRank: number;
  isNew?: boolean;
}

const categoryInfo: Record<GoalCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  academic_career: { label: 'Academic / Career', icon: GraduationCap },
  health: { label: 'Health', icon: Heart },
  personal_growth: { label: 'Personal Growth', icon: TrendingUp },
  social: { label: 'Social', icon: Users },
  spiritual_mental: { label: 'Spiritual / Mental', icon: Brain },
  rest_recreation: { label: 'Rest & Recreation', icon: Coffee },
};

export function GoalsSettings({ userId }: GoalsSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority_rank', { ascending: true });

      if (data) {
        setGoals(data.map(g => ({
          id: g.id,
          category: g.category,
          title: g.title,
          description: g.description || '',
          targetDate: g.target_date || '',
          priorityRank: g.priority_rank,
        })));
      }
      setLoading(false);
    };
    fetchGoals();
  }, [userId]);

  const addGoal = () => {
    const maxRank = goals.length > 0 ? Math.max(...goals.map(g => g.priorityRank)) : 0;
    setGoals(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: 'personal_growth',
        title: '',
        description: '',
        targetDate: '',
        priorityRank: maxRank + 1,
        isNew: true,
      },
    ]);
  };

  const removeGoal = async (id: string, isNew?: boolean) => {
    if (!isNew) {
      await supabase.from('goals').delete().eq('id', id);
    }
    setGoals(prev => prev.filter(g => g.id !== id));
    toast({ title: 'Goal removed' });
  };

  const updateGoal = (id: string, field: keyof Goal, value: unknown) => {
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validGoals = goals.filter(g => g.title.trim());
      
      for (const goal of validGoals) {
        if (goal.isNew) {
          const { error } = await supabase.from('goals').insert({
            user_id: userId,
            category: goal.category,
            title: goal.title,
            description: goal.description || null,
            target_date: goal.targetDate || null,
            priority_rank: goal.priorityRank,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('goals').update({
            category: goal.category,
            title: goal.title,
            description: goal.description || null,
            target_date: goal.targetDate || null,
            priority_rank: goal.priorityRank,
          }).eq('id', goal.id);
          if (error) throw error;
        }
      }

      toast({ title: 'Goals saved!', description: `${validGoals.length} goals updated.` });
      setGoals(prev => prev.map(g => ({ ...g, isNew: false })));
    } catch (error: unknown) {
      toast({ 
        title: 'Error saving goals', 
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
          <CardTitle className="text-base sm:text-lg">Your Goals</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your goals across different life areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No goals yet. Add your first one below.
            </p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {goals.map((goal) => {
                const cat = categoryInfo[goal.category];
                const Icon = cat.icon;
                return (
                  <Card key={goal.id} className="border">
                    <CardContent className="pt-4 space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="p-2 rounded-lg gradient-primary shrink-0">
                            <Icon className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <Select
                            value={goal.category}
                            onValueChange={v => updateGoal(goal.id, 'category', v as GoalCategory)}
                          >
                            <SelectTrigger className="flex-1 h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryInfo).map(([key, info]) => (
                                <SelectItem key={key} value={key}>
                                  {info.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGoal(goal.id, goal.isNew)}
                          className="shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm">Goal Title</Label>
                        <Input
                          placeholder="e.g., Get A's in all subjects"
                          value={goal.title}
                          onChange={e => updateGoal(goal.id, 'title', e.target.value)}
                          className="h-10"
                        />
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm">Description (Optional)</Label>
                        <Textarea
                          placeholder="Add more details..."
                          value={goal.description}
                          onChange={e => updateGoal(goal.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Target Date</Label>
                          <Input
                            type="date"
                            value={goal.targetDate}
                            onChange={e => updateGoal(goal.id, 'targetDate', e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Priority Rank</Label>
                          <Input
                            type="number"
                            min={1}
                            value={goal.priorityRank}
                            onChange={e => updateGoal(goal.id, 'priorityRank', parseInt(e.target.value) || 1)}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={addGoal} className="flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
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
