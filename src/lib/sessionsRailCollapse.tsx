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
  readBooleanSetting,
  writeBooleanSetting,
} from "@/lib/persist";
import { useAssistantWorkspace } from "@/lib/assistantWorkspace";
import { flipWithVT } from "@/lib/viewTransitions";

export const SESSIONS_RAIL_FULL_W = 260;
/** Docked: narrow strip pinned to the left edge of the assistant workspace. */
export const SESSIONS_RAIL_COLLAPSED_W = 32;

export type SessionsRailCollapseContextValue = {
  /** Steady docked (`SESSIONS_RAIL_COLLAPSED_W` strip). */
  collapsed: boolean;
  requestCollapse: () => void;
  requestExpand: () => void;
  requestToggle: () => void;
};

const SessionsRailCollapseContext =
  createContext<SessionsRailCollapseContextValue | null>(null);

/**
 * Sessions sub-rail dock state. The sessions list is a left sidebar
 * *inside* the assistant workspace — owned by the assistant, not the
 * product. Toggling commits `collapsed` inside
 * `flipWithVT(..., { kind: "sessions-rail" })` so the browser snapshot-
 * morphs the rail's bounding box (260 ↔ 32) — see
 * `::view-transition-old/new(sessions-rail)` in `src/index.css`.
 *
 * The `kind` keeps the animation scoped to the sessions-rail pseudos so
 * a sub-rail dock never animates the surrounding assistant column or
 * the (hidden) product nav.
 *
 * The collapsed boolean is persisted to `localStorage` so the dock state
 * survives a refresh.
 */
export function SessionsRailCollapseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { prefersReducedMotion } = useAssistantWorkspace();

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    readBooleanSetting(PERSIST_KEYS.sessionsRailCollapsed, false),
  );

  useEffect(() => {
    writeBooleanSetting(PERSIST_KEYS.sessionsRailCollapsed, collapsed);
  }, [collapsed]);

  const requestCollapse = useCallback(() => {
    if (collapsed) return;
    flipWithVT(() => setCollapsed(true), {
      skip: prefersReducedMotion,
      kind: "sessions-rail",
    });
  }, [collapsed, prefersReducedMotion]);

  const requestExpand = useCallback(() => {
    if (!collapsed) return;
    flipWithVT(() => setCollapsed(false), {
      skip: prefersReducedMotion,
      kind: "sessions-rail",
    });
  }, [collapsed, prefersReducedMotion]);

  const requestToggle = useCallback(() => {
    if (collapsed) requestExpand();
    else requestCollapse();
  }, [collapsed, requestCollapse, requestExpand]);

  const value = useMemo<SessionsRailCollapseContextValue>(
    () => ({
      collapsed,
      requestCollapse,
      requestExpand,
      requestToggle,
    }),
    [collapsed, requestCollapse, requestExpand, requestToggle],
  );

  return (
    <SessionsRailCollapseContext.Provider value={value}>
      {children}
    </SessionsRailCollapseContext.Provider>
  );
}

export function useSessionsRailCollapse(): SessionsRailCollapseContextValue {
  const v = useContext(SessionsRailCollapseContext);
  if (!v) {
    throw new Error(
      "useSessionsRailCollapse must be used inside <SessionsRailCollapseProvider>",
    );
  }
  return v;
}
