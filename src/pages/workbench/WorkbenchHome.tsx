import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WorkbenchTaskList } from "./WorkbenchTaskList";
import { QueueTabContent, QueueTabToolbar } from "./QueueTabContent";
import { ApprovalsTabContent } from "./ApprovalsTabContent";

/** Picked once per mount / full page refresh — demo user name matches shell prototype. */
const WORKBENCH_GREETINGS = ["Welcome, Alex.", "Greetings, Alex."] as const;

type WorkbenchTab = "tasks" | "queue" | "approvals";

const tabs: { id: WorkbenchTab; label: string }[] = [
  { id: "tasks", label: "Your tasks" },
  { id: "queue", label: "Queue" },
  { id: "approvals", label: "Approvals" },
];

export function WorkbenchHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [greeting] = useState(
    () => WORKBENCH_GREETINGS[Math.floor(Math.random() * WORKBENCH_GREETINGS.length)],
  );

  const activeTab = (searchParams.get("tab") as WorkbenchTab) || "tasks";

  function handleTabChange(tab: WorkbenchTab) {
    const params = new URLSearchParams(searchParams);
    if (tab === "tasks") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    setSearchParams(params);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-grey-100">
      <div className="flex min-h-0 flex-1 flex-col px-6 pt-6 pb-7">
        <header className="mb-4 shrink-0">
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            Workbench
          </p>
          <h1 className="max-w-3xl text-[30px] font-bold leading-tight tracking-tight text-text-primary">
            {greeting}
          </h1>
        </header>

        {/* Tabs + queue actions */}
        <div className="mb-6 flex shrink-0 items-end justify-between gap-4 border-b border-border-default">
          <div className="flex min-w-0 items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative px-4 py-2.5 text-[13px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-blue-600"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                )}
              </button>
            ))}
          </div>
          {activeTab === "queue" && <QueueTabToolbar />}
        </div>

        {/* Tab content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {activeTab === "tasks" && <WorkbenchTaskList />}
          {activeTab === "queue" && <QueueTabContent />}
          {activeTab === "approvals" && <ApprovalsTabContent />}
        </div>
      </div>
    </div>
  );
}
