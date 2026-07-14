// Rotating motivational messages used for in-app toasts.
// Picks a new message each call (never the same as the previous one in this session).

export type MotivationLang = 'en' | 'pidgin';

export const MOTIVATION_MESSAGES: Record<MotivationLang, string[]> = {
  en: [
    "You're building momentum 🔥",
    "Small wins become big results.",
    "Locked in. Keep going.",
    "Consistency looks good on you.",
    "Another step closer.",
    "That's how it's done. Keep going.",
    "One task down. You're on a roll.",
  ],
  pidgin: [
    "You dey try 🔥",
    "Small small, you go reach there.",
    "No loose guard, you don almost finish am.",
    "Na consistency dey carry person go far.",
    "You show up today. That one matter.",
    "Sharp! Another task don clear.",
    "You too active abeg 😭🔥",
    "Steady grinding. We see you.",
    "Your future self go thank you for this.",
    "No give up now, momentum dey build.",
    "You don pass yesterday's version of yourself.",
    "One step closer. Keep moving.",
    "DoAm dey proud of you 😎",
    "You lock in today.",
    "Nothing do you. Continue.",
    "Rest small if you need am, then bounce back.",
    "You fit do am.",
    "Today never waste.",
    "Progress na progress, no matter how small.",
    "You dey enter your productive era 😭🔥",
  ],
};

let lastIndex = -1;

function getLang(): MotivationLang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('doam-language');
  return stored === 'pidgin' ? 'pidgin' : 'en';
}

export function randomMotivation(langOverride?: MotivationLang): string {
  const lang = langOverride ?? getLang();
  const list = MOTIVATION_MESSAGES[lang];
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  let idx = Math.floor(Math.random() * list.length);
  if (idx === lastIndex) idx = (idx + 1) % list.length;
  lastIndex = idx;
  return list[idx];
}
