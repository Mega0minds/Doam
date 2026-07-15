import { ArrowRight, ShieldCheck } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-4">

      {/* Heading */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white leading-tight">
          Welcome to DoAm
        </h2>
        <p className="text-white/60 text-base max-w-xs mx-auto leading-relaxed">
          Your AI-powered planner that builds your day around your goals, your energy, and your real life.
        </p>
      </div>

      {/* Honesty message */}
      <div className="w-full rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5 text-left">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-white/75 text-sm leading-relaxed">
            To get the very best out of DoAm, be as honest as possible with your answers. The more real your input, the more accurate your schedule.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full h-13 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_24px_hsl(217_91%_55%/0.40)] transition-all"
      >
        Get Started
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
