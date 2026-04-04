import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Stage } from "./RevenueJourneyRail";

interface BreadcrumbInfo {
  from: string;
  customerName: string;
  activeStage: Stage;
  recordId?: string;
  actions?: React.ReactNode;
}

const moduleLabels: Record<string, string> = {
  customers: "Customers",
  quotes: "Quotes",
  contracts: "Contracts",
  invoices: "Invoices",
};

const groupLabels: Record<string, string> = {
  "renewals-30d": "Renewals in 30 days",
  "quotes-pending": "Quotes pending approval",
  "burn-down-risk": "Burn-down risk",
  "overdue-invoices": "Overdue invoices",
  "enforcement-mismatch": "Enforcement mismatches",
  "support-escalations": "Support escalations",
  "expansion-opportunity": "Expansion opportunity",
  "pending-approval": "Pending approval",
  "expiring-soon": "Expiring soon",
  "accepted-no-contract": "Accepted, no contract",
  "amendment-in-progress": "Amendment in progress",
  "crm-mismatch": "CRM sync mismatch",
  "non-standard-terms": "Non-standard terms",
  "pending-enforcement": "Pending enforcement",
  "invoice-review-pending": "Invoice review pending",
  "approaching-renewal": "Approaching renewal",
  "provisioning-issues": "Provisioning issues",
  "quote-mismatch": "Quote-to-contract mismatch",
  "min-commit-risk": "Min-commit risk",
  "amendments-in-progress": "Amendments in progress",
  "pending-review": "Pending review",
  "overdue": "Overdue",
  "promise-to-pay": "Promise-to-pay",
  "disputes": "Disputes",
  "blocked-missing-details": "Blocked – missing details",
};

const stageLabels: Record<string, string> = {
  customer: "Account 360",
  quote: "Quote",
  contract: "Contract",
  invoicing: "Invoicing",
  payment: "Payment",
  revrec: "Rev Rec",
};

function parseFrom(from: string): { module: string; group?: string; backPath: string; backLabel: string } {
  const [mod, group] = from.split(":");
  const moduleName = moduleLabels[mod] ?? mod;
  const backPath = group ? `/${mod}?group=${group}` : `/${mod}`;
  const backLabel = group ? `${moduleName} · ${groupLabels[group] ?? group}` : moduleName;
  return { module: mod, group, backPath, backLabel };
}

export function DetailBreadcrumb({ from, customerName, activeStage, recordId, actions }: BreadcrumbInfo) {
  const navigate = useNavigate();

  if (!from) return null;

  const { module, group } = parseFrom(from);
  const moduleName = moduleLabels[module] ?? module;

  const crumbs: { label: string; path?: string }[] = [];

  crumbs.push({ label: moduleName, path: `/${module}` });

  if (group) {
    crumbs.push({ label: groupLabels[group] ?? group, path: `/${module}?group=${group}` });
  }

  crumbs.push({ label: customerName });

  if (activeStage !== "customer" && recordId) {
    crumbs.push({ label: `${stageLabels[activeStage] ?? activeStage} · ${recordId}` });
  } else if (activeStage !== "customer") {
    crumbs.push({ label: stageLabels[activeStage] ?? activeStage });
  }

  return (
    <div className="flex h-9 min-h-9 items-center gap-3">
      <nav className="flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-[12px] leading-none text-text-muted [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <span key={idx} className="inline-flex items-center gap-1">
              {idx > 0 && <ChevronRight size={11} className="text-text-muted/50" />}
              {crumb.path && !isLast ? (
                <button
                  onClick={() => navigate(crumb.path!)}
                  className="text-text-secondary transition-colors hover:text-text-primary"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={isLast ? "font-medium text-text-primary" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      {actions && (
        <div className="ml-auto flex max-h-7 shrink-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {actions}
        </div>
      )}
    </div>
  );
}
