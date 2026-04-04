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
  const { role } = useWorkbenchRole();
  const config = role === "admin" ? adminConfig : operatorConfig;
  const railCards = role === "admin" ? adminRailCards : operatorRailCards;
  const milestoneTitle = role === "admin" ? "Required before go-live" : "Start here";
  const milestones = config.milestones;

  return (
    <div className="h-full w-full overflow-auto">
      <div className="px-8 py-7">
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
          <div className="col-span-4">
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
