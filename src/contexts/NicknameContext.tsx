'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NicknameContextValue {
  nickname: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setNickname: (n: string | null) => void;
}

const NicknameContext = createContext<NicknameContextValue | undefined>(undefined);

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNicknameState(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('user_profiles')
      .select('nickname' as any)
      .eq('user_id', user.id)
      .maybeSingle();
    const n = (data as any)?.nickname;
    setNicknameState(n && typeof n === 'string' && n.trim() ? n.trim() : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return (
    <NicknameContext.Provider value={{ nickname, loading, refresh, setNickname: setNicknameState }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  const ctx = useContext(NicknameContext);
  if (!ctx) throw new Error('useNickname must be used within NicknameProvider');
  return ctx;
}
