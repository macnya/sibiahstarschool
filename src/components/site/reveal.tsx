'use client';

import { useEffect } from 'react';

/**
 * Fades sections in as they scroll into view. Safe by design: the "js" class is only added once
 * the script runs (so with JavaScript off the content is simply visible), and a stylesheet rule
 * disables the animation for people who prefer reduced motion.
 */
export function RevealInit() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
    // Pages change without a full reload: pick up newly mounted sections too.
    const mo = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
