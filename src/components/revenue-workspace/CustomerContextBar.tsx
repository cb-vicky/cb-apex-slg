import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import type { RevenueArrangement } from "@/data/revrec-data";
import type { Stage } from "./RevenueJourneyRail";
import {
  deriveAllStageStatuses,
  derivePriorityChips,
  deriveContextMetrics,
  type PriorityChip,
  type ContextMetric,
  type StageStatus,
} from "./derive-stage-data";

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
}

export function CustomerContextBar({
  customer,
  quote,
  contract,
  invoice,
  arrangement,
  activeStage,
  onStageChange,
  disabledStages,
  from,
  recordId,
}: Props) {
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);
  const isStuck = useStuckOnScroll(barRef);

  const customerInvoices = getInvoices(customer.id);
  const stageStatuses = deriveAllStageStatuses(customer, quote, contract);
  const chips = derivePriorityChips(customer, customerInvoices, contract);
  const metrics = deriveContextMetrics(activeStage, customer, quote, contract, invoice, arrangement);
  const crumbs = buildCrumbs({ from, customerName: customer.name, customerId: customer.id, activeStage, recordId });

  return (
    <div
      ref={barRef}
      data-insight-rail-anchor=""
      className={cn(
        "sticky top-0 z-20 overflow-hidden rounded-tl-[24px] rounded-bl-[24px] bg-white",
        "border border-border-default",
        "transition-shadow duration-200 ease-out",
        isStuck && "shadow-[0_10px_20px_-6px_rgba(17,24,39,0.18)]",
      )}
    >
      {/* ROW 1 — breadcrumb + search */}
      <div className="flex h-11 items-center justify-between gap-3 px-6">
        <Breadcrumbs crumbs={crumbs} onNavigate={navigate} />
        <SearchInput />
      </div>

      {/* ROW 2 — title + priority chips (left)  ↔  dynamic metrics (right) */}
      <div className="flex items-center justify-between gap-4 px-6 pt-1 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-[24px] font-semibold leading-tight tracking-tight text-text-primary">
            {customer.name}
          </h1>
          {chips.length > 0 && (
            <div className="flex shrink-0 items-center gap-1.5">
              {chips.map((chip) => (
                <PriorityChipBadge key={`${chip.label}-${chip.value}`} chip={chip} />
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {metrics.map((m) => (
            <MetricInline key={m.label} metric={m} />
          ))}
        </div>
      </div>

      {/* ROW 3 — resource tabs (full-width, 24px side margins) */}
      <div className="flex items-stretch border-b border-border-default px-6">
        {STAGE_ORDER.map((stageId) => {
          const isActive = stageId === activeStage;
          const isDisabled = disabledStages?.has(stageId) ?? false;
          return (
            <TabButton
              key={stageId}
              label={stageDisplay[stageId].tab}
              status={stageStatuses[stageId]}
              active={isActive}
              disabled={isDisabled}
              onClick={() => !isDisabled && onStageChange(stageId)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
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

function SearchInput() {
  return (
    <div className="flex h-8 w-[280px] shrink-0 items-center gap-2 rounded-full border border-border-default bg-[#F7F7F8] px-3 text-[13px] text-text-muted">
      <Search size={14} className="shrink-0 opacity-80" strokeWidth={2.2} aria-hidden />
      <span className="flex-1 truncate">Search anything...</span>
      <kbd className="inline-flex shrink-0 items-center gap-0.5 font-medium text-blue-600">
        <span className="text-[13px] leading-none">⌘</span>
        <span className="text-[10px] leading-none">K</span>
      </kbd>
    </div>
  );
}

function PriorityChipBadge({ chip }: { chip: PriorityChip }) {
  const classes =
    chip.severity === "red"
      ? "bg-red-50 text-red-700 border border-red-100 border-l-2 border-l-red-400"
      : "bg-amber-50 text-amber-700 border border-amber-100 border-l-2 border-l-amber-400";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] uppercase tracking-wide leading-none",
        classes,
      )}
    >
      <span className="font-normal opacity-80">{chip.label}:</span>
      <span className="font-semibold">{chip.value}</span>
    </span>
  );
}

function MetricInline({ metric }: { metric: ContextMetric }) {
  return (
    <div className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border border-border-default bg-surface-muted/40 px-2 leading-none">
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{metric.label}</span>
      <span className="text-[12px] font-semibold tabular-nums text-text-primary">{metric.value}</span>
    </div>
  );
}

function TabButton({
  label,
  status,
  active,
  disabled,
  onClick,
}: {
  label: string;
  status: StageStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const dotClass = disabled ? "bg-gray-200" : dotColorFor(status.severity);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative -mb-px inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 pb-2.5 pt-1 text-[13px] transition-colors",
        disabled
          ? "cursor-not-allowed border-transparent text-text-muted/70"
          : active
          ? "border-blue-600 font-semibold text-blue-600"
          : "border-transparent font-medium text-text-secondary hover:border-border-default hover:text-text-primary",
      )}
    >
      {!active && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />}
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
    default:
      return "bg-gray-200";
  }
}

// Tracks whether a `sticky top-0` element is currently "stuck" — i.e., its
// nearest scrolling ancestor has scrolled past the top. Used to elevate the
// bar with a subtle shadow only when content is actually sliding underneath.
function useStuckOnScroll(ref: React.RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollParent = findScrollParent(el);
    const read = () => {
      const top =
        scrollParent === window
          ? window.scrollY
          : (scrollParent as HTMLElement).scrollTop;
      setStuck(top > 0);
    };

    read();
    scrollParent.addEventListener("scroll", read, { passive: true });
    return () => scrollParent.removeEventListener("scroll", read);
  }, [ref]);

  return stuck;
}

function findScrollParent(el: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY + style.overflow)) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}
