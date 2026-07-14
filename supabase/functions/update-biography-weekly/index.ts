import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Updating weekly biography for user:', user.id);

    // Get last 7 days of task feedback
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      profileResult,
      goalsResult,
      energyResult,
      feedbackResult,
      scheduleResult
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('energy_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('task_feedback').select('*').eq('user_id', user.id).gte('completed_at', oneWeekAgo.toISOString()),
      supabase.from('schedule_slots').select('*, tasks(*)').eq('user_id', user.id).gte('start_time', oneWeekAgo.toISOString())
    ]);

    const profile = profileResult.data;
    const goals = goalsResult.data || [];
    const energy = energyResult.data;
    const feedback = feedbackResult.data || [];
    const scheduleSlots = scheduleResult.data || [];

    // Analyze patterns
    const completedTasks = feedback.filter((f: any) => f.status === 'completed');
    const skippedTasks = feedback.filter((f: any) => f.status === 'skipped');
    const completionRate = feedback.length > 0 
      ? Math.round((completedTasks.length / feedback.length) * 100) 
      : 0;

    // Analyze time-of-day success
    const morningSuccess = scheduleSlots.filter((s: any) => {
      const hour = new Date(s.start_time).getHours();
      return hour >= 6 && hour < 12 && s.tasks?.status === 'Complete';
    }).length;

    const afternoonSuccess = scheduleSlots.filter((s: any) => {
      const hour = new Date(s.start_time).getHours();
      return hour >= 12 && hour < 18 && s.tasks?.status === 'Complete';
    }).length;

    const eveningSuccess = scheduleSlots.filter((s: any) => {
      const hour = new Date(s.start_time).getHours();
      return hour >= 18 && s.tasks?.status === 'Complete';
    }).length;

    // Build context
    let context = 'Generate an updated biography based on the following user data and weekly patterns:\n\n';

    // Existing profile data
    if (profile) {
      if (profile.ai_biography) {
        context += `Previous Biography: ${profile.ai_biography}\n\n`;
      }
      if (profile.self_described_strengths?.length) {
        context += `Strengths: ${profile.self_described_strengths.join(', ')}\n`;
      }
      if (profile.self_described_struggles?.length) {
        context += `Struggles: ${profile.self_described_struggles.join(', ')}\n`;
      }
    }

    // Weekly patterns
    context += `\nWeekly Patterns (last 7 days):\n`;
    context += `- Task completion rate: ${completionRate}%\n`;
    context += `- Tasks completed: ${completedTasks.length}\n`;
    context += `- Tasks skipped: ${skippedTasks.length}\n`;
    context += `- Morning completions: ${morningSuccess}\n`;
    context += `- Afternoon completions: ${afternoonSuccess}\n`;
    context += `- Evening completions: ${eveningSuccess}\n`;

    // Skip reasons analysis
    const skipReasons = skippedTasks
      .filter((t: any) => t.skipped_reason)
      .map((t: any) => t.skipped_reason);
    if (skipReasons.length > 0) {
      context += `- Common skip reasons: ${skipReasons.slice(0, 3).join(', ')}\n`;
    }

    // Energy data
    if (energy) {
      context += `\nEnergy Profile:\n`;
      context += `- Chronotype: ${energy.chronotype}\n`;
      context += `- Wake time: ${energy.wake_time}, Sleep time: ${energy.sleep_time}\n`;
    }

    // Goals
    if (goals.length > 0) {
      context += `\nActive Goals: ${goals.map((g: any) => g.title).join(', ')}\n`;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are DoAm's profile evolution writer. Update the user's biography based on their weekly behavior patterns.

Rules:
- Write in second person ("You", "Your")
- Be warm, encouraging, never judgmental
- Only mention patterns that appeared 3+ times
- Use soft language ("tends to", "often", "usually")
- No absolute claims
- Acknowledge improvements compassionately
- If completion rate dropped, frame it gently as an opportunity
- Keep under 100 words
- Focus on actionable insights for scheduling

If completion rate > 70%: Celebrate consistency
If completion rate 40-70%: Acknowledge effort, suggest small adjustments
If completion rate < 40%: Be very gentle, focus on what worked`
          },
          { role: 'user', content: context }
        ],
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const biography = data.choices?.[0]?.message?.content || profile?.ai_biography || 'Profile information is being gathered.';

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ai_biography: biography,
        ai_biography_updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error('Error updating biography:', updateError);
    }

    console.log('Weekly biography updated successfully');

    return new Response(
      JSON.stringify({ 
        biography,
        stats: {
          completionRate,
          completedTasks: completedTasks.length,
          skippedTasks: skippedTasks.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-biography-weekly function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
