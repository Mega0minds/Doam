import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  start: Date | null;
  onClose: () => void;
  onCreated?: () => void;
}

export default function QuickAddTaskDrawer({ open, start, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (start) {
      setDate(format(start, "yyyy-MM-dd"));
      setTime(format(start, "HH:mm"));
      setTitle("");
      setPriority("MEDIUM");
    }
  }, [start, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: title.trim(),
        priority,
        type: "Deep Work",
        estimated_duration_min: 30,
        status: "To Do",
        due_date: date,
        due_time: time,
        reminder_enabled: false,
      } as any);
      if (error) throw error;
      toast.success("Task added");
      onCreated?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Could not add task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Quick Add Task</DrawerTitle>
          <DrawerDescription>
            {start ? format(start, "EEE, MMM d 'at' h:mm a") : "New task"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qa-title">Title</Label>
            <Input
              id="qa-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qa-date">Date</Label>
              <Input
                id="qa-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-time">Time</Label>
              <Input
                id="qa-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Adding…" : "Add Task"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
