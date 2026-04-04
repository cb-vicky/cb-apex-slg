import {
  adminConfig,
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

  return (
    <div className="h-full w-full overflow-auto">
      <div className="flex flex-col gap-6 px-8 py-7">
        {/* 1. Hero row */}
        <GettingStartedHeader role={role} config={config} />

        {/* 2. Progress / summary strip */}
        <SummaryStrip config={config} />

        {/* 3. Environment banner */}
        <EnvironmentBanner />

        {/* 4. Main milestone content */}
        {role === "admin" ? (
          <AdminLayout />
        ) : (
          <OperatorLayout />
        )}

        {/* 5. Footer callout */}
        <FooterCallout config={config.footerCallout} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin: full-width 2-column grid
// ---------------------------------------------------------------------------
function AdminLayout() {
  return (
    <MilestoneGrid
      title="Required before go-live"
      milestones={adminConfig.milestones}
      columns={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Operator: 8-col left + 4-col right rail
// ---------------------------------------------------------------------------
function OperatorLayout() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <MilestoneGrid
          title="Start here"
          milestones={operatorConfig.milestones}
          columns={1}
        />
      </div>
      <div className="col-span-4">
        <OperatorRail cards={operatorRailCards} />
      </div>
    </div>
  );
}
