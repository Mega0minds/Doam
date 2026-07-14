'use client';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LandingControls() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
        <div className="w-16 h-9 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pidgin' : 'en');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative overflow-hidden transition-all duration-300 hover:bg-primary/10"
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Sun className={`h-4 w-4 absolute transition-all duration-300 ${
          resolvedTheme === 'dark' 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
        }`} />
        <Moon className={`h-4 w-4 absolute transition-all duration-300 ${
          resolvedTheme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`} />
      </Button>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="gap-1.5 text-xs font-medium hover:bg-primary/10 transition-all duration-300"
        aria-label={language === 'en' ? 'Switch to Pidgin' : 'Switch to English'}
      >
        <Languages className="h-3.5 w-3.5" />
        <span className="uppercase tracking-wide">
          {language === 'en' ? 'EN' : 'PG'}
        </span>
      </Button>
    </div>
  );
}
