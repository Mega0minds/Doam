import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { GoalsStep } from './steps/GoalsStep';
import { EnergyStep } from './steps/EnergyStep';
import { CommitmentsStep } from './steps/CommitmentsStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { CompletionStep } from './steps/CompletionStep';
import { Progress } from '@/components/ui/progress';
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
      setCurrentStep(progress.current_step as OnboardingStep);
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
    goals: 'Set Your Goals',
    energy: 'Energy Profile',
    commitments: 'Fixed Commitments',
    complete: 'All Set!',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:w-full">
        <div className="p-4 sm:p-6">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentIndex + 1} of {steps.length}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {stepLabels[currentStep]}
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
            {progress?.current_step && progress.current_step !== 'welcome' && (
              <p className="text-xs text-muted-foreground mt-1 text-center">
                ✓ Your progress is saved — you'll resume here if you leave
              </p>
            )}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] sm:min-h-[400px]">
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={handleNext} />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
