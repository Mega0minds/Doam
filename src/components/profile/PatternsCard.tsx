import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PatternsCardProps {
  wakeTime: string | null;
  sleepTime: string | null;
  highFocusStart: string | null;
  highFocusEnd: string | null;
  strengths: string[];
  struggles: string[];
  blockers: string[];
}

export function PatternsCard({
  wakeTime,
  sleepTime,
  highFocusStart,
  highFocusEnd,
  strengths,
  struggles,
  blockers
}: PatternsCardProps) {
  const { language } = useLanguage();

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {language === 'pidgin' ? 'Your Patterns' : 'Habits & Patterns'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === 'pidgin' ? 'Wake/Sleep' : 'Schedule'}
              </span>
            </div>
            <p className="text-sm font-medium">
              {formatTime(wakeTime)} - {formatTime(sleepTime)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === 'pidgin' ? 'Peak Focus' : 'Peak Focus'}
              </span>
            </div>
            <p className="text-sm font-medium text-primary">
              {highFocusStart && highFocusEnd 
                ? `${formatTime(highFocusStart)} - ${formatTime(highFocusEnd)}`
                : (language === 'pidgin' ? 'No data yet' : 'Not set')}
            </p>
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">
                {language === 'pidgin' ? 'Your Strengths' : 'Strengths'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas to Improve */}
        {struggles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">
                {language === 'pidgin' ? 'Areas You Dey Work On' : 'Areas to Improve'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {struggles.map((s, i) => (
                <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Blockers */}
        {blockers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">
                {language === 'pidgin' ? 'Wetin Dey Block You' : 'Typical Blockers'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockers.map((b, i) => (
                <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {strengths.length === 0 && struggles.length === 0 && blockers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === 'pidgin' 
              ? 'Add more info in settings make we understand you better.'
              : 'Add more information in settings to unlock pattern insights.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
