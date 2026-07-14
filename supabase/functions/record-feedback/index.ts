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

    const { 
      task_id, 
      schedule_slot_id, 
      status, 
      actual_duration_minutes,
      skipped_reason 
    } = await req.json();

    // Record the feedback
    const { error: feedbackError } = await supabaseClient
      .from('task_feedback')
      .insert({
        user_id: user.id,
        task_id,
        schedule_slot_id,
        status,
        actual_duration_minutes,
        skipped_reason,
        completed_at: new Date().toISOString(),
      });

    if (feedbackError) throw feedbackError;

    // Update task status if completed
    if (status === 'completed' && task_id) {
      await supabaseClient
        .from('tasks')
        .update({ status: 'Complete' })
        .eq('id', task_id);
    }

    // Analyze patterns after recording feedback
    await analyzePatterns(supabaseClient, user.id);

    return new Response(
      JSON.stringify({ message: 'Feedback recorded successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in record-feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzePatterns(supabase: any, userId: string) {
  try {
    // Get recent feedback (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: recentFeedback } = await supabase
      .from('task_feedback')
      .select('*, schedule_slots(start_time, end_time)')
      .eq('user_id', userId)
      .gte('completed_at', twoWeeksAgo.toISOString());

    if (!recentFeedback || recentFeedback.length < 5) {
      return; // Not enough data for pattern detection
    }

    const patterns: any[] = [];

    // Detect time-of-day skipping patterns
    const skippedByHour: Record<number, number> = {};
    const completedByHour: Record<number, number> = {};

    recentFeedback.forEach((f: any) => {
      if (!f.schedule_slots?.start_time) return;
      const hour = new Date(f.schedule_slots.start_time).getHours();
      
      if (f.status === 'skipped') {
        skippedByHour[hour] = (skippedByHour[hour] || 0) + 1;
      } else if (f.status === 'completed') {
        completedByHour[hour] = (completedByHour[hour] || 0) + 1;
      }
    });

    // Find hours with high skip rates
    for (const hour in skippedByHour) {
      const skipped = skippedByHour[hour];
      const completed = completedByHour[hour] || 0;
      const total = skipped + completed;
      const skipRate = skipped / total;

      if (total >= 3 && skipRate >= 0.6) {
        patterns.push({
          user_id: userId,
          pattern_type: 'high_skip_hour',
          pattern_data: {
            hour: parseInt(hour),
            skip_rate: skipRate,
            sample_size: total,
          },
          confidence: Math.min(0.9, 0.5 + (total / 20)),
        });
      }
    }

    // Detect duration estimation patterns
    const durationDiffs: number[] = [];
    recentFeedback.forEach((f: any) => {
      if (f.actual_duration_minutes && f.schedule_slots) {
        const scheduled = (new Date(f.schedule_slots.end_time).getTime() - 
                         new Date(f.schedule_slots.start_time).getTime()) / 60000;
        durationDiffs.push(f.actual_duration_minutes - scheduled);
      }
    });

    if (durationDiffs.length >= 5) {
      const avgDiff = durationDiffs.reduce((a, b) => a + b, 0) / durationDiffs.length;
      if (Math.abs(avgDiff) >= 10) {
        patterns.push({
          user_id: userId,
          pattern_type: 'duration_bias',
          pattern_data: {
            average_difference_minutes: Math.round(avgDiff),
            direction: avgDiff > 0 ? 'underestimate' : 'overestimate',
            sample_size: durationDiffs.length,
          },
          confidence: Math.min(0.85, 0.5 + (durationDiffs.length / 30)),
        });
      }
    }

    // Save detected patterns
    if (patterns.length > 0) {
      // Delete old patterns of these types
      const patternTypes = patterns.map(p => p.pattern_type);
      await supabase
        .from('user_patterns')
        .delete()
        .eq('user_id', userId)
        .in('pattern_type', patternTypes);

      // Insert new patterns
      await supabase.from('user_patterns').insert(patterns);

      console.log(`Detected ${patterns.length} patterns for user ${userId}`);
    }

  } catch (error) {
    console.error('Error analyzing patterns:', error);
  }
}
