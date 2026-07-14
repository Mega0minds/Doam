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
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating biography for user:', user.id);

    // Fetch all relevant user data
    const [
      profileResult,
      goalsResult,
      energyResult,
      commitmentsResult
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('energy_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('fixed_commitments').select('*').eq('user_id', user.id)
    ]);

    const profile = profileResult.data;
    const goals = goalsResult.data || [];
    const energy = energyResult.data;
    const commitments = commitmentsResult.data || [];

    // Build context for AI
    let context = 'Based on the following user data, generate a concise, warm biography:\n\n';

    if (profile) {
      if (profile.academic_level) context += `Academic Level: ${profile.academic_level}\n`;
      if (profile.field_of_study) context += `Field of Study: ${profile.field_of_study}\n`;
      if (profile.long_term_aspirations) context += `Aspirations: ${profile.long_term_aspirations}\n`;
      if (profile.self_described_strengths?.length) {
        context += `Strengths: ${profile.self_described_strengths.join(', ')}\n`;
      }
      if (profile.self_described_struggles?.length) {
        context += `Struggles with: ${profile.self_described_struggles.join(', ')}\n`;
      }
      if (profile.study_habits) context += `Study Habits: ${profile.study_habits}\n`;
      if (profile.consistency_level) context += `Consistency: ${profile.consistency_level}\n`;
      if (profile.typical_blockers?.length) {
        context += `Typical Blockers: ${profile.typical_blockers.join(', ')}\n`;
      }
      if (profile.preferred_work_style) context += `Work Style: ${profile.preferred_work_style}\n`;
      if (profile.goal_deepdive_data && Object.keys(profile.goal_deepdive_data).length > 0) {
        context += `Goal Insights: ${JSON.stringify(profile.goal_deepdive_data)}\n`;
      }
    }

    if (goals.length > 0) {
      context += '\nGoals:\n';
      goals.forEach((g: any) => {
        context += `- ${g.category}: ${g.title}${g.description ? ` (${g.description})` : ''}\n`;
      });
    }

    if (energy) {
      context += `\nEnergy Profile:\n`;
      context += `- Chronotype: ${energy.chronotype}\n`;
      context += `- Wake time: ${energy.wake_time}, Sleep time: ${energy.sleep_time}\n`;
      if (energy.high_focus_start && energy.high_focus_end) {
        context += `- Peak focus: ${energy.high_focus_start} - ${energy.high_focus_end}\n`;
      }
      if (energy.low_energy_start && energy.low_energy_end) {
        context += `- Low energy: ${energy.low_energy_start} - ${energy.low_energy_end}\n`;
      }
    }

    if (commitments.length > 0) {
      context += `\nHas ${commitments.length} fixed commitments in their schedule.\n`;
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
            content: `You are DoAm's profile writer. Generate a meaningful, warm, second-person biography (3-4 sentences) that captures the user's essence for planning purposes.

Rules:
- Write in second person ("You are...", "You tend to...")
- Be warm, encouraging, and understanding
- Focus on what matters for scheduling: energy patterns, priorities, challenges, work style
- Keep it under 80 words
- No assumptions beyond the data provided
- Highlight both strengths and areas for growth compassionately
- Mention specific scheduling insights when available (e.g., "You work best in the morning")
- If minimal data, acknowledge this gracefully and encourage the user to add more

Example: "You're a driven undergraduate student who prioritizes academics and personal growth. You're aiming for a strong CGPA, but consistency sometimes slows you down. You work best in the morning, struggle with late-night focus, and benefit from shorter, frequent study sessions. Your schedule protects your rest while keeping academic goals on track."`
          },
          { role: 'user', content: context }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const biography = data.choices?.[0]?.message?.content || 'Profile information is being gathered.';

    // Update user profile with new biography
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

    console.log('Biography generated successfully');

    return new Response(
      JSON.stringify({ biography }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-biography function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
