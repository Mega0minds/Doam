'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import BrainDump from "@/components/BrainDump";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, CheckCircle2, Trash2, Circle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TaskEditDrawer, type EditableTask } from "@/components/tasks/TaskEditDrawer";
import { randomMotivation } from "@/lib/motivation";

interface Task {
  id: string;
  title: string;
  estimated_duration_min: number;
  priority: string;
  type: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  reminder_enabled: boolean;
  notes: string | null;
}

const todayISO = () => format(new Date(), "yyyy-MM-dd");

const defaultNewTask = (): EditableTask => ({
  title: "",
  estimated_duration_min: 30,
  priority: "MEDIUM",
  type: "Deep Work",
  due_date: todayISO(),
  due_time: null,
  reminder_enabled: false,
  notes: "",
});

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState<EditableTask>(defaultNewTask());
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTasks((data as any) || []);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tasks").insert([{
        title: newTask.title,
        estimated_duration_min: newTask.estimated_duration_min,
        priority: newTask.priority as any,
        type: newTask.type as any,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        reminder_enabled: !!newTask.reminder_enabled,
        notes: newTask.notes ?? null,
        user_id: user.id,
      } as any]);
      if (error) throw error;
      toast.success("Task created!");
      setNewTask(defaultNewTask());
      setShowForm(false);
      fetchTasks();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (task: Task) => {
    const isComplete = task.status === "Complete";
    const nextStatus = isComplete ? "To Do" : "Complete";
    // optimistic
    const nextTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus } : t
    );
    setTasks(nextTasks);
    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus as any })
      .eq("id", task.id);
    if (error) {
      toast.error("Could not update");
      fetchTasks();
      return;
    }
    if (!isComplete) {
      toast.success(randomMotivation());
      // Bonus toast if everything is done now
      const remaining = nextTasks.filter((t) => t.status !== "Complete").length;
      if (remaining === 0 && nextTasks.length > 0) {
        setTimeout(() => {
          toast.success("All tasks done for today! 🎉 Rest well, you earned it.");
        }, 900);
      }
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      fetchTasks();
    } else {
      toast.success("Task deleted");
    }
  };

  const priorityColors: Record<string, string> = {
    HIGH: "destructive",
    MEDIUM: "secondary",
    LOW: "default",
  };

  const formatDue = (t: Task) => {
    if (!t.due_date && !t.due_time) return null;
    const parts: string[] = [];
    if (t.due_date) {
      try { parts.push(format(new Date(t.due_date), "MMM d")); } catch { parts.push(t.due_date); }
    }
    if (t.due_time) parts.push(t.due_time.slice(0, 5));
    return parts.join(" · ");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">My Tasks</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your to-do list</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-primary hover:shadow-elevated gap-2 w-full sm:w-auto"
            data-tour="add-task"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        <BrainDump onTasksCreated={fetchTasks} />

        {showForm && (
          <Card className="border-border/50 shadow-card">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Write the blog post"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      value={newTask.estimated_duration_min}
                      onChange={(e) =>
                        setNewTask({ ...newTask, estimated_duration_min: parseInt(e.target.value || "0") || 0 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newTask.type}
                      onValueChange={(v) => setNewTask({ ...newTask, type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deep Work">Deep Work</SelectItem>
                        <SelectItem value="Shallow Work">Shallow Work</SelectItem>
                        <SelectItem value="Creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* New fields: Due Date / Due Time / Reminder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      className="h-11"
                      value={newTask.due_date ?? ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, due_date: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-time">Due Time</Label>
                    <Input
                      id="due-time"
                      type="time"
                      className="h-11"
                      value={newTask.due_time ?? ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, due_time: e.target.value || null })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <div>
                      <Label htmlFor="remind" className="text-sm">Remind me</Label>
                      <p className="text-xs text-muted-foreground">
                        Push notification at the due time.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="remind"
                    checked={!!newTask.reminder_enabled}
                    onCheckedChange={(v) => setNewTask({ ...newTask, reminder_enabled: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={newTask.notes ?? ""}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    placeholder="Optional details"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Creating..." : "Create Task"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {tasks.map((task) => {
            const isComplete = task.status === "Complete";
            const due = formatDue(task);
            return (
              <Card
                key={task.id}
                className={`border-border/50 shadow-card transition-smooth ${
                  isComplete ? "opacity-60" : "hover:shadow-elevated"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 space-y-2 min-w-0">
                      <h3
                        className={`font-semibold text-base sm:text-lg ${
                          isComplete ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityColors[task.priority] as any} className="text-xs">
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{task.type}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.estimated_duration_min} min
                        </Badge>
                        <Badge className="bg-gradient-energy-high text-xs">{task.status}</Badge>
                        {due && (
                          <Badge variant="outline" className="text-xs">
                            Due {due}
                          </Badge>
                        )}
                        {task.reminder_enabled && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Bell className="h-3 w-3" /> Reminder
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-1 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        aria-label="Edit task"
                        onClick={() => setEditTask(task)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-green-600 hover:text-green-700"
                        aria-label="Complete task"
                        onClick={() => handleComplete(task)}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 fill-green-500 text-white" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-destructive hover:text-destructive"
                        aria-label="Delete task"
                        onClick={() => setDeleteId(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {tasks.length === 0 && !showForm && (
            <Card className="border-border/50 shadow-card">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">
                  No tasks yet. Create your first task to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TaskEditDrawer
        open={!!editTask}
        task={editTask as any}
        onClose={() => setEditTask(null)}
        onSaved={() => {
          setEditTask(null);
          fetchTasks();
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Tasks;
