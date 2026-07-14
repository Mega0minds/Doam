import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, AlertCircle, Target } from 'lucide-react';

interface ImprovingTogetherCardProps {
  struggles: string[];
  blockers: string[];
  consistencyLevel: string | null;
}

export function ImprovingTogetherCard({
  struggles,
  blockers,
  consistencyLevel
}: ImprovingTogetherCardProps) {
  const { language } = useLanguage();

  const improvements: { icon: typeof TrendingUp; text: string; type: 'struggle' | 'blocker' | 'consistency' }[] = [];

  // Consistency insight
  if (consistencyLevel === 'low' || consistencyLevel === 'variable') {
    const text = language === 'pidgin'
      ? 'Consistency na your challenge — we go start with small, achievable blocks to build momentum.'
      : "Consistency is your growth area — we'll start with small, achievable blocks to build momentum.";
    improvements.push({ icon: TrendingUp, text, type: 'consistency' });
  }

  // Struggles insights
  struggles.slice(0, 2).forEach(struggle => {
    const text = language === 'pidgin'
      ? `You dey work on "${struggle}" — your schedule go support this growth.`
      : `You're working on "${struggle}" — your schedule supports this growth area.`;
    improvements.push({ icon: Target, text, type: 'struggle' });
  });

  // Blockers insights
  blockers.slice(0, 2).forEach(blocker => {
    const text = language === 'pidgin'
      ? `"${blocker}" fit block you — we go plan around am.`
      : `"${blocker}" can block your progress — we plan around this.`;
    improvements.push({ icon: AlertCircle, text, type: 'blocker' });
  });

  if (improvements.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          {language === 'pidgin' ? 'Wetin We Dey Improve Together' : "What We're Improving Together"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {improvements.slice(0, 3).map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-start gap-3 text-sm">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${
                item.type === 'blocker' ? 'text-amber-500' : 'text-muted-foreground'
              }`} />
              <p className="text-muted-foreground">{item.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
