import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { CalendarDays, Moon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import ScheduleSlotCard from './ScheduleSlotCard';
import CommitmentBlock from './CommitmentBlock';
import EnergyIndicator from './EnergyIndicator';

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

interface Commitment {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  category: string;
  is_locked: boolean;
}

interface EnergyProfile {
  wake_time?: string;
  sleep_time?: string;
  peak_focus_start?: string;
  peak_focus_end?: string;
  low_energy_start?: string;
  low_energy_end?: string;
  chronotype?: string;
}

interface DailyScheduleViewProps {
  date: Date;
  schedule: ScheduleSlot[];
  commitments: Commitment[];
  energyProfile: EnergyProfile | null;
  loading: boolean;
  onComplete: (slot: ScheduleSlot) => void;
  onSkip: (slot: ScheduleSlot) => void;
  onSlotClick?: (slot: ScheduleSlot) => void;
}

const DailyScheduleView = ({
  date,
  schedule,
  commitments,
  energyProfile,
  loading,
  onComplete,
  onSkip,
  onSlotClick,
}: DailyScheduleViewProps) => {
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  // Filter for this day
  const dayOfWeek = date.getDay();
  const dayCommitments = commitments.filter(c => c.day_of_week === dayOfWeek);
  const daySchedule = schedule.filter(s => isSameDay(new Date(s.start_time), date));

  // Combine and sort all events by time
  type TimelineEvent = {
    type: 'commitment' | 'schedule';
    startTime: Date;
    endTime: Date;
    data: Commitment | ScheduleSlot;
  };

  const timelineEvents: TimelineEvent[] = [
    ...dayCommitments.map(c => ({
      type: 'commitment' as const,
      startTime: new Date(`${format(date, 'yyyy-MM-dd')}T${c.start_time}`),
      endTime: new Date(`${format(date, 'yyyy-MM-dd')}T${c.end_time}`),
      data: c,
    })),
    ...daySchedule.map(s => ({
      type: 'schedule' as const,
      startTime: new Date(s.start_time),
      endTime: new Date(s.end_time),
      data: s,
    })),
  ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Group events by time period
  const currentHour = new Date().getHours();
  const isToday = isSameDay(date, new Date());
  
  const pastEvents = isToday ? timelineEvents.filter(e => e.endTime.getHours() <= currentHour) : [];
  const currentEvents = isToday ? timelineEvents.filter(e => 
    e.startTime.getHours() <= currentHour && e.endTime.getHours() > currentHour
  ) : [];
  const upcomingEvents = isToday 
    ? timelineEvents.filter(e => e.startTime.getHours() > currentHour)
    : timelineEvents;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {format(date, 'EEEE, MMMM d')}
          </CardTitle>
          {energyProfile && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Moon className="h-3 w-3" />
              {energyProfile.wake_time} - {energyProfile.sleep_time}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading schedule...</div>
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate a schedule to add AI-optimized time blocks
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Events */}
            {currentEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">Now</Badge>
                  <EnergyIndicator hour={currentHour} energyProfile={energyProfile} />
                </div>
                {currentEvents.map(event => (
                  event.type === 'commitment' ? (
                    <CommitmentBlock 
                      key={(event.data as Commitment).id} 
                      commitment={event.data as Commitment} 
                    />
                  ) : (
                    <div
                      key={(event.data as ScheduleSlot).id}
                      onClick={() => onSlotClick?.(event.data as ScheduleSlot)}
                      role={onSlotClick ? 'button' : undefined}
                    >
                      <ScheduleSlotCard
                        slot={event.data as ScheduleSlot}
                        onComplete={onComplete}
                        onSkip={onSkip}
                      />
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2">
                {isToday && currentEvents.length > 0 && (
                  <Separator className="my-4" />
                )}
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isToday ? 'Upcoming' : 'Schedule'}
                </div>
                {(showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 3)).map((event, idx) => {
                  const hour = event.startTime.getHours();
                  const displayedEvents = showAllUpcoming ? upcomingEvents : upcomingEvents.slice(0, 3);
                  const prevHour = idx > 0 ? displayedEvents[idx - 1].startTime.getHours() : -1;
                  const showEnergyIndicator = hour !== prevHour;
                  
                  return (
                    <div key={event.type === 'commitment' ? (event.data as Commitment).id : (event.data as ScheduleSlot).id}>
                      {showEnergyIndicator && (
                        <div className="flex items-center gap-2 mt-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {format(event.startTime, 'h:mm a')}
                          </span>
                          <EnergyIndicator hour={hour} energyProfile={energyProfile} />
                        </div>
                      )}
                      {event.type === 'commitment' ? (
                        <CommitmentBlock 
                          commitment={event.data as Commitment} 
                        />
                      ) : (
                        <div
                          onClick={() => onSlotClick?.(event.data as ScheduleSlot)}
                          role={onSlotClick ? 'button' : undefined}
                        >
                          <ScheduleSlotCard
                            slot={event.data as ScheduleSlot}
                            onComplete={onComplete}
                            onSkip={onSkip}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {upcomingEvents.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  >
                    {showAllUpcoming ? 'Show less' : `See all (${upcomingEvents.length - 3} more)`}
                  </Button>
                )}
              </div>
            )}

            {/* Past Events (collapsed) */}
            {pastEvents.length > 0 && (
              <div className="space-y-2">
                <Separator className="my-4" />
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide opacity-50">
                  Earlier Today ({pastEvents.length})
                </div>
                <div className="opacity-50 space-y-2">
                  {pastEvents.slice(-3).map(event => (
                    event.type === 'commitment' ? (
                      <CommitmentBlock 
                        key={(event.data as Commitment).id} 
                        commitment={event.data as Commitment}
                        compact
                      />
                    ) : (
                      <div
                        key={(event.data as ScheduleSlot).id}
                        onClick={() => onSlotClick?.(event.data as ScheduleSlot)}
                        role={onSlotClick ? 'button' : undefined}
                      >
                        <ScheduleSlotCard
                          slot={event.data as ScheduleSlot}
                          onComplete={onComplete}
                          onSkip={onSkip}
                          compact
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyScheduleView;
