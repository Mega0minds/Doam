'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TobiMascot } from '@/components/TobiMascot';
import { useNickname } from '@/contexts/NicknameContext';

interface DynamicGreetingProps {
  className?: string;
}

export function DynamicGreeting({ className = '' }: DynamicGreetingProps) {
  const { language } = useLanguage();
  const { nickname } = useNickname();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const computeGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 17) return 'Good afternoon';
      return 'Good evening';
    };

    setGreeting(computeGreeting());
    const interval = setInterval(() => setGreeting(computeGreeting()), 60_000);
    return () => clearInterval(interval);
  }, [language]);

  const displayName = nickname || (language === 'pidgin' ? 'friend' : 'there');

  return (
    <span
      className={`inline-flex flex-row items-center justify-start gap-3 sm:gap-4 align-middle ${className}`}
    >
      {/* DoAm mascot — no white frame */}
      <span className="sm:hidden inline-flex items-center">
        <TobiMascot size={64} framed={false} waving />
      </span>
      <span className="hidden sm:inline-flex items-center">
        <TobiMascot size={76} framed={false} waving />
      </span>
      <span className="leading-tight">
        {greeting}, {displayName}!
      </span>
    </span>
  );
}
