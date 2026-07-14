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

    const { text } = await req.json();
    if (!text || text.trim() === '') {
      throw new Error('Please provide some text to process');
    }

    console.log('Processing brain dump:', text);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const systemPrompt = `You are the "Brain Dump Processor" AI, an **expert productivity assistant** trained to be highly proactive and AGGRESSIVE in extracting actionable tasks.

**CRITICAL RULES:**
1. Your primary goal is to **NEVER** return an empty list unless the input is completely devoid of any topics, activities, or subjects.
2. Even single words or short phrases should be converted into actionable tasks.
3. Be CREATIVE in interpreting vague inputs - assume the user wants to DO something with whatever they mention.

**DEFAULT ASSUMPTIONS (use when input is ambiguous):**
- estimated_duration_min: 30 minutes (default)
- priority: "MEDIUM" (default)
- type: "Shallow Work" (default, unless task clearly involves deep thought, design, or creativity)

**TYPE CLASSIFICATION:**
- "Deep Work" - requires focus, concentration, complex thinking, research, analysis, coding, writing reports
- "Shallow Work" - administrative, routine, quick tasks, errands, calls, emails, simple actions
- "Creative" - brainstorming, ideation, design, colors, artwork, content creation, marketing ideas

**PRIORITY INDICATORS:**
- HIGH: "urgent", "ASAP", "quickly", "important", "deadline", "today", "now", "critical"
- LOW: "eventually", "someday", "when possible", "low priority", "maybe"
- MEDIUM: everything else (default)

**TASK TITLE GUIDELINES:**
- Make vague inputs ACTIONABLE (e.g., "website colors" → "Finalize color palette for website")
- Add action verbs: "Do", "Complete", "Review", "Prepare", "Send", "Create", "Research"
- Keep titles clear and under 100 characters

**EXTRACTION RULES:**
- Extract ALL actionable items, even implicit ones
- If someone mentions a NOUN (e.g., "books", "mom", "bills"), create a task around it
- Single words like "read" → "Complete reading session"
- Personal items like "mom" → "Call mom" or "Visit mom"
- Activities like "football" → "Play football" or "Practice football"

Return ONLY valid JSON array (no markdown, no code blocks, no explanations):
[{"title": "Task title", "estimated_duration_min": 30, "priority": "MEDIUM", "type": "Shallow Work"}]`;

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
          { role: 'user', content: text }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to process brain dump with AI');
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;
    
    console.log('AI Response:', responseText);
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      throw new Error('Invalid AI response format');
    }
    
    const extractedTasks = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(extractedTasks)) {
      throw new Error('AI did not return an array of tasks');
    }

    if (extractedTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No actionable tasks found in your input. Try being more specific!',
          tasks_created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize tasks
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
    const validTypes = ['Deep Work', 'Shallow Work', 'Creative'];
    
    const tasksToInsert = extractedTasks.map((task: any) => ({
      user_id: user.id,
      title: String(task.title).slice(0, 200),
      estimated_duration_min: Math.max(5, Math.min(480, Number(task.estimated_duration_min) || 30)),
      priority: validPriorities.includes(task.priority) ? task.priority : 'MEDIUM',
      type: validTypes.includes(task.type) ? task.type : 'Deep Work',
      status: 'To Do'
    }));

    console.log('Inserting tasks:', tasksToInsert);

    const { data: insertedTasks, error: insertError } = await supabaseClient
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully created ${insertedTasks.length} task(s) from your brain dump!`,
        tasks_created: insertedTasks.length,
        tasks: insertedTasks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-brain-dump:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
