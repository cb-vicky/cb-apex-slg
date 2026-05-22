import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Total time both labels are mounted together. Should match the longer of
 * `suite-product-subtitle-in` / `-out` in `index.css`.
 */
const FLIP_MS = 240;

/**
 * Width "settle" tween that runs after `outgoing` clears. The sizer text
 * snaps from the wider previous label to the narrower current one in one
 * frame; we pin the container's measured wide width, then tween down to
 * the natural narrow width so the tab edge doesn't pop in.
 */
const WIDTH_SETTLE_MS = 240;
const WIDTH_SETTLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  /** Latest subtitle to display in the white product tab shell. */
  subtitle: string;
  prefersReducedMotion: boolean;
};

/**
 * In-place "split-flap" label switcher for the white product tab.
 *
 * When `subtitle` changes, the outgoing label fades up and out while the
 * incoming label rises into place from below. Both run simultaneously
 * (translateY in opposite directions) so the swap reads as a slot-reel
 * roll rather than a hard cut. The shell pill itself never moves — only
 * the inner label changes — which pairs with the bar-wide light sweep
 * to acknowledge the product change without any element traversing
 * across the bar.
 *
 * Container is absolutely-positioned over an invisible sizer so the
 * surrounding chrome doesn't jitter while two labels are briefly mounted.
 * The sizer always tracks the longer of `current` and `outgoing` so the
 * outgoing label isn't clipped during its exit. Once `outgoing` clears,
 * a FLIP-style settle tweens the container width down from the wide
 * value to the natural narrow width.
 */
export function ProductTabShellLabel({ subtitle, prefersReducedMotion }: Props) {
  const [current, setCurrent] = useState(subtitle);
  const [outgoing, setOutgoing] = useState<{ value: string; key: number } | null>(
    null,
  );
  const keyRef = useRef(0);
  /*
   * `current` lives in a ref so the swap effect can read its latest value
   * without listing `current` as a dep. If we did list it, the effect's
   * cleanup would fire every time we call `setCurrent(subtitle)` from
   * inside the effect itself — clearing the 240ms timer before it can
   * run, so `outgoing` would never clear and the sizer would stay pinned
   * to the wider previous label. Reading via the ref keeps the timer
   * alive until the *next* subtitle change (or unmount).
   */
  const currentRef = useRef(current);
  currentRef.current = current;

  const containerRef = useRef<HTMLSpanElement>(null);
  const lastWideWidthRef = useRef<number | null>(null);
  const prevOutgoingRef = useRef(outgoing);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (subtitle === currentRef.current) return;
    keyRef.current += 1;
    const myKey = keyRef.current;
    setOutgoing({ value: currentRef.current, key: myKey });
    setCurrent(subtitle);
    const t = window.setTimeout(() => {
      setOutgoing((prev) => (prev != null && prev.key === myKey ? null : prev));
    }, FLIP_MS);
    return () => window.clearTimeout(t);
  }, [subtitle]);

  /*
   * FLIP-style width settle. While `outgoing` is mounted the sizer text
   * is the wider of the two labels, so the container's natural width is
   * "wide". When `outgoing` clears the sizer text snaps to `current` and
   * the natural width becomes "narrow" in one frame.
   *
   *  - Each render while `outgoing` is set: snapshot the measured wide
   *    width via `offsetWidth`.
   *  - Render where `outgoing` just transitioned to `null`: read the new
   *    narrow width, pin the container to the wide width for one frame
   *    (no transition), then on the next frame apply `transition: width`
   *    and release to the narrow width. After the transition's nominal
   *    duration, clear the inline overrides so the container goes back
   *    to natural sizing.
   *
   * Runs in a `useLayoutEffect` so the pinning happens before paint,
   * preventing the visible snap. Skipped under reduced-motion.
   */
  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const wasOutgoing = prevOutgoingRef.current;
    prevOutgoingRef.current = outgoing;

    if (outgoing) {
      lastWideWidthRef.current = el.offsetWidth;
      return;
    }
    if (!wasOutgoing) return;
    const wide = lastWideWidthRef.current;
    if (wide == null) return;
    const narrow = el.offsetWidth;
    if (narrow >= wide) return;

    el.style.transition = "none";
    el.style.width = `${wide}px`;

    const raf = requestAnimationFrame(() => {
      el.style.transition = `width ${WIDTH_SETTLE_MS}ms ${WIDTH_SETTLE_EASE}`;
      el.style.width = `${narrow}px`;
    });
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(() => {
      el.style.width = "";
      el.style.transition = "";
      settleTimerRef.current = null;
    }, WIDTH_SETTLE_MS + 30);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [outgoing, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <span className="inline-block font-normal">{subtitle}</span>;
  }

  const sizer =
    outgoing && outgoing.value.length > current.length ? outgoing.value : current;

  return (
    <span
      ref={containerRef}
      className="relative inline-block whitespace-nowrap align-baseline"
    >
      <span className="invisible block font-normal" aria-hidden>
        {sizer}
      </span>
      {outgoing ? (
        <span
          key={`out-${outgoing.key}`}
          className="absolute left-0 top-0 block font-normal motion-safe:animate-suite-product-subtitle-out motion-reduce:hidden"
          aria-hidden
        >
          {outgoing.value}
        </span>
      ) : null}
      <span
        key={`in-${current}`}
        className="absolute left-0 top-0 block font-normal motion-safe:animate-suite-product-subtitle-in"
      >
        {current}
      </span>
    </span>
  );
}
