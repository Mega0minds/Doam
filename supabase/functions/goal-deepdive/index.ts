import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoalInfo {
  category: string;
  title: string;
  description?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { goal, conversationHistory, language } = await req.json() as {
      goal: GoalInfo;
      conversationHistory: Message[];
      language: 'en' | 'pidgin';
    };

    console.log('Generating follow-up questions for goal:', goal.category, goal.title);
    console.log('Language:', language);
    console.log('Conversation history length:', conversationHistory.length);

    const categoryNames: Record<string, string> = {
      academic_career: 'Academics / Career',
      health: 'Health',
      personal_growth: 'Personal Growth',
      social: 'Social',
      spiritual_mental: 'Spiritual / Mental',
      rest_recreation: 'Rest & Recreation'
    };

    const categoryContext: Record<string, string> = {
      academic_career: `For academic/career goals, ask about:
- Current study habits or work patterns
- Support systems (tutors, study groups, mentors)
- Specific challenges or difficult topics
- Exam schedules or deadlines`,
      health: `For health goals, ask about:
- Types of exercise or activities they enjoy
- Realistic frequency per week
- Any physical limitations to consider
- Diet or nutrition aspects`,
      personal_growth: `For personal growth goals, ask about:
- Specific skills they want to develop
- Resources they already have (books, courses)
- Time they can dedicate
- How they want to measure progress`,
      social: `For social goals, ask about:
- Types of connections they're seeking
- Current social activities
- Comfort level with new situations
- Balance with other priorities`,
      spiritual_mental: `For spiritual/mental goals, ask about:
- Current practices (meditation, prayer, journaling)
- Triggers that affect mental wellness
- Preferred methods of relaxation
- How they want to incorporate this daily`,
      rest_recreation: `For rest/recreation goals, ask about:
- Activities they find truly restful
- Causes of feeling tired or overwhelmed
- Ideal amount of downtime daily/weekly
- Barriers to rest currently`
    };

    const toneGuide = language === 'pidgin' 
      ? `IMPORTANT: Respond in Soft Nigerian Pidgin. Rules:
- Light, friendly, professional tone
- Easy to understand
- Never use heavy slang or street grammar
- Never shame or pressure
Examples:
- "Make I understand am well make I plan am better"
- "How many times you dey do this for one week?"
- "Any wahala wey dey stop you?"
- "No pressure, take your time"` 
      : `Use a warm, conversational English tone. Be friendly and supportive. Never pressure or judge.`;

    const systemPrompt = `You are DoAm's Goal Deep-Dive Assistant. Your job is to have a brief, friendly conversation to understand the user's goal better so their calendar can be personalized.

${toneGuide}

Category: ${categoryNames[goal.category] || goal.category}
User's Goal: "${goal.title}"
${goal.description ? `Description: "${goal.description}"` : ''}

${categoryContext[goal.category] || ''}

RULES:
1. Ask no more than 2-3 follow-up questions per goal
2. Questions must be DIRECTLY relevant to their specific goal
3. Focus on making the goal ACTIONABLE and REALISTIC
4. Keep each message brief (under 100 words)
5. Be warm and supportive
6. Never be judgmental or interrogative
7. If user seems done or uninterested, gracefully wrap up

If this is the START of conversation (no history), introduce yourself briefly and ask your first question about the goal.
If continuing a conversation, respond naturally to what they said and either ask a follow-up or summarize what you learned.

When you have enough information (usually after 2-3 exchanges), conclude with a brief summary of what you learned that will help personalize their schedule.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    // If no conversation history, this is the first message
    if (conversationHistory.length === 0) {
      messages.push({ role: 'user', content: `I want to: ${goal.title}` });
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    console.log('AI response generated successfully');

    // Check if the conversation seems complete
    const isComplete = conversationHistory.length >= 4 || 
      aiResponse.toLowerCase().includes('summary') ||
      aiResponse.toLowerCase().includes('perfect') ||
      aiResponse.toLowerCase().includes('got it') ||
      aiResponse.toLowerCase().includes('understand');

    return new Response(
      JSON.stringify({ 
        message: aiResponse,
        isComplete 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in goal-deepdive function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
