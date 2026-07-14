-- Create table for decomposed goal actions
CREATE TABLE public.goal_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  frequency TEXT NOT NULL DEFAULT 'daily',
  effort_level TEXT NOT NULL DEFAULT 'light',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for task completion feedback
CREATE TABLE public.task_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  schedule_slot_id UUID REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  actual_duration_minutes INTEGER,
  skipped_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for detected patterns
CREATE TABLE public.user_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.goal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

-- Goal actions policies
CREATE POLICY "Users can view their own goal actions" ON public.goal_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goal actions" ON public.goal_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goal actions" ON public.goal_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goal actions" ON public.goal_actions FOR DELETE USING (auth.uid() = user_id);

-- Task feedback policies
CREATE POLICY "Users can view their own feedback" ON public.task_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feedback" ON public.task_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.task_feedback FOR UPDATE USING (auth.uid() = user_id);

-- User patterns policies
CREATE POLICY "Users can view their own patterns" ON public.user_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patterns" ON public.user_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patterns" ON public.user_patterns FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers
CREATE TRIGGER update_goal_actions_updated_at BEFORE UPDATE ON public.goal_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();