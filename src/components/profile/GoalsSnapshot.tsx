import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, ChevronRight, BookOpen, Heart, TrendingUp, Users, Brain, Coffee } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

interface Goal {
  id: string;
  title: string;
  category: string;
  priority_rank: number;
  is_active: boolean;
  updated_at: string;
}

interface GoalsSnapshotProps {
  goals: Goal[];
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: { en: string; pidgin: string } }> = {
  'academic_career': { icon: BookOpen, color: 'text-blue-500', label: { en: 'Academic', pidgin: 'School' } },
  'health': { icon: Heart, color: 'text-red-500', label: { en: 'Health', pidgin: 'Health' } },
  'personal_growth': { icon: TrendingUp, color: 'text-emerald-500', label: { en: 'Growth', pidgin: 'Growth' } },
  'social': { icon: Users, color: 'text-purple-500', label: { en: 'Social', pidgin: 'Social' } },
  'spiritual_mental': { icon: Brain, color: 'text-indigo-500', label: { en: 'Mental', pidgin: 'Mind' } },
  'rest_recreation': { icon: Coffee, color: 'text-amber-500', label: { en: 'Rest', pidgin: 'Rest' } }
};

export function GoalsSnapshot({ goals }: GoalsSnapshotProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const sortedGoals = [...goals].sort((a, b) => a.priority_rank - b.priority_rank);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {language === 'pidgin' ? 'Your Goals' : 'Goals Snapshot'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/goals')}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            {language === 'pidgin' ? 'See All' : 'View All'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedGoals.length > 0 ? (
          <div className="space-y-3">
            {sortedGoals.slice(0, 6).map((goal) => {
              const config = categoryConfig[goal.category] || categoryConfig['personal_growth'];
              const Icon = config.icon;
              
              return (
                <div 
                  key={goal.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                  onClick={() => router.push('/goals')}
                >
                  <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.label[language === 'pidgin' ? 'pidgin' : 'en']} • 
                      {language === 'pidgin' ? ' Rank' : ' Priority'} #{goal.priority_rank}
                    </p>
                  </div>
                  <Badge 
                    variant={goal.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {goal.is_active 
                      ? (language === 'pidgin' ? 'Active' : 'Active')
                      : (language === 'pidgin' ? 'Paused' : 'Paused')
                    }
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {language === 'pidgin' 
                ? 'You never set any goal yet. Click button above to add.'
                : 'No goals set yet. Click above to add goals.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
