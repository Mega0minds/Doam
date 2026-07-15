'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';

export default function GoogleCalendarCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting Google Calendar…');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      setStatus('error');
      setMessage('Connection cancelled.');
      setTimeout(() => router.replace('/dashboard'), 2000);
      return;
    }

    const exchange = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/google-calendar`;
        const { data, error: fnError } = await supabase.functions.invoke('google-calendar', {
          body: { action: 'exchange_code', code, redirect_uri: redirectUri },
        });

        if (fnError || data?.error) throw new Error(data?.error || fnError?.message);

        setStatus('success');
        setMessage('Google Calendar connected!');
        setTimeout(() => router.replace('/dashboard'), 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Something went wrong.');
        setTimeout(() => router.replace('/dashboard'), 3000);
      }
    };

    exchange();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {status === 'loading' && (
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {status === 'success' && (
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
