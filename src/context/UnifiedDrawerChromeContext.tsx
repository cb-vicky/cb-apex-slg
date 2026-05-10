import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AllContractsTabState = {
  showTab: boolean;
  isActive: boolean;
  showBackButton: boolean;
  onTabClick: () => void;
  onBackClick: () => void;
};

export type UnifiedDrawerChromeValue = {
  trailingActions: ReactNode | null;
  setTrailingActions: (node: ReactNode | null) => void;
  allContractsTab: AllContractsTabState;
  setAllContractsTab: (state: Partial<AllContractsTabState>) => void;
};

const defaultAllContractsTab: AllContractsTabState = {
  showTab: false,
  isActive: false,
  showBackButton: false,
  onTabClick: () => {},
  onBackClick: () => {},
};

const UnifiedDrawerChromeContext = createContext<UnifiedDrawerChromeValue | null>(null);

export function UnifiedDrawerChromeProvider({ children }: { children: ReactNode }) {
  const [trailingActions, setTrailingActionsState] = useState<ReactNode | null>(null);
  const [allContractsTabState, setAllContractsTabState] = useState<AllContractsTabState>(defaultAllContractsTab);
  
  const setTrailingActions = useCallback((node: ReactNode | null) => {
    setTrailingActionsState(node);
  }, []);
  
  const setAllContractsTab = useCallback((state: Partial<AllContractsTabState>) => {
    setAllContractsTabState((prev) => ({ ...prev, ...state }));
  }, []);
  
  const value = useMemo(
    () => ({ trailingActions, setTrailingActions, allContractsTab: allContractsTabState, setAllContractsTab }),
    [trailingActions, setTrailingActions, allContractsTabState, setAllContractsTab],
  );
  return (
    <UnifiedDrawerChromeContext.Provider value={value}>{children}</UnifiedDrawerChromeContext.Provider>
  );
}

/** Hook for unified drawer header actions (non-component export is intentional). */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useUnifiedDrawerChrome(): UnifiedDrawerChromeValue {
  const ctx = useContext(UnifiedDrawerChromeContext);
  if (!ctx) {
    return {
      trailingActions: null,
      setTrailingActions: () => {},
      allContractsTab: defaultAllContractsTab,
      setAllContractsTab: () => {},
    };
  }
  return ctx;
}
