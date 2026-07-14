import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sun, Moon, Sunset, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InsightsCardProps {
  chronotype: string | null;
  workStyle: string | null;
  consistencyLevel: string | null;
  topGoalCategories: string[];
}

export function InsightsCard({ 
  chronotype, 
  workStyle, 
  consistencyLevel,
  topGoalCategories 
}: InsightsCardProps) {
  const { language } = useLanguage();

  const getChronotypeIcon = () => {
    switch (chronotype) {
      case 'early_bird': return <Sun className="h-5 w-5 text-amber-500" />;
      case 'night_owl': return <Moon className="h-5 w-5 text-indigo-500" />;
      default: return <Sunset className="h-5 w-5 text-orange-500" />;
    }
  };

  const getChronotypeLabel = () => {
    const labels: Record<string, { en: string; pidgin: string }> = {
      'early_bird': { en: 'Morning Person', pidgin: 'Morning Person' },
      'night_owl': { en: 'Night Owl', pidgin: 'Night Owl' },
      'balanced': { en: 'Balanced', pidgin: 'Balanced' }
    };
    return labels[chronotype || 'balanced']?.[language === 'pidgin' ? 'pidgin' : 'en'] || 'Balanced';
  };

  const getWorkStyleLabel = () => {
    const labels: Record<string, { en: string; pidgin: string }> = {
      'structured': { en: 'Structured', pidgin: 'Structured' },
      'flexible': { en: 'Flexible', pidgin: 'Flexible' },
      'deadline': { en: 'Deadline-driven', pidgin: 'Deadline-driven' },
      'flow': { en: 'Flow-based', pidgin: 'Flow-based' }
    };
    return labels[workStyle || 'flexible']?.[language === 'pidgin' ? 'pidgin' : 'en'] || 'Flexible';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { en: string; pidgin: string }> = {
      'academic_career': { en: 'Academics', pidgin: 'School' },
      'health': { en: 'Health', pidgin: 'Health' },
      'personal_growth': { en: 'Growth', pidgin: 'Growth' },
      'social': { en: 'Social', pidgin: 'Social' },
      'spiritual_mental': { en: 'Mental', pidgin: 'Mind' },
      'rest_recreation': { en: 'Rest', pidgin: 'Rest' }
    };
    return labels[category]?.[language === 'pidgin' ? 'pidgin' : 'en'] || category;
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {language === 'pidgin' ? 'How DoAm See You' : 'How DoAm Sees You'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Focus Type */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              {getChronotypeIcon()}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === 'pidgin' ? 'Focus Time' : 'Focus Type'}
              </span>
            </div>
            <p className="font-semibold text-foreground">{getChronotypeLabel()}</p>
          </div>

          {/* Work Style */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === 'pidgin' ? 'Work Style' : 'Planning Style'}
              </span>
            </div>
            <p className="font-semibold text-foreground">{getWorkStyleLabel()}</p>
          </div>

          {/* Top Priorities */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === 'pidgin' ? 'Top Priority' : 'Top Priorities'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {topGoalCategories.length > 0 ? (
                topGoalCategories.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {getCategoryLabel(cat)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {language === 'pidgin' ? 'No goals yet' : 'No goals yet'}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
