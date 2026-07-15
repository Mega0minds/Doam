'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Target,
  Calendar,
  Clock,
  Brain,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Moon,
  RefreshCw,
  ChevronDown,
  Lightbulb,
  Users,
  Sparkles,
  Mail,
  Loader2,
  ClipboardList,
  Wind,
  Compass,
} from "lucide-react";
import tobiMascotImg from "@/assets/tobi-mascot.png";
import { LandingControls } from "@/components/LandingControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import TypewriterHero from "@/components/TypewriterHero";
import FloatingParticles from "@/components/FloatingParticles";
import { TobiMascot } from "@/components/TobiMascot";
import { AuthModal } from "@/components/AuthModal";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
    <Sparkles className="w-3 h-3" />
    {children}
  </div>
);

const Index = () => {
  const { t } = useLanguage();

  type SplashPhase = "enter" | "shake" | "fly" | "done";
  const [splashPhase, setSplashPhase] = useState<SplashPhase>("enter");
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"signup" | "signin">("signup");

  // Splash sequence
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => setSplashPhase("shake"), 700);
    const t2 = setTimeout(() => setSplashPhase("fly"), 1750);
    const t3 = setTimeout(() => {
      setSplashPhase("done");
      document.body.style.overflow = "";
    }, 2600);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      document.body.style.overflow = "";
    };
  }, []);

  // Scroll reveal — starts after splash finishes
  useEffect(() => {
    if (splashPhase !== "done") return;
    const els = document.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [splashPhase]);

  const heroReady = splashPhase === "done";
  const hs = (delay: number): React.CSSProperties =>
    heroReady ? { animation: `hero-rise 0.75s ${delay}ms cubic-bezier(0.4,0,0.2,1) both` } : { opacity: 0 };

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const openSignUp = () => { setAuthTab("signup"); setShowAuth(true); };
  const openSignIn = () => { setAuthTab("signin"); setShowAuth(true); };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openSignUp();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const flowSteps = [
    { icon: Users, label: t.flowIdentity, desc: t.flowIdentityDesc },
    { icon: Clock, label: t.flowTime, desc: t.flowTimeDesc },
    { icon: Target, label: t.flowActions, desc: t.flowActionsDesc },
    { icon: Calendar, label: t.flowSchedule, desc: t.flowScheduleDesc },
  ];

  const howItWorksSteps = [
    { num: "1", title: t.howStep1Title, desc: t.howStep1Desc },
    { num: "2", title: t.howStep2Title, desc: t.howStep2Desc },
    { num: "3", title: t.howStep3Title, desc: t.howStep3Desc },
    { num: "4", title: t.howStep4Title, desc: t.howStep4Desc },
  ];

  const features = [
    { icon: Target, title: t.featureGoalDriven, desc: t.featureGoalDrivenDesc },
    { icon: Zap, title: t.featureEnergyAware, desc: t.featureEnergyAwareDesc },
    { icon: Shield, title: t.featureProtectedTime, desc: t.featureProtectedTimeDesc },
    { icon: RefreshCw, title: t.featureAdaptive, desc: t.featureAdaptiveDesc },
  ];

  const stats = [
    { value: "500+", label: "Students active" },
    { value: "3×", label: "More tasks completed" },
    { value: "< 2 min", label: "To generate your day" },
    { value: "Free", label: "To get started" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AuthModal open={showAuth} defaultTab={authTab} onClose={() => setShowAuth(false)} initialEmail={email} />

      {/* ── Splash Screen ── */}
      {splashPhase !== "done" && (
        <div
          className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-5"
          style={splashPhase === "fly" ? { animation: "splash-bg-exit 0.65s 0.2s ease both", pointerEvents: "none" } : undefined}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,hsl(var(--primary)/0.14)_0%,transparent_70%)] pointer-events-none" />
          {/* Tobi mascot as splash clock */}
          <div
            style={
              splashPhase === "enter"
                ? { animation: "splash-clock-enter 0.75s cubic-bezier(0.34,1.56,0.64,1) both" }
                : splashPhase === "shake"
                ? { animation: "splash-clock-shake 1s ease both" }
                : { animation: "splash-clock-fly 0.7s cubic-bezier(0.4,0,0.8,1) both", pointerEvents: "none" }
            }
          >
            <img src={tobiMascotImg.src} alt="" className="w-36 h-36 object-contain drop-shadow-[0_8px_32px_hsl(217_91%_55%/0.35)]" />
          </div>
          {/* Brand label */}
          <div
            style={
              splashPhase === "fly"
                ? { animation: "splash-label-exit 0.28s ease both" }
                : { animation: "splash-label-enter 0.55s 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }
            }
          >
            <span className="font-display text-3xl font-bold text-foreground tracking-tight">DoAm</span>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-display text-2xl font-bold shimmer-brand">DoAm</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LandingControls />
            <div className="hidden sm:block h-5 w-px bg-border" />
            <Button
              variant="ghost"
              onClick={() => openSignIn()}
              className="text-muted-foreground hover:text-foreground text-sm hidden sm:inline-flex"
            >
              {t.signIn}
            </Button>
            <Button
              onClick={() => openSignUp()}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-sm"
            >
              {t.getStarted}
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-0 px-4 sm:px-6 lg:px-8 gradient-hero overflow-x-hidden">
        {/* Drifting orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="orb-a absolute top-10 left-[15%] w-[520px] h-[520px] rounded-full bg-primary/8 blur-[110px]" />
          <div className="orb-b absolute top-32 right-[10%] w-[420px] h-[420px] rounded-full bg-sky-400/6 blur-[90px]" />
          <div className="orb-c absolute bottom-0 left-[40%] w-[360px] h-[360px] rounded-full bg-indigo-400/5 blur-[100px]" />
        </div>
        <FloatingParticles />

        <div className="relative max-w-6xl mx-auto">
          {/* Two-column layout on lg+ */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              <div style={hs(0)} className="mb-6">
                {heroReady
                  ? <TypewriterHero />
                  : <div className="min-h-[4.5rem] sm:min-h-[5.5rem] lg:min-h-[6.5rem]" />}
              </div>

              <p style={hs(140)} className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t.heroDescription}
              </p>

              <div style={hs(260)} className="flex items-center gap-3 justify-center lg:justify-start mb-8">
                <div className="flex -space-x-2">
                  {[
                    { initial: "A", bg: "hsl(217 91% 55%)" },
                    { initial: "K", bg: "hsl(199 89% 48%)" },
                    { initial: "T", bg: "hsl(173 80% 40%)" },
                    { initial: "M", bg: "hsl(142 76% 36%)" },
                    { initial: "J", bg: "hsl(280 70% 55%)" },
                  ].map(({ initial, bg }) => (
                    <div
                      key={initial}
                      style={{ backgroundColor: bg }}
                      className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[11px] font-bold text-white"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Join <span className="font-semibold text-foreground">500+</span> students already getting things done
                </p>
              </div>

              {/* Email + Google CTA */}
              <form onSubmit={handleEmailSubmit} style={hs(360)} className="w-full">
                <div className="flex flex-col gap-2 w-full max-w-md mx-auto lg:mx-0">
                  {/* Email input — full width */}
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  {/* Buttons row */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      className="btn-shine flex-1 h-12 bg-foreground hover:bg-foreground/90 text-background font-semibold text-sm rounded-xl"
                    >
                      Get Started
                    </Button>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      title="Continue with Google"
                      className="w-12 h-12 rounded-xl border border-border bg-card hover:bg-accent flex items-center justify-center shrink-0 shadow-sm transition-all hover:border-primary/30"
                    >
                      {googleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <button
                style={hs(450)}
                onClick={scrollToHowItWorks}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 mx-auto lg:mx-0"
              >
                {t.seeHowItWorks}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Stat pills — under CTAs on left */}
              <div style={hs(500)} className="flex gap-2 flex-wrap justify-center lg:justify-start mt-6">
                <span className="px-3 py-1 rounded-full bg-card border border-border/50 text-xs font-medium text-foreground shadow-sm">
                  Under 2 min setup
                </span>
                <span className="px-3 py-1 rounded-full bg-card border border-border/50 text-xs font-medium text-foreground shadow-sm">
                  Goal-driven AI
                </span>
                <span className="px-3 py-1 rounded-full bg-card border border-border/50 text-xs font-medium text-foreground shadow-sm">
                  Free to start
                </span>
              </div>
            </div>

            {/* Right — Tobi mascot (hidden on mobile, shown on lg+) */}
            <div style={hs(180)} className="hidden lg:flex flex-shrink-0 flex-col items-center">

              {/* Speech bubble — in flow, above Tobi */}
              <div className="bubble-in relative self-start ml-12 mb-2 bg-card border border-border/60 shadow-card rounded-2xl rounded-bl-none px-4 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap">
                Let's plan your day
                <span className="absolute -bottom-2.5 left-5 w-3 h-3 bg-card border-r border-b border-border/60 rotate-45 block" />
              </div>

              {/* Tobi with glow */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-[460px] h-[460px] rounded-full bg-primary/10 glow-ring blur-2xl" />
                <div className="absolute w-[340px] h-[340px] rounded-full bg-primary/15 glow-ring blur-xl" />
                <div className="relative float-bob">
                  <TobiMascot size={400} framed={false} waving />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App mockup — full width below hero */}
        <div className="relative max-w-2xl mx-auto mt-12 sm:mt-16">
          <div className="absolute inset-x-8 top-4 bottom-0 bg-primary/10 blur-3xl rounded-3xl -z-10" />

          <div className="bg-card rounded-2xl shadow-elevated border border-border/40 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-muted/60 border-b border-border/40 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 bg-background/70 rounded-md px-3 py-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Tuesday, December 24</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.today}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{t.protectedSleep}</span>
                    <Shield className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">11:00 PM – 7:00 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Chemistry Lecture</span>
                    <Shield className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">9:00 AM – 10:30 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent border border-primary/25 shadow-soft">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Review Lecture Notes</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-accent-foreground font-semibold whitespace-nowrap">
                      {t.peakFocus}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">10:45 AM – 11:30 AM · Academic Goal</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">Rest & Recharge</span>
                  <div className="text-xs text-muted-foreground">12:00 PM – 12:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-y border-border/40">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className={`reveal stagger-${i + 1} text-center`}>
              <div className="font-display text-3xl font-bold text-foreground mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-10 sm:mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t.soundFamiliar}
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              {t.mostToolsFail}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: ClipboardList, title: t.problem1Title, desc: t.problem1Desc, stagger: "stagger-1" },
              { icon: Wind,          title: t.problem2Title, desc: t.problem2Desc, stagger: "stagger-2" },
              { icon: Compass,       title: t.problem3Title, desc: t.problem3Desc, stagger: "stagger-3" },
            ].map((p) => (
              <div
                key={p.stagger}
                className={`reveal ${p.stagger} group bg-card rounded-2xl p-6 border border-border/50 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300`}
              >
                <p.icon className="w-5 h-5 text-muted-foreground mb-5" />
                <h3 className="font-display text-base font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="reveal mb-10 sm:mb-14 text-center lg:text-left">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t.solutionTitle}
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto lg:mx-0">
              {t.solutionDesc}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left — vertical timeline */}
            <div>
              {[
                { num: "01", tag: flowSteps[0].label, icon: flowSteps[0].icon, title: t.step1Title, desc: t.step1Desc },
                { num: "02", tag: flowSteps[1].label, icon: flowSteps[1].icon, title: t.step2Title, desc: t.step2Desc },
                { num: "03", tag: flowSteps[2].label, icon: flowSteps[2].icon, title: t.step3Title, desc: t.step3Desc },
                { num: "04", tag: flowSteps[3].label, icon: flowSteps[3].icon, title: t.step4Title, desc: t.step4Desc },
              ].map((s, i, arr) => (
                <div key={s.num} className={`reveal stagger-${Math.min(i + 1, 4)} relative flex gap-6`}>
                  {i < arr.length - 1 && (
                    <div className="absolute left-[17px] top-9 bottom-0 w-px bg-border/50" />
                  )}
                  <div className="w-9 h-9 rounded-full border border-border/70 bg-background flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wide">{s.num}</span>
                  </div>
                  <div className="pb-10 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-xs text-primary/70 font-medium tracking-wide uppercase">{s.tag}</span>
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — app mockup */}
            <div className="reveal-right lg:sticky lg:top-24">
              <div className="relative">
                <div className="absolute inset-x-6 top-4 bottom-0 bg-primary/8 blur-3xl rounded-3xl -z-10" />
                <div className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-elevated">

                  {/* Card header */}
                  <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Your profile</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Tuesday</span>
                  </div>

                  {/* Profile snapshot */}
                  <div className="px-5 py-4 border-b border-border/30 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Graduate with honours</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Run 3× a week</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">Peak energy: <span className="text-foreground font-medium">9 AM – 12 PM</span></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">Protected: <span className="text-foreground font-medium">Sleep · Classes · Meals</span></span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="px-5 py-2.5 flex items-center gap-3 bg-primary/5">
                    <div className="flex-1 h-px bg-primary/15" />
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Sparkles className="w-3 h-3" />
                      Generated schedule
                    </div>
                    <div className="flex-1 h-px bg-primary/15" />
                  </div>

                  {/* Schedule */}
                  <div className="px-5 py-4 space-y-2">
                    {[
                      { time: "9:00 – 10:30", label: "Chemistry Lecture", tag: "Class", accent: false, muted: true },
                      { time: "10:45 – 12:00", label: "Review Lecture Notes", tag: "Peak focus", accent: true, muted: false },
                      { time: "12:00 – 12:30", label: "Lunch & rest", tag: null, accent: false, muted: true },
                      { time: "3:00 – 4:00", label: "30-min run · gym", tag: "Goal", accent: false, muted: false },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`flex items-center gap-3 p-2.5 rounded-xl ${row.accent ? "bg-accent border border-primary/20" : row.muted ? "bg-muted/40" : "bg-muted/20"}`}
                      >
                        <span className="text-[10px] text-muted-foreground font-mono w-20 shrink-0">{row.time}</span>
                        <span className="text-xs font-medium text-foreground flex-1">{row.label}</span>
                        {row.tag && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${row.accent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {row.tag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Core features ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-10 sm:mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {t.calendarTitle}
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              {t.calendarDesc}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`reveal stagger-${i + 1} group bg-card rounded-2xl p-4 sm:p-6 border border-border/50 shadow-card hover:shadow-elevated hover:border-primary/20 hover:-translate-y-1.5 transition-all duration-300 text-center`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-all duration-300">
                  <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 sm:mb-2 text-xs sm:text-sm">{f.title}</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brain Dump ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="reveal-left">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                {t.brainDumpTitle}
              </h2>
              <p className="text-muted-foreground text-base mb-6 leading-relaxed">
                {t.brainDumpDesc}
              </p>
              <ul className="space-y-3">
                {[t.brainDumpBenefit1, t.brainDumpBenefit2, t.brainDumpBenefit3].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal-right bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Brain Dump</span>
              </div>
              <div className="p-5 space-y-2">
                {[
                  "Need to finish chemistry homework…",
                  "Remember to call mom on her birthday",
                  "Should probably start studying for finals",
                  "Want to start running again this week",
                ].map((line) => (
                  <p key={line} className="text-sm text-muted-foreground italic leading-relaxed">
                    "{line}"
                  </p>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-border/40 bg-primary/5">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Lightbulb className="w-4 h-4" />
                  <span>DoAm found 4 tasks to schedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-24 sm:py-36 px-4 sm:px-6 lg:px-8">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_55%,hsl(var(--primary)/0.13)_0%,transparent_70%)]" />
        {/* Edge fades */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background to-transparent" />

        <div className="reveal-scale relative max-w-xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-muted-foreground text-base mb-10 max-w-sm mx-auto leading-relaxed">
            {t.ctaDesc}
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <Button
              onClick={() => openSignUp()}
              size="lg"
              className="btn-shine cta-pulse bg-primary hover:bg-primary/90 shadow-elevated text-sm px-7 h-11"
            >
              {t.ctaButton}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              onClick={() => openSignIn()}
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground text-sm h-11 px-5"
            >
              Sign in
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" /> Free to start
            </span>
            <span className="hidden sm:block w-px h-3 bg-border/60" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" /> No credit card
            </span>
            <span className="hidden sm:block w-px h-3 bg-border/60" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary/50" /> 2 min setup
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-display text-lg font-bold shimmer-brand mb-0.5">DoAm</div>
            <p className="text-xs text-muted-foreground">{t.footerTagline}</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <button onClick={() => openSignIn()} className="hover:text-foreground transition-colors">Sign In</button>
            <button onClick={() => openSignUp()} className="hover:text-foreground transition-colors">Get Started</button>
            <span className="text-border/60">·</span>
            <span>© {new Date().getFullYear()} DoAm</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
