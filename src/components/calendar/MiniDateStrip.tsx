import { useEffect, useRef } from 'react';
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';

interface Props {
  selected: Date;
  onSelect: (d: Date) => void;
  daysBefore?: number;
  daysAfter?: number;
}

const MiniDateStrip = ({ selected, onSelect, daysBefore = 14, daysAfter = 21 }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const start = subDays(startOfDay(new Date()), daysBefore);
  const dates = Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => addDays(start, i));

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selected]);

  const today = new Date();

  return (
    <div
      ref={scrollerRef}
      className="-mx-2 px-2 overflow-x-auto scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex gap-1.5 py-2 min-w-max">
        {dates.map((d) => {
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              ref={isSel ? selectedRef : undefined}
              onClick={() => onSelect(d)}
              className={`flex flex-col items-center justify-center w-11 h-14 rounded-full shrink-0 transition-all ${
                isSel
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted/40 hover:bg-muted text-foreground'
              }`}
              aria-label={format(d, 'PPP')}
              aria-pressed={isSel}
            >
              <span className={`text-[10px] uppercase font-medium ${isSel ? 'opacity-90' : 'text-muted-foreground'}`}>
                {format(d, 'EEEEE')}
              </span>
              <span className="text-sm font-semibold leading-tight">{format(d, 'd')}</span>
              {isToday && !isSel && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniDateStrip;
