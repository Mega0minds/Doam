'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sun, Moon, BellOff } from 'lucide-react';

export function AlarmOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<'wake' | 'sleep' | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const alarm = searchParams.get('alarm');
    if (alarm === 'wake' || alarm === 'sleep') {
      setKind(alarm);
      startTone(alarm);
    }
    return () => stopTone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const startTone = (k: 'wake' | 'sleep') => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx: AudioContext = new AC();
      ctxRef.current = ctx;

      // Gentle 2-note repeating chime.
      const notes = k === 'wake' ? [660, 880] : [392, 330];
      let stopped = false;
      let idx = 0;

      const playOnce = () => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[idx % notes.length];
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.08);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
        idx++;
        setTimeout(playOnce, 1100);
      };
      playOnce();

      stopRef.current = () => {
        stopped = true;
        ctx.close().catch(() => {});
      };
    } catch (e) {
      console.warn('[alarm] audio start failed', e);
    }
  };

  const stopTone = () => {
    try { stopRef.current?.(); } catch {}
    stopRef.current = null;
    ctxRef.current = null;
  };

  const dismiss = () => {
    stopTone();
    setKind(null);
    // Strip ?alarm= from URL without scroll
    const params = new URLSearchParams(searchParams.toString());
    params.delete('alarm');
    const search = params.toString() ? `?${params.toString()}` : '';
    router.replace(`${pathname}${search}`);
  };

  if (!kind) return null;

  const isWake = kind === 'wake';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isWake ? 'bg-amber-500/15 text-amber-500' : 'bg-indigo-500/15 text-indigo-500'}`}>
          {isWake ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          {isWake ? 'Good morning! Time to rise 🌅' : 'Time to sleep 🌙'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isWake
            ? 'Your goals are waiting. Let’s make today count.'
            : 'You showed up today. Rest well and come back stronger tomorrow.'}
        </p>
        <Button onClick={dismiss} size="lg" className="w-full">
          <BellOff className="mr-2 h-4 w-4" />
          Dismiss Alarm
        </Button>
      </div>
    </div>
  );
}

export default AlarmOverlay;
