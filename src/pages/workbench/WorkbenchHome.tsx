import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type Role,
  adminConfig,
  operatorConfig,
  operatorRailCards,
} from "@/data/gettingStarted";
import { GettingStartedHeader } from "@/components/getting-started/GettingStartedHeader";
import { SummaryStrip } from "@/components/getting-started/SummaryStrip";
import { EnvironmentBanner } from "@/components/getting-started/EnvironmentBanner";
import { MilestoneGrid } from "@/components/getting-started/MilestoneGrid";
import { OperatorRail } from "@/components/getting-started/OperatorRail";
import { FooterCallout } from "@/components/getting-started/FooterCallout";

export function WorkbenchHome() {
  const [role, setRole] = useState<Role>("admin");
  const config = role === "admin" ? adminConfig : operatorConfig;

  return (
    <div className="h-full w-full overflow-auto">
      <div className="flex flex-col gap-6 px-8 py-7">
        {/* Role switcher (prototype only) */}
        <div className="flex items-center justify-end">
          <div className="inline-flex rounded-lg border border-border-default bg-surface-muted p-0.5">
            <RoleTab label="Billing Manager" active={role === "admin"} onClick={() => setRole("admin")} />
            <RoleTab label="Billing Operator" active={role === "operator"} onClick={() => setRole("operator")} />
          </div>
        </div>

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

// ---------------------------------------------------------------------------
// Role switcher tab
// ---------------------------------------------------------------------------
function RoleTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-white text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}
