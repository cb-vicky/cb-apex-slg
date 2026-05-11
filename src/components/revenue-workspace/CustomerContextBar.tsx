import { useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn, currency } from "@/lib/utils";
import type { Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import type { RevenueArrangement } from "@/data/revrec-data";
import type { Stage } from "./RevenueJourneyRail";
import {
  deriveAllStageStatuses,
  mergeInvoiceStatuses,
  type StageStatus,
} from "./derive-stage-data";
import { useIngestContext } from "@/context/IngestContext";

// Display labels are intentionally decoupled from the internal Stage union so
// we can ship "Overview" / "Collections" labels without renaming the union.
const stageDisplay: Record<Stage, { tab: string; crumb: string }> = {
  customer: { tab: "Overview", crumb: "Overview" },
  quote: { tab: "Quotes", crumb: "Quote" },
  contract: { tab: "Contracts", crumb: "Contract" },
  invoicing: { tab: "Invoicing", crumb: "Invoice" },
  payment: { tab: "Collections", crumb: "Collection" },
  revrec: { tab: "RevRec", crumb: "Arrangement" },
};

const STAGE_ORDER: Stage[] = ["customer", "quote", "contract", "invoicing", "payment", "revrec"];

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
  overdue: "Overdue",
  "promise-to-pay": "Promise-to-pay",
  disputes: "Disputes",
  "blocked-missing-details": "Blocked – missing details",
};

interface Props {
  customer: Customer;
  quote: Quote | null;
  contract: Contract | null;
  invoice?: Invoice;
  arrangement?: RevenueArrangement;
  activeStage: Stage;
  onStageChange: (stage: Stage) => void;
  disabledStages?: Set<Stage>;
  from?: string;
  recordId?: string;
  /**
   * Slot rendered below the tabs row, inside the sticky frame, to host the
   * detail-record context bar (glass card). Pass `null`/`undefined` and the
   * rail collapses to just the tabs row.
   */
  recordSlot?: ReactNode;
}

export function CustomerContextBar({
  customer,
  quote,
  contract,
  activeStage,
  onStageChange,
  disabledStages,
  from,
  recordId,
  recordSlot,
}: Props) {
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);
  const { invoiceStatusOverrides } = useIngestContext();

  const customerInvoices = mergeInvoiceStatuses(
    getInvoices(customer.id),
    invoiceStatusOverrides,
  );
  const stageStatuses = deriveAllStageStatuses(customer, quote, contract, invoiceStatusOverrides);
  const headerChips = deriveHeaderChips(customer, customerInvoices);
  const crumbs = buildCrumbs({ from, customerName: customer.name, customerId: customer.id, activeStage, recordId });

  return (
    <div
      ref={barRef}
      data-insight-rail-anchor=""
      className="sticky top-0 z-20 bg-transparent"
    >
      {/* === Customer header (white, top-rounded to match canvas) === */}
      <div className="border-b border-border-default bg-white">
        {/* breadcrumb */}
        <div className="flex h-11 items-center px-6">
          <Breadcrumbs crumbs={crumbs} onNavigate={navigate} />
        </div>

        {/* title + owners + financial-health chips */}
        <div className="flex items-center justify-between gap-4 px-6 pt-1 pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-semibold leading-tight tracking-tight text-text-primary">
              {customer.name}
            </h1>
            <p className="mt-1 text-[12px] text-text-muted">
              AE: {customer.ae} | CSM: {customer.csm} | Billing: {customer.billingOwner}
            </p>
          </div>
          {headerChips.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {headerChips.map((chip) => (
                <HeaderChip key={chip.label} chip={chip} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === Tabs (edge-to-edge, no gap) === */}
      <div data-tabs-anchor="" className="flex items-stretch">
        {STAGE_ORDER.map((stageId, idx) => {
          const isActive = stageId === activeStage;
          const isDisabled = disabledStages?.has(stageId) ?? false;
          return (
            <TabButton
              key={stageId}
              label={stageDisplay[stageId].tab}
              status={stageStatuses[stageId]}
              active={isActive}
              disabled={isDisabled}
              isFirst={idx === 0}
              isLast={idx === STAGE_ORDER.length - 1}
              onClick={() => !isDisabled && onStageChange(stageId)}
            />
          );
        })}
      </div>

      {/* === Record context slot — glass card centered max-w-1200 (own backdrop-blur) === */}
      {recordSlot ? (
        <div className="px-6 pt-3 pb-4">
          <div className="mx-auto w-full max-w-[1200px]">{recordSlot}</div>
        </div>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header chips — financial health only (CREDITS, OPEN AR, HELD)
// Bracket-style: tinted bg, thin top/bottom border, thicker side accents.
// ---------------------------------------------------------------------------

interface HeaderChipDef {
  label: string;
  value: string;
  severity: "amber" | "red";
}

function deriveHeaderChips(customer: Customer, customerInvoices: Invoice[]): HeaderChipDef[] {
  const chips: HeaderChipDef[] = [];

  if (customer.openAr > 0) {
    chips.push({ label: "OPEN AR", value: currency(customer.openAr), severity: "red" });
  } else {
    const overdueCount = customerInvoices.filter((i) => i.status === "Overdue").length;
    if (overdueCount > 0) {
      chips.push({
        label: "OVERDUE",
        value: `${overdueCount} invoice${overdueCount > 1 ? "s" : ""}`,
        severity: "red",
      });
    }
  }

  if (customer.prepaidCreditTotal > 0) {
    const usedPct = Math.round(
      ((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100,
    );
    if (usedPct >= 50) {
      chips.push({ label: "CREDITS", value: `${usedPct}% used`, severity: "amber" });
    }
  }

  const heldCount = customerInvoices.filter((i) => i.holdReason).length;
  if (heldCount > 0) {
    chips.push({
      label: "HELD",
      value: `${heldCount} invoice${heldCount > 1 ? "s" : ""}`,
      severity: "amber",
    });
  }

  return chips;
}

function HeaderChip({ chip }: { chip: HeaderChipDef }) {
  const palette =
    chip.severity === "red"
      ? "border-red-300 bg-red-50/80 text-red-700"
      : "border-amber-300 bg-amber-50/80 text-amber-700";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] leading-4",
        // Bracket frame: 1px top/bottom + 3px left/right accents + tinted fill
        "rounded-sm border border-l-[3px] border-r-[3px]",
        palette,
      )}
    >
      <span className="font-semibold uppercase tracking-wide">{chip.label}:</span>
      <span className="font-bold text-text-primary tabular-nums">{chip.value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs (unchanged behavior)
// ---------------------------------------------------------------------------

interface Crumb {
  label: string;
  path?: string;
  kind?: "root" | "group" | "customer" | "record";
}

function buildCrumbs({
  from,
  customerName,
  customerId,
  activeStage,
  recordId,
}: {
  from?: string;
  customerName: string;
  customerId: string;
  activeStage: Stage;
  recordId?: string;
}): Crumb[] {
  const crumbs: Crumb[] = [];

  const [fromModule, fromGroup] = (from ?? "").split(":");
  const moduleKey = fromModule || defaultModuleForStage(activeStage);
  crumbs.push({
    label: moduleLabels[moduleKey] ?? "Customers",
    path: `/${moduleKey}`,
    kind: "root",
  });

  if (fromGroup) {
    crumbs.push({
      label: groupLabels[fromGroup] ?? fromGroup,
      path: `/${moduleKey}?group=${fromGroup}`,
      kind: "group",
    });
  }

  crumbs.push({
    label: customerName,
    path: `/customers/${customerId}`,
    kind: "customer",
  });

  if (activeStage !== "customer" && recordId) {
    crumbs.push({
      label: `${stageDisplay[activeStage].crumb} · ${recordId}`,
      kind: "record",
    });
  }

  return crumbs;
}

function defaultModuleForStage(stage: Stage): string {
  switch (stage) {
    case "quote":
      return "quotes";
    case "contract":
      return "contracts";
    case "invoicing":
      return "invoices";
    default:
      return "customers";
  }
}

function Breadcrumbs({
  crumbs,
  onNavigate,
}: {
  crumbs: Crumb[];
  onNavigate: (path: string) => void;
}) {
  return (
    <nav className="flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-[13px] leading-none text-text-muted [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const muted = crumb.kind === "customer";
        return (
          <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1">
            {idx > 0 && <ChevronRight size={12} className="text-text-muted/50" />}
            {crumb.path && !isLast ? (
              <button
                onClick={() => onNavigate(crumb.path!)}
                className={cn(
                  "transition-colors underline-offset-2 hover:underline",
                  muted
                    ? "text-text-muted hover:text-text-secondary"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {crumb.label}
              </button>
            ) : (
              <span className={cn("font-medium", isLast ? "text-text-primary" : "text-text-secondary")}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Tab — inverted card pill (sharp top, rounded bottom). Selected = blue solid.
// Edge-to-edge: no gap between tabs, only neighbour borders shared cleanly.
// ---------------------------------------------------------------------------

function TabButton({
  label,
  status,
  active,
  disabled,
  isFirst,
  isLast,
  onClick,
}: {
  label: string;
  status: StageStatus;
  active: boolean;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  const dotClass = disabled ? "bg-gray-300" : dotColorFor(status.severity);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex flex-1 items-center justify-center gap-1.5",
        "rounded-b-2xl rounded-t-none px-4 py-2.5 text-[13px] transition-all",
        "border-b border-r",
        // First tab: also draw left border
        isFirst && "border-l",
        // Last tab: nothing extra (right border already on)
        // Hide right border on the last tab so it sits flush with canvas edge
        isLast && "!border-r-0",
        active
          ? "z-[1] border-blue-600 bg-blue-600 font-semibold text-white shadow-[0_6px_14px_-4px_rgba(37,99,235,0.45)]"
          : disabled
          ? "cursor-not-allowed border-gray-200 bg-white text-text-muted/60"
          : "border-gray-200 bg-white font-medium text-text-secondary hover:border-gray-300 hover:text-text-primary",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          active ? "bg-white/90" : dotClass,
        )}
      />
      <span>{label}</span>
    </button>
  );
}

// Only three severities surface on tabs: danger (red), warning (amber), neutral (gray).
function dotColorFor(severity: StageStatus["severity"]): string {
  switch (severity) {
    case "red":
      return "bg-red-500";
    case "amber":
      return "bg-amber-500";
    case "green":
      return "bg-emerald-500";
    default:
      return "bg-gray-300";
  }
}
