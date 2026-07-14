import { useState } from 'react';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateScheduleButtonProps {
  onGenerated: () => void;
  hasExistingSchedule: boolean;
}

const GenerateScheduleButton = ({ onGenerated, hasExistingSchedule }: GenerateScheduleButtonProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const generateSchedule = async () => {
    setGenerating(true);
    setShowConfirm(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule');
      
      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'Cannot generate schedule',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Schedule generated!',
        description: `Created ${data.slots_created || 'your'} optimized time blocks based on your goals and energy profile.`,
      });
      
      onGenerated();
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast({
        title: 'Error generating schedule',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClick = () => {
    if (hasExistingSchedule) {
      setShowConfirm(true);
    } else {
      generateSchedule();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={generating}
        className="gap-2"
      >
        {generating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {hasExistingSchedule ? 'Regenerate' : 'Generate'} Schedule
          </>
        )}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Regenerate Today's Schedule?
            </DialogTitle>
            <DialogDescription>
              This will replace your current schedule for today. Any feedback you've given on completed/skipped tasks will be preserved for learning.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={generateSchedule} disabled={generating}>
              {generating ? 'Generating...' : 'Yes, Regenerate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GenerateScheduleButton;
