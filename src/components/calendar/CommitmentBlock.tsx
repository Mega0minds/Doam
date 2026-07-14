import { Lock, Moon, Book, Car, Users, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Commitment {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  category: string;
  is_locked: boolean;
}

interface CommitmentBlockProps {
  commitment: Commitment;
  compact?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    class: <Book className="h-4 w-4" />,
    work: <Briefcase className="h-4 w-4" />,
    commute: <Car className="h-4 w-4" />,
    family: <Users className="h-4 w-4" />,
    sleep: <Moon className="h-4 w-4" />,
  };
  return icons[category] || null;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    class: 'bg-blue-500/20 border-blue-500',
    work: 'bg-purple-500/20 border-purple-500',
    commute: 'bg-gray-500/20 border-gray-500',
    family: 'bg-pink-500/20 border-pink-500',
    sleep: 'bg-indigo-500/20 border-indigo-500',
    other: 'bg-muted border-border',
  };
  return colors[category] || colors.other;
};

const CommitmentBlock = ({ commitment, compact = false }: CommitmentBlockProps) => {
  if (compact) {
    return (
      <div className={`text-xs p-1 rounded mb-1 border-l-2 ${getCategoryColor(commitment.category)}`}>
        <div className="font-medium truncate flex items-center gap-1">
          {commitment.is_locked && <Lock className="h-3 w-3" />}
          {commitment.title}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getCategoryColor(commitment.category)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {commitment.is_locked && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            {getCategoryIcon(commitment.category)}
            {commitment.title}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {commitment.start_time} - {commitment.end_time}
          </div>
        </div>
        <Badge variant="outline" className="text-xs capitalize">
          {commitment.category}
        </Badge>
      </div>
      
      {/* Fixed commitment indicator */}
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Fixed commitment — AI will not schedule over this</span>
      </div>
    </div>
  );
};

export default CommitmentBlock;
