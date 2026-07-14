'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAvatarUrl(userId: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${userId}/avatar`);
    // Append cache-buster
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { avatarUrl, refresh };
}
