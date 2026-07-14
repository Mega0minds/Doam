import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

export interface EditableTask {
  id?: string;
  title: string;
  estimated_duration_min: number;
  priority: string;
  type: string;
  status?: string;
  due_date?: string | null;
  due_time?: string | null;
  reminder_enabled?: boolean;
  notes?: string | null;
}

interface Props {
  open: boolean;
  task: EditableTask | null;
  onClose: () => void;
  onSaved?: (task: EditableTask) => void;
}

export function TaskEditDrawer({ open, task, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EditableTask | null>(task);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(task);
  }, [task]);

  if (!form) return null;

  const update = <K extends keyof EditableTask>(k: K, v: EditableTask[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.id) {
      onSaved?.(form);
      onClose();
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        estimated_duration_min: form.estimated_duration_min,
        priority: form.priority,
        type: form.type,
        due_date: form.due_date || null,
        due_time: form.due_time || null,
        reminder_enabled: !!form.reminder_enabled,
        notes: form.notes ?? null,
      };
      const { error } = await supabase.from("tasks").update(payload).eq("id", form.id);
      if (error) throw error;
      toast.success("Task updated");
      onSaved?.(form);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>{form.id ? "Edit Task" : "New Task"}</DrawerTitle>
          <DrawerDescription>Update task details — changes save instantly.</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What do you want to do?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t-date">Due Date</Label>
              <Input
                id="t-date"
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => update("due_date", e.target.value || null)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-time">Due Time</Label>
              <Input
                id="t-time"
                type="time"
                value={form.due_time ?? ""}
                onChange={(e) => update("due_time", e.target.value || null)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t-dur">Duration (min)</Label>
              <Input
                id="t-dur"
                type="number"
                min={5}
                value={form.estimated_duration_min}
                onChange={(e) =>
                  update("estimated_duration_min", parseInt(e.target.value || "0") || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
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
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deep Work">Deep Work</SelectItem>
                  <SelectItem value="Shallow Work">Shallow Work</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="t-remind" className="text-sm">Remind me</Label>
              <p className="text-xs text-muted-foreground">
                Get a push notification at the due time.
              </p>
            </div>
            <Switch
              id="t-remind"
              checked={!!form.reminder_enabled}
              onCheckedChange={(v) => update("reminder_enabled", v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-notes">Notes</Label>
            <Textarea
              id="t-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anything else?"
            />
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1 bg-gradient-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default TaskEditDrawer;
