'use client';
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Sparkles, Calendar as CalIcon, Upload, Target, CheckCircle2,
  Plus, ExternalLink,
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { DynamicGreeting } from "@/components/DynamicGreeting";
import { useGoogleCalendar, type GCalEvent } from "@/hooks/useGoogleCalendar";

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  justification: string;
  task_id: string | null;
  tasks?: { title: string; priority: string; type: string };
}

interface NewTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  type: string;
  due_date: string;
  description: string;
}

const PRIORITIES = ['low', 'medium', 'high'] as const;
const TYPES = ['Work', 'Study', 'Health', 'Personal', 'Other'];

const priorityColor: Record<string, string> = {
  low:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high:   'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const Dashboard = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [hasEnergyProfile, setHasEnergyProfile] = useState(false);
  const [hasTasks, setHasTasks] = useState(false);
  const [hasGoals, setHasGoals] = useState(false);

  // Calendar state
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '', priority: 'medium', type: 'Work', due_date: '', description: '',
  });
  const [savingTask, setSavingTask] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  // Google Calendar
  const gcal = useGoogleCalendar();
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);
  const [gcalLoading, setGcalLoading] = useState(false);

  // Proof dialog
  const [proofDialog, setProofDialog] = useState<{ open: boolean; slotId: string; taskTitle: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboardingStatus();

  useEffect(() => {
    checkPrerequisites();
    fetchSchedule();
    gcal.checkConnection();
    // Track last active date
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        await supabase
          .from('notification_preferences' as any)
          .upsert({ user_id: user.id, last_active_date: today }, { onConflict: 'user_id' });
      } catch { /* non-fatal */ }
    })();
  }, []);

  // Fetch Google Calendar events whenever the visible month changes
  const fetchGcalEvents = useCallback(async (month: Date) => {
    if (!gcal.connected) return;
    setGcalLoading(true);
    try {
      const start = startOfMonth(month).toISOString();
      const end = endOfMonth(addMonths(month, 0)).toISOString();
      const events = await gcal.listEvents(start, end);
      setGcalEvents(events);
    } catch { /* non-fatal */ }
    finally { setGcalLoading(false); }
  }, [gcal.connected]);

  useEffect(() => {
    if (gcal.connected) fetchGcalEvents(calMonth);
  }, [gcal.connected, calMonth]);

  const checkPrerequisites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: energy } = await supabase.from('energy_profiles').select('id').eq('user_id', user.id).maybeSingle();
      setHasEnergyProfile(!!energy);
      const { data: tasks } = await supabase.from('tasks').select('id').eq('user_id', user.id).limit(1);
      setHasTasks(!!tasks && tasks.length > 0);
      const { data: goals } = await supabase.from('goals').select('id').eq('user_id', user.id).eq('is_active', true).limit(1);
      setHasGoals(!!goals && goals.length > 0);
    } catch (error) { console.error('Error checking prerequisites:', error); }
  };

  const fetchSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const { data, error } = await supabase
        .from("schedule_slots")
        .select(`*, tasks (title, priority, type)`)
        .eq("user_id", user.id)
        .gte("start_time", today.toISOString())
        .lt("start_time", tomorrow.toISOString())
        .order("start_time");
      setSchedule(error ? [] : (data || []));
    } catch { setSchedule([]); }
  };

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-schedule");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Schedule generated!", description: data.message || "Your day has been optimally planned." });
      fetchSchedule();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate schedule", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    setSelectedDate(day);
    setNewTask(t => ({ ...t, due_date: format(day, 'yyyy-MM-dd') }));
    setTaskSheetOpen(true);
  };

  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: "Task title required", variant: "destructive" }); return;
    }
    setSavingTask(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: newTask.title.trim(),
        priority: newTask.priority,
        type: newTask.type,
        due_date: newTask.due_date || null,
        description: newTask.description || null,
        status: 'pending',
      } as any);
      if (error) throw error;

      // Sync to Google Calendar if toggle is on and user is connected
      if (syncToGoogle && gcal.connected && newTask.due_date) {
        try {
          const result = await gcal.createEvent({
            title: newTask.title.trim(),
            date: newTask.due_date,
            description: newTask.description || undefined,
          });
          toast({
            title: "Task added & synced!",
            description: (
              <span>
                "{newTask.title}" saved for {format(selectedDate, 'MMM d')} and added to{' '}
                <a href={result.html_link} target="_blank" rel="noopener noreferrer" className="underline">
                  Google Calendar
                </a>.
              </span>
            ) as any,
          });
        } catch {
          toast({ title: "Task saved", description: `"${newTask.title}" saved. Google Calendar sync failed — check your connection.` });
        }
      } else {
        toast({ title: "Task added!", description: `"${newTask.title}" saved for ${format(selectedDate, 'MMM d')}.` });
      }

      setTaskSheetOpen(false);
      setNewTask({ title: '', priority: 'medium', type: 'Work', due_date: '', description: '' });
      checkPrerequisites();
      if (gcal.connected) fetchGcalEvents(calMonth);

    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save task", variant: "destructive" });
    } finally { setSavingTask(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !proofDialog) return;
    setUploadingProof(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; });
      const slot = schedule.find(s => s.id === proofDialog.slotId);
      if (!slot?.task_id) throw new Error("No task associated with this slot");
      const { data, error } = await supabase.functions.invoke("verify-proof", {
        body: { task_id: slot.task_id, file_base64: reader.result as string, file_type: selectedFile.type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const v = data.verification;
      if (v.verified && v.confidence >= 70) {
        toast({ title: "Proof Verified!", description: `Task marked as complete. ${v.explanation}` });
      } else {
        toast({ title: "Verification Failed", description: v.explanation || "Proof doesn't demonstrate task completion.", variant: "destructive" });
      }
      fetchSchedule(); setProofDialog(null); setSelectedFile(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit proof", variant: "destructive" });
    } finally { setUploadingProof(false); }
  };

  const connectGoogleCalendar = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri = `${window.location.origin}/auth/google-calendar`;
    const scope = 'https://www.googleapis.com/auth/calendar';
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    window.location.href = url.toString();
  };

  // Days that have Google Calendar events (for dot indicators)
  const gcalEventDates = new Set(gcalEvents.map(e => e.date));

  // Google Calendar events for the selected day
  const selectedDayGcalEvents = gcalEvents.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd'));

  const isReady = hasEnergyProfile && hasTasks;

  return (
    <Layout>
      <div className={`space-y-6 transition-all duration-300 ${showOnboarding ? 'blur-sm brightness-50 pointer-events-none select-none' : ''}`}>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              <DynamicGreeting />
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-1">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Button
            onClick={handleGenerateSchedule}
            disabled={loading || !isReady}
            className="bg-gradient-primary hover:shadow-elevated gap-2 shrink-0 h-11"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Generating…" : "Generate Schedule"}
          </Button>
        </div>

        {/* ── Setup nudge (compact) ── */}
        {!isReady && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Complete your setup</p>
              <p className="text-xs text-muted-foreground">
                {!hasEnergyProfile && !hasTasks
                  ? "Finish onboarding and add a task to unlock schedule generation."
                  : !hasEnergyProfile
                  ? "Finish onboarding to set your energy profile."
                  : "Add at least one task to generate your first schedule."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs h-8"
              onClick={() => !hasEnergyProfile ? setShowOnboarding(true) : router.push('/tasks')}
            >
              {!hasEnergyProfile ? "Finish setup" : "Add task"}
            </Button>
          </div>
        )}

        {/* ── Main grid: Schedule + Calendar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* Today's Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base text-foreground">Today's Schedule</h2>
              {schedule.length > 0 && (
                <span className="text-xs text-muted-foreground">{schedule.length} blocks</span>
              )}
            </div>

            {schedule.length > 0 ? (
              <div className="space-y-2.5">
                {schedule.map((slot) => {
                  const actionMatch = slot.justification?.match(/^\[([^\]]+)\]\s*(.*)$/);
                  const actionTitle = actionMatch ? actionMatch[1] : null;
                  const justificationText = actionMatch ? actionMatch[2] : slot.justification;
                  const isRestBlock =
                    !slot.task_id &&
                    (actionTitle?.toLowerCase().includes('rest') ||
                      actionTitle?.toLowerCase().includes('recharge') ||
                      actionTitle?.toLowerCase().includes('break'));
                  const displayTitle =
                    slot.tasks?.title || actionTitle || (isRestBlock ? 'Rest & Recharge' : 'Scheduled Block');

                  return (
                    <div
                      key={slot.id}
                      className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 hover:border-primary/30 transition-all duration-150"
                    >
                      <div className="shrink-0 text-right min-w-[52px]">
                        <p className="text-xs font-semibold text-primary">
                          {format(new Date(slot.start_time), "h:mm")}
                          <span className="text-[10px] text-muted-foreground ml-0.5">{format(new Date(slot.start_time), "a")}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(slot.end_time), "h:mm a")}</p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${isRestBlock ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                        <div className="w-px flex-1 bg-border/50 min-h-[16px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">{displayTitle}</p>
                          {slot.task_id && (
                            <Button
                              variant="ghost" size="sm"
                              className="shrink-0 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setProofDialog({ open: true, slotId: slot.id, taskTitle: slot.tasks?.title || 'Task' })}
                            >
                              <Upload className="w-3 h-3 mr-1" />Proof
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {slot.tasks && (
                            <>
                              <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${priorityColor[slot.tasks.priority] || 'bg-muted text-muted-foreground border-border'}`}>
                                {slot.tasks.priority}
                              </span>
                              <span className="text-[10px] text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded-md">{slot.tasks.type}</span>
                            </>
                          )}
                          {!slot.tasks && actionTitle && !isRestBlock && (
                            <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-md">Goal action</span>
                          )}
                        </div>
                        {justificationText && (
                          <p className="text-xs text-muted-foreground/60 mt-1.5 leading-relaxed line-clamp-2">{justificationText}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 py-14 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">No schedule yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">
                    Hit "Generate Schedule" to let AI plan your day around your goals and energy.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Calendar panel ── */}
          <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-sm text-foreground">Calendar</h2>
                  {gcal.connected && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Google
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedDate(new Date()); handleDayClick(new Date()); }}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />Add task
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tap any day to add a task</p>
            </div>

            <div className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={calMonth}
                onMonthChange={(m) => { setCalMonth(m); }}
                className="w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-2",
                  caption: "flex justify-center items-center relative px-2 py-1",
                  caption_label: "text-sm font-semibold text-foreground",
                  nav: "flex items-center",
                  nav_button: "w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground/60 text-[11px] font-medium text-center flex-1 py-1",
                  row: "flex w-full mt-1",
                  cell: "flex-1 text-center p-0 relative",
                  day: "w-full aspect-square max-w-[36px] mx-auto flex items-center justify-center text-xs rounded-xl font-medium text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer",
                  day_selected: "bg-primary text-white hover:bg-primary hover:text-white shadow-[0_2px_8px_hsl(217_91%_55%/0.4)]",
                  day_today: "border border-primary/40 text-primary font-bold",
                  day_outside: "text-muted-foreground/30",
                  day_disabled: "text-muted-foreground/20 cursor-not-allowed",
                  day_hidden: "invisible",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const hasGcal = gcalEventDates.has(dateStr);
                    return (
                      <div className="relative flex items-center justify-center w-full h-full">
                        <span>{date.getDate()}</span>
                        {hasGcal && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                        )}
                      </div>
                    );
                  },
                }}
              />
            </div>

            {/* Selected date info + Google events */}
            <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {format(selectedDate, "MMMM d")}
                    {isSameDay(selectedDate, new Date()) && (
                      <span className="ml-1.5 text-[10px] text-primary font-medium">Today</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{format(selectedDate, "EEEE")}</p>
                </div>
                <button
                  onClick={() => handleDayClick(selectedDate)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />Task
                </button>
              </div>

              {/* Google Calendar events for selected day */}
              {selectedDayGcalEvents.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {selectedDayGcalEvents.map(ev => (
                    <a
                      key={ev.id}
                      href={ev.html_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 hover:bg-blue-500/15 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-[11px] text-blue-300 font-medium truncate flex-1">{ev.title}</span>
                      {!ev.is_all_day && (
                        <span className="text-[10px] text-blue-400/70 shrink-0">
                          {format(new Date(ev.start), 'h:mm a')}
                        </span>
                      )}
                      <ExternalLink className="w-2.5 h-2.5 text-blue-400/50 shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {gcal.connected === false && (
                <button
                  onClick={connectGoogleCalendar}
                  className="mt-2 w-full flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 px-3 py-2.5 transition-all duration-150"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Connect Google Calendar</p>
                    <p className="text-[10px] text-muted-foreground">Sync tasks & see your events</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Task Sheet ── */}
      <Sheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle className="font-display text-lg font-bold">Add Task</SheetTitle>
            <p className="text-sm text-muted-foreground">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Task title <span className="text-rose-400">*</span></Label>
              <Input
                placeholder="e.g. Study for math exam"
                value={newTask.title}
                onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                className="h-11 rounded-xl"
                onKeyDown={e => e.key === 'Enter' && handleSaveTask()}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Priority</Label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    onClick={() => setNewTask(t => ({ ...t, priority: p }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all duration-150 ${newTask.priority === p ? priorityColor[p] : 'border-border/50 text-muted-foreground hover:border-border'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Category</Label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(tp => (
                  <button
                    key={tp}
                    onClick={() => setNewTask(t => ({ ...t, type: tp }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${newTask.type === tp ? 'bg-primary/15 text-primary border-primary/40' : 'border-border/50 text-muted-foreground hover:border-border'}`}
                  >
                    {tp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <CalIcon className="w-3.5 h-3.5 text-muted-foreground" />Due date
              </Label>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Notes <span className="text-muted-foreground/50 font-normal">(optional)</span></Label>
              <textarea
                placeholder="Any extra details…"
                value={newTask.description}
                onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Google Calendar toggle */}
            {gcal.connected && (
              <button
                onClick={() => setSyncToGoogle(v => !v)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${syncToGoogle ? 'border-blue-500/40 bg-blue-500/10' : 'border-border/50 bg-muted/20'}`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-foreground">Add to Google Calendar</p>
                  <p className="text-[11px] text-muted-foreground">Creates an event on the selected date</p>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all duration-200 relative ${syncToGoogle ? 'bg-blue-500' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${syncToGoogle ? 'left-4' : 'left-0.5'}`} />
                </div>
              </button>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/50 flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setTaskSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 bg-gradient-primary shadow-[0_4px_16px_hsl(217_91%_55%/0.35)]"
              onClick={handleSaveTask}
              disabled={savingTask || !newTask.title.trim()}
            >
              {savingTask ? "Saving…" : gcal.syncing ? "Syncing…" : "Save Task"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Proof Dialog ── */}
      <Dialog open={!!proofDialog} onOpenChange={(open) => !open && setProofDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Proof of Completion</DialogTitle>
            <DialogDescription>
              Upload a screenshot showing you completed: <strong>{proofDialog?.taskTitle}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof-file">Upload Proof</Label>
              <Input id="proof-file" type="file" accept="image/*" onChange={handleFileSelect} disabled={uploadingProof} />
              {selectedFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />{selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmitProof} disabled={!selectedFile || uploadingProof} className="flex-1 bg-gradient-primary">
              {uploadingProof ? "Verifying…" : "Verify with AI"}
            </Button>
            <Button variant="outline" onClick={() => { setProofDialog(null); setSelectedFile(null); }} disabled={uploadingProof}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Onboarding Modal ── */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={() => { completeOnboarding(); checkPrerequisites(); }}
      />
    </Layout>
  );
};

export default Dashboard;
