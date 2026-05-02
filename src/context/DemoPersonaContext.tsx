import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { DemoPersona } from "@/types/demo-persona";

const STORAGE_KEY = "apex-demo-persona";

function readStoredPersona(): DemoPersona {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "approver" || v === "operator") return v;
  } catch {
    /* private mode / SSR */
  }
  return "operator";
}

type DemoPersonaContextValue = {
  persona: DemoPersona;
  setPersona: (p: DemoPersona) => void;
};

const DemoPersonaContext = createContext<DemoPersonaContextValue | null>(null);

export function DemoPersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<DemoPersona>(() => readStoredPersona());

  const setPersona = useCallback((p: DemoPersona) => {
    setPersonaState(p);
    try {
      sessionStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <DemoPersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </DemoPersonaContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useDemoPersona() {
  const ctx = useContext(DemoPersonaContext);
  if (!ctx) {
    throw new Error("useDemoPersona must be used within DemoPersonaProvider");
  }
  return ctx;
}
