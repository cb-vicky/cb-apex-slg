/**
 * Visual layer that paints the bar-wide sweep band. Pair with
 * `useTopBarSweep` from `@/lib/topBarSweep`. Returns `null` until the
 * first trigger so we don't mount an idle div on page load.
 *
 * The `key={nonce}` is the entire mechanism: each bump remounts the
 * `<div>` and re-runs the `workspace-topbar-sweep` keyframe from
 * frame zero.
 */
export function TopBarSweepLayer({ nonce }: { nonce: number }) {
  if (nonce <= 0) return null;
  return (
    <div
      key={nonce}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] motion-safe:animate-workspace-topbar-sweep motion-reduce:hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.10) 50%, transparent 100%)",
        backgroundSize: "40% 100%",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
