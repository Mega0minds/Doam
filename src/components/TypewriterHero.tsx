'use client';
import { useState, useEffect, useCallback } from "react";

const phrases = [
  { prefix: "Stop dragging, just ", suffix: "." },
  { prefix: "Stop procrastinating, just ", suffix: "." },
  { prefix: "Stop overthinking, just ", suffix: "." },
  { prefix: "Stop delaying, just ", suffix: "." },
  { prefix: "Stop waiting, just ", suffix: "." },
];

type Phase = "typing" | "pausing" | "deleting";

const TypewriterHero = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  const fullText = phrases[phraseIndex].prefix + "DoAm" + phrases[phraseIndex].suffix;

  const tick = useCallback(() => {
    if (phase === "typing") {
      if (charIndex < fullText.length) {
        setCharIndex((c) => c + 1);
      } else {
        setPhase("pausing");
      }
    } else if (phase === "deleting") {
      if (charIndex > 0) {
        setCharIndex((c) => c - 1);
      } else {
        setPhraseIndex((i) => (i + 1) % phrases.length);
        setPhase("typing");
      }
    }
  }, [phase, charIndex, fullText.length]);

  useEffect(() => {
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), 2000);
      return () => clearTimeout(t);
    }
    const speed = phase === "typing" ? 60 : 35;
    const t = setTimeout(tick, speed);
    return () => clearTimeout(t);
  }, [phase, tick]);

  // Split displayed text to highlight "DoAm"
  const displayed = fullText.slice(0, charIndex);
  const prefixLen = phrases[phraseIndex].prefix.length;
  const doamStart = prefixLen;
  const doamEnd = prefixLen + 4; // "DoAm".length

  const renderText = () => {
    const before = displayed.slice(0, Math.min(charIndex, doamStart));
    const doamPart = charIndex > doamStart ? displayed.slice(doamStart, Math.min(charIndex, doamEnd)) : "";
    const after = charIndex > doamEnd ? displayed.slice(doamEnd) : "";

    return (
      <>
        {before}
        {doamPart && <span className="text-primary">{doamPart}</span>}
        {after}
      </>
    );
  };

  return (
    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight min-h-[4.5rem] sm:min-h-[5.5rem] lg:min-h-[6.5rem]">
      {renderText()}
      <span className="inline-block w-[3px] h-[1em] bg-primary align-middle ml-1 animate-[blink_1s_step-end_infinite]" />
    </h1>
  );
};

export default TypewriterHero;
