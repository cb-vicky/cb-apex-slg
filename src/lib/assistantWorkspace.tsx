import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PERSIST_KEYS,
  readStringSetting,
  writeStringSetting,
} from "@/lib/persist";
import { flipWithVT } from "@/lib/viewTransitions";

type WorkspaceMode = "sidebar" | "workspace";
const WORKSPACE_MODES: readonly WorkspaceMode[] = ["sidebar", "workspace"];

/**
 * Shared motion clock for any chrome that animates alongside a workspace
 * mode flip (rail collapse, suite-nav reflow, etc.). The column morph
 * itself runs off the View Transitions API now (see
 * `::view-transition-group(assistant-column)` in `src/index.css`); this
 * constant is just the "default" envelope for accompanying CSS
 * transitions.
 */
export const WORKSPACE_FLIGHT_ENTER_MS = 520;
export const WORKSPACE_FLIGHT_EASE_ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Top-bar / chrome morph is intentionally faster than the column flight
 * so the surrounding UI feels like it *acknowledges* the mode change
 * in a quick one-beat motion while the column does its thing.
 */
export const WORKSPACE_TOPBAR_MORPH_MS = 380;
export const WORKSPACE_TOPBAR_SWEEP_MS = 520;

type AssistantWorkspaceContextValue = {
  mode: WorkspaceMode;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
  /** True when the user prefers reduced UI motion. */
  prefersReducedMotion: boolean;
};

const AssistantWorkspaceContext =
  createContext<AssistantWorkspaceContextValue | null>(null);

/** Compact-viewport breakpoint matches Tailwind's `md` (used across the shell). */
const COMPACT_VIEWPORT_QUERY = "(max-width: 767px)";

function isCompactViewportSync(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(COMPACT_VIEWPORT_QUERY).matches
  );
}

function useMediaPrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(q.matches);
    fn();
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function useIsCompactViewport(): boolean {
  const [isCompact, setIsCompact] = useState(isCompactViewportSync);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = window.matchMedia(COMPACT_VIEWPORT_QUERY);
    const fn = () => setIsCompact(q.matches);
    fn();
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }, []);
  return isCompact;
}

export function AssistantWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  /** Last-used mode from `localStorage`; defaults to sidebar (main + docked assistant). */
  const [mode, setMode] = useState<WorkspaceMode>(() =>
    readStringSetting<WorkspaceMode>(
      PERSIST_KEYS.assistantMode,
      WORKSPACE_MODES,
      "sidebar",
    ),
  );
  const prefersReducedMotion = useMediaPrefersReducedMotion();
  const isCompactViewport = useIsCompactViewport();

  useEffect(() => {
    writeStringSetting(PERSIST_KEYS.assistantMode, mode);
  }, [mode]);

  /**
   * Flip the mode. View-Transitions-capable browsers get the column /
   * main animations defined in `src/index.css` — tagged elements
   * (`view-transition-name` in CSS) morph between their before/after
   * positions; everything else gets a default crossfade.
   *
   * Reduced-motion users, compact viewports, and non-VT browsers
   * (Firefox today) all skip the VT and flip instantly via the `skip`
   * branch in `flipWithVT`.
   */
  const flip = useCallback(
    (next: WorkspaceMode) => {
      if (mode === next) return;
      flipWithVT(() => setMode(next), {
        skip: prefersReducedMotion || isCompactViewport,
        kind: "workspace",
      });
    },
    [mode, prefersReducedMotion, isCompactViewport],
  );

  const enter = useCallback(() => flip("workspace"), [flip]);
  const exit = useCallback(() => flip("sidebar"), [flip]);
  const toggle = useCallback(
    () => (mode === "workspace" ? exit() : enter()),
    [mode, enter, exit],
  );

  const value = useMemo(
    () => ({
      mode,
      enter,
      exit,
      toggle,
      prefersReducedMotion,
    }),
    [mode, enter, exit, toggle, prefersReducedMotion],
  );

  return (
    <AssistantWorkspaceContext.Provider value={value}>
      {children}
    </AssistantWorkspaceContext.Provider>
  );
}

export function useAssistantWorkspace(): AssistantWorkspaceContextValue {
  const v = useContext(AssistantWorkspaceContext);
  if (!v) {
    throw new Error(
      "useAssistantWorkspace must be used inside <AssistantWorkspaceProvider>",
    );
  }
  return v;
}
