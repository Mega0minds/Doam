'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  category: string;
  title: string;
  description?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GoalDeepdiveChatProps {
  goals: Goal[];
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const categoryOrder = [
  'academic_career',
  'health',
  'personal_growth',
  'social',
  'spiritual_mental',
  'rest_recreation'
];

const categoryLabels: Record<string, { en: string; pidgin: string }> = {
  academic_career: { en: 'Academics / Career', pidgin: 'School / Work' },
  health: { en: 'Health', pidgin: 'Health' },
  personal_growth: { en: 'Personal Growth', pidgin: 'Personal Growth' },
  social: { en: 'Social', pidgin: 'Social Life' },
  spiritual_mental: { en: 'Spiritual / Mental', pidgin: 'Spirit / Mind' },
  rest_recreation: { en: 'Rest & Recreation', pidgin: 'Rest & Fun' }
};

export function GoalDeepdiveChat({ goals, userId, onComplete, onSkip }: GoalDeepdiveChatProps) {
  const { language, t } = useLanguage();
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [goalComplete, setGoalComplete] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sort goals by category order
  const sortedGoals = [...goals].sort((a, b) => {
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });

  const currentGoal = sortedGoals[currentGoalIndex];
  const currentMessages = currentGoal ? (conversations[currentGoal.id] || []) : [];
  const totalGoals = sortedGoals.length;
  const completedCount = Object.values(goalComplete).filter(Boolean).length;

  useEffect(() => {
    // Start conversation for current goal if not started
    if (currentGoal && !conversations[currentGoal.id]) {
      startConversation();
    }
  }, [currentGoalIndex, currentGoal?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const startConversation = async () => {
    if (!currentGoal) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('goal-deepdive', {
        body: {
          goal: {
            category: currentGoal.category,
            title: currentGoal.title,
            description: currentGoal.description
          },
          conversationHistory: [],
          language
        }
      });

      if (error) throw error;

      setConversations(prev => ({
        ...prev,
        [currentGoal.id]: [{ role: 'assistant', content: data.message }]
      }));
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Fallback message
      const fallbackMsg = language === 'pidgin' 
        ? `Make we talk about your goal: "${currentGoal.title}". Wetin you want achieve?`
        : `Let's talk about your goal: "${currentGoal.title}". What are you hoping to achieve?`;
      
      setConversations(prev => ({
        ...prev,
        [currentGoal.id]: [{ role: 'assistant', content: fallbackMsg }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !currentGoal || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    const updatedMessages: Message[] = [
      ...currentMessages,
      { role: 'user', content: userMessage }
    ];
    
    setConversations(prev => ({
      ...prev,
      [currentGoal.id]: updatedMessages
    }));

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('goal-deepdive', {
        body: {
          goal: {
            category: currentGoal.category,
            title: currentGoal.title,
            description: currentGoal.description
          },
          conversationHistory: updatedMessages,
          language
        }
      });

      if (error) throw error;

      setConversations(prev => ({
        ...prev,
        [currentGoal.id]: [
          ...updatedMessages,
          { role: 'assistant', content: data.message }
        ]
      }));

      if (data.isComplete) {
        setGoalComplete(prev => ({ ...prev, [currentGoal.id]: true }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const nextGoal = async () => {
    // Save conversation data to profile
    if (currentGoal) {
      const deepdiveData = { [currentGoal.category]: currentMessages };
      
      try {
        // Get existing profile data
        const { data: existingProfile } = await supabase
          .from('user_profiles' as any)
          .select('goal_deepdive_data')
          .eq('user_id', userId)
          .maybeSingle() as { data: { goal_deepdive_data: Record<string, unknown> } | null };

        const existingData = existingProfile?.goal_deepdive_data || {};
        
        const { error } = await supabase.from('user_profiles' as any).upsert({
          user_id: userId,
          goal_deepdive_data: { ...existingData, ...deepdiveData },
          goal_deepdive_completed: currentGoalIndex >= totalGoals - 1
        } as any);
        
        if (error) console.error('Error saving:', error);
      } catch (error) {
        console.error('Error saving deepdive data:', error);
      }
    }

    if (currentGoalIndex < totalGoals - 1) {
      setCurrentGoalIndex(prev => prev + 1);
    } else {
      // Generate biography after completing all goals
      try {
        await supabase.functions.invoke('generate-biography');
      } catch (error) {
        console.error('Error generating biography:', error);
      }
      onComplete();
    }
  };

  const skipCurrentGoal = () => {
    setGoalComplete(prev => ({ ...prev, [currentGoal?.id || '']: true }));
    nextGoal();
  };

  if (!currentGoal) {
    return null;
  }

  const categoryLabel = categoryLabels[currentGoal.category]?.[language] || currentGoal.category;

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{categoryLabel}</span>
            <span className="text-xs">({currentGoalIndex + 1}/{totalGoals})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {t.skip}
          </Button>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-1">
          {sortedGoals.map((goal, idx) => (
            <div
              key={goal.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                idx < currentGoalIndex ? "bg-primary" :
                idx === currentGoalIndex ? "bg-primary/60" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Current goal card */}
      <Card className="flex-shrink-0 p-3 mb-4 bg-primary/5 border-primary/20">
        <p className="text-sm font-medium">{currentGoal.title}</p>
        {currentGoal.description && (
          <p className="text-xs text-muted-foreground mt-1">{currentGoal.description}</p>
        )}
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {currentMessages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'pidgin' ? "Type your answer..." : "Type your answer..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={skipCurrentGoal}
            className="flex-1"
          >
            {language === 'pidgin' ? 'Skip this one' : 'Skip this goal'}
          </Button>
          <Button
            size="sm"
            onClick={nextGoal}
            className="flex-1"
            disabled={currentMessages.length < 2}
          >
            {currentGoalIndex < totalGoals - 1 ? (
              <>
                {language === 'pidgin' ? 'Next Goal' : 'Next Goal'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              language === 'pidgin' ? 'Finish' : 'Finish'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
