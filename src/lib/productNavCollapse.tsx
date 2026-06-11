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
import {
  WORKSPACE_FLIGHT_EASE_ENTER,
  useAssistantWorkspace,
} from "@/lib/assistantWorkspace";
import { flipWithVT } from "@/lib/viewTransitions";

/** Matches apex `Sidebar` expanded width. */
export const PRODUCT_NAV_FULL_W = 210;
/** Docked: narrow strip at the layout edge; hover or click runs the expand flight. */
export const PRODUCT_NAV_COLLAPSED_W = 48;

/**
 * Easing for the row-wave keyframe in `ChargebeeLeftNav`. Re-exported
 * here so the nav file doesn't need to know about `assistantWorkspace`'s
 * motion clock.
 */
export const PRODUCT_NAV_FLIGHT_EASE = WORKSPACE_FLIGHT_EASE_ENTER;

/** Billing-tab hover: aside + tab icon row nudge left together. */
export const PRODUCT_NAV_PEEK_SHIFT_PX = 4;
export const PRODUCT_NAV_PEEK_TRANSFORM_MS = 220;
export const PRODUCT_NAV_PEEK_TRANSFORM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export type ProductNavCollapseContextValue = {
  /** Steady docked (`PRODUCT_NAV_COLLAPSED_W` strip). */
  collapsed: boolean;
  requestCollapse: () => void;
  requestExpand: () => void;
  requestToggle: () => void;
  /** Billing-tab hover "peek" — slightly nudges the open rail left. */
  collapsePeek: boolean;
  setCollapsePeek: (next: boolean) => void;
  /** True when the open rail is doing the hover peek (aside + product tab shift together). */
  peekNudgeActive: boolean;
};

const ProductNavCollapseContext =
  createContext<ProductNavCollapseContextValue | null>(null);

/**
 * Product (left) nav dock state. Each toggle commits `collapsed` inside
 * `flipWithVT(..., { kind: "product-nav" })` so the browser snapshot-
 * morphs the rail's bounding box (260 ↔ 32) — see
 * `::view-transition-old/new(product-nav)` in `src/index.css`.
 *
 * The `kind` keeps the animation scoped to the product-nav pseudos so a
 * dock toggle never accidentally animates the assistant column or the
 * sessions rail (sibling VT names).
 *
 * Reduced-motion users and non-VT browsers (Firefox today) skip the VT
 * and snap state — documented fallback.
 *
 * The collapsed boolean is persisted to `localStorage` so the dock state
 * survives a refresh.
 */
export function ProductNavCollapseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { mode, prefersReducedMotion } = useAssistantWorkspace();
  const inWorkspace = mode === "workspace";

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    readBooleanSetting(PERSIST_KEYS.productNavCollapsed, true),
  );
  const [collapsePeek, setCollapsePeek] = useState(false);

  useEffect(() => {
    writeBooleanSetting(PERSIST_KEYS.productNavCollapsed, collapsed);
  }, [collapsed]);

  /** Peek only renders in sidebar mode; workspace mode hides the product nav entirely. */
  const peekNudgeActive = !inWorkspace && collapsePeek && !collapsed;

  const requestCollapse = useCallback(() => {
    if (collapsed) return;
    setCollapsePeek(false);
    flipWithVT(() => setCollapsed(true), {
      skip: prefersReducedMotion,
      kind: "product-nav",
    });
  }, [collapsed, prefersReducedMotion]);

  const requestExpand = useCallback(() => {
    if (!collapsed) return;
    setCollapsePeek(false);
    flipWithVT(() => setCollapsed(false), {
      skip: prefersReducedMotion,
      kind: "product-nav",
    });
  }, [collapsed, prefersReducedMotion]);

  const requestToggle = useCallback(() => {
    if (collapsed) requestExpand();
    else requestCollapse();
  }, [collapsed, requestCollapse, requestExpand]);

  const value = useMemo<ProductNavCollapseContextValue>(
    () => ({
      collapsed,
      requestCollapse,
      requestExpand,
      requestToggle,
      collapsePeek,
      setCollapsePeek,
      peekNudgeActive,
    }),
    [
      collapsed,
      requestCollapse,
      requestExpand,
      requestToggle,
      collapsePeek,
      peekNudgeActive,
    ],
  );

  return (
    <ProductNavCollapseContext.Provider value={value}>
      {children}
    </ProductNavCollapseContext.Provider>
  );
}

export function useProductNavCollapse(): ProductNavCollapseContextValue {
  const v = useContext(ProductNavCollapseContext);
  if (!v) {
    throw new Error(
      "useProductNavCollapse must be used inside <ProductNavCollapseProvider>",
    );
  }
  return v;
}
