import { useEffect, useRef, useState } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';

export type CalEventKind = 'task' | 'slot' | 'commitment';

export interface CalEvent {
  id: string;
  kind: CalEventKind;
  title: string;
  start: Date;
  end: Date;
  priority?: string | null;
  raw?: any;
}

interface Props {
  date: Date;
  events: CalEvent[];
  hourHeight?: number;
  onEventClick?: (e: CalEvent) => void;
  onEmptyClick?: (start: Date) => void;
  autoScrollToNow?: boolean;
  showHourLabels?: boolean;
  className?: string;
}

const priorityClasses = (p?: string | null) => {
  switch ((p || '').toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300';
    case 'MEDIUM':
      return 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300';
    case 'LOW':
      return 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300';
    default:
      return 'bg-primary/15 border-primary text-primary';
  }
};

const kindStyles = (kind: CalEventKind, priority?: string | null) => {
  if (kind === 'commitment') {
    return 'bg-muted/70 border-muted-foreground/40 text-foreground/80 border-dashed';
  }
  if (kind === 'slot') {
    return `${priorityClasses(priority)} border-dotted`;
  }
  return priorityClasses(priority);
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayTimeline = ({
  date,
  events,
  hourHeight = 56,
  onEventClick,
  onEmptyClick,
  autoScrollToNow = true,
  showHourLabels = true,
  className = '',
}: Props) => {
  const dayStart = startOfDay(date);
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const isToday = isSameDay(date, now);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoScrollToNow) return;
    const ref = containerRef.current;
    if (!ref) return;
    const target = isToday
      ? (now.getHours() * 60 + now.getMinutes()) / 60
      : 7;
    ref.scrollTop = Math.max(0, target * hourHeight - hourHeight * 2);
  }, [isToday, autoScrollToNow, hourHeight]);

  const minutesFromStart = (d: Date) => (d.getTime() - dayStart.getTime()) / 60000;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto rounded-lg border bg-card ${className}`}
      style={{ height: hourHeight * 14 }}
    >
      <div className="relative" style={{ height: hourHeight * 24 }}>
        {/* Hour rows */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/50 flex"
            style={{ top: h * hourHeight, height: hourHeight }}
          >
            {showHourLabels && (
              <div className="w-12 shrink-0 -translate-y-2 text-[10px] text-muted-foreground pl-1 pt-0.5">
                {h === 0 ? '' : format(new Date(2000, 0, 1, h), 'h a')}
              </div>
            )}
            <button
              onClick={() => {
                const d = new Date(dayStart);
                d.setHours(h, 0, 0, 0);
                onEmptyClick?.(d);
              }}
              className="flex-1 group hover:bg-accent/30 transition-colors text-left"
              aria-label={`Add task at ${h}:00`}
            >
              <span className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground pl-2">+ Add</span>
            </button>
          </div>
        ))}

        {/* Events */}
        <div className="absolute inset-0 pointer-events-none" style={{ paddingLeft: showHourLabels ? 48 : 0 }}>
          {events.map((ev) => {
            const startMin = Math.max(0, minutesFromStart(ev.start));
            const endMin = Math.min(24 * 60, minutesFromStart(ev.end));
            const top = (startMin / 60) * hourHeight;
            const height = Math.max(18, ((endMin - startMin) / 60) * hourHeight - 2);
            return (
              <button
                key={`${ev.kind}-${ev.id}`}
                onClick={() => onEventClick?.(ev)}
                className={`absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 text-left pointer-events-auto shadow-sm hover:shadow transition-all overflow-hidden ${kindStyles(
                  ev.kind,
                  ev.priority
                )}`}
                style={{ top, height }}
              >
                <div className="text-xs font-semibold truncate">{ev.title}</div>
                <div className="text-[10px] opacity-80 truncate">
                  {format(ev.start, 'h:mm a')} – {format(ev.end, 'h:mm a')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current time line */}
        {isToday && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
            style={{ top: ((now.getHours() * 60 + now.getMinutes()) / 60) * hourHeight }}
          >
            {showHourLabels && <div className="w-12 shrink-0" />}
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DayTimeline;
