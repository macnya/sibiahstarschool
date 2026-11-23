'use client';

import { useEffect, useState } from 'react';

/**
 * Optional background film for the hero. Set NEXT_PUBLIC_HERO_VIDEO_URL to an .mp4 to switch it on.
 * It only plays on larger screens, never for people who prefer reduced motion or have Data Saver on,
 * so phones on mobile data never download it.
 */
export function HeroVideo() {
  const src = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!src) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const calm = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    setPlay(calm && wide && !nav.connection?.saveData);
  }, [src]);

  if (!src || !play) return null;
  return <video className="absolute inset-0 h-full w-full object-cover opacity-40" src={src} autoPlay muted loop playsInline preload="none" aria-hidden="true" />;
}
