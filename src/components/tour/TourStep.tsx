import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, ArrowLeft, X, Sparkles, Keyboard } from 'lucide-react';

interface TourStepProps {
  title: string;
  description: string;
  icon: React.ElementType;
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function TourStep({
  title,
  description,
  icon: Icon,
  currentStep,
  totalSteps,
  isLastStep,
  onNext,
  onPrev,
  onSkip
}: TourStepProps) {
  const { t } = useLanguage();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div 
      className="bg-card border border-border rounded-2xl shadow-elevated overflow-hidden max-w-md w-[90vw] sm:w-full"
      role="alertdialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      {/* Progress bar */}
      <div className="h-1.5 bg-muted" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 text-center relative">
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Close tour"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
          <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
        </div>

        {/* Title */}
        <h2 id="tour-title" className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
          {title}
        </h2>

        {/* Description */}
        <p id="tour-description" className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 leading-relaxed">
          {description}
        </p>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-5 sm:mb-6" role="tablist" aria-label="Tour progress">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              role="tab"
              aria-selected={index === currentStep}
              aria-label={`Step ${index + 1} of ${totalSteps}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-6 bg-primary' 
                  : index < currentStep 
                    ? 'w-1.5 bg-primary/50' 
                    : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2 sm:gap-3 justify-center">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={onPrev}
              className="gap-1.5 sm:gap-2 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Go to previous step"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t.back || 'Back'}</span>
            </Button>
          )}
          <Button
            onClick={onNext}
            className="gap-1.5 sm:gap-2 bg-gradient-primary text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isLastStep ? 'Finish tour and go to dashboard' : 'Go to next step'}
          >
            {isLastStep ? (
              <>
                {t.goToDashboard || 'Go to Dashboard'}
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                {t.next || 'Next'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip link and keyboard hint */}
        <div className="mt-4 space-y-2">
          {!isLastStep && (
            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:underline"
            >
              {t.skipTour || 'Skip tour'}
            </button>
          )}
          
          {/* Keyboard navigation hint */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <Keyboard className="h-3 w-3" />
            <span>← → to navigate • Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
