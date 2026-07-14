'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Target, AlertTriangle, Plus, CalendarPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

import CalendarLegend from '@/components/calendar/CalendarLegend';
import GenerateScheduleButton from '@/components/calendar/GenerateScheduleButton';
import MiniDateStrip from '@/components/calendar/MiniDateStrip';
import DayTimeline, { CalEvent } from '@/components/calendar/DayTimeline';
import QuickAddTaskDrawer from '@/components/calendar/QuickAddTaskDrawer';
import { TaskEditDrawer, type EditableTask } from '@/components/tasks/TaskEditDrawer';

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  justification: string | null;
  task_id: string | null;
  tasks?: { title: string; priority: string; type: string } | null;
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

interface TaskRow {
  id: string;
  title: string;
  priority: string;
  type: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  estimated_duration_min: number | null;
  reminder_enabled: boolean | null;
  notes: string | null;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  priority_rank: number;
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

type ViewMode = 'daily' | 'weekly' | 'monthly';

const VIEW_KEY = 'doam-calendar-view';

const parseTimeOnto = (date: Date, t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const Calendar = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'daily';
    const v = localStorage.getItem(VIEW_KEY);
    return (v === 'weekly' || v === 'monthly' || v === 'daily') ? v : 'daily';
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [energyProfile, setEnergyProfile] = useState<EnergyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstLoaded, setFirstLoaded] = useState(false);

  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean; slot: ScheduleSlot | null; action: 'complete' | 'skip' | null;
  }>({ open: false, slot: null, action: null });
  const [actualDuration, setActualDuration] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [editTask, setEditTask] = useState<EditableTask | null>(null);
  const [quickAddStart, setQuickAddStart] = useState<Date | null>(null);
  const monthTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Persist view
  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view); } catch {}
  }, [view]);

  // Fetch range covers the broadest visible window for the current view
  const fetchRange = useMemo(() => {
    if (view === 'monthly') {
      const gridStart = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
      return { start: gridStart, end: addDays(gridStart, 42) };
    }
    if (view === 'weekly') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return { start, end: addDays(start, 7) };
    }
    return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
  }, [view, selectedDate, monthCursor]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [scheduleResult, commitmentResult, taskResult, goalResult, energyResult] = await Promise.all([
        supabase
          .from('schedule_slots')
          .select(`*, tasks (title, priority, type)`)
          .eq('user_id', user.id)
          .gte('start_time', fetchRange.start.toISOString())
          .lt('start_time', fetchRange.end.toISOString()),
        supabase.from('fixed_commitments').select('*').eq('user_id', user.id),
        supabase
          .from('tasks')
          .select('id,title,priority,type,status,due_date,due_time,estimated_duration_min,reminder_enabled,notes')
          .eq('user_id', user.id)
          .not('due_date', 'is', null)
          .gte('due_date', format(fetchRange.start, 'yyyy-MM-dd'))
          .lte('due_date', format(addDays(fetchRange.end, -1), 'yyyy-MM-dd')),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true).order('priority_rank'),
        supabase.from('energy_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      setSchedule((scheduleResult.data as any) || []);
      setCommitments((commitmentResult.data as any) || []);
      setTasks((taskResult.data as any) || []);
      setGoals((goalResult.data as any) || []);

      if (energyResult.data) {
        setEnergyProfile({
          wake_time: (energyResult.data as any).wake_time,
          sleep_time: (energyResult.data as any).sleep_time,
          peak_focus_start: (energyResult.data as any).high_focus_start,
          peak_focus_end: (energyResult.data as any).high_focus_end,
          low_energy_start: (energyResult.data as any).low_energy_start,
          low_energy_end: (energyResult.data as any).low_energy_end,
          chronotype: (energyResult.data as any).chronotype,
        });
      }
    } catch (e) {
      console.error('Error fetching calendar data:', e);
    } finally {
      setLoading(false);
      setFirstLoaded(true);
    }
  }, [fetchRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---------- Event building ---------- */

  const eventsForDay = useCallback((day: Date): CalEvent[] => {
    const events: CalEvent[] = [];
    const dow = day.getDay();

    // Commitments (recurring)
    for (const c of commitments) {
      if (c.day_of_week !== dow) continue;
      events.push({
        id: `c-${c.id}-${format(day, 'yyyy-MM-dd')}`,
        kind: 'commitment',
        title: c.title,
        start: parseTimeOnto(day, c.start_time),
        end: parseTimeOnto(day, c.end_time),
        raw: c,
      });
    }

    // Schedule slots
    for (const s of schedule) {
      const st = new Date(s.start_time);
      if (!isSameDay(st, day)) continue;
      events.push({
        id: s.id,
        kind: 'slot',
        title: s.tasks?.title || 'Scheduled Block',
        start: st,
        end: new Date(s.end_time),
        priority: s.tasks?.priority,
        raw: s,
      });
    }

    // Tasks with due_time
    for (const t of tasks) {
      if (!t.due_date) continue;
      const taskDate = new Date(`${t.due_date}T00:00:00`);
      if (!isSameDay(taskDate, day)) continue;
      const start = t.due_time ? parseTimeOnto(day, t.due_time) : parseTimeOnto(day, '09:00');
      const durMin = t.estimated_duration_min ?? 30;
      const end = new Date(start.getTime() + durMin * 60_000);
      events.push({
        id: t.id,
        kind: 'task',
        title: t.title,
        start,
        end,
        priority: t.priority,
        raw: t,
      });
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [commitments, schedule, tasks]);

  /* ---------- Handlers ---------- */

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setMonthCursor(startOfMonth(now));
  };

  const openEventEdit = async (ev: CalEvent) => {
    if (ev.kind === 'commitment') {
      toast({ title: 'Fixed commitment', description: 'Edit recurring commitments in Settings.' });
      return;
    }
    if (ev.kind === 'task') {
      const t = ev.raw as TaskRow;
      setEditTask({
        id: t.id,
        title: t.title,
        estimated_duration_min: t.estimated_duration_min ?? 30,
        priority: t.priority,
        type: t.type,
        status: t.status,
        due_date: t.due_date,
        due_time: t.due_time,
        reminder_enabled: !!t.reminder_enabled,
        notes: t.notes,
      });
      return;
    }
    // slot
    const slot = ev.raw as ScheduleSlot;
    if (!slot.task_id) {
      toast({ title: 'No task linked', description: "This block isn't tied to a task." });
      return;
    }
    const { data } = await supabase.from('tasks').select('*').eq('id', slot.task_id).maybeSingle();
    if (!data) { toast({ title: 'Could not load task', variant: 'destructive' }); return; }
    const d: any = data;
    setEditTask({
      id: d.id, title: d.title, estimated_duration_min: d.estimated_duration_min,
      priority: d.priority, type: d.type, status: d.status,
      due_date: d.due_date, due_time: d.due_time,
      reminder_enabled: !!d.reminder_enabled, notes: d.notes,
    });
  };

  const handleTaskSaved = (t: EditableTask) => {
    // Optimistic update of tasks list
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, ...t, estimated_duration_min: t.estimated_duration_min } as TaskRow : x));
    setSchedule((prev) =>
      prev.map((s) =>
        s.task_id === t.id && s.tasks
          ? { ...s, tasks: { ...s.tasks, title: t.title, priority: t.priority, type: t.type } }
          : s
      )
    );
    setEditTask(null);
    fetchData();
  };

  const openFeedbackDialog = (slot: ScheduleSlot, action: 'complete' | 'skip') => {
    setFeedbackDialog({ open: true, slot, action });
    if (action === 'complete') {
      const start = new Date(slot.start_time);
      const end = new Date(slot.end_time);
      setActualDuration(Math.round((end.getTime() - start.getTime()) / 60000).toString());
    } else { setActualDuration(''); }
    setSkipReason('');
  };

  const submitFeedback = async () => {
    if (!feedbackDialog.slot) return;
    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.functions.invoke('record-feedback', {
        body: {
          task_id: feedbackDialog.slot.task_id,
          schedule_slot_id: feedbackDialog.slot.id,
          status: feedbackDialog.action === 'complete' ? 'completed' : 'skipped',
          actual_duration_minutes: actualDuration ? parseInt(actualDuration) : null,
          skipped_reason: skipReason || null,
        },
      });
      if (error) throw error;
      toast({
        title: feedbackDialog.action === 'complete' ? 'Task completed!' : 'Task skipped',
        description: feedbackDialog.action === 'complete'
          ? 'Great work! Your progress is being tracked.'
          : "Noted. We'll learn from this to improve future schedules.",
      });
      setFeedbackDialog({ open: false, slot: null, action: null });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error recording feedback', description: e.message, variant: 'destructive' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getGoalCategoryIcon = (category: string) => ({
    academic_career: '📚', health: '💪', personal_growth: '🌱',
    social: '👥', spiritual_mental: '🧘', rest_recreation: '☕',
  }[category] || '🎯');

  /* ---------- Renderers ---------- */

  const NavHeader = ({ title, onPrev, onNext }: { title: string; onPrev: () => void; onNext: () => void }) => (
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-center font-semibold text-base sm:text-lg flex-1 truncate">{title}</div>
      <Button variant="outline" size="icon" onClick={onNext} aria-label="Next">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderDaily = () => {
    const events = eventsForDay(selectedDate);
    const isEmpty = events.length === 0;
    return (
      <div className="space-y-3 animate-fade-in">
        <NavHeader
          title={format(selectedDate, 'EEEE, MMM d')}
          onPrev={() => setSelectedDate(addDays(selectedDate, -1))}
          onNext={() => setSelectedDate(addDays(selectedDate, 1))}
        />
        <MiniDateStrip selected={selectedDate} onSelect={setSelectedDate} />

        {!isSameDay(selectedDate, new Date()) ? (
          <Button variant="outline" size="sm" className="w-full" onClick={goToToday}>Jump to Today</Button>
        ) : (
          <GenerateScheduleButton
            onGenerated={fetchData}
            hasExistingSchedule={schedule.some((s) => isSameDay(new Date(s.start_time), selectedDate))}
          />
        )}

        {loading && !firstLoaded ? (
          <Skeleton className="h-[600px] w-full rounded-lg" />
        ) : (
          <>
            <DayTimeline
              date={selectedDate}
              events={events}
              onEventClick={openEventEdit}
              onEmptyClick={(start) => setQuickAddStart(start)}
            />
            {isEmpty && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Nothing scheduled. Want to add something?</p>
                  <Button size="sm" onClick={() => setQuickAddStart(parseTimeOnto(selectedDate, '09:00'))}>
                    <Plus className="h-4 w-4 mr-1" /> Quick add
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  const renderWeekly = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const visibleCount = isMobile ? 3 : 7;
    // anchor visible window around selectedDate
    let anchorOffset = isMobile
      ? Math.max(0, Math.min(7 - visibleCount, selectedDate.getDay() === 0 ? 4 : selectedDate.getDay() - 1 - 1))
      : 0;
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const visibleDays = isMobile ? allDays.slice(anchorOffset, anchorOffset + visibleCount) : allDays;

    return (
      <div className="space-y-3 animate-fade-in">
        <NavHeader
          title={`${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
          onPrev={() => setSelectedDate(addDays(selectedDate, isMobile ? -3 : -7))}
          onNext={() => setSelectedDate(addDays(selectedDate, isMobile ? 3 : 7))}
        />
        <MiniDateStrip selected={selectedDate} onSelect={setSelectedDate} />

        {loading && !firstLoaded ? (
          <Skeleton className="h-[600px] w-full rounded-lg" />
        ) : (
          <Card>
            <CardContent className="p-2">
              {/* Day headers */}
              <div className="flex pl-12 mb-1 sticky top-0 bg-card z-10">
                {visibleDays.map((d) => {
                  const isToday = isSameDay(d, new Date());
                  const isSel = isSameDay(d, selectedDate);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-1 min-w-0 py-1 text-center rounded-md transition-colors ${
                        isSel ? 'bg-primary/10' : isToday ? 'bg-accent/40' : ''
                      }`}
                    >
                      <div className="text-[10px] uppercase text-muted-foreground">{format(d, 'EEE')}</div>
                      <div className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{format(d, 'd')}</div>
                    </button>
                  );
                })}
              </div>
              {/* Columns */}
              <div className="flex">
                {visibleDays.map((d, idx) => (
                  <div key={d.toISOString()} className="flex-1 min-w-0 border-l first:border-l-0 border-border/50">
                    <DayTimeline
                      date={d}
                      events={eventsForDay(d)}
                      hourHeight={48}
                      showHourLabels={idx === 0}
                      onEventClick={openEventEdit}
                      onEmptyClick={(start) => setQuickAddStart(start)}
                      autoScrollToNow={idx === 0}
                      className="border-0 rounded-none"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderMonthly = () => {
    const monthStart = startOfMonth(monthCursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Build event preview per day
    const tasksByDay = new Map<string, CalEvent[]>();
    for (const c of cells) {
      const key = format(c, 'yyyy-MM-dd');
      tasksByDay.set(key, eventsForDay(c).filter((e) => e.kind !== 'commitment'));
    }

    // Swipe handlers
    return (
      <div
        className="space-y-3 animate-fade-in"
        onTouchStart={(e) => { monthTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          if (!monthTouchRef.current) return;
          const dx = e.changedTouches[0].clientX - monthTouchRef.current.x;
          const dy = e.changedTouches[0].clientY - monthTouchRef.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            setMonthCursor(addMonths(monthCursor, dx < 0 ? 1 : -1));
          }
          monthTouchRef.current = null;
        }}
      >
        <NavHeader
          title={format(monthCursor, 'MMMM yyyy')}
          onPrev={() => setMonthCursor(addMonths(monthCursor, -1))}
          onNext={() => setMonthCursor(addMonths(monthCursor, 1))}
        />

        {loading && !firstLoaded ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayLabels.map((d, i) => (
                  <div key={i} className="text-[10px] text-center text-muted-foreground font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day) => {
                  const inMonth = isSameMonth(day, monthCursor);
                  const isToday = isSameDay(day, new Date());
                  const evs = tasksByDay.get(format(day, 'yyyy-MM-dd')) ?? [];
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setView('daily'); }}
                      className={`min-h-[64px] sm:min-h-[88px] rounded-md p-1 text-left text-xs flex flex-col gap-1 border transition-all hover:bg-accent ${
                        inMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
                      } ${isToday ? 'border-primary ring-1 ring-primary/40' : 'border-border/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold ${
                          isToday ? 'bg-primary text-primary-foreground' : ''
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {evs.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={`truncate text-[10px] px-1 py-0.5 rounded ${
                              e.priority === 'HIGH' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                              e.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                              e.priority === 'LOW' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                              'bg-primary/15 text-primary'
                            }`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {evs.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{evs.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={goToToday}>Jump to Today</Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Your Schedule</h1>
            <p className="text-sm text-muted-foreground">Goal-driven, energy-aware daily planning</p>
          </div>
          <Button
            size="sm"
            onClick={() => setQuickAddStart(parseTimeOnto(selectedDate, format(new Date(), 'HH:mm')))}
          >
            <CalendarPlus className="h-4 w-4 mr-1" /> Quick add
          </Button>
        </div>

        {/* Segmented view toggle */}
        <div role="tablist" className="inline-flex w-full sm:w-auto rounded-lg border bg-muted p-1">
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                view === v ? 'bg-background text-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {!energyProfile && view === 'daily' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Set up your energy profile to enable smart scheduling based on your natural rhythms.
            </AlertDescription>
          </Alert>
        )}

        {view === 'daily' && renderDaily()}
        {view === 'weekly' && renderWeekly()}
        {view === 'monthly' && renderMonthly()}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals set yet</p>
            ) : (
              goals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                  <span>{getGoalCategoryIcon(goal.category)}</span>
                  <span className="flex-1 truncate">{goal.title}</span>
                  <Badge variant="secondary" className={`text-xs ${goal.priority_rank <= 2 ? 'bg-primary/20 text-primary' : ''}`}>
                    #{goal.priority_rank}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <CalendarLegend />

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialog.open}
          onOpenChange={(open) => !open && setFeedbackDialog({ open: false, slot: null, action: null })}
        >
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{feedbackDialog.action === 'complete' ? 'Mark Task Complete' : 'Skip Task'}</DialogTitle>
              <DialogDescription>
                {feedbackDialog.action === 'complete'
                  ? 'Great job! How long did it actually take?'
                  : 'No worries! Let us know why so we can improve your schedule.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {feedbackDialog.action === 'complete' && (
                <div>
                  <Label htmlFor="duration">Actual duration (minutes)</Label>
                  <Input id="duration" type="number" value={actualDuration}
                    onChange={(e) => setActualDuration(e.target.value)} placeholder="30" />
                </div>
              )}
              {feedbackDialog.action === 'skip' && (
                <div>
                  <Label htmlFor="reason">Why are you skipping?</Label>
                  <Textarea id="reason" value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)} rows={2}
                    placeholder="e.g., ran out of time, felt too tired..." />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline"
                  onClick={() => setFeedbackDialog({ open: false, slot: null, action: null })}>
                  Cancel
                </Button>
                <Button onClick={submitFeedback} disabled={submittingFeedback}
                  variant={feedbackDialog.action === 'complete' ? 'default' : 'destructive'}>
                  {submittingFeedback ? 'Saving...' : feedbackDialog.action === 'complete' ? 'Complete' : 'Skip'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <TaskEditDrawer
          open={!!editTask}
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={handleTaskSaved}
        />

        <QuickAddTaskDrawer
          open={!!quickAddStart}
          start={quickAddStart}
          onClose={() => setQuickAddStart(null)}
          onCreated={fetchData}
        />
      </div>
    </Layout>
  );
};

export default Calendar;
