import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

const REFRESH_MS = 650;

type SuiteLayoutRefreshContextValue = {
  isSuiteLayoutRefreshing: boolean;
  triggerSuiteLayoutRefresh: () => void;
};

const SuiteLayoutRefreshContext =
  createContext<SuiteLayoutRefreshContextValue | null>(null);

export function SuiteLayoutRefreshProvider({ children }: { children: ReactNode }) {
  const [isSuiteLayoutRefreshing, setIsSuiteLayoutRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSuiteLayoutRefresh = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIsSuiteLayoutRefreshing(true);
    timerRef.current = window.setTimeout(() => {
      setIsSuiteLayoutRefreshing(false);
      timerRef.current = null;
    }, REFRESH_MS);
  }, []);

  return (
    <SuiteLayoutRefreshContext.Provider
      value={{ isSuiteLayoutRefreshing, triggerSuiteLayoutRefresh }}
    >
      {children}
    </SuiteLayoutRefreshContext.Provider>
  );
}

export function useSuiteLayoutRefresh(): SuiteLayoutRefreshContextValue {
  const ctx = useContext(SuiteLayoutRefreshContext);
  if (!ctx) {
    throw new Error(
      "useSuiteLayoutRefresh must be used within SuiteLayoutRefreshProvider",
    );
  }
  return ctx;
}

/** Shared overlay spinner for suite tab “layout refresh”. */
export function SuiteLayoutRefreshSpinner({
  label = "Loading",
}: {
  label?: string;
}) {
  return (
    <div
      className="pointer-events-none flex flex-col items-center justify-center gap-2"
      aria-label={label}
    >
      <Loader2
        className="h-8 w-8 animate-spin text-primary-500"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
