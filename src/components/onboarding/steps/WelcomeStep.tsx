import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Zap, Calendar, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WelcomeStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  const { t, language } = useLanguage();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill any existing nickname so returning users don't lose it
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('nickname' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const existing = (data as any)?.nickname;
      if (existing) setNickname(existing);
    })();
  }, []);

  const handleContinue = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      toast.error(language === 'pidgin' ? 'Abeg tell us your nickname' : 'Please enter a nickname');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          { user_id: user.id, nickname: trimmed } as any,
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      onNext();
    } catch (e: any) {
      toast.error(e.message || 'Could not save nickname');
    } finally {
      setSaving(false);
    }
  };

  const whatHappensNext = language === 'en' 
    ? [
        'Ask what you want to achieve',
        'Learn how your time and energy work',
        'Lock in things you can\'t change',
        'Build your first calendar',
      ]
    : [
        'Ask wetin you wan achieve',
        'Learn how your time and energy dey work',
        'Lock things wey you no fit change',
        'Build your first calendar',
      ];

  const whyWeAsk = language === 'en'
    ? 'We ask questions so your schedule fits you. We don\'t guess. We don\'t force routines.'
    : 'We dey ask questions make we no guess your life.';

  const whatDoamDoes = language === 'en'
    ? 'DoAm helps you turn your goals into a realistic calendar — built around your real life, your energy, and your commitments.'
    : 'DoAm dey help you turn your goals to correct plan — the way your life be.';

  const features = [
    {
      icon: Target,
      title: t.onboardingFeature1Title,
      description: t.onboardingFeature1Desc,
    },
    {
      icon: Zap,
      title: t.onboardingFeature2Title,
      description: t.onboardingFeature2Desc,
    },
    {
      icon: Calendar,
      title: t.onboardingFeature3Title,
      description: t.onboardingFeature3Desc,
    },
    {
      icon: Sparkles,
      title: t.onboardingFeature4Title,
      description: t.onboardingFeature4Desc,
    },
  ];

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Main heading and description */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
          <Calendar className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t.onboardingWelcomeTitle}
        </h2>
        
        {/* What DoAm Does - Trust Builder */}
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          {whatDoamDoes}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Clock className="h-4 w-4" />
          {t.onboardingTimeEstimate}
        </div>
      </div>

      {/* What Will Happen Next */}
      <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
          {language === 'en' ? 'What Will Happen Next' : 'Wetin Go Happen Next'}
        </h3>
        <div className="space-y-2">
          {whatHappensNext.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{index + 1}</span>
              </div>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why We Ask Questions */}
      <div className="bg-accent/50 rounded-xl p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            {whyWeAsk}
          </p>
        </div>
      </div>

      {/* Nickname */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <Label htmlFor="nickname" className="text-sm font-semibold">
          {language === 'pidgin'
            ? 'Wetin nickname you wan make we dey call you?'
            : 'What nickname would you like to go by?'}
        </Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={language === 'pidgin' ? 'e.g. Ada, Chidi, KD' : 'e.g. Alex, Sam, KD'}
          maxLength={40}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          {language === 'pidgin'
            ? 'We go use this name everywhere for the app.'
            : "We'll use this name everywhere in the app."}
        </p>
      </div>

      {/* Feature cards - collapsible */}
      <div className="grid gap-3">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-card transition-all"
          >
            <div className="p-2 rounded-lg gradient-primary flex-shrink-0">
              <feature.icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button onClick={handleContinue} disabled={saving} size="lg" className="px-8 bg-gradient-primary w-full sm:w-auto">
          {saving
            ? (language === 'en' ? 'Saving…' : 'E dey save…')
            : (language === 'en' ? "Let's start" : 'Make we start')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {onSkip && (
          <Button 
            onClick={onSkip} 
            variant="ghost" 
            size="lg" 
            className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
          >
            {language === 'en' ? 'Skip tour' : 'Skip am'}
          </Button>
        )}
      </div>
    </div>
  );
}
