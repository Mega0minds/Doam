'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, ListTodo, Target, Settings, Sparkles, Zap, Brain, Clock } from 'lucide-react';
import { TourStep } from '@/components/tour/TourStep';
import { TourHighlight } from '@/components/tour/TourHighlight';

interface TourStepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  targetPath?: string;
  targetSelector?: string;
  position: 'center' | 'top' | 'bottom';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const steps: TourStepConfig[] = [
    {
      id: 'welcome',
      title: t.tourWelcome || 'Welcome to DoAm!',
      description: t.tourWelcomeDesc || 'Let us show you around. This quick tour will help you get the most out of your energy-aware scheduling.',
      icon: Sparkles,
      position: 'center',
    },
    {
      id: 'calendar',
      title: t.tourCalendar || 'Your Smart Calendar',
      description: t.tourCalendarDesc || 'Generate AI-powered schedules that respect your energy patterns. Your tasks are placed at optimal times for peak productivity.',
      icon: Calendar,
      targetPath: '/dashboard',
      targetSelector: '[data-tour="generate-schedule"]',
      position: 'bottom',
    },
    {
      id: 'tasks',
      title: t.tourTasks || 'Manage Your Tasks',
      description: t.tourTasksDesc || 'Add tasks with priority and type. Deep work goes to high-energy hours, shallow tasks fill the gaps.',
      icon: ListTodo,
      targetPath: '/tasks',
      targetSelector: '[data-tour="add-task"]',
      position: 'bottom',
    },
    {
      id: 'braindump',
      title: t.tourBrainDump || 'Brain Dump',
      description: t.tourBrainDumpDesc || 'Quickly capture thoughts and ideas. AI will help organize them into actionable tasks.',
      icon: Brain,
      targetPath: '/tasks',
      targetSelector: '[data-tour="brain-dump"]',
      position: 'bottom',
    },
    {
      id: 'goals',
      title: t.tourGoals || 'Set Your Goals',
      description: t.tourGoalsDesc || 'Define goals across 6 life areas. Your schedule will prioritize what matters most to you.',
      icon: Target,
      targetPath: '/goals',
      targetSelector: '[data-tour="goals-list"]',
      position: 'bottom',
    },
    {
      id: 'energy',
      title: t.tourEnergy || 'Energy Awareness',
      description: t.tourEnergyDesc || 'Your schedule adapts to when you have the most energy. Morning person? Night owl? We adjust accordingly.',
      icon: Zap,
      targetPath: '/settings',
      targetSelector: '[data-tour="settings-tabs"]',
      position: 'bottom',
    },
    {
      id: 'commitments',
      title: t.tourCommitments || 'Fixed Commitments',
      description: t.tourCommitmentsDesc || 'Block out classes, meetings, and non-negotiable time. Your schedule works around these.',
      icon: Clock,
      targetPath: '/settings',
      targetSelector: '[data-tour="settings-tabs"]',
      position: 'bottom',
    },
    {
      id: 'complete',
      title: t.tourComplete || "You're All Set!",
      description: t.tourCompleteDesc || 'Start generating your personalized schedule. DoAm will learn and improve with every day you use it.',
      icon: Sparkles,
      targetPath: '/dashboard',
      position: 'center',
    },
  ];

  // Handle opening/closing
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsVisible(true);
      setIsReady(false);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsReady(false);
    }
  }, [isOpen]);

  // Handle navigation to target path
  useEffect(() => {
    if (!isOpen || !isReady) return;

    const step = steps[currentStep];
    if (step?.targetPath && pathname !== step.targetPath && !isNavigating) {
      setIsNavigating(true);
      router.push(step.targetPath);
      // Wait for navigation to complete
      const timer = setTimeout(() => setIsNavigating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, pathname, router, isNavigating, isOpen, isReady, steps]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('doam-tour-completed', 'true');
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      router.push('/dashboard');
    }, 300);
  }, [router, onClose]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('doam-tour-completed', 'true');
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div 
      className={`transition-opacity duration-300 ${
        isVisible && isReady ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <TourHighlight
        targetSelector={step.targetSelector}
        isActive={isVisible && isReady && !isNavigating}
        position={step.position}
        onNext={handleNext}
        onPrev={handlePrev}
        onClose={handleSkip}
      >
        <TourStep
          title={step.title}
          description={step.description}
          icon={step.icon}
          currentStep={currentStep}
          totalSteps={steps.length}
          isLastStep={currentStep === steps.length - 1}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
        />
      </TourHighlight>
    </div>
  );
}
