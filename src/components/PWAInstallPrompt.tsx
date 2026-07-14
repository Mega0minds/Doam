'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTooltip, setShowIOSTooltip] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [isLanding, setIsLanding] = useState(false);

  useEffect(() => {
    // Don't show in iframes or preview
    try {
      if (window.self !== window.top) return;
    } catch { return; }

    // Check if already installed or permanently dismissed
    if (localStorage.getItem('pwa-installed') === 'true') return;
    if (localStorage.getItem('doam-pwa-installed') === 'true') return;
    if (localStorage.getItem('pwa-install-dismissed') === 'true') return;

    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      localStorage.setItem('pwa-installed', 'true');
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Listen for beforeinstallprompt as early as possible (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptReady(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    const onInstalled = () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // Trigger timing:
    // - Landing page (/) → immediately (catch users before sign-in)
    // - Dashboard route → after 10 seconds (less jarring mid-session)
    // - Other routes → after 20 seconds (least aggressive)
    const path = window.location.pathname;
    const isLandingPage = path === '/' || path === '';
    setIsLanding(isLandingPage);
    const isDashboard = path.startsWith('/dashboard');
    const delay = isLandingPage ? 0 : isDashboard ? 10000 : 20000;

    if (delay === 0) {
      setCanShow(true);
    }
    const timer = delay > 0 ? setTimeout(() => setCanShow(true), delay) : null;

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Show banner only when both: (a) timing elapsed and (b) browser is ready
  // For iOS, there's no beforeinstallprompt — show purely on timer.
  useEffect(() => {
    if (!canShow) return;
    if (isIOS) {
      setShowBanner(true);
      // On landing page, show iOS install instructions immediately
      if (isLanding) setShowIOSTooltip(true);
    } else if (promptReady) {
      setShowBanner(true);
    }
  }, [canShow, isIOS, promptReady, isLanding]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSTooltip(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSTooltip(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
        {showIOSTooltip ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm text-foreground">Install DoAm on iOS</h3>
              <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
                <span>Tap the <Share className="inline h-3.5 w-3.5 mx-0.5" /> Share button in Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
                <span>Tap <strong>"Add"</strong> to install</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {isLanding ? 'Install DoAm on your home screen' : 'Install DoAm'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {isLanding
                  ? 'Get instant access — no browser needed.'
                  : 'Add to your home screen for faster access'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-xs">
                Install
              </Button>
              <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
