'use client';
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Sparkles } from "lucide-react";

interface BrainDumpProps {
  onTasksCreated: () => void;
}

const BrainDump = ({ onTasksCreated }: BrainDumpProps) => {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({ title: "Please enter some text", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-brain-dump', {
        body: { text: input }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({ 
        title: "Brain Dump Processed!", 
        description: data.message 
      });
      
      setInput("");
      onTasksCreated();
    } catch (error: any) {
      console.error('Brain dump error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to process brain dump", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-card bg-gradient-to-br from-background to-muted/20" data-tour="brain-dump">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Brain className="w-5 h-5 text-primary" />
          Brain Dump
          <Sparkles className="w-4 h-4 text-amber-500" />
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Dump your thoughts and let AI organize them into actionable tasks
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="e.g., I need to pay the bills, quickly brainstorm marketing ideas, finish the report by Friday, and call mom..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
          disabled={loading}
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="w-full bg-gradient-primary hover:shadow-elevated gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extract Tasks
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BrainDump;
