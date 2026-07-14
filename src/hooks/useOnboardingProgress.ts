'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingProgress {
  current_step: string;
  goals_data: Record<string, any>;
  energy_data: Record<string, any>;
  commitments_data: any[];
  last_updated: string;
}

const STORAGE_KEY = 'doam-onboarding-progress';

export function useOnboardingProgress(userId: string | null) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Load progress from localStorage and/or database
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        // First try localStorage for immediate response
        const localData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          setProgress(parsed);
        }

        // Then sync with database
        const { data, error } = await supabase
          .from('onboarding_status')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data && (data as any).progress_data) {
          const dbProgress = (data as any).progress_data as OnboardingProgress;
          setProgress(dbProgress);
          localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(dbProgress));
        }
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId]);

  // Save progress - instant local save + async database save
  const saveProgress = useCallback(async (updates: Partial<OnboardingProgress>) => {
    if (!userId) return;

    const newProgress: OnboardingProgress = {
      current_step: updates.current_step || progress?.current_step || 'welcome',
      goals_data: updates.goals_data ?? progress?.goals_data ?? {},
      energy_data: updates.energy_data ?? progress?.energy_data ?? {},
      commitments_data: updates.commitments_data ?? progress?.commitments_data ?? [],
      last_updated: new Date().toISOString(),
    };

    // Immediate local save
    setProgress(newProgress);
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(newProgress));

    // Async database save (don't await for UX)
    supabase
      .from('onboarding_status')
      .upsert({
        user_id: userId,
        progress_data: newProgress as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.error('Error saving progress to database:', error);
      });
  }, [userId, progress]);

  // Clear progress on completion
  const clearProgress = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
    setProgress(null);
  }, [userId]);

  return {
    progress,
    loading,
    saveProgress,
    clearProgress,
  };
}
