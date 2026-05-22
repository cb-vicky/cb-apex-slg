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

export type SuiteNavItem = {
  id: string;
  label: string;
  isNew?: boolean;
};

/** The "billing" tab is the default white product tab on initial load. */
export const BILLING_NAV: SuiteNavItem = { id: "billing", label: "billing" };

/**
 * Order matters: this is also the visual order in the desktop top bar's
 * suite navigation and the mobile nav drawer's "switch product" list.
 */
export const SUITE_LINKS: readonly SuiteNavItem[] = [
  { id: "growth", label: "growth" },
  { id: "revrec", label: "revrec" },
  { id: "q2c", label: "quote-to-cash" },
  { id: "payments", label: "payments" },
  { id: "revenue-story", label: "revenue story" },
  { id: "revive", label: "revive", isNew: true },
  { id: "billingdesk", label: "billingdesk" },
];

/** All suite products that can appear on the white product tab (ids match nav items). */
export const SUITE_PRODUCT_ITEMS: readonly SuiteNavItem[] = [
  BILLING_NAV,
  ...SUITE_LINKS,
];

export function suiteProductSubtitle(productId: string): string {
  return (
    SUITE_PRODUCT_ITEMS.find((x) => x.id === productId)?.label ??
    BILLING_NAV.label
  );
}

type SuiteProductContextValue = {
  /** Currently active suite product reflected by the white product tab. */
  activeSuiteProductId: string;
  setActiveSuiteProductId: (id: string) => void;
};

const SuiteProductContext = createContext<SuiteProductContextValue | null>(
  null,
);

/**
 * Lifts the active suite-product id to a shared context so both the desktop
 * top bar and the mobile nav drawer can read/write it.
 */
const SUITE_PRODUCT_IDS = SUITE_PRODUCT_ITEMS.map((p) => p.id);

export function SuiteProductProvider({ children }: { children: ReactNode }) {
  const [activeSuiteProductId, setActiveSuiteProductIdState] = useState<string>(
    () =>
      readStringSetting(
        PERSIST_KEYS.activeSuiteProduct,
        SUITE_PRODUCT_IDS,
        BILLING_NAV.id,
      ),
  );

  useEffect(() => {
    writeStringSetting(
      PERSIST_KEYS.activeSuiteProduct,
      activeSuiteProductId,
    );
  }, [activeSuiteProductId]);

  const setActiveSuiteProductId = useCallback((id: string) => {
    setActiveSuiteProductIdState(id);
  }, []);

  const value = useMemo(
    () => ({ activeSuiteProductId, setActiveSuiteProductId }),
    [activeSuiteProductId, setActiveSuiteProductId],
  );

  return (
    <SuiteProductContext.Provider value={value}>
      {children}
    </SuiteProductContext.Provider>
  );
}

export function useSuiteProduct(): SuiteProductContextValue {
  const v = useContext(SuiteProductContext);
  if (!v) {
    throw new Error(
      "useSuiteProduct must be used inside <SuiteProductProvider>",
    );
  }
  return v;
}
