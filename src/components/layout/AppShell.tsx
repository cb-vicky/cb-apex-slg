import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative z-[2] min-w-0 flex-1 rounded-tr-[24px] bg-white pt-4 pr-4 pb-0">
          <div className="flex h-full w-full flex-col overflow-auto rounded-tl-[24px] rounded-tr-[24px] border-l border-r border-t border-border-default bg-white shadow-[-4px_8px_22px_rgba(1,42,56,0.08),0_2px_5px_rgba(1,42,56,0.05)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
