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

    const { task_id, file_base64, file_type } = await req.json();

    if (!task_id || !file_base64) {
      throw new Error('Missing required fields: task_id and file_base64');
    }

    // Fetch task details
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) throw new Error('Task not found');

    // Prepare AI verification prompt
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const systemPrompt = `You are an AI task verification assistant. Review the provided proof-of-work for the following task:

Task: "${task.title}"
Type: ${task.type}
Priority: ${task.priority}

Analyze the provided image/text and determine if it represents valid proof that the task was completed. Respond with a JSON object:
{
  "verified": true/false,
  "confidence": 0-100,
  "explanation": "brief explanation"
}`;

    // Construct the message with image
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please verify if this proof demonstrates task completion.'
          },
          {
            type: 'image_url',
            image_url: {
              url: file_base64.startsWith('data:') ? file_base64 : `data:${file_type};base64,${file_base64}`
            }
          }
        ]
      }
    ];

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to verify proof with AI');
    }

    const aiData = await aiResponse.json();
    const verificationText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = verificationText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    
    const verification = JSON.parse(jsonMatch[0]);

    // Update task status if verified
    if (verification.verified && verification.confidence >= 70) {
      await supabaseClient
        .from('tasks')
        .update({ status: 'Complete' })
        .eq('id', task_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification: verification,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-proof:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});