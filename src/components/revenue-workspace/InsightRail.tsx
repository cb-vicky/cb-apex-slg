import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { Task, Customer } from "@/data/mock-data";
import { getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { cn, shortDate } from "@/lib/utils";
import {
  ArrowUpRight,
  ChevronDown,
  FileText,
  IdCard,
  ListChecks,
  PanelRightClose,
  type LucideIcon,
} from "lucide-react";
import {
  type ExternalLinkedRecord,
  type CustomerHealthData,
  deriveCustomerHealth,
  getCustomerExternalLinkedRecords,
  mergeContractsWithRuntimeClosures,
} from "./derive-stage-data";

// ---------------------------------------------------------------------------
// Section state — kept for API compatibility with `CustomerRevenueWorkspace`.
// In the collapsed-rail design, "open section" is interpreted as "panel open
// with this section expanded". Only one section is expanded at a time.
// ---------------------------------------------------------------------------

export type InsightRailSectionKey = "openTasks" | "accountDetails" | "linkedRecords";

export type InsightRailSections = Record<InsightRailSectionKey, boolean>;

export const DEFAULT_INSIGHT_RAIL_SECTIONS: InsightRailSections = {
  openTasks: false,
  accountDetails: false,
  linkedRecords: false,
};

interface SectionDef {
  key: InsightRailSectionKey;
  title: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  { key: "openTasks", title: "Open Tasks", icon: ListChecks },
  { key: "accountDetails", title: "Account Details", icon: IdCard },
  { key: "linkedRecords", title: "Linked Records", icon: FileText },
];

interface Props {
  tasks: Task[];
  customer: Customer;
  /** Retained for API compatibility — controls which section is expanded in the open panel. */
  sections: InsightRailSections;
  onSectionToggle: (key: InsightRailSectionKey) => void;
}

// Distance from the customer-header+tabs anchor to where the icon stack sits.
// Includes a buffer for the optional record bar so the icons don't jump when
// switching between tabs that do/don't render a record card.
const ICON_TOP_OFFSET = 80;
const PANEL_WIDTH = 340;
const PANEL_RIGHT = 12;
const PANEL_BOTTOM_MARGIN = 24;

export function InsightRail({ tasks, customer, sections, onSectionToggle }: Props) {
  const iconTop = useFixedIconTop();
  const { contractClosures, contractGraceExtensions } = useIngestContext();

  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContracts = useMemo(
    () =>
      mergeContractsWithRuntimeClosures(
        getContractsForCustomer(customer.id),
        contractClosures,
        contractGraceExtensions,
      ),
    [customer.id, contractClosures, contractGraceExtensions],
  );
  const health = deriveCustomerHealth(customer);
  const linked = getCustomerExternalLinkedRecords(customer, customerQuotes, customerContracts);

  const openSection = SECTIONS.find((s) => sections[s.key])?.key ?? null;
  const isOpen = openSection !== null;

  const openTasks = useMemo(() => tasks.filter((t) => t.status === "Open"), [tasks]);
  const counts: Record<InsightRailSectionKey, number> = {
    openTasks: openTasks.length,
    accountDetails: 0,
    linkedRecords: linked.length,
  };

  function openPanelAt(next: InsightRailSectionKey) {
    if (openSection && openSection !== next) onSectionToggle(openSection);
    if (!sections[next]) onSectionToggle(next);
  }

  function toggleSection(next: InsightRailSectionKey) {
    if (next === openSection) {
      // Collapse current — keep panel open but no section expanded
      onSectionToggle(next);
      return;
    }
    if (openSection) onSectionToggle(openSection);
    onSectionToggle(next);
  }

  function closeRail() {
    if (openSection) onSectionToggle(openSection);
  }

  // Push main content over when the panel is open.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-workspace-content]");
    if (!root) return;
    if (isOpen) {
      root.style.paddingRight = `${PANEL_WIDTH + PANEL_RIGHT + 12}px`;
    } else {
      root.style.paddingRight = "";
    }
    return () => {
      root.style.paddingRight = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* === Floating icon stack (visible when panel is closed) === */}
      <aside
        aria-hidden={isOpen}
        className={cn(
          "fixed z-30 hidden pr-4 transition-opacity duration-150 xl:block",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{ top: iconTop, right: PANEL_RIGHT }}
      >
        <div className="flex flex-col items-center gap-2 rounded-full border border-border-default bg-white p-1 shadow-[0_6px_18px_-8px_rgba(17,24,39,0.18)]">
          {SECTIONS.map((section) => (
            <RailIconButton
              key={section.key}
              icon={section.icon}
              label={section.title}
              count={counts[section.key]}
              active={false}
              onClick={() => openPanelAt(section.key)}
            />
          ))}
        </div>
      </aside>

      {/* === Panel === */}
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed z-30 hidden flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-[0_18px_40px_-16px_rgba(17,24,39,0.25)] transition-all duration-200 ease-out xl:flex",
          isOpen ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0",
        )}
        style={{
          top: iconTop,
          right: PANEL_RIGHT,
          width: PANEL_WIDTH,
          maxHeight: `calc(100vh - ${iconTop + PANEL_BOTTOM_MARGIN}px)`,
        }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Insights</h3>
          <button
            type="button"
            onClick={closeRail}
            aria-label="Collapse insights"
            className="group/cb relative inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <PanelRightClose size={14} />
            <Tooltip>Collapse</Tooltip>
          </button>
        </div>

        {/* Scrollable accordion body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {SECTIONS.map((section) => (
            <AccordionSection
              key={section.key}
              title={section.title}
              icon={section.icon}
              count={counts[section.key]}
              open={section.key === openSection}
              onToggle={() => toggleSection(section.key)}
            >
              {section.key === "openTasks" && <OpenTasksBody tasks={openTasks} />}
              {section.key === "accountDetails" && (
                <AccountDetailsBody customer={customer} health={health} />
              )}
              {section.key === "linkedRecords" && <LinkedRecordsBody records={linked} />}
            </AccordionSection>
          ))}
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Icon button + tooltip
// ---------------------------------------------------------------------------

function RailIconButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group/ib relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <Icon size={16} strokeWidth={1.9} />
      {!active && count !== undefined && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {count}
        </span>
      )}
      <Tooltip>{label}</Tooltip>
    </button>
  );
}

/**
 * Left-side hover tooltip. Parent must include `group/ib` (icon button) or
 * `group/cb` (collapse button) so we can target the right hover scope.
 */
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium leading-none text-white opacity-0 shadow-md transition-opacity",
        "group-hover/ib:opacity-100 group-hover/cb:opacity-100",
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Accordion section
// ---------------------------------------------------------------------------

function AccordionSection({
  title,
  icon: Icon,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: LucideIcon;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60"
      >
        <Icon size={14} className="shrink-0 text-text-secondary" />
        <h4 className="flex-1 text-[12px] font-semibold uppercase tracking-wider text-text-primary">{title}</h4>
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 text-[10px] font-semibold leading-4",
              open ? "bg-blue-600 text-white" : "bg-gray-200 text-text-secondary",
            )}
          >
            {count}
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section bodies
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5 text-[14px]">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("truncate text-right font-medium text-text-primary", valueClassName)}>{value}</span>
    </div>
  );
}

function AccountDetailsBody({
  customer,
  health,
}: {
  customer: Customer;
  health: CustomerHealthData;
}) {
  return (
    <div className="text-[13px]">
      <div className="space-y-1.5">
        <DetailRow label="NPS" value={health.nps} />
        <DetailRow label="Support tickets (30d)" value={health.supportTickets30d} />
        {health.openEscalations > 0 && (
          <DetailRow
            label="Open escalations"
            value={health.openEscalations}
            valueClassName="text-red-600"
          />
        )}
        <DetailRow label="Churn risk" value={health.churnRisk} valueClassName={health.churnColor} />
      </div>

      <div className="mt-2.5 space-y-1.5 border-t border-border-subtle pt-2.5">
        <DetailRow label="Segment" value={`${customer.segment} · ${customer.tier}`} />
        <DetailRow label="Industry" value={customer.industry} />
        <DetailRow label="Region" value={customer.region} />
        <DetailRow label="Customer since" value={shortDate(customer.createdAt)} />
      </div>

      <div className="mt-2.5 space-y-1.5 border-t border-border-subtle pt-2.5">
        <DetailRow label="Account" value={customer.commercialAccount} />
        <DetailRow label="Billing Entity" value={customer.billingLegalEntity} />
        <DetailRow label="CB Entity" value={customer.chargebeeEntity} />
      </div>

      <div className="mt-2.5 space-y-1.5 border-t border-border-subtle pt-2.5">
        <DetailRow label="AE" value={customer.ae} />
        <DetailRow label="CSM" value={customer.csm} />
        <DetailRow label="Billing Owner" value={customer.billingOwner} />
      </div>
    </div>
  );
}

function OpenTasksBody({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <p className="text-[13px] text-text-muted">No open tasks.</p>;
  return (
    <div className="divide-y divide-border-subtle">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className="group w-full py-2.5 text-left first:pt-0 last:pb-0 -mx-1 rounded px-1 transition-colors hover:bg-surface-muted/50"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
                task.priority === "High" ? "group-hover:bg-red-400" : "group-hover:bg-amber-400",
              )}
              aria-hidden
            />
            <span className="min-w-0 truncate text-[14px] font-medium leading-snug text-text-primary">
              {task.title}
            </span>
          </div>
          <div className="mt-1 flex gap-2">
            <span className="inline-block w-2 shrink-0" aria-hidden />
            <span className="text-[13px] leading-snug text-text-secondary">
              {task.assignee} &middot; Due {shortDate(task.dueDate)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function LinkedRecordsBody({ records }: { records: ExternalLinkedRecord[] }) {
  if (records.length === 0)
    return <p className="text-[13px] text-text-muted">No external records linked.</p>;
  return (
    <div className="divide-y divide-border-subtle">
      {records.map((r, idx) => (
        <LinkedRecordRow key={`${r.kind}-${r.value}-${idx}`} record={r} />
      ))}
    </div>
  );
}

function LinkedRecordRow({ record }: { record: ExternalLinkedRecord }) {
  const rowPad = "w-full py-2.5 text-left first:pt-0 last:pb-0 -mx-1 rounded px-1";
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-text-secondary">{record.label}</p>
        <p className="mt-0.5 truncate text-[14px] font-medium leading-snug text-blue-600">{record.value}</p>
        {record.sublabel && (
          <p className="mt-0.5 truncate text-[12px] leading-snug text-text-muted">{record.sublabel}</p>
        )}
      </div>
      {record.href && (
        <ArrowUpRight
          size={14}
          strokeWidth={2}
          className="mt-0.5 shrink-0 text-text-muted opacity-80"
          aria-hidden
        />
      )}
    </>
  );

  if (record.href) {
    return (
      <a
        href={record.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("flex items-start gap-2 transition-colors hover:bg-surface-muted/50", rowPad)}
      >
        {inner}
      </a>
    );
  }
  return <div className={cn("flex items-start gap-2", rowPad)}>{inner}</div>;
}

// ---------------------------------------------------------------------------
// Fixed icon top — anchored to the BOTTOM of the customer header + tabs row
// (i.e. the part of the sticky bar that doesn't change height across tabs).
// Adds a buffer so the icons clear the optional record bar without moving when
// the user navigates between lifecycle tabs.
// ---------------------------------------------------------------------------

function useFixedIconTop(): number {
  const [top, setTop] = useState(220);

  useLayoutEffect(() => {
    function measure() {
      const anchor = document.querySelector<HTMLElement>("[data-tabs-anchor]");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setTop(Math.round(rect.bottom + ICON_TOP_OFFSET));
    }
    measure();

    // Observe ONLY layout-affecting changes (resize, font-load), not React state
    // changes that bubble up through stickyTop measurement. We deliberately do
    // NOT remeasure on scroll — sticky elements report consistent rect.bottom.
    const anchor = document.querySelector<HTMLElement>("[data-tabs-anchor]");
    const ro = anchor && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (anchor && ro) ro.observe(anchor);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return top;
}
