import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type WorkspaceShellContextValue = {
  isCustomer360Active: boolean;
  setCustomer360Active: (active: boolean) => void;
};

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null);

export function WorkspaceShellProvider({ children }: { children: ReactNode }) {
  const [isCustomer360Active, setIsActive] = useState(false);

  const setCustomer360Active = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  return (
    <WorkspaceShellContext.Provider value={{ isCustomer360Active, setCustomer360Active }}>
      {children}
    </WorkspaceShellContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useWorkspaceShell() {
  const ctx = useContext(WorkspaceShellContext);
  if (!ctx) {
    throw new Error("useWorkspaceShell must be used within WorkspaceShellProvider");
  }
  return ctx;
}
