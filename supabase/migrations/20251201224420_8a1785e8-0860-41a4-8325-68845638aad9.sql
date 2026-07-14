-- Create user_rhythms table
CREATE TABLE public.user_rhythms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  peak_focus_start TIME NOT NULL,
  peak_focus_end TIME NOT NULL,
  low_energy_start TIME NOT NULL,
  low_energy_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_rhythms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rhythms
CREATE POLICY "Users can view their own rhythm"
  ON public.user_rhythms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rhythm"
  ON public.user_rhythms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rhythm"
  ON public.user_rhythms FOR UPDATE
  USING (auth.uid() = user_id);

-- Create enum types for tasks
CREATE TYPE task_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE task_type AS ENUM ('Deep Work', 'Shallow Work', 'Creative');
CREATE TYPE task_status AS ENUM ('To Do', 'Scheduled', 'Complete');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_duration_min INTEGER NOT NULL,
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'To Do',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create schedule_slots table
CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_slots
CREATE POLICY "Users can view their own schedule slots"
  ON public.schedule_slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule slots"
  ON public.schedule_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule slots"
  ON public.schedule_slots FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_rhythms_updated_at
  BEFORE UPDATE ON public.user_rhythms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();