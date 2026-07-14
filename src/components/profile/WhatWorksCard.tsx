import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Clock, Brain, Target, Battery } from 'lucide-react';

interface WhatWorksCardProps {
  chronotype: string | null;
  highFocusStart: string | null;
  highFocusEnd: string | null;
  workStyle: string | null;
  consistencyLevel: string | null;
  strengths: string[];
}

export function WhatWorksCard({
  chronotype,
  highFocusStart,
  highFocusEnd,
  workStyle,
  consistencyLevel,
  strengths
}: WhatWorksCardProps) {
  const { language } = useLanguage();

  const insights: { icon: typeof Clock; text: string }[] = [];

  // Focus time insight
  if (highFocusStart && highFocusEnd) {
    const text = language === 'pidgin'
      ? `Your head sharp between ${highFocusStart} and ${highFocusEnd}. Na when we schedule hard work.`
      : `You focus best between ${highFocusStart} and ${highFocusEnd}. We schedule challenging tasks here.`;
    insights.push({ icon: Clock, text });
  }

  // Chronotype insight
  if (chronotype) {
    const chronoText = {
      early_bird: language === 'pidgin'
        ? 'You be morning person — your schedule front-load important tasks.'
        : "You're a morning person — your schedule front-loads important tasks.",
      night_owl: language === 'pidgin'
        ? 'You be night owl — deep work dey shift to evening.'
        : "You're a night owl — deep work shifts to evening hours.",
      neutral: language === 'pidgin'
        ? 'Your energy balance throughout the day — flexible scheduling fit you.'
        : 'Your energy is balanced throughout the day — flexible scheduling works for you.'
    }[chronotype];
    if (chronoText) {
      insights.push({ icon: Battery, text: chronoText });
    }
  }

  // Work style insight
  if (workStyle) {
    const styleText = {
      structured: language === 'pidgin'
        ? 'You like structure — we go give you fixed time blocks.'
        : 'You prefer structure — your schedule has defined time blocks.',
      flexible: language === 'pidgin'
        ? 'You like flexibility — we go give you loose windows.'
        : 'You prefer flexibility — your schedule has loose time windows.',
      deadline: language === 'pidgin'
        ? 'Deadline dey drive you — we go set clear end times.'
        : "You're deadline-driven — clear end times keep you on track.",
      flow: language === 'pidgin'
        ? 'You follow your flow — we protect uninterrupted time.'
        : 'You work in flow states — we protect uninterrupted blocks.'
    }[workStyle];
    if (styleText) {
      insights.push({ icon: Brain, text: styleText });
    }
  }

  // Strengths insight
  if (strengths.length > 0) {
    const strengthList = strengths.slice(0, 2).join(', ');
    const text = language === 'pidgin'
      ? `Your strengths like ${strengthList} help you succeed.`
      : `Your strengths in ${strengthList} contribute to your success.`;
    insights.push({ icon: Target, text });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {language === 'pidgin' ? 'Wetin Dey Work For You' : 'What Works Best for You'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex items-start gap-3 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">{insight.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
