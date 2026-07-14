import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="relative">
        <div className="p-6 rounded-full gradient-primary">
          <CheckCircle2 className="h-16 w-16 text-primary-foreground" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{t.onboardingCompleteTitle}</h2>
        <p className="text-muted-foreground max-w-md">
          {t.onboardingCompleteDesc}
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4 max-w-sm text-center">
        <h3 className="font-semibold text-foreground mb-2">{t.onboardingWhatsNext}</h3>
        <ul className="text-sm text-muted-foreground space-y-1 text-left">
          <li>• {t.onboardingNext1}</li>
          <li>• {t.onboardingNext2}</li>
          <li>• {t.onboardingNext3}</li>
          <li>• {t.onboardingNext4}</li>
        </ul>
      </div>

      <Button onClick={onComplete} size="lg" className="px-8 bg-gradient-primary">
        {t.goToDashboard}
      </Button>
    </div>
  );
}
