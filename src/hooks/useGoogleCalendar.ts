'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GCalEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  is_all_day: boolean;
  html_link: string;
}

export function useGoogleCalendar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);

  const invoke = useCallback(async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { action, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const { data: { user } } = await (await import('@/integrations/supabase/client')).supabase.auth.getUser();
      if (!user) { setConnected(false); return false; }

      // Only attempt if user signed in via Google
      const provider = user.app_metadata?.provider;
      const identities = user.identities ?? [];
      const hasGoogle = provider === 'google' || identities.some((i: any) => i.provider === 'google');
      if (!hasGoogle) { setConnected(false); return false; }

      await invoke('status');
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  }, [invoke]);

  const createEvent = useCallback(async (params: {
    title: string;
    date: string;
    description?: string;
    gcal_event_id?: string;
  }) => {
    setSyncing(true);
    try {
      const result = await invoke('create', params);
      return result as { event_id: string; html_link: string };
    } finally {
      setSyncing(false);
    }
  }, [invoke]);

  const listEvents = useCallback(async (timeMin: string, timeMax: string): Promise<GCalEvent[]> => {
    try {
      const result = await invoke('list', { time_min: timeMin, time_max: timeMax });
      return result.events as GCalEvent[];
    } catch {
      return [];
    }
  }, [invoke]);

  const deleteEvent = useCallback(async (gcal_event_id: string) => {
    await invoke('delete', { gcal_event_id });
  }, [invoke]);

  return { connected, syncing, checkConnection, createEvent, listEvents, deleteEvent };
}
