import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useWorkspaceShell } from "@/context/WorkspaceShellContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { isCustomer360Active } = useWorkspaceShell();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative z-[2] min-w-0 flex-1 rounded-tr-[24px] bg-grey-100 pt-4 pr-4 pb-0">
          <div
            className={`flex h-full w-full flex-col overflow-auto rounded-tl-[24px] rounded-tr-[24px] ${
              isCustomer360Active ? "bg-gray-100" : "bg-grey-100"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
