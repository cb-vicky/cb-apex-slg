import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  adminConfig,
  adminRailCards,
  operatorConfig,
  operatorRailCards,
} from "@/data/gettingStarted";
import { useWorkbenchRole } from "@/context/WorkbenchRoleContext";
import { GettingStartedHeader } from "@/components/getting-started/GettingStartedHeader";
import { SummaryStrip } from "@/components/getting-started/SummaryStrip";
import { EnvironmentBanner } from "@/components/getting-started/EnvironmentBanner";
import { MilestoneGrid } from "@/components/getting-started/MilestoneGrid";
import { OperatorRail } from "@/components/getting-started/OperatorRail";
import { FooterCallout } from "@/components/getting-started/FooterCallout";
import { WorkbenchTaskList } from "./WorkbenchTaskList";

type WorkbenchTab = "tasks" | "getting-started";

export function WorkbenchHome() {
  const { role, setRole } = useWorkbenchRole();
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("tasks");

  const config = role === "admin" ? adminConfig : operatorConfig;
  const railCards = role === "admin" ? adminRailCards : operatorRailCards;
  const milestoneTitle = role === "admin" ? "Required before go-live" : "Start here";
  const milestones = config.milestones;

  return (
    <div className="flex-1 w-full overflow-auto">
      <div className="px-8 py-7">
        {/* Top bar: tabs left, role switcher right */}
        <div className="mb-6 flex items-center justify-between">
          <TabBar active={activeTab} onChange={setActiveTab} />
          <div className="inline-flex shrink-0 rounded-lg bg-surface-muted p-0.5">
            <RoleTab
              label="Billing Manager"
              active={role === "admin"}
              onClick={() => setRole("admin")}
            />
            <RoleTab
              label="Billing Operator"
              active={role === "operator"}
              onClick={() => setRole("operator")}
            />
          </div>
        </div>

        {/* My Tasks tab */}
        {activeTab === "tasks" && <WorkbenchTaskList role={role} />}

        {/* Getting Started tab — rendered exactly as before */}
        {activeTab === "getting-started" && (
          <>
            {/* Two-column layout: 8-col scrollable content + 4-col sticky rail */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left: all scrollable page content */}
              <div className="col-span-8 flex flex-col gap-6">
                <GettingStartedHeader role={role} config={config} />
                <SummaryStrip config={config} />
                <EnvironmentBanner />
                <MilestoneGrid
                  title={milestoneTitle}
                  milestones={milestones}
                  columns={1}
                />
              </div>

              {/* Right: sticky info rail */}
              <div className="col-span-4 pt-0">
                <OperatorRail cards={railCards} />
              </div>
            </div>

            {/* Footer: full-width below the grid */}
            <div className="mt-6">
              <FooterCallout config={config.footerCallout} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

function TabBar({
  active,
  onChange,
}: {
  active: WorkbenchTab;
  onChange: (tab: WorkbenchTab) => void;
}) {
  return (
    <div className="flex items-end gap-0 border-b border-border-default">
      <Tab
        label="My Tasks"
        active={active === "tasks"}
        onClick={() => onChange("tasks")}
      />
      <Tab
        label="Getting Started"
        active={active === "getting-started"}
        onClick={() => onChange("getting-started")}
      />
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 pb-2 text-[13px] font-medium transition-colors",
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
      {/* Active underline */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-cb-orange transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Role tab (unchanged)
// ---------------------------------------------------------------------------

function RoleTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-white text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}
