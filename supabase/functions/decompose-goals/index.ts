import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema validation for AI response
interface ActionSchema {
  title: string;
  description: string;
  duration_minutes: number;
  frequency: string;
  effort_level: string;
}

function validateAction(action: any): ActionSchema | null {
  if (!action || typeof action !== 'object') return null;
  if (typeof action.title !== 'string' || action.title.trim() === '') return null;
  
  const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
  const validEffortLevels = ['deep_focus', 'moderate', 'light'];
  const validDurations = [15, 30, 45, 60, 90, 120];
  
  return {
    title: action.title.trim().slice(0, 200),
    description: typeof action.description === 'string' ? action.description.trim().slice(0, 500) : '',
    duration_minutes: validDurations.includes(action.duration_minutes) ? action.duration_minutes : 30,
    frequency: validFrequencies.includes(action.frequency) ? action.frequency : 'daily',
    effort_level: validEffortLevels.includes(action.effort_level) ? action.effort_level : 'moderate',
  };
}

function validateActions(rawActions: any[]): ActionSchema[] {
  if (!Array.isArray(rawActions)) return [];
  
  const validated = rawActions
    .map(validateAction)
    .filter((a): a is ActionSchema => a !== null)
    .slice(0, 7); // Max 7 actions per goal
  
  return validated;
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

    // Handle empty body gracefully
    let goal_id = null;
    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        goal_id = parsed.goal_id;
      }
    } catch {
      // No body or invalid JSON - process all goals
    }

    // Fetch the specific goal or all goals
    let goalsQuery = supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (goal_id) {
      goalsQuery = goalsQuery.eq('id', goal_id);
    }

    const { data: goals, error: goalsError } = await goalsQuery;
    if (goalsError) throw goalsError;

    if (!goals || goals.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No goals to decompose' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const allActions: any[] = [];

    for (const goal of goals) {
      const systemPrompt = `You are a productivity expert that breaks down goals into actionable tasks.

Given a SMART goal, decompose it into 3-7 specific, repeatable actions that will help achieve the goal.

Goal to decompose:
- Category: ${goal.category}
- Title: ${goal.title}
- Description: ${goal.description || 'No description'}
- Target Date: ${goal.target_date || 'No deadline'}
- Priority Rank: ${goal.priority_rank} (1=highest)

For each action, determine:
1. A clear, actionable title (start with a verb)
2. Brief description of what to do
3. Estimated duration in minutes (15, 30, 45, 60, 90, or 120)
4. Frequency: "daily", "weekly", "biweekly", or "monthly"
5. Effort level: "deep_focus" (requires concentration), "moderate", or "light" (can do when tired)

Follow the principle: Identity → Time → Actions → Schedule
Focus on building habits, not one-time tasks.

Return ONLY valid JSON array (no markdown):
[
  {
    "title": "Action title",
    "description": "Brief description",
    "duration_minutes": 30,
    "frequency": "daily",
    "effort_level": "moderate"
  }
]`;

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
            { role: 'user', content: `Decompose my goal: "${goal.title}"` }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error for goal:', goal.id);
        continue;
      }

      const aiData = await aiResponse.json();
      const responseText = aiData.choices[0].message.content;
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON in response for goal:', goal.id);
        continue;
      }

      let rawActions;
      try {
        rawActions = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Invalid JSON for goal:', goal.id, parseError);
        continue;
      }
      
      // Validate and sanitize AI response
      const validatedActions = validateActions(rawActions);
      
      if (validatedActions.length === 0) {
        console.error('No valid actions after validation for goal:', goal.id);
        continue;
      }

      console.log(`Validated ${validatedActions.length}/${rawActions.length} actions for goal:`, goal.id);
      
      // Add goal_id and user_id to each validated action
      const actionsToInsert = validatedActions.map(action => ({
        user_id: user.id,
        goal_id: goal.id,
        title: action.title,
        description: action.description,
        duration_minutes: action.duration_minutes,
        frequency: action.frequency,
        effort_level: action.effort_level,
      }));

      allActions.push(...actionsToInsert);
    }

    if (allActions.length > 0) {
      // Delete existing actions for these goals if regenerating
      const goalIds = goals.map(g => g.id);
      await supabaseClient
        .from('goal_actions')
        .delete()
        .eq('user_id', user.id)
        .in('goal_id', goalIds);

      const { error: insertError } = await supabaseClient
        .from('goal_actions')
        .insert(allActions);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        message: `Created ${allActions.length} actions from ${goals.length} goals`,
        actions_created: allActions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in decompose-goals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
