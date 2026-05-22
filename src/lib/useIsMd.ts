import { useEffect, useState } from "react";

/**
 * Tracks Tailwind's `md` breakpoint (`min-width: 768px`).
 *
 * Used as the gate for desktop-only chrome — the shell layouts read it to
 * conditionally render the routed `<main>` and the assistant column, and
 * the rail / aside components read it to decide whether to attach
 * `view-transition-name`s (mobile snapshots aren't useful and the named
 * elements can produce duplicate-name errors if both mobile and desktop
 * variants briefly coexist mid-resize).
 *
 * The first paint always sees `false` until the effect resolves so SSR
 * (if introduced later) lands on the mobile layout — callers that need a
 * synchronous answer should fall through to `useMediaQuery` directly.
 */
export function useIsMd(): boolean {
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMd;
}
