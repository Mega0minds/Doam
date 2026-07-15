'use client';
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  LogOut, ListTodo, Target, CalendarDays,
  Settings, Menu, Bell, Search, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const menuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/goals",     icon: Target,          label: "Goals" },
  { path: "/tasks",     icon: ListTodo,        label: "Tasks" },
  { path: "/calendar",  icon: CalendarDays,    label: "Calendar" },
];

const generalItems = [
  { path: "/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({
  pathname,
  onNavigate,
  onSignOut,
  nickname,
  userEmail,
  avatarUrl,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  nickname: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6">
        <button
          onClick={() => onNavigate("/dashboard")}
          className="flex items-center group"
        >
          <span className="font-display font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
            DoAm
          </span>
        </button>
      </div>

      {/* MENU section */}
      <div className="px-3 flex-1">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 px-2 mb-2">
          Menu
        </p>
        <nav className="space-y-0.5">
          {menuItems.map(({ path, icon: Icon, label }) => {
            const isActive = pathname === path;
            return (
              <button
                key={path}
                onClick={() => onNavigate(path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                )}
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* GENERAL section */}
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 px-2 mt-6 mb-2">
          General
        </p>
        <nav className="space-y-0.5">
          {generalItems.map(({ path, icon: Icon, label }) => {
            const isActive = pathname === path;
            return (
              <button
                key={path}
                onClick={() => onNavigate(path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                )}
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground")} />
                {label}
              </button>
            );
          })}

          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 shrink-0 text-muted-foreground/70 group-hover:text-foreground" />
            Logout
          </button>
        </nav>
      </div>

      {/* User profile at bottom */}
      <div className="p-3 mt-4 border-t border-border/50">
        <button
          onClick={() => onNavigate("/settings")}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-all duration-150"
        >
          <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="text-xs font-bold bg-gradient-primary text-white">
              {nickname ? nickname.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {nickname || "You"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

const Layout = ({ children, hideNav = false }: LayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { avatarUrl } = useAvatarUrl(user?.id ?? null);

  useEffect(() => {
    const loadNickname = async (uid: string) => {
      const { data } = await supabase
        .from('user_profiles')
        .select('nickname' as any)
        .eq('user_id', uid)
        .maybeSingle();
      const n = (data as any)?.nickname;
      setNickname(n && typeof n === 'string' ? n : null);
    };

    const saveGoogleToken = async (session: any) => {
      const providerToken = session?.provider_token;
      const refreshToken = session?.provider_refresh_token;
      const userId = session?.user?.id;
      const provider = session?.user?.app_metadata?.provider;

      if (provider !== 'google' || !providerToken || !userId) return;

      // expires_in from Google is 3600s; we don't get it here so default 55 min
      const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();

      await supabase.from('google_tokens' as any).upsert(
        {
          user_id: userId,
          access_token: providerToken,
          ...(refreshToken ? { refresh_token: refreshToken } : {}),
          expires_at: expiresAt,
        },
        { onConflict: 'user_id' }
      );
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push("/");
      else {
        loadNickname(session.user.id);
        saveGoogleToken(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) router.push("/");
      else {
        loadNickname(session.user.id);
        saveGoogleToken(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const currentPageLabel =
    [...menuItems, ...generalItems].find((i) => i.path === pathname)?.label ?? "DoAm";

  if (!user) return null;

  /* ── Onboarding: plain centred layout, no chrome ── */
  if (hideNav) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur-sm">
        <SidebarContent
          pathname={pathname}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          nickname={nickname}
          userEmail={user.email ?? null}
          avatarUrl={avatarUrl}
        />
      </aside>

      {/* ── Right column: topbar + content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header className="h-16 shrink-0 flex items-center gap-4 px-5 border-b border-border/60 bg-card/40 backdrop-blur-sm">

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SidebarContent
                pathname={pathname}
                onNavigate={handleNavigate}
                onSignOut={handleSignOut}
                nickname={nickname}
                userEmail={user.email ?? null}
                avatarUrl={avatarUrl}
              />
            </SheetContent>
          </Sheet>

          {/* Page title (mobile) / Search (desktop) */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {/* Mobile: current page name */}
            <span className="md:hidden font-display font-bold text-base truncate">
              {currentPageLabel}
            </span>

            {/* Desktop: search bar */}
            <div className="hidden md:flex items-center gap-2 bg-muted/60 border border-border/50 rounded-xl px-3 py-2 w-64 lg:w-80 hover:border-primary/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search tasks, goals…"
                className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground/60"
              />
              <kbd className="hidden lg:inline text-[10px] text-muted-foreground/50 border border-border/50 rounded px-1 py-0.5 font-mono shrink-0">
                ⌘F
              </kbd>
            </div>
          </div>

          {/* Right side: bell + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150">
              <Bell className="w-4 h-4" />
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted transition-all duration-150"
            >
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="text-xs font-bold bg-gradient-primary text-white">
                  {nickname ? nickname.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {nickname || "You"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
                  {user.email}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
