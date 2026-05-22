import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared "chrome acknowledges the change" sweep used by `ProductTopBar`.
 *
 * A soft white band passes left → right across the entire bar once per
 * trigger. Two triggers fire it:
 *
 *   - Entering workspace mode (handled by the hook's internal effect).
 *   - Switching the active suite product (consumers call `triggerSweep`
 *     from click handlers; the bar-wide sweep masks the strip reflow
 *     and the in-place label flip inside the white shell).
 *
 * Each trigger bumps a nonce; `<TopBarSweepLayer nonce={…}>` renders the
 * sweep `<div>` with `key={nonce}` so React remounts it on each bump and
 * the CSS animation restarts from frame zero — no setTimeout-to-clear
 * needed. Skipped under reduced-motion.
 */
export function useTopBarSweep(
  isWorkspace: boolean,
  prefersReducedMotion: boolean,
) {
  const [sweepNonce, setSweepNonce] = useState(0);
  const wasWorkspaceRef = useRef(isWorkspace);

  useEffect(() => {
    if (prefersReducedMotion) {
      wasWorkspaceRef.current = isWorkspace;
      return;
    }
    if (isWorkspace && !wasWorkspaceRef.current) {
      setSweepNonce((n) => n + 1);
    }
    wasWorkspaceRef.current = isWorkspace;
  }, [isWorkspace, prefersReducedMotion]);

  const triggerSweep = useCallback(() => {
    if (prefersReducedMotion) return;
    setSweepNonce((n) => n + 1);
  }, [prefersReducedMotion]);

  return { sweepNonce, triggerSweep } as const;
}
