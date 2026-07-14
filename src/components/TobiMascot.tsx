'use client';
import tobiImg from '@/assets/tobi-mascot.png';

interface TobiMascotProps {
  /** Pixel size of the mascot image (square). */
  size?: number;
  className?: string;
  waving?: boolean;
  /** Wraps Tobi in a small white rounded badge for visibility on any background. */
  framed?: boolean;
  /** Inner padding (px) of the white badge around the mascot. */
  framePadding?: number;
}

/**
 * Tobi — the DoAm alarm-clock mascot.
 *
 * When `framed` (default), Tobi sits inside a small white rounded-square
 * "sticker" so the mascot stays visible in both light and dark mode.
 * The wave animation is applied directly to the <img>.
 */
export function TobiMascot({
  size = 96,
  className = '',
  waving = true,
  framed = true,
  framePadding = 8,
}: TobiMascotProps) {
  const img = (
    <img
      src={tobiImg.src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      aria-hidden="true"
      className={`object-contain select-none ${waving ? 'tobi-wave' : ''}`}
      style={{
        width: size,
        height: size,
        transformOrigin: '50% 85%',
      }}
    />
  );

  if (!framed) {
    return (
      <span
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {img}
      </span>
    );
  }

  const frameSize = size + framePadding * 2;

  return (
    <span
      className={`inline-flex items-center justify-center select-none bg-white rounded-2xl shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ width: frameSize, height: frameSize, padding: framePadding }}
      aria-hidden="true"
    >
      {img}
    </span>
  );
}

export default TobiMascot;
