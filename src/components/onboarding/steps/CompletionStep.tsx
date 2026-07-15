import { ArrowRight, CalendarDays, ListTodo, Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const { t } = useLanguage();

  const nextSteps = [
    { icon: ListTodo,     label: 'Add your tasks',          sub: 'Drop everything on your plate' },
    { icon: CalendarDays, label: 'Generate your schedule',  sub: 'AI maps tasks to your energy' },
    { icon: Zap,          label: 'Work at your best',       sub: 'Right task, right time' },
    { icon: TrendingUp,   label: 'Track your progress',     sub: 'See goals move forward' },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-7 py-2">

      {/* Animated checkmark */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, hsl(217 91% 55% / 0.25) 0%, transparent 70%)',
          }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_hsl(217_91%_55%/0.5)]">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        {/* Orbiting dot */}
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center shadow-[0_0_12px_hsl(217_91%_60%/0.8)]">
          <span className="text-[10px] text-white font-bold">✦</span>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          You're all set!
        </h2>
        <p className="text-white/55 text-sm max-w-xs mx-auto leading-relaxed">
          Your profile is ready. DoAm now knows enough to start planning your days around what matters most to you.
        </p>
      </div>

      {/* Next steps grid */}
      <div className="w-full grid grid-cols-2 gap-2">
        {nextSteps.map(({ icon: Icon, label, sub }, i) => (
          <div
            key={i}
            className="flex flex-col items-start gap-2 p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
              <Icon className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85 leading-tight">{label}</p>
              <p className="text-[11px] text-white/35 mt-0.5 leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onComplete}
        className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_24px_hsl(217_91%_55%/0.40)] transition-all"
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-[11px] text-white/25">
        You can update all of this anytime in Settings
      </p>
    </div>
  );
}
