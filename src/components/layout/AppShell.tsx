import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { AIAgentSidebar } from "@/components/assistant/AIAgentSidebar";
import { NotesDrawer, NotesFloatingButton } from "@/components/notes";
import { useAssistantWorkspace } from "@/lib/assistantWorkspace";
import { useIsMd } from "@/lib/useIsMd";
import { useWorkspaceShell } from "@/context/WorkspaceShellContext";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { isCustomer360Active } = useWorkspaceShell();
  const { mode } = useAssistantWorkspace();
  const isMd = useIsMd();
  const showMain = mode === "sidebar";

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[#012A38]">
      <TopNav />
      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <div
          className={cn(
            "relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden bg-grey-100",
            "pt-0 pb-3 pl-0",
          )}
        >
          {showMain ? (
            <main
              id="main-content"
              className="relative z-[2] flex min-h-0 min-w-0 flex-1 flex-col pl-0"
              style={isMd ? { viewTransitionName: "main-content" } : undefined}
            >
              <div
                data-main-scroll-container=""
                className={cn(
                  "min-h-0 min-w-0 flex-1 overflow-auto rounded-tl-[24px] rounded-tr-[24px]",
                  isCustomer360Active ? "bg-gray-100" : "bg-grey-100",
                )}
              >
                {children}
              </div>
            </main>
          ) : null}
          <div
            className={cn(
              "flex min-h-0 overflow-hidden",
              showMain
                ? "w-auto shrink-0"
                : "min-w-0 flex-1 rounded-tl-[24px] rounded-tr-[24px]",
            )}
          >
            <AIAgentSidebar />
          </div>
        </div>
      </div>
      <NotesFloatingButton />
      <NotesDrawer />
    </div>
  );
}
