'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Calendar, Upload, Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { GoalDeepdiveModal } from "@/components/GoalDeepdiveModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { DynamicGreeting } from "@/components/DynamicGreeting";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";

interface ScheduleSlot {
  id: string;
  start_time: string;
  end_time: string;
  justification: string;
  task_id: string | null;
  tasks?: {
    title: string;
    priority: string;
    type: string;
  };
}

const Dashboard = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [hasEnergyProfile, setHasEnergyProfile] = useState(false);
  const [hasTasks, setHasTasks] = useState(false);
  const [hasGoals, setHasGoals] = useState(false);
  const [proofDialog, setProofDialog] = useState<{ open: boolean; slotId: string; taskTitle: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboardingStatus();
  const [showGoalDeepdive, setShowGoalDeepdive] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Auto-trigger tour for first-time users after onboarding
  useEffect(() => {
    const tourCompleted = localStorage.getItem('doam-tour-completed');
    const onboardingCompleted = localStorage.getItem('doam-onboarding-completed');
    
    // Show tour if onboarding is done but tour hasn't been shown
    if (onboardingCompleted === 'true' && tourCompleted !== 'true' && !showOnboarding && !showGoalDeepdive) {
      // Small delay to let the page settle
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, showGoalDeepdive]);

  useEffect(() => {
    checkPrerequisites();
    fetchSchedule();
    // Track activity so intelligent nudges know if the user opened the app today.
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        await supabase
          .from('notification_preferences' as any)
          .upsert(
            { user_id: user.id, last_active_date: today },
            { onConflict: 'user_id' }
          );
      } catch (e) {
        // non-fatal
      }
    })();
  }, []);

  const checkPrerequisites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if energy profile exists
      const { data: energy } = await supabase
        .from('energy_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasEnergyProfile(!!energy);

      // Check if tasks exist
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setHasTasks(!!tasks && tasks.length > 0);

      // Check if goals exist
      const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      setHasGoals(!!goals && goals.length > 0);
    } catch (error) {
      console.error('Error checking prerequisites:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("schedule_slots")
        .select(`
          *,
          tasks (
            title,
            priority,
            type
          )
        `)
        .eq("user_id", user.id)
        .gte("start_time", today.toISOString())
        .lt("start_time", tomorrow.toISOString())
        .order("start_time");

      setSchedule(error ? [] : (data || []));
    } catch {
      setSchedule([]);
    }
  };

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-schedule");

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Schedule generated!",
        description: data.message || "Your day has been optimally planned.",
      });

      fetchSchedule();
    } catch (error: any) {
      console.error('Generate schedule error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !proofDialog) return;

    setUploadingProof(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Data = reader.result as string;

      const slot = schedule.find(s => s.id === proofDialog.slotId);
      if (!slot?.task_id) {
        throw new Error("No task associated with this slot");
      }

      const { data, error } = await supabase.functions.invoke("verify-proof", {
        body: {
          task_id: slot.task_id,
          file_base64: base64Data,
          file_type: selectedFile.type,
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const verification = data.verification;

      if (verification.verified && verification.confidence >= 70) {
        toast({
          title: "Proof Verified!",
          description: `Task marked as complete. ${verification.explanation}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: verification.explanation || "The proof doesn't appear to demonstrate task completion.",
          variant: "destructive",
        });
      }

      fetchSchedule();
      setProofDialog(null);
      setSelectedFile(null);

    } catch (error: any) {
      console.error('Proof submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit proof",
        variant: "destructive",
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const isReady = hasEnergyProfile && hasTasks;

  return (
    <Layout hideNav={showOnboarding}>
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
              <DynamicGreeting />
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Button
            onClick={handleGenerateSchedule}
            disabled={loading || !isReady}
            className="bg-gradient-primary hover:shadow-elevated gap-2 w-full sm:w-auto"
            size="lg"
            data-tour="generate-schedule"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{loading ? "Generating..." : "Generate Schedule"}</span>
          </Button>
        </div>

        {!isReady && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Complete Your Setup</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    To generate personalized schedules, please complete these steps:
                  </p>
                  <div className="space-y-2">
                    {!hasEnergyProfile && (
                      <Button
                        variant="outline"
                        onClick={() => setShowOnboarding(true)}
                        className="w-full justify-start gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Complete onboarding to set energy profile
                      </Button>
                    )}
                    {!hasGoals && (
                      <Button
                        variant="outline"
                        onClick={() => setShowOnboarding(true)}
                        className="w-full justify-start gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Set your goals in onboarding
                      </Button>
                    )}
                    {!hasTasks && (
                      <Button
                        variant="outline"
                        onClick={() => router.push('/tasks')}
                        className="w-full justify-start gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Add at least one task
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {schedule.length > 0 ? (
          <div className="space-y-4">
            {(showAllSchedule ? schedule : schedule.slice(0, 3)).map((slot) => {
              // Parse "[Action Title] justification" format from generate-schedule
              const actionMatch = slot.justification?.match(/^\[([^\]]+)\]\s*(.*)$/);
              const actionTitle = actionMatch ? actionMatch[1] : null;
              const justificationText = actionMatch ? actionMatch[2] : slot.justification;
              const isRestBlock =
                !slot.task_id &&
                (actionTitle?.toLowerCase().includes('rest') ||
                  actionTitle?.toLowerCase().includes('recharge') ||
                  actionTitle?.toLowerCase().includes('break') ||
                  justificationText?.toLowerCase().includes('rest block'));
              const displayTitle =
                slot.tasks?.title ||
                actionTitle ||
                (isRestBlock ? 'Rest & Recharge' : 'Scheduled Block');

              return (
              <Card key={slot.id} className="border-border/50 shadow-card hover:shadow-elevated transition-smooth">
                <CardHeader className={slot.task_id || (actionTitle && !isRestBlock) ? "bg-gradient-energy-high" : "bg-gradient-energy-low"}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        {displayTitle}
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm">
                        {format(new Date(slot.start_time), "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
                      </CardDescription>
                    </div>
                    {slot.task_id && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 w-full sm:w-auto"
                        onClick={() => setProofDialog({ 
                          open: true, 
                          slotId: slot.id, 
                          taskTitle: slot.tasks?.title || 'Task' 
                        })}
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Submit Proof</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {slot.tasks && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{slot.tasks.priority}</Badge>
                      <Badge variant="outline">{slot.tasks.type}</Badge>
                    </div>
                  )}
                  {!slot.tasks && actionTitle && !isRestBlock && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">Goal Action</Badge>
                    </div>
                  )}
                  {justificationText && (
                    <p className="text-sm text-muted-foreground italic">
                      "{justificationText}"
                    </p>
                  )}
                </CardContent>
              </Card>
              );
            })}
            {schedule.length > 3 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAllSchedule(!showAllSchedule)}
              >
                {showAllSchedule ? 'Show less' : `See more (${schedule.length - 3} more)`}
              </Button>
            )}
          </div>
        ) : (
          <Card className="border-border/50 shadow-card">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-display text-xl font-semibold mb-2">No schedule yet</h3>
                <p className="text-muted-foreground">
                  Click "Generate Schedule" to let AI plan your day based on your goals and energy
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proof Upload Dialog */}
        <Dialog open={!!proofDialog} onOpenChange={(open) => !open && setProofDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Proof of Completion</DialogTitle>
              <DialogDescription>
                Upload an image or screenshot showing you completed: <strong>{proofDialog?.taskTitle}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="proof-file">Upload Proof</Label>
                <Input
                  id="proof-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploadingProof}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitProof}
                disabled={!selectedFile || uploadingProof}
                className="flex-1 bg-gradient-primary"
              >
                {uploadingProof ? "Verifying..." : "Verify with AI"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setProofDialog(null);
                  setSelectedFile(null);
                }}
                disabled={uploadingProof}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Onboarding Modal */}
        <OnboardingModal
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          onComplete={() => {
            completeOnboarding();
            checkPrerequisites();
            // Trigger Goal Deep-Dive after onboarding
            setShowGoalDeepdive(true);
          }}
        />

        {/* Goal Deep-Dive Modal */}
        <GoalDeepdiveModal
          open={showGoalDeepdive}
          onOpenChange={setShowGoalDeepdive}
          onComplete={() => {
            setShowGoalDeepdive(false);
            toast({
              title: "Profile Enhanced!",
              description: "Your goals have been fine-tuned for better scheduling.",
            });
          }}
        />

        {/* Onboarding Tour */}
        <OnboardingTour 
          isOpen={showTour} 
          onClose={() => setShowTour(false)} 
        />

        {/* Daily notification permission prompt — shown after onboarding */}
        <NotificationPermissionPrompt
          enabled={!showOnboarding && !showGoalDeepdive && !showTour}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
