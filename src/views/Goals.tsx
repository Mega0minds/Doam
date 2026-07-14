'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Trash2, MessageCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoalDeepdiveModal } from '@/components/GoalDeepdiveModal';
import { useLanguage } from '@/contexts/LanguageContext';
interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority_rank: number;
  target_date: string | null;
  is_active: boolean;
}

interface GoalAction {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  frequency: string;
  effort_level: string;
}

interface Pattern {
  id: string;
  pattern_type: string;
  pattern_data: any;
  confidence: number;
}

const Goals = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<GoalAction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [decomposing, setDecomposing] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showDeepdive, setShowDeepdive] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [goalsRes, actionsRes, patternsRes] = await Promise.all([
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority_rank'),
        supabase
          .from('goal_actions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('user_patterns')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ]);

      setGoals(goalsRes.data || []);
      setActions(actionsRes.data || []);
      setPatterns(patternsRes.data || []);
    } catch (error) {
      console.error('Error fetching goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecomposeGoals = async () => {
    setDecomposing(true);
    try {
      const { data, error } = await supabase.functions.invoke('decompose-goals');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Goals Decomposed!',
        description: data.message || 'AI has created actionable steps for your goals.',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to decompose goals',
        variant: 'destructive',
      });
    } finally {
      setDecomposing(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;

      toast({ title: 'Goal archived' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleGoalExpanded = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const getGoalCategoryLabel = (category: string) => {
    const labels: Record<string, { label: string; emoji: string }> = {
      academic_career: { label: 'Academic/Career', emoji: '📚' },
      health: { label: 'Health', emoji: '💪' },
      personal_growth: { label: 'Personal Growth', emoji: '🌱' },
      social: { label: 'Social', emoji: '👥' },
      spiritual_mental: { label: 'Spiritual/Mental', emoji: '🧘' },
      rest_recreation: { label: 'Rest & Recreation', emoji: '☕' },
    };
    return labels[category] || { label: category, emoji: '🎯' };
  };

  const getEffortBadgeVariant = (effort: string) => {
    if (effort === 'deep_focus') return 'destructive';
    if (effort === 'moderate') return 'default';
    return 'secondary';
  };

  const actionsForGoal = (goalId: string) => actions.filter(a => a.goal_id === goalId);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              {language === 'en' ? 'Your Goals' : 'Your Goals'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'en' 
                ? 'Track progress and manage goal-based actions' 
                : 'Track progress and manage your goal actions'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowDeepdive(true)}
              variant="outline"
              disabled={goals.length === 0}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {language === 'en' ? 'Goal Deep-Dive' : 'Deep-Dive Your Goals'}
            </Button>
            <Button
              onClick={handleDecomposeGoals}
              disabled={decomposing || goals.length === 0}
              className="gap-2 bg-gradient-primary"
            >
              <Sparkles className="h-4 w-4" />
              {decomposing 
                ? (language === 'en' ? 'Decomposing...' : 'Dey Decompose...')
                : (language === 'en' ? 'Generate Actions with AI' : 'Generate Actions with AI')
              }
            </Button>
          </div>
        </div>

        {/* Patterns Insights */}
        {patterns.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patterns.map(p => (
                <div key={p.id} className="flex items-start gap-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    {p.pattern_type === 'high_skip_hour' && (
                      <p>
                        You tend to skip tasks scheduled at{' '}
                        <strong>{p.pattern_data.hour}:00</strong> ({Math.round(p.pattern_data.skip_rate * 100)}% skip rate).
                        Consider avoiding this time for important tasks.
                      </p>
                    )}
                    {p.pattern_type === 'duration_bias' && (
                      <p>
                        You typically {p.pattern_data.direction} task durations by{' '}
                        <strong>{Math.abs(p.pattern_data.average_difference_minutes)} minutes</strong>.
                        AI will adjust estimates accordingly.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Goals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete the onboarding to set up your goals, or go to Dashboard to start.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-tour="goals-list">
            {goals.map(goal => {
              const goalActions = actionsForGoal(goal.id);
              const category = getGoalCategoryLabel(goal.category);
              const isExpanded = expandedGoals.has(goal.id);

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline">{category.label}</Badge>
                            <Badge variant="secondary">Priority #{goal.priority_rank}</Badge>
                            {goal.target_date && (
                              <span className="text-xs">
                                Due: {new Date(goal.target_date).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {goal.description}
                      </p>
                    )}

                    {goalActions.length > 0 ? (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleGoalExpanded(goal.id)}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-between gap-2"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              View AI-Generated Actions ({goalActions.length})
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="grid gap-2">
                            {goalActions.map(action => (
                              <div 
                                key={action.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-2"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{action.title}</p>
                                  {action.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {action.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {action.duration_minutes}min
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {action.frequency}
                                  </Badge>
                                  <Badge 
                                    variant={getEffortBadgeVariant(action.effort_level)}
                                    className="text-xs"
                                  >
                                    {action.effort_level.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Click "Generate Actions with AI" to create actionable steps for this goal.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Goal Deep-Dive Modal */}
        <GoalDeepdiveModal
          open={showDeepdive}
          onOpenChange={setShowDeepdive}
          onComplete={() => {
            setShowDeepdive(false);
            toast({
              title: language === 'en' ? 'Goals Updated!' : 'Goals Don Update!',
              description: language === 'en' 
                ? 'Your goal insights have been saved.' 
                : 'Your goal insights don save.',
            });
          }}
        />
      </div>
    </Layout>
  );
};

export default Goals;
