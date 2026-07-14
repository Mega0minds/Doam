'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TobiMascot } from '@/components/TobiMascot';
import { toast } from 'sonner';
import {
  deferNotifyPrompt,
  requestPermissionAndSubscribe,
  shouldShowNotifyPrompt,
  clearDefer,
} from '@/lib/pushNotifications';

interface Props {
  /** Only show after onboarding has completed. */
  enabled?: boolean;
}

export function NotificationPermissionPrompt({ enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    // Tiny delay so we don't compete with the tour
    const t = setTimeout(() => {
      if (shouldShowNotifyPrompt()) setOpen(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [enabled]);

  const handleAccept = async () => {
    setLoading(true);
    const res = await requestPermissionAndSubscribe();
    setLoading(false);
    if (res.ok) {
      clearDefer();
      toast.success("You're in! DoAm will check in on you daily.");
      setOpen(false);
    } else if (res.reason === 'denied') {
      toast.error('Notifications blocked. You can enable them in your browser settings.');
      setOpen(false);
    } else if (res.reason === 'unsupported') {
      toast.message('Notifications are not supported on this device.');
      setOpen(false);
    } else {
      toast.error("Couldn't enable notifications. Please try again.");
    }
  };

  const handleDefer = () => {
    deferNotifyPrompt();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDefer()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-3">
          <TobiMascot size={80} />
          <DialogTitle className="text-xl">Mind if DoAm checks in on you daily?</DialogTitle>
          <DialogDescription className="text-base">
            We'll send a quick dose of motivation and gentle reminders to help you stay on track.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-center gap-2 pt-2">
          <Button variant="outline" onClick={handleDefer} disabled={loading}>
            Maybe later
          </Button>
          <Button onClick={handleAccept} disabled={loading} className="bg-gradient-primary">
            {loading ? 'Setting up…' : 'Yes, keep me accountable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationPermissionPrompt;
