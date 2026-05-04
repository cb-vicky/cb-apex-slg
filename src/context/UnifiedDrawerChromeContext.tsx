import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type UnifiedDrawerChromeValue = {
  trailingActions: ReactNode | null;
  setTrailingActions: (node: ReactNode | null) => void;
};

const UnifiedDrawerChromeContext = createContext<UnifiedDrawerChromeValue | null>(null);

export function UnifiedDrawerChromeProvider({ children }: { children: ReactNode }) {
  const [trailingActions, setTrailingActionsState] = useState<ReactNode | null>(null);
  const setTrailingActions = useCallback((node: ReactNode | null) => {
    setTrailingActionsState(node);
  }, []);
  const value = useMemo(
    () => ({ trailingActions, setTrailingActions }),
    [trailingActions, setTrailingActions],
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
    };
  }
  return ctx;
}
