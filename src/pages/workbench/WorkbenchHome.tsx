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

export function WorkbenchHome() {
  const { role, setRole } = useWorkbenchRole();
  const config = role === "admin" ? adminConfig : operatorConfig;
  const railCards = role === "admin" ? adminRailCards : operatorRailCards;
  const milestoneTitle = role === "admin" ? "Required before go-live" : "Start here";
  const milestones = config.milestones;

  return (
    <div className="flex-1 w-full overflow-auto">
      <div className="px-8 py-7">
        {/* Role switcher — top-right of the page */}
        <div className="mb-5 flex justify-end">
          <div className="inline-flex shrink-0 rounded-lg bg-surface-muted p-0.5">
            <RoleTab label="Billing Manager" active={role === "admin"} onClick={() => setRole("admin")} />
            <RoleTab label="Billing Operator" active={role === "operator"} onClick={() => setRole("operator")} />
          </div>
        </div>

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
      </div>
    </div>
  );
}

function RoleTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
        active ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}
