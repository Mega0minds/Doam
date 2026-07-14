'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnergyProfileSettings } from '@/components/settings/EnergyProfileSettings';
import { CommitmentsSettings } from '@/components/settings/CommitmentsSettings';
import { GoalsSettings } from '@/components/settings/GoalsSettings';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { Zap, Clock, Target, Loader2, User, Palette, Globe, PlayCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { OnboardingTour } from '@/components/OnboardingTour';

const Settings = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleStartTour = () => {
    setShowTour(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!userId) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">{t.settingsTitle}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your profile, energy preferences, and scheduling settings.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full gradient-primary">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Profile</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{userEmail}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full" data-tour="settings-tabs">
          <TabsList className="grid w-full grid-cols-8 h-auto">
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Me</span>
            </TabsTrigger>
            <TabsTrigger value="energy" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">{t.energyProfile}</span>
              <span className="sm:hidden">Energy</span>
            </TabsTrigger>
            <TabsTrigger value="commitments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t.commitments}</span>
              <span className="sm:hidden">Time</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Target className="h-4 w-4" />
              <span>{t.goals}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t.language}</span>
              <span className="sm:hidden">Lang</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span>{t.theme}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Bell</span>
            </TabsTrigger>
            <TabsTrigger value="tour" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <PlayCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tour</span>
              <span className="sm:hidden">Tour</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings userId={userId} />
          </TabsContent>

          <TabsContent value="energy" className="mt-6">
            <EnergyProfileSettings userId={userId} />
          </TabsContent>

          <TabsContent value="commitments" className="mt-6">
            <CommitmentsSettings userId={userId} />
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <GoalsSettings userId={userId} />
          </TabsContent>

          <TabsContent value="language" className="mt-6">
            <LanguageSettings />
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <ThemeSettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings userId={userId} />
          </TabsContent>

          <TabsContent value="tour" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    {t.replayTour}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t.replayTourDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleStartTour}
                    className="gap-2 bg-gradient-primary"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {t.replayTourButton}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />
    </Layout>
  );
};

export default Settings;
