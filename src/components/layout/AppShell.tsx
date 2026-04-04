import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <SearchBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-[#F0F1F3] pt-0 pr-0 pb-0 pl-3">
          <div className="h-full w-full rounded-tl-[24px] bg-white shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
