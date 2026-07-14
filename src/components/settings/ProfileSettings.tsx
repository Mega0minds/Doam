import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, GraduationCap, Brain, X, Edit3, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { InsightsCard } from '@/components/profile/InsightsCard';
import { GoalsSnapshot } from '@/components/profile/GoalsSnapshot';
import { PatternsCard } from '@/components/profile/PatternsCard';
import { WhatWorksCard } from '@/components/profile/WhatWorksCard';
import { ImprovingTogetherCard } from '@/components/profile/ImprovingTogetherCard';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { NicknameEditor } from '@/components/settings/NicknameEditor';

interface ProfileSettingsProps {
  userId: string;
}

interface UserProfile {
  academic_level: string | null;
  field_of_study: string | null;
  long_term_aspirations: string | null;
  self_described_strengths: string[] | null;
  self_described_struggles: string[] | null;
  study_habits: string | null;
  consistency_level: string | null;
  typical_blockers: string[] | null;
  preferred_work_style: string | null;
  ai_biography: string | null;
  ai_biography_updated_at: string | null;
}

interface EnergyProfile {
  chronotype: string | null;
  wake_time: string | null;
  sleep_time: string | null;
  high_focus_start: string | null;
  high_focus_end: string | null;
  low_energy_start: string | null;
  low_energy_end: string | null;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  priority_rank: number;
  is_active: boolean;
  updated_at: string;
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');
  
  const [profile, setProfile] = useState<UserProfile>({
    academic_level: null,
    field_of_study: null,
    long_term_aspirations: null,
    self_described_strengths: [],
    self_described_struggles: [],
    study_habits: null,
    consistency_level: null,
    typical_blockers: [],
    preferred_work_style: null,
    ai_biography: null,
    ai_biography_updated_at: null
  });
  
  const [energyProfile, setEnergyProfile] = useState<EnergyProfile>({
    chronotype: null,
    wake_time: null,
    sleep_time: null,
    high_focus_start: null,
    high_focus_end: null,
    low_energy_start: null,
    low_energy_end: null
  });
  
  const [goals, setGoals] = useState<Goal[]>([]);

  const [newStrength, setNewStrength] = useState('');
  const [newStruggle, setNewStruggle] = useState('');
  const [newBlocker, setNewBlocker] = useState('');

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);

      // Fetch all data in parallel
      const [profileRes, energyRes, goalsRes] = await Promise.all([
        supabase.from('user_profiles' as any).select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('energy_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('goals').select('*').eq('user_id', userId).eq('is_active', true).order('priority_rank')
      ]);

      if (profileRes.data) {
        const data = profileRes.data as any;
        setProfile({
          academic_level: data.academic_level,
          field_of_study: data.field_of_study,
          long_term_aspirations: data.long_term_aspirations,
          self_described_strengths: data.self_described_strengths || [],
          self_described_struggles: data.self_described_struggles || [],
          study_habits: data.study_habits,
          consistency_level: data.consistency_level,
          typical_blockers: data.typical_blockers || [],
          preferred_work_style: data.preferred_work_style,
          ai_biography: data.ai_biography,
          ai_biography_updated_at: data.ai_biography_updated_at
        });
      }

      if (energyRes.data) {
        setEnergyProfile({
          chronotype: energyRes.data.chronotype,
          wake_time: energyRes.data.wake_time,
          sleep_time: energyRes.data.sleep_time,
          high_focus_start: energyRes.data.high_focus_start,
          high_focus_end: energyRes.data.high_focus_end,
          low_energy_start: energyRes.data.low_energy_start,
          low_energy_end: energyRes.data.low_energy_end
        });
      }

      if (goalsRes.data) {
        setGoals(goalsRes.data);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profile
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success(language === 'pidgin' ? 'Profile don save!' : 'Profile saved!');
      setActiveTab('overview');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(language === 'pidgin' ? 'E no save. Try again.' : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const regenerateBiography = async () => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biography');
      
      if (error) throw error;
      
      setProfile(prev => ({
        ...prev,
        ai_biography: data.biography,
        ai_biography_updated_at: new Date().toISOString()
      }));
      
      toast.success(language === 'pidgin' ? 'Biography don update!' : 'Biography updated!');
    } catch (error) {
      console.error('Error regenerating biography:', error);
      toast.error(language === 'pidgin' ? 'E no work. Try again.' : 'Failed to regenerate. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const addToArray = (field: 'self_described_strengths' | 'self_described_struggles' | 'typical_blockers', value: string) => {
    if (!value.trim()) return;
    const currentArray = profile[field] || [];
    if (!currentArray.includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const removeFromArray = (field: 'self_described_strengths' | 'self_described_struggles' | 'typical_blockers', value: string) => {
    const currentArray = profile[field] || [];
    setProfile(prev => ({
      ...prev,
      [field]: currentArray.filter(v => v !== value)
    }));
  };

  const topGoalCategories = goals
    .slice(0, 3)
    .map(g => g.category);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <AvatarUpload userId={userId} email={userEmail} />

      {/* Nickname Editor */}
      <NicknameEditor userId={userId} />

      {/* Profile Header */}
      <ProfileHeader
        email={userEmail}
        biography={profile.ai_biography}
        biographyUpdatedAt={profile.ai_biography_updated_at}
        isRegenerating={regenerating}
        onRegenerate={regenerateBiography}
      />

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {language === 'pidgin' ? 'Overview' : 'Overview'}
        </Button>
        <Button
          variant={activeTab === 'edit' ? 'default' : 'outline'}
          onClick={() => setActiveTab('edit')}
          className="gap-2"
        >
          <Edit3 className="h-4 w-4" />
          {language === 'pidgin' ? 'Edit Profile' : 'Edit Profile'}
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* How DoAm Sees You */}
          <InsightsCard
            chronotype={energyProfile.chronotype}
            workStyle={profile.preferred_work_style}
            consistencyLevel={profile.consistency_level}
            topGoalCategories={topGoalCategories}
          />

          {/* Goals Snapshot */}
          <GoalsSnapshot goals={goals} />

          {/* Patterns Card */}
          <PatternsCard
            wakeTime={energyProfile.wake_time}
            sleepTime={energyProfile.sleep_time}
            highFocusStart={energyProfile.high_focus_start}
            highFocusEnd={energyProfile.high_focus_end}
            strengths={profile.self_described_strengths || []}
            struggles={profile.self_described_struggles || []}
            blockers={profile.typical_blockers || []}
          />

          {/* What Works For You */}
          <WhatWorksCard
            chronotype={energyProfile.chronotype}
            workStyle={profile.preferred_work_style}
            highFocusStart={energyProfile.high_focus_start}
            highFocusEnd={energyProfile.high_focus_end}
            consistencyLevel={profile.consistency_level}
            strengths={profile.self_described_strengths || []}
          />

          {/* What We're Improving Together */}
          <ImprovingTogetherCard
            struggles={profile.self_described_struggles || []}
            blockers={profile.typical_blockers || []}
            consistencyLevel={profile.consistency_level}
          />
        </>
      ) : (
        <>
          {/* Identity Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {language === 'pidgin' ? 'About You' : 'Identity Overview'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'pidgin' ? 'Academic Level' : 'Academic Level'}</Label>
                  <Select
                    value={profile.academic_level || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, academic_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secondary">Secondary School</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      <SelectItem value="professional">Working Professional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'pidgin' ? 'Field of Study' : 'Field of Study'}</Label>
                  <Input
                    value={profile.field_of_study || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, field_of_study: e.target.value }))}
                    placeholder="e.g., Computer Science, Medicine..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'pidgin' ? 'Long-term Goals' : 'Long-term Aspirations'}</Label>
                <Textarea
                  value={profile.long_term_aspirations || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, long_term_aspirations: e.target.value }))}
                  placeholder={language === 'pidgin' 
                    ? "Wetin you wan achieve for life? Your big dreams..."
                    : "What do you want to achieve in life? Your big picture dreams..."}
                  rows={3}
                />
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <Label>{language === 'pidgin' ? 'Your Strengths' : 'Your Strengths'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="Add a strength..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('self_described_strengths', newStrength);
                        setNewStrength('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToArray('self_described_strengths', newStrength);
                      setNewStrength('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.self_described_strengths || []).map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {s}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromArray('self_described_strengths', s)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Struggles */}
              <div className="space-y-2">
                <Label>{language === 'pidgin' ? 'Areas You Dey Work On' : 'Areas to Improve'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newStruggle}
                    onChange={(e) => setNewStruggle(e.target.value)}
                    placeholder="Add an area..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('self_described_struggles', newStruggle);
                        setNewStruggle('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToArray('self_described_struggles', newStruggle);
                      setNewStruggle('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.self_described_struggles || []).map((s, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {s}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromArray('self_described_struggles', s)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Patterns */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {language === 'pidgin' ? 'How You Work' : 'Behavioral Patterns'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'pidgin' ? 'Study Habits' : 'Study/Work Habits'}</Label>
                <Textarea
                  value={profile.study_habits || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, study_habits: e.target.value }))}
                  placeholder={language === 'pidgin'
                    ? "How you dey study or work? Short bursts or long sessions?"
                    : "Describe how you typically study or work. Short bursts or long sessions?"}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'pidgin' ? 'Consistency Level' : 'Consistency Level'}</Label>
                  <Select
                    value={profile.consistency_level || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, consistency_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High - I stick to plans well</SelectItem>
                      <SelectItem value="medium">Medium - I'm fairly consistent</SelectItem>
                      <SelectItem value="low">Low - I struggle with consistency</SelectItem>
                      <SelectItem value="variable">Variable - Depends on the day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'pidgin' ? 'Work Style' : 'Preferred Work Style'}</Label>
                  <Select
                    value={profile.preferred_work_style || ''}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, preferred_work_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="structured">Structured - Fixed schedule</SelectItem>
                      <SelectItem value="flexible">Flexible - Loose timeframes</SelectItem>
                      <SelectItem value="deadline">Deadline-driven</SelectItem>
                      <SelectItem value="flow">Flow-based - When inspired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Blockers */}
              <div className="space-y-2">
                <Label>{language === 'pidgin' ? 'Wetin Dey Block You' : 'Typical Blockers'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBlocker}
                    onChange={(e) => setNewBlocker(e.target.value)}
                    placeholder="e.g., Fatigue, Social media, Procrastination..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('typical_blockers', newBlocker);
                        setNewBlocker('');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToArray('typical_blockers', newBlocker);
                      setNewBlocker('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.typical_blockers || []).map((b, i) => (
                    <Badge key={i} variant="destructive" className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20">
                      {b}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFromArray('typical_blockers', b)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={saveProfile} disabled={saving} className="w-full bg-gradient-primary">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {language === 'pidgin' ? 'Dey Save...' : 'Saving...'}
              </>
            ) : (
              language === 'pidgin' ? 'Save Profile' : 'Save Profile'
            )}
          </Button>
        </>
      )}
    </div>
  );
}