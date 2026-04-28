import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-[#F0F1F3] pt-4 pr-0 pb-0">
          <div className="flex h-full w-full flex-col overflow-auto rounded-tl-[24px] border-l border-t border-border-default bg-white">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
