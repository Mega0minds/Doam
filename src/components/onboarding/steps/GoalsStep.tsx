'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  GraduationCap, Heart, TrendingUp, Users, Brain, Coffee,
  ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

interface GoalsStepProps {
  userId: string;
  onNext: (goalsData: Record<string, any>) => void;
  onBack: () => void;
  savedData?: Record<string, any>;
}

type GoalCategory = 'academic_career' | 'health' | 'personal_growth' | 'social' | 'spiritual_mental' | 'rest_recreation';

interface GoalData {
  category: GoalCategory;
  title: string;
  description: string;
  targetDate: string;
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  academic_career:  'from-blue-500 to-indigo-600',
  health:           'from-emerald-500 to-teal-600',
  personal_growth:  'from-violet-500 to-purple-600',
  social:           'from-amber-500 to-orange-500',
  spiritual_mental: 'from-sky-400 to-cyan-500',
  rest_recreation:  'from-rose-400 to-pink-500',
};

const CATEGORY_BORDER: Record<GoalCategory, string> = {
  academic_career:  'border-blue-500/50',
  health:           'border-emerald-500/50',
  personal_growth:  'border-violet-500/50',
  social:           'border-amber-500/50',
  spiritual_mental: 'border-sky-400/50',
  rest_recreation:  'border-rose-400/50',
};

export function GoalsStep({ userId, onNext, onBack, savedData }: GoalsStepProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<'select' | 'fill'>('select');
  const [fillIndex, setFillIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [showTargetDate, setShowTargetDate] = useState(false);

  const [nickname, setNickname] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const categories: {
    key: GoalCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    placeholder: string;
  }[] = [
    { key: 'academic_career',  label: t.academicCareer,   icon: GraduationCap, description: t.academicCareerDesc,   placeholder: 'e.g., Graduate with first class honours' },
    { key: 'health',           label: t.health,            icon: Heart,         description: t.healthDesc,           placeholder: 'e.g., Run 5km three times a week' },
    { key: 'personal_growth',  label: t.personalGrowth,   icon: TrendingUp,    description: t.personalGrowthDesc,   placeholder: 'e.g., Read 12 books this year' },
    { key: 'social',           label: t.social,            icon: Users,         description: t.socialDesc,           placeholder: 'e.g., Stay connected with family weekly' },
    { key: 'spiritual_mental', label: t.spiritualMental,  icon: Brain,         description: t.spiritualMentalDesc,  placeholder: 'e.g., Meditate 10 minutes every morning' },
    { key: 'rest_recreation',  label: t.restRecreation,   icon: Coffee,        description: t.restRecreationDesc,   placeholder: 'e.g., Take one full rest day each week' },
  ];

  const [selectedCategories, setSelectedCategories] = useState<GoalCategory[]>(
    savedData?.selectedCategories || []
  );

  const [goals, setGoals] = useState<Record<GoalCategory, GoalData>>(() => {
    if (savedData?.goals) return savedData.goals;
    const initial = {} as Record<GoalCategory, GoalData>;
    categories.forEach(cat => {
      initial[cat.key] = { category: cat.key, title: '', description: '', targetDate: '' };
    });
    return initial;
  });

  // Pre-fill nickname if returning user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('nickname' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const existing = (data as any)?.nickname;
      if (existing) setNickname(existing);
    })();
  }, []);

  const toggleCategory = (key: GoalCategory) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectContinue = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      sonnerToast.error('Please tell us what to call you');
      return;
    }
    setNicknameSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, nickname: trimmed } as any, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (e: any) {
      sonnerToast.error(e.message || 'Could not save your name');
      setNicknameSaving(false);
      return;
    }
    setNicknameSaving(false);

    if (selectedCategories.length === 0) {
      // No goals selected — skip to next main step
      onNext({ goals: {}, selectedCategories: [], priorityOrder: [] });
      return;
    }
    setFillIndex(0);
    setPhase('fill');
  };

  const activeCats = categories.filter(c => selectedCategories.includes(c.key));
  const currentCategory = activeCats[fillIndex];

  const goToFillIndex = (idx: number) => {
    setFillIndex(idx);
    setShowDescription(false);
    setShowTargetDate(false);
  };
  const isLastFill = fillIndex === activeCats.length - 1;

  const updateGoal = (field: keyof GoalData, value: string) => {
    if (!currentCategory) return;
    setGoals(prev => ({
      ...prev,
      [currentCategory.key]: { ...prev[currentCategory.key], [field]: value },
    }));
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      const goalsToInsert = activeCats
        .map(c => goals[c.key])
        .filter(g => g.title.trim())
        .map(g => ({
          user_id: userId,
          category: g.category,
          title: g.title,
          description: g.description || null,
          target_date: g.targetDate || null,
          priority_rank: selectedCategories.indexOf(g.category) + 1,
        }));

      if (goalsToInsert.length > 0) {
        const { error } = await supabase.from('goals').insert(goalsToInsert);
        if (error) throw error;
      }

      toast({
        title: 'Goals saved!',
        description: `${goalsToInsert.length} goal${goalsToInsert.length !== 1 ? 's' : ''} created.`,
      });
      onNext({ goals, selectedCategories, priorityOrder: selectedCategories });
    } catch (error: unknown) {
      toast({
        title: 'Error saving goals',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ── PHASE: SELECT ── */
  if (phase === 'select') {
    return (
      <div className="flex flex-col gap-6">

        {/* Nickname */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white/80">
            What should we call you?
          </label>
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSelectContinue()}
            placeholder="e.g. Alex, Sam, Chidi"
            maxLength={40}
            autoFocus
            autoComplete="off"
            className="h-12 bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/30 rounded-xl focus-visible:ring-primary/50 focus-visible:border-primary/40"
          />
        </div>

        {/* Category picker */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-white/80">
              Which areas do you want to set goals in?
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Tap to select — you can skip any you don't care about right now
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const selected = selectedCategories.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                    selected
                      ? `${CATEGORY_BORDER[cat.key]} bg-white/[0.08]`
                      : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white/70" />
                  </div>
                  <span className="text-xs font-medium text-white/80 leading-tight flex-1">
                    {cat.label}
                  </span>
                  {selected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSelectContinue}
            disabled={nicknameSaving}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-[0_0_20px_hsl(217_91%_55%/0.35)] hover:opacity-90 transition-all disabled:opacity-60"
          >
            {nicknameSaving ? 'Saving…' : selectedCategories.length > 0 ? `Continue (${selectedCategories.length})` : 'Skip goals'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── PHASE: FILL selected categories ── */
  const currentGoal = goals[currentCategory.key];
  const Icon = currentCategory.icon;

  return (
    <div className="flex flex-col gap-6">

      {/* Segment progress — only selected */}
      <div className="flex gap-1.5">
        {activeCats.map((cat, idx) => (
          <button
            key={cat.key}
            onClick={() => goToFillIndex(idx)}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx < fillIndex
                ? 'bg-primary/60'
                : idx === fillIndex
                ? 'bg-primary'
                : goals[cat.key].title
                ? 'bg-primary/40'
                : 'bg-white/10'
            }`}
            aria-label={cat.label}
          />
        ))}
      </div>

      {/* Category hero */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[currentCategory.key]} opacity-30 blur-2xl scale-150`} />
          <Icon className="w-10 h-10 relative z-10 text-white/90" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{currentCategory.label}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{currentCategory.description}</p>
        </div>
      </div>

      {/* Goal input */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your goal
          </label>
          <Input
            placeholder={currentCategory.placeholder}
            value={currentGoal.title}
            onChange={e => updateGoal('title', e.target.value)}
            className="h-11 bg-white/[0.06] border-white/[0.1] rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/50 focus-visible:border-primary/40"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          {!showTargetDate && (
            <button
              onClick={() => setShowTargetDate(true)}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              + Add target date
            </button>
          )}
          {!showDescription && (
            <button
              onClick={() => setShowDescription(true)}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              + Add details
            </button>
          )}
        </div>

        {showTargetDate && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target date
            </label>
            <Input
              type="date"
              value={currentGoal.targetDate}
              onChange={e => updateGoal('targetDate', e.target.value)}
              className="h-11 bg-white/[0.06] border-white/[0.1] rounded-xl text-sm focus-visible:ring-primary/50 focus-visible:border-primary/40"
            />
          </div>
        )}

        {showDescription && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</label>
            <Textarea
              placeholder="Add more context about this goal…"
              value={currentGoal.description}
              onChange={e => updateGoal('description', e.target.value)}
              rows={2}
              className="bg-white/[0.06] border-white/[0.1] rounded-xl text-sm resize-none placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => fillIndex === 0 ? setPhase('select') : goToFillIndex(fillIndex - 1)}
          className="flex items-center gap-1.5 h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1" />
        {isLastFill ? (
          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-[0_0_20px_hsl(217_91%_55%/0.35)] hover:opacity-90 transition-all disabled:opacity-60"
          >
            {saving ? 'Saving…' : t.saveAndContinue}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => goToFillIndex(fillIndex + 1)}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-[0_0_20px_hsl(217_91%_55%/0.35)] hover:opacity-90 transition-all"
          >
            {currentGoal.title.trim() ? 'Next' : 'Skip'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
