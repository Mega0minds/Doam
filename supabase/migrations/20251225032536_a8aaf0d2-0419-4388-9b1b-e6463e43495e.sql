-- Create user_profiles table for storing comprehensive user intelligence
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Identity Overview
  academic_level TEXT,
  field_of_study TEXT,
  long_term_aspirations TEXT,
  self_described_strengths TEXT[],
  self_described_struggles TEXT[],
  
  -- Behavioral Patterns
  study_habits TEXT,
  consistency_level TEXT CHECK (consistency_level IN ('high', 'medium', 'low', 'variable')),
  typical_blockers TEXT[],
  
  -- Time & Energy Summary (references energy_profiles but stores summaries)
  preferred_work_style TEXT,
  stress_periods TEXT[],
  
  -- AI Biography
  ai_biography TEXT,
  ai_biography_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Goal Deep-Dive Status
  goal_deepdive_completed BOOLEAN NOT NULL DEFAULT false,
  goal_deepdive_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
  ON public.user_profiles FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create goal_history table to track goal changes over time
CREATE TABLE public.goal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  goal_title TEXT NOT NULL,
  goal_category TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'completed', 'abandoned')),
  previous_state JSONB,
  new_state JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goal history" 
  ON public.goal_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal history" 
  ON public.goal_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);