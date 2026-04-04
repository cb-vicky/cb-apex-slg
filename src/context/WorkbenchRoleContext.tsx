import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/data/gettingStarted";

type WorkbenchRoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

const WorkbenchRoleContext = createContext<WorkbenchRoleContextValue | null>(null);

export function WorkbenchRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  return (
    <WorkbenchRoleContext.Provider value={{ role, setRole }}>{children}</WorkbenchRoleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook must live with provider
export function useWorkbenchRole() {
  const ctx = useContext(WorkbenchRoleContext);
  if (!ctx) {
    throw new Error("useWorkbenchRole must be used within WorkbenchRoleProvider");
  }
  return ctx;
}
