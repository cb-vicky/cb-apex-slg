import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import cbLogoWhite from "@/assets/cb-logo-white.svg";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
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
        <main className="relative z-[2] flex min-h-0 min-w-0 flex-1 flex-col rounded-tr-[24px] bg-grey-100 pt-4 pr-3 pb-3 pl-0">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
            <div
              data-main-scroll-container=""
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-auto rounded-tl-[24px] rounded-tr-[24px]",
                isCustomer360Active ? "bg-gray-100" : "bg-grey-100",
              )}
            >
              {children}
            </div>
            {aiChatOpen ? (
              <div className="box-border flex min-h-0 w-[min(360px,40vw)] max-w-[min(360px,90vw)] shrink-0 pl-1.5">
                <AiChatPanel onClose={() => setAiChatOpen(false)} />
              </div>
            ) : null}
          </div>

          {!aiChatOpen && (
            <button
              type="button"
              onClick={() => setAiChatOpen(true)}
              className="ai-fab-gradient absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
              aria-label="Open AI assistant"
            >
              <img
                src={cbLogoWhite}
                alt=""
                className="pointer-events-none h-[15px] w-[15px] select-none drop-shadow-sm"
                width={15}
                height={15}
                aria-hidden
              />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
