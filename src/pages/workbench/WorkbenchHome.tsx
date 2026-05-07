import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WorkbenchTaskList } from "./WorkbenchTaskList";
import { QueueTabContent } from "./QueueTabContent";
import { ApprovalsTabContent } from "./ApprovalsTabContent";

/** Picked once per mount / full page refresh — demo user name matches shell prototype. */
const WORKBENCH_GREETINGS = [
  "Hi, Alex. Finance calls.",
  "Morning, Alex. Chase cash.",
] as const;

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
    <div className="flex-1 w-full overflow-auto">
      <div className="px-6 pt-5 pb-7">
        <header className="mb-3">
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
            Workbench
          </p>
          <h1 className="max-w-3xl text-[30px] font-semibold leading-tight tracking-tight text-text-primary">
            {greeting}
          </h1>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-border-default">
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

        {/* Tab content */}
        {activeTab === "tasks" && <WorkbenchTaskList />}
        {activeTab === "queue" && <QueueTabContent />}
        {activeTab === "approvals" && <ApprovalsTabContent />}
      </div>
    </div>
  );
}
