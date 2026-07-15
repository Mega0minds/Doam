import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { WelcomeStep } from './steps/WelcomeStep';
import { GoalsStep } from './steps/GoalsStep';
import { EnergyStep } from './steps/EnergyStep';
import { CommitmentsStep } from './steps/CommitmentsStep';
import { CompletionStep } from './steps/CompletionStep';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

export type OnboardingStep = 'welcome' | 'goals' | 'energy' | 'commitments' | 'complete';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const { progress, saveProgress, clearProgress } = useOnboardingProgress(userId);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Restore saved step when progress loads (only once)
  useEffect(() => {
    if (progress?.current_step && !restored) {
      const step = progress.current_step as OnboardingStep;
      setCurrentStep(step);
      setRestored(true);
    }
  }, [progress, restored]);

  const steps: OnboardingStep[] = ['welcome', 'goals', 'energy', 'commitments', 'complete'];
  const currentIndex = steps.indexOf(currentStep);
  const progressValue = ((currentIndex) / (steps.length - 1)) * 100;

  const goToStep = (step: OnboardingStep, extraData?: Partial<typeof progress>) => {
    setCurrentStep(step);
    saveProgress({ ...extraData, current_step: step });
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex]);
    }
  };

  // Called by GoalsStep after saving goals to DB
  const handleGoalsSaved = (goalsData: Record<string, any>) => {
    goToStep('energy', { goals_data: goalsData });
  };

  // Called by EnergyStep after saving energy profile to DB
  const handleEnergySaved = (energyData: Record<string, any>) => {
    goToStep('commitments', { energy_data: energyData });
  };

  // Called by CommitmentsStep after saving commitments to DB
  const handleCommitmentsSaved = (commitmentsData: any[]) => {
    goToStep('complete', { commitments_data: commitmentsData });
  };

  const handleComplete = async () => {
    if (!userId) return;
    
    await supabase
      .from('onboarding_status')
      .upsert({
        user_id: userId,
        goals_completed: true,
        energy_completed: true,
        commitments_completed: true,
        onboarding_completed: true,
      }, { onConflict: 'user_id' });

    localStorage.setItem('doam-onboarding-completed', 'true');
    clearProgress();
    onComplete();
    onOpenChange(false);
  };

  const stepLabels: Record<OnboardingStep, string> = {
    welcome: 'Welcome',
    goals: 'Your Goals',
    energy: 'Energy Profile',
    commitments: 'Fixed Commitments',
    complete: 'All Set!',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-0 sm:w-full border border-white/[0.12] bg-black/50 backdrop-blur-2xl shadow-2xl rounded-2xl">
        {/* Glass inner highlight */}
        <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_50%)] pointer-events-none" />
        {/* Subtle radial glow */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(217_91%_55%/0.10),transparent)] pointer-events-none" />

        <div className="relative p-5 sm:p-7">
          {/* Step label */}
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/60">
                Step {currentIndex} of {steps.length - 2}
              </span>
              <span className="text-xs font-semibold text-primary/80 tracking-wide">
                {stepLabels[currentStep]}
              </span>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[360px]">
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={() => goToStep('goals')} />
            )}
            {currentStep === 'goals' && userId && (
              <GoalsStep
                userId={userId}
                onNext={handleGoalsSaved}
                onBack={handleBack}
                savedData={progress?.goals_data}
              />
            )}
            {currentStep === 'energy' && userId && (
              <EnergyStep
                userId={userId}
                onNext={handleEnergySaved}
                onBack={handleBack}
                savedData={progress?.energy_data}
              />
            )}
            {currentStep === 'commitments' && userId && (
              <CommitmentsStep
                userId={userId}
                onNext={handleCommitmentsSaved}
                onBack={handleBack}
                savedData={progress?.commitments_data}
              />
            )}
            {currentStep === 'complete' && (
              <CompletionStep onComplete={handleComplete} />
            )}
          </div>

          {progress?.current_step && !['welcome', 'goals'].includes(progress.current_step) && (
            <p className="text-xs text-muted-foreground/40 text-center mt-4">
              Progress auto-saved — you can resume anytime
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
