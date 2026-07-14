import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema validation for schedule slots
interface ScheduleSlotSchema {
  task_id: string | null;
  action_title: string | null;
  start_time: string;
  end_time: string;
  justification: string;
  is_rest: boolean;
}

function isValidISODate(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime());
}

function validateScheduleSlot(slot: any, validTaskIds: Set<string>): ScheduleSlotSchema | null {
  if (!slot || typeof slot !== 'object') return null;
  
  // Validate required time fields
  if (!slot.start_time || !slot.end_time) return null;
  if (!isValidISODate(slot.start_time) || !isValidISODate(slot.end_time)) return null;
  
  // Ensure end is after start
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  if (end <= start) return null;
  
  // Validate task_id if provided
  const taskId = slot.task_id && validTaskIds.has(slot.task_id) ? slot.task_id : null;
  
  return {
    task_id: taskId,
    action_title: typeof slot.action_title === 'string' ? slot.action_title.slice(0, 200) : null,
    start_time: slot.start_time,
    end_time: slot.end_time,
    justification: typeof slot.justification === 'string' ? slot.justification.slice(0, 500) : 'AI scheduled',
    is_rest: slot.is_rest === true,
  };
}

function validateScheduleSlots(rawSlots: any[], validTaskIds: Set<string>): ScheduleSlotSchema[] {
  if (!Array.isArray(rawSlots)) return [];
  
  return rawSlots
    .map(slot => validateScheduleSlot(slot, validTaskIds))
    .filter((s): s is ScheduleSlotSchema => s !== null)
    .slice(0, 30); // Max 30 slots per day
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch energy profile (prefer new table, fallback to user_rhythms)
    let energyProfile: any = null;
    
    const { data: newProfile } = await supabaseClient
      .from('energy_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (newProfile) {
      energyProfile = {
        peak_focus_start: newProfile.high_focus_start,
        peak_focus_end: newProfile.high_focus_end,
        low_energy_start: newProfile.low_energy_start,
        low_energy_end: newProfile.low_energy_end,
        wake_time: newProfile.wake_time,
        sleep_time: newProfile.sleep_time,
        chronotype: newProfile.chronotype,
      };
    } else {
      const { data: rhythm } = await supabaseClient
        .from('user_rhythms')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (rhythm) {
        energyProfile = {
          peak_focus_start: rhythm.peak_focus_start,
          peak_focus_end: rhythm.peak_focus_end,
          low_energy_start: rhythm.low_energy_start,
          low_energy_end: rhythm.low_energy_end,
        };
      }
    }

    if (!energyProfile) {
      return new Response(
        JSON.stringify({ 
          error: 'Please set up your energy profile first',
          redirect: '/rhythm'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fixed commitments for today's day of week
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const { data: commitments } = await supabaseClient
      .from('fixed_commitments')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_of_week', dayOfWeek);

    // Fetch user's tasks that need scheduling
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['To Do', 'Scheduled']);

    if (tasksError) throw tasksError;

    // Fetch goal actions for additional context
    const { data: goalActions } = await supabaseClient
      .from('goal_actions')
      .select('*, goals(title, priority_rank, category)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Fetch user patterns for personalization
    const { data: patterns } = await supabaseClient
      .from('user_patterns')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if ((!tasks || tasks.length === 0) && (!goalActions || goalActions.length === 0)) {
      return new Response(
        JSON.stringify({ message: 'No tasks to schedule. Add some tasks first!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    // Build schedule window based on wake/sleep times
    const wakeHour = energyProfile.wake_time ? parseInt(energyProfile.wake_time.split(':')[0]) : 7;
    const sleepHour = energyProfile.sleep_time ? parseInt(energyProfile.sleep_time.split(':')[0]) : 23;

    const scheduleDate = new Date();
    scheduleDate.setHours(wakeHour, 0, 0, 0);
    const startTime = scheduleDate.toISOString();
    scheduleDate.setHours(sleepHour, 0, 0, 0);
    const endTime = scheduleDate.toISOString();

    // Format commitments as blocked time
    const blockedTimes = (commitments || []).map(c => ({
      title: c.title,
      start: c.start_time,
      end: c.end_time,
      locked: c.is_locked,
    }));

    const tasksInfo = (tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      duration: t.estimated_duration_min,
      priority: t.priority,
      type: t.type
    }));

    const actionsInfo = (goalActions || []).map(a => ({
      id: a.id,
      title: a.title,
      duration: a.duration_minutes,
      effort: a.effort_level,
      frequency: a.frequency,
      goal_title: a.goals?.title,
      goal_priority: a.goals?.priority_rank,
    }));

    const patternsInfo = (patterns || []).map(p => 
      `${p.pattern_type}: ${JSON.stringify(p.pattern_data)}`
    ).join('\n');

    const systemPrompt = `You are an AI scheduling assistant that creates OPTIMAL daily schedules.

CRITICAL RULES:
1. NEVER schedule anything during blocked times (fixed commitments)
2. Match deep focus tasks to peak energy periods
3. Match light tasks to low energy periods
4. Higher priority goals (lower rank number) get protected time slots FIRST
5. Include 10-15 minute breaks between tasks
6. ALWAYS include at least one rest/recharge block during low energy periods
7. If time is limited, REDUCE or REMOVE tasks from lower-priority goals first (higher rank numbers)
8. Return ONLY the JSON array, no other text

User's Energy Profile:
- Chronotype: ${energyProfile.chronotype || 'neutral'}
- Wake Time: ${energyProfile.wake_time || '07:00'}
- Sleep Time: ${energyProfile.sleep_time || '23:00'}
- Peak Focus: ${energyProfile.peak_focus_start || '09:00'} to ${energyProfile.peak_focus_end || '12:00'} (BEST for deep work)
- Low Energy: ${energyProfile.low_energy_start || '14:00'} to ${energyProfile.low_energy_end || '15:30'} (SCHEDULE REST OR LIGHT TASKS HERE)

BLOCKED TIMES (DO NOT SCHEDULE OVER THESE):
${blockedTimes.length > 0 ? blockedTimes.map(b => `- ${b.title}: ${b.start} to ${b.end} ${b.locked ? '(LOCKED)' : ''}`).join('\n') : 'None'}

Available Tasks:
${tasksInfo.map(t => `- ID: ${t.id}
  Title: "${t.title}"
  Duration: ${t.duration} minutes
  Priority: ${t.priority}
  Type: ${t.type}`).join('\n')}

Goal-Based Actions (recurring habits, ordered by goal priority):
${actionsInfo.sort((a, b) => (a.goal_priority || 99) - (b.goal_priority || 99)).map(a => `- Title: "${a.title}"
  Duration: ${a.duration} minutes
  Effort: ${a.effort}
  From Goal: "${a.goal_title}" (priority ${a.goal_priority}) ${a.goal_priority <= 2 ? '← PROTECT THIS' : ''}`).join('\n')}

${patternsInfo ? `User Patterns to consider:\n${patternsInfo}` : ''}

Schedule Window: ${startTime} to ${endTime}

TASK MATCHING RULES:
- Deep Work/Creative tasks → Peak focus hours ONLY
- Shallow Work → Any available time
- Light effort actions → Low energy periods
- Priority 1-2 goal actions → MUST be scheduled, protected slots first
- Priority 5-6 goal actions → Schedule if time permits, drop first if needed

REST BLOCKS (REQUIRED):
- Add at least one "Rest & Recharge" block (15-30 min) during low energy period
- Include short breaks (5-10 min) between intense tasks

Return ONLY valid JSON (absolutely no markdown or explanation):
[
  {
    "task_id": "uuid-from-tasks-list" or null,
    "action_title": "title if from goal actions, or 'Rest & Recharge' for rest blocks" or null,
    "start_time": "ISO 8601 timestamp",
    "end_time": "ISO 8601 timestamp",
    "justification": "Brief reason for this slot",
    "is_rest": true or false
  }
]`;

    console.log('Generating schedule with prompt length:', systemPrompt.length);

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Create my optimized schedule for today, respecting all constraints.' }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate schedule with AI');
    }

    const aiData = await aiResponse.json();
    const scheduleText = aiData.choices[0].message.content;
    
    console.log('AI Response:', scheduleText);
    
    const jsonMatch = scheduleText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      throw new Error('Invalid AI response format');
    }
    
    let rawSlots;
    try {
      rawSlots = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse schedule JSON:', parseError);
      throw new Error('Invalid JSON in AI response');
    }
    
    // Validate and sanitize AI response
    const validTaskIds = new Set((tasks || []).map(t => t.id));
    const validatedSlots = validateScheduleSlots(rawSlots, validTaskIds);
    
    if (validatedSlots.length === 0) {
      console.error('No valid slots after validation');
      throw new Error('AI generated no valid schedule slots');
    }

    console.log(`Validated ${validatedSlots.length}/${rawSlots.length} schedule slots`);

    // Delete existing schedule for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    await supabaseClient
      .from('schedule_slots')
      .delete()
      .eq('user_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lt('start_time', todayEnd.toISOString());

    // Insert new schedule with validated data
    const slotsToInsert = validatedSlots.map(slot => ({
      user_id: user.id,
      task_id: slot.task_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      justification: slot.action_title 
        ? `[${slot.action_title}] ${slot.justification}`
        : slot.justification,
    }));

    const { error: insertError } = await supabaseClient
      .from('schedule_slots')
      .insert(slotsToInsert);

    if (insertError) throw insertError;

    // Update task statuses to Scheduled
    const taskIds = validatedSlots.filter((s: any) => s.task_id).map((s: any) => s.task_id);
    if (taskIds.length > 0) {
      await supabaseClient
        .from('tasks')
        .update({ status: 'Scheduled' })
        .in('id', taskIds);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Schedule generated successfully!',
        slots_created: slotsToInsert.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-schedule:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
