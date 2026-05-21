import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { AskAiRail } from "./AskAiRail";
import { AiChatPanel } from "./AiChatPanel";
import { useWorkspaceShell } from "@/context/WorkspaceShellContext";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { isCustomer360Active } = useWorkspaceShell();
  const [aiChatOpen, setAiChatOpen] = useState(false);

  useEffect(() => {
    if (!aiChatOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAiChatOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [aiChatOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative z-[2] flex min-h-0 min-w-0 flex-1 flex-col bg-grey-100 pt-4 pb-3 pl-0">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
            <div
              data-main-scroll-container=""
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-auto rounded-tl-[24px]",
                isCustomer360Active ? "bg-gray-100" : "bg-grey-100",
              )}
            >
              {children}
            </div>
            {aiChatOpen ? (
              <div className="box-border flex min-h-0 w-[min(360px,40vw)] max-w-[min(360px,90vw)] shrink-0 pl-1.5 pr-3">
                <AiChatPanel onClose={() => setAiChatOpen(false)} />
              </div>
            ) : null}
          </div>
        </main>
        <AskAiRail active={aiChatOpen} onToggle={() => setAiChatOpen((open) => !open)} />
      </div>
    </div>
  );
}
