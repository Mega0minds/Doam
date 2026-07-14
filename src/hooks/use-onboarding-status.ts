'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOnboardingStatus() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Check if user has completed onboarding
      const { data: status, error } = await supabase
        .from('onboarding_status')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Can't confirm completion — default to showing onboarding for new users
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      // Show onboarding if no status exists or not completed
      if (!status || !status.onboarding_completed) {
        setShowOnboarding(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in onboarding check:', error);
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const reopenOnboarding = () => {
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    loading,
    userId,
    completeOnboarding,
    reopenOnboarding,
  };
}
