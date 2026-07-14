import { format } from 'date-fns';
import { Check, X, Sparkles, Lock, Coffee, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  justification: string | null;
  task_id: string | null;
  tasks?: {
    title: string;
    priority: string;
    type: string;
  } | null;
}

interface ScheduleSlotCardProps {
  slot: ScheduleSlot;
  onComplete: (slot: ScheduleSlot) => void;
  onSkip: (slot: ScheduleSlot) => void;
  compact?: boolean;
}

const ScheduleSlotCard = ({ slot, onComplete, onSkip, compact = false }: ScheduleSlotCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const isRestBlock = slot.justification?.toLowerCase().includes('rest') || 
                      slot.justification?.toLowerCase().includes('break') ||
                      slot.justification?.toLowerCase().includes('recharge');
  
  const isDeepWork = slot.tasks?.type === 'Deep Work' || slot.tasks?.type === 'Creative';
  
  // Extract goal info from justification (format: "[Action Title] justification")
  const actionMatch = slot.justification?.match(/^\[([^\]]+)\]/);
  const actionTitle = actionMatch ? actionMatch[1] : null;
  const justificationText = actionMatch 
    ? slot.justification?.replace(/^\[[^\]]+\]\s*/, '') 
    : slot.justification;

  if (compact) {
    return (
      <div className={`text-xs p-1 rounded mb-1 border-l-2 ${
        isRestBlock 
          ? 'bg-emerald-500/20 border-emerald-500'
          : 'bg-primary/20 border-primary'
      }`}>
        <div className="font-medium truncate flex items-center gap-1">
          {isRestBlock ? (
            <Coffee className="h-3 w-3" />
          ) : isDeepWork ? (
            <Zap className="h-3 w-3 text-amber-500" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {slot.tasks?.title || actionTitle || 'Task'}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      isRestBlock 
        ? 'bg-emerald-500/10 border-emerald-500'
        : 'bg-primary/10 border-primary'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {isRestBlock ? (
              <Coffee className="h-4 w-4 text-emerald-500" />
            ) : isDeepWork ? (
              <Zap className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            {slot.tasks?.title || actionTitle || 'Scheduled Block'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
          </div>
        </div>
        {slot.tasks && (
          <div className="flex gap-1 flex-wrap justify-end">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                slot.tasks.priority === 'HIGH' 
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300' 
                  : slot.tasks.priority === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'bg-muted'
              }`}
            >
              {slot.tasks.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {slot.tasks.type}
            </Badge>
          </div>
        )}
      </div>

      {/* Explainability Section */}
      {justificationText && (
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 mt-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              Why this time?
              {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
              <p className="italic">{justificationText}</p>
              {actionTitle && slot.tasks?.title !== actionTitle && (
                <p className="mt-1 font-medium text-foreground/70">
                  From goal action: {actionTitle}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Actions - only show for non-rest blocks */}
      {!isRestBlock && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-green-500/10 hover:bg-green-500/20 border-green-500/30"
            onClick={() => onComplete(slot)}
          >
            <Check className="h-4 w-4 mr-1" />
            Done
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 border-red-500/30"
            onClick={() => onSkip(slot)}
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScheduleSlotCard;
