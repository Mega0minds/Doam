-- Create enum for goal categories
CREATE TYPE public.goal_category AS ENUM ('academic_career', 'health', 'personal_growth', 'social', 'spiritual_mental', 'rest_recreation');

-- Create goals table for SMART goals
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category goal_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  priority_rank INTEGER NOT NULL CHECK (priority_rank >= 1 AND priority_rank <= 6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fixed commitments table with weekly patterns
CREATE TABLE public.fixed_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create energy profile table (extends user_rhythms concept)
CREATE TABLE public.energy_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  chronotype TEXT NOT NULL DEFAULT 'neutral',
  wake_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '07:00',
  sleep_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '23:00',
  high_focus_start TIME WITHOUT TIME ZONE,
  high_focus_end TIME WITHOUT TIME ZONE,
  low_energy_start TIME WITHOUT TIME ZONE,
  low_energy_end TIME WITHOUT TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding status table
CREATE TABLE public.onboarding_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  goals_completed BOOLEAN NOT NULL DEFAULT false,
  energy_completed BOOLEAN NOT NULL DEFAULT false,
  commitments_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Fixed commitments policies
CREATE POLICY "Users can view their own commitments" ON public.fixed_commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own commitments" ON public.fixed_commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own commitments" ON public.fixed_commitments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own commitments" ON public.fixed_commitments FOR DELETE USING (auth.uid() = user_id);

-- Energy profiles policies
CREATE POLICY "Users can view their own energy profile" ON public.energy_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own energy profile" ON public.energy_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own energy profile" ON public.energy_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Onboarding status policies
CREATE POLICY "Users can view their own onboarding status" ON public.onboarding_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own onboarding status" ON public.onboarding_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own onboarding status" ON public.onboarding_status FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fixed_commitments_updated_at BEFORE UPDATE ON public.fixed_commitments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_energy_profiles_updated_at BEFORE UPDATE ON public.energy_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_status_updated_at BEFORE UPDATE ON public.onboarding_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();