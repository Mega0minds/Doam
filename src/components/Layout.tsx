'use client';
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Sparkles, LogOut, Calendar, ListTodo, Menu, Target, CalendarDays, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const Layout = ({ children, hideNav = false }: LayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { avatarUrl } = useAvatarUrl(user?.id ?? null);

  const getInitial = () => {
    if (nickname && nickname.trim()) return nickname.trim().charAt(0).toUpperCase();
    return 'U';
  };

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push("/auth");
      } else {
        loadNickname(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        router.push("/auth");
      } else {
        loadNickname(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const navItems = [
    { path: "/dashboard", icon: Calendar, label: "Dashboard" },
    { path: "/goals", icon: Target, label: "Goals" },
    { path: "/tasks", icon: ListTodo, label: "Tasks" },
    { path: "/calendar", icon: CalendarDays, label: "Calendar" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo — always visible */}
            <button
              onClick={() => !hideNav && router.push("/dashboard")}
              className="flex items-center gap-2 font-display font-bold text-lg md:text-xl group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:shadow-elevated transition-smooth">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent hidden sm:inline font-bold">
                DoAm
              </span>
            </button>

            {/* Nav links — hidden during onboarding */}
            {!hideNav && (
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      onClick={() => router.push(item.path)}
                      className={cn(
                        "gap-2 transition-smooth",
                        isActive && "bg-gradient-energy-high"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <Avatar className="h-8 w-8 border border-primary/20 flex cursor-pointer" onClick={() => !hideNav && router.push("/settings")}>
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="text-xs font-bold gradient-primary text-primary-foreground">
                  {getInitial()}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>

              {/* Mobile Menu — hidden during onboarding */}
              {!hideNav && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-4 mt-8">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                          <Button
                            key={item.path}
                            variant={isActive ? "secondary" : "ghost"}
                            onClick={() => {
                              router.push(item.path);
                              setMobileMenuOpen(false);
                            }}
                            className={cn(
                              "gap-2 justify-start transition-smooth",
                              isActive && "bg-gradient-energy-high"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Button>
                        );
                      })}
                      <div className="border-t pt-4 mt-4">
                        <Button
                          variant="ghost"
                          onClick={handleSignOut}
                          className="gap-2 w-full justify-start"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;