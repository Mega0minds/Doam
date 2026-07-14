'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Loader2, Eye, EyeOff, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Tab = "signup" | "signin";

interface AuthModalProps {
  open: boolean;
  defaultTab?: Tab;
  onClose: () => void;
}

const COUNTRY_CODES = [
  { code: "+1",   flag: "🇺🇸", abbr: "US" },
  { code: "+44",  flag: "🇬🇧", abbr: "GB" },
  { code: "+234", flag: "🇳🇬", abbr: "NG" },
  { code: "+91",  flag: "🇮🇳", abbr: "IN" },
  { code: "+33",  flag: "🇫🇷", abbr: "FR" },
  { code: "+49",  flag: "🇩🇪", abbr: "DE" },
  { code: "+61",  flag: "🇦🇺", abbr: "AU" },
  { code: "+27",  flag: "🇿🇦", abbr: "ZA" },
];

// brand primary ≈ hsl(217 91% 55%)
const PRIMARY       = "hsl(217,91%,55%)";
const PRIMARY_DIM   = "hsla(217,91%,55%,0.18)";
const PRIMARY_BORDER= "hsla(217,91%,55%,0.55)";

const FIELD: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "0 14px",
  height: "48px",
  transition: "border-color 0.2s",
};

const INPUT: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: "14px",
  color: "#fff",
  minWidth: 0,
};

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
  </svg>
);

/* Reusable field wrapper — handles focus border highlight */
const Field = ({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) => (
  <div
    style={{
      ...FIELD,
      borderColor: focused ? PRIMARY_BORDER : "rgba(255,255,255,0.10)",
      boxShadow: focused ? `0 0 0 3px ${PRIMARY_DIM}` : "none",
    }}
  >
    {children}
  </div>
);

export const AuthModal = ({ open, defaultTab = "signup", onClose }: AuthModalProps) => {
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab]                       = useState<Tab>(defaultTab);
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [phone, setPhone]                   = useState("");
  const [countryCode, setCountryCode]       = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCP]      = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [googleLoading, setGoogleLoading]   = useState(false);

  // focused field tracking for ring highlight
  const [focusedField, setFocusedField]     = useState<string | null>(null);

  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) router.replace("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail("");
    setPassword(""); setPhone(""); setShowPassword(false); setFocusedField(null);
  };

  const switchTab = (t: Tab) => { setTab(t); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              phone: phone ? `${countryCode.code}${phone}` : undefined,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a confirmation link." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  if (!open) return null;

  const iconColor = "rgba(255,255,255,0.38)";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          background: "rgba(14, 16, 22, 0.94)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          animation: "auth-modal-in 0.28s cubic-bezier(0.34,1.4,0.64,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle brand glow at top */}
        <div
          className="absolute inset-x-0 top-0 h-40 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -10%, hsla(217,91%,55%,0.18) 0%, transparent 70%)`,
          }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        <div className="relative p-6 sm:p-7">
          {/* Tab toggle */}
          <div
            className="inline-flex items-center rounded-full p-[3px] mb-6"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {(["signup", "signin"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  tab === t
                    ? { background: PRIMARY, color: "#fff", boxShadow: `0 2px 12px hsla(217,91%,55%,0.40)` }
                    : { color: "rgba(255,255,255,0.42)" }
                }
              >
                {t === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          {/* Title */}
          <h2 className="font-bold text-[22px] sm:text-2xl text-white mb-5">
            {tab === "signup" ? "Create an account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Name row */}
            {tab === "signup" && (
              <div className="flex gap-2.5">
                <Field focused={focusedField === "firstName"}>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="First name"
                    style={{ ...INPUT }}
                    className="placeholder-white/30"
                  />
                </Field>
                <Field focused={focusedField === "lastName"}>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Last name"
                    style={{ ...INPUT }}
                    className="placeholder-white/30"
                  />
                </Field>
              </div>
            )}

            {/* Email */}
            <Field focused={focusedField === "email"}>
              <Mail className="w-4 h-4 shrink-0" style={{ color: iconColor }} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your email"
                style={{ ...INPUT }}
                className="placeholder-white/30"
              />
            </Field>

            {/* Password */}
            <Field focused={focusedField === "password"}>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                style={{ ...INPUT }}
                className="placeholder-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 transition-colors"
                style={{ color: iconColor }}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            {/* Phone */}
            {tab === "signup" && (
              <div className="relative">
                <div
                  style={{
                    ...FIELD,
                    padding: 0,
                    borderColor: focusedField === "phone" ? PRIMARY_BORDER : "rgba(255,255,255,0.10)",
                    boxShadow: focusedField === "phone" ? `0 0 0 3px ${PRIMARY_DIM}` : "none",
                  }}
                >
                  {/* Country picker trigger */}
                  <button
                    type="button"
                    onClick={() => setShowCP((v) => !v)}
                    className="flex items-center gap-1.5 h-full px-3 shrink-0 transition-colors hover:bg-white/05"
                    style={{ borderRight: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <span className="text-[17px] leading-none">{countryCode.flag}</span>
                    <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                  </button>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={`${countryCode.code} 000 000 0000`}
                    style={{ ...INPUT, padding: "0 14px" }}
                    className="placeholder-white/30"
                  />
                </div>

                {/* Country dropdown */}
                {showCountryPicker && (
                  <div
                    className="absolute top-[calc(100%+6px)] left-0 z-20 w-48 rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      background: "rgba(18,20,28,0.98)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <button
                        key={c.abbr}
                        type="button"
                        onClick={() => { setCountryCode(c); setShowCP(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/08 transition-colors"
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="font-medium">{c.abbr}</span>
                        <span className="ml-auto text-white/35 text-xs">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-1"
              style={{
                background: PRIMARY,
                color: "#fff",
                boxShadow: `0 4px 20px hsla(217,91%,55%,0.38)`,
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === "signup" ? "Create an account" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
            <span className="text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap" style={{ color: "rgba(255,255,255,0.30)" }}>
              or continue with
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 font-medium text-sm text-white/80 transition-all hover:bg-white/12 disabled:opacity-60"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              {googleLoading
                ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                : <GoogleIcon />}
              <span className="hidden xs:inline">Google</span>
            </button>
            <button
              type="button"
              className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 font-medium text-sm text-white/80 transition-all hover:bg-white/12"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <AppleIcon />
              <span className="hidden xs:inline">Apple</span>
            </button>
          </div>

          {/* Terms */}
          <p className="text-center text-[11px] mt-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            By creating an account, you agree to our{" "}
            <span
              className="underline cursor-pointer transition-colors hover:text-white/60"
              style={{ color: "rgba(255,255,255,0.46)" }}
            >
              Terms & Service
            </span>
          </p>
        </div>
      </div>

      <style>{`
        .placeholder-white\\/30::placeholder { color: rgba(255,255,255,0.30); }
        @keyframes auth-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 640px) {
          @keyframes auth-modal-in {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
};
