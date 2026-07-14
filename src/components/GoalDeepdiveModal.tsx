'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { GoalDeepdiveChat } from './GoalDeepdiveChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Goal {
  id: string;
  category: string;
  title: string;
  description?: string | null;
}

interface GoalDeepdiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function GoalDeepdiveModal({ open, onOpenChange, onComplete }: GoalDeepdiveModalProps) {
  const { language } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (open) {
      loadUserAndGoals();
    }
  }, [open]);

  const loadUserAndGoals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, category, title, description')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
  };

  const handleSkip = async () => {
    if (userId) {
      await supabase.from('user_profiles' as any).upsert({
        user_id: userId,
        goal_deepdive_completed: true
      } as any);
    }
    toast.warning(
      language === 'pidgin'
        ? 'You fit skip this step, but your experience and recommendations no go too personalized pass people wey complete the Goal Deep Dive.'
        : 'You can skip this step, but your experience and recommendations may be less personalized compared to users who complete the Goal Deep Dive.',
      { duration: 6000 }
    );
    onComplete();
    onOpenChange(false);
  };

  const startChat = () => {
    setShowIntro(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (goals.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'pidgin' ? 'No Goals Yet' : 'No Goals Yet'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pidgin' 
                ? 'Add some goals first, then we go talk about them.'
                : 'Add some goals first, then we can discuss them.'}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleSkip}>
            {language === 'pidgin' ? 'Continue' : 'Continue'}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {showIntro ? (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">
                {language === 'pidgin'
                  ? "Make We Fine-Tune Your Goals"
                  : "Let's Fine-Tune Your Goals"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Goal Deep Dive introduction
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 items-start">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-foreground/90">
                {language === 'pidgin'
                  ? 'Goal Deep Dive go help DoAm sabi you well-well so e fit give you better personalized recommendations, schedules, routines and productivity insights wey match your goals.'
                  : 'Goal Deep Dive helps DoAm understand you better so it can create more personalized recommendations, schedules, routines, and productivity insights tailored to your goals.'}
              </p>
            </div>

            <div className="space-y-3 py-4">
              <div className="text-sm text-muted-foreground">
                {language === 'pidgin' 
                  ? `You get ${goals.length} goals wey we go discuss:`
                  : `You have ${goals.length} goals to discuss:`}
              </div>
              <div className="space-y-2">
                {goals.slice(0, 4).map((goal, idx) => (
                  <div key={goal.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="truncate">{goal.title}</span>
                  </div>
                ))}
                {goals.length > 4 && (
                  <div className="text-sm text-muted-foreground pl-7">
                    +{goals.length - 4} more...
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                {language === 'pidgin' ? 'Skip for now' : 'Skip for now'}
              </Button>
              <Button onClick={startChat} className="flex-1">
                {language === 'pidgin' ? "Let's do it" : "Let's do it"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">
                {language === 'pidgin' ? 'Goal Deep-Dive' : 'Goal Deep-Dive'}
              </DialogTitle>
            </DialogHeader>
            
            {userId && (
              <GoalDeepdiveChat
                goals={goals}
                userId={userId}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
