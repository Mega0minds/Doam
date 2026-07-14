import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  GraduationCap, Heart, TrendingUp, Users, Brain, Coffee,
  ChevronLeft, ChevronRight, Info
} from 'lucide-react';

interface GoalsStepProps {
  userId: string;
  onNext: (goalsData: Record<string, any>) => void;
  onBack: () => void;
  savedData?: Record<string, any>;
}

type GoalCategory = 'academic_career' | 'health' | 'personal_growth' | 'social' | 'spiritual_mental' | 'rest_recreation';

interface GoalData {
  category: GoalCategory;
  title: string;
  description: string;
  targetDate: string;
}

export function GoalsStep({ userId, onNext, onBack, savedData }: GoalsStepProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  const categories: { key: GoalCategory; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { key: 'academic_career', label: t.academicCareer, icon: GraduationCap, description: t.academicCareerDesc },
    { key: 'health', label: t.health, icon: Heart, description: t.healthDesc },
    { key: 'personal_growth', label: t.personalGrowth, icon: TrendingUp, description: t.personalGrowthDesc },
    { key: 'social', label: t.social, icon: Users, description: t.socialDesc },
    { key: 'spiritual_mental', label: t.spiritualMental, icon: Brain, description: t.spiritualMentalDesc },
    { key: 'rest_recreation', label: t.restRecreation, icon: Coffee, description: t.restRecreationDesc },
  ];

  const [goals, setGoals] = useState<Record<GoalCategory, GoalData>>(() => {
    if (savedData?.goals) return savedData.goals;
    const initial: Record<GoalCategory, GoalData> = {} as Record<GoalCategory, GoalData>;
    categories.forEach(cat => {
      initial[cat.key] = { category: cat.key, title: '', description: '', targetDate: '' };
    });
    return initial;
  });
  const [priorityOrder, setPriorityOrder] = useState<GoalCategory[]>(
    savedData?.priorityOrder || categories.map(c => c.key)
  );

  // Restore category index from saved data
  useEffect(() => {
    if (savedData?.currentCategoryIndex != null) {
      setCurrentCategoryIndex(savedData.currentCategoryIndex);
    }
  }, []);

  const currentCategory = categories[currentCategoryIndex];

  const updateGoal = (field: keyof GoalData, value: string) => {
    setGoals(prev => ({
      ...prev,
      [currentCategory.key]: { ...prev[currentCategory.key], [field]: value }
    }));
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrevCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...priorityOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPriorityOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === priorityOrder.length - 1) return;
    const newOrder = [...priorityOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPriorityOrder(newOrder);
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      const goalsToInsert = Object.values(goals)
        .filter(g => g.title.trim() !== '')
        .map(g => ({
          user_id: userId,
          category: g.category,
          title: g.title,
          description: g.description || null,
          target_date: g.targetDate || null,
          priority_rank: priorityOrder.indexOf(g.category) + 1,
        }));

      if (goalsToInsert.length > 0) {
        const { error } = await supabase.from('goals').insert(goalsToInsert);
        if (error) throw error;
      }

      toast({ title: 'Goals saved!', description: `${goalsToInsert.length} goals created.` });
      onNext({ goals, priorityOrder, currentCategoryIndex });
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

  const Icon = currentCategory.icon;
  const showPriorityRanking = currentCategoryIndex === categories.length - 1;

  return (
    <div className="space-y-3 sm:space-y-6 px-1">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-base sm:text-xl font-bold text-foreground">{t.onboardingGoalsTitle}</h2>
        <p className="text-xs text-muted-foreground px-2">{t.onboardingGoalsDesc}</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">{t.onboardingGoalsWhy}</p>
      </div>

      <div className="flex justify-center gap-1.5 sm:gap-2">
        {categories.map((cat, idx) => (
          <button
            key={cat.key}
            onClick={() => setCurrentCategoryIndex(idx)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
              idx === currentCategoryIndex 
                ? 'bg-primary scale-125' 
                : goals[cat.key].title 
                  ? 'bg-primary/50' 
                  : 'bg-muted-foreground/30'
            }`}
            aria-label={`Go to ${cat.label}`}
          />
        ))}
      </div>

      {!showPriorityRanking ? (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-3 sm:px-6 sm:pt-6 sm:pb-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-lg font-semibold">{currentCategory.label}</CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">{currentCategory.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-4 sm:px-6 sm:pb-6 sm:space-y-4">
            <div className="space-y-1">
              <Label htmlFor="goal-title" className="text-xs sm:text-sm font-medium">Goal Title</Label>
              <Input
                id="goal-title"
                placeholder="e.g., Get A's in all subjects this semester..."
                value={goals[currentCategory.key].title}
                onChange={e => updateGoal('title', e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-description" className="text-xs sm:text-sm font-medium">Description (Optional)</Label>
              <Textarea
                id="goal-description"
                placeholder="Add more details about your goal..."
                value={goals[currentCategory.key].description}
                onChange={e => updateGoal('description', e.target.value)}
                rows={2}
                className="text-sm resize-none min-h-[60px] sm:min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-date" className="text-xs sm:text-sm font-medium">Target Date (Optional)</Label>
              <Input
                id="goal-date"
                type="date"
                value={goals[currentCategory.key].targetDate}
                onChange={e => updateGoal('targetDate', e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-3 sm:px-6 sm:pt-6 sm:pb-3">
            <CardTitle className="text-sm sm:text-lg font-semibold">{t.onboardingPriorityTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.onboardingPriorityDesc}</p>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{t.onboardingPriorityWhy}</p>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {priorityOrder.map((catKey, idx) => {
                const cat = categories.find(c => c.key === catKey)!;
                const CatIcon = cat.icon;
                return (
                  <div key={catKey} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="font-bold text-primary w-4 sm:w-6 text-xs sm:text-base text-center">{idx + 1}</span>
                    <CatIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium text-xs sm:text-base truncate">{cat.label}</span>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <span className="text-sm sm:text-base">↑</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => moveDown(idx)} disabled={idx === priorityOrder.length - 1}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <span className="text-sm sm:text-base">↓</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-2 sm:pt-4 gap-2">
        <Button variant="outline" onClick={currentCategoryIndex === 0 ? onBack : handlePrevCategory}
          className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm">
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
          {t.back}
        </Button>
        
        {showPriorityRanking ? (
          <Button onClick={handleSaveAndContinue} disabled={saving}
            className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex-1 max-w-[180px] sm:max-w-none sm:flex-none">
            {saving ? t.saving : t.saveAndContinue}
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
          </Button>
        ) : (
          <Button onClick={handleNextCategory} className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm">
            {goals[currentCategory.key].title ? t.next : t.skip}
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
