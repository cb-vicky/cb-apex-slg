import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import {
  type ExternalLinkedRecord,
  type CustomerHealthData,
  deriveCustomerHealth,
  getCustomerExternalLinkedRecords,
  mergeContractsWithRuntimeClosures,
} from "./derive-stage-data";

// ---------------------------------------------------------------------------
// Section open state (lifted to parent — persists across lifecycle tab switches once toggled)
// ---------------------------------------------------------------------------

export type InsightRailSectionKey = "accountDetails" | "openTasks" | "linkedRecords";

export type InsightRailSections = Record<InsightRailSectionKey, boolean>;

export const DEFAULT_INSIGHT_RAIL_SECTIONS: InsightRailSections = {
  accountDetails: false,
  openTasks: false,
  linkedRecords: false,
};

// ---------------------------------------------------------------------------
// Shared collapsible section wrapper (controlled)
// ---------------------------------------------------------------------------

function RailSection({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof ListChecks;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border-default last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted/60"
      >
        <Icon size={13} className="shrink-0 text-text-secondary" />
        <h4 className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-text-primary">
          {title}
        </h4>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-3 pb-3 pt-3">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("truncate text-right font-medium text-text-primary", valueClassName)}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function AccountDetailsSection({
  customer,
  health,
  open,
  onToggle,
}: {
  customer: Customer;
  health: CustomerHealthData;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <RailSection title="Account Details" icon={IdCard} open={open} onToggle={onToggle}>
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
          <DetailRow
            label="Churn risk"
            value={health.churnRisk}
            valueClassName={health.churnColor}
          />
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
    </RailSection>
  );
}

function OpenTasksSection({
  tasks,
  open,
  onToggle,
}: {
  tasks: Task[];
  open: boolean;
  onToggle: () => void;
}) {
  const openTasks = tasks.filter((t) => t.status === "Open");
  return (
    <RailSection
      title={`Open Tasks${openTasks.length > 0 ? ` · ${openTasks.length}` : ""}`}
      icon={ListChecks}
      open={open}
      onToggle={onToggle}
    >
      {openTasks.length === 0 ? (
        <p className="text-[12px] text-text-muted">No open tasks.</p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {openTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className="group w-full py-2.5 text-left first:pt-0 last:pb-0 transition-colors hover:bg-surface-muted/50 -mx-1 rounded px-1"
            >
              {/* Priority: neutral dot; priority color only on row hover */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
                    task.priority === "High" ? "group-hover:bg-red-400" : "group-hover:bg-amber-400",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 truncate text-[13px] font-medium leading-snug text-text-primary">
                  {task.title}
                </span>
              </div>
              {/* Meta aligned with title text (same inset as dot + gap) */}
              <div className="mt-0.5 flex gap-2">
                <span className="inline-block w-2 shrink-0" aria-hidden />
                <span className="text-[12px] leading-snug text-text-secondary">
                  {task.assignee} &middot; Due {shortDate(task.dueDate)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </RailSection>
  );
}

function LinkedRecordsSection({
  records,
  open,
  onToggle,
}: {
  records: ExternalLinkedRecord[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <RailSection
      title={`Linked Records${records.length > 0 ? ` · ${records.length}` : ""}`}
      icon={FileText}
      open={open}
      onToggle={onToggle}
    >
      {records.length === 0 ? (
        <p className="text-[12px] text-text-muted">No external records linked.</p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {records.map((r, idx) => (
            <LinkedRecordRow key={`${r.kind}-${r.value}-${idx}`} record={r} />
          ))}
        </div>
      )}
    </RailSection>
  );
}

function LinkedRecordRow({ record }: { record: ExternalLinkedRecord }) {
  const rowPad = "w-full py-2.5 text-left first:pt-0 last:pb-0 -mx-1 rounded px-1";

  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-text-secondary">{record.label}</p>
        <p className="mt-0.5 truncate text-[13px] font-medium leading-snug text-blue-600">
          {record.value}
        </p>
        {record.sublabel && (
          <p className="mt-0.5 truncate text-[11px] leading-snug text-text-muted">{record.sublabel}</p>
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

  return (
    <div className={cn("flex items-start gap-2", rowPad)}>
      {inner}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sticky fixed-height behavior (desktop only)
// ---------------------------------------------------------------------------

const DESKTOP_MQ = "(min-width: 1280px)";
const RAIL_GAP = 16;        // space between context bar and rail
const BOTTOM_MARGIN = 32;   // requested bottom margin

type RailMetrics = {
  stickyTop: number;          // offset inside scroll parent for `position: sticky`
  maxHeight: string;          // CSS value for the rail's fixed height
} | null;

function useRailMetrics(): RailMetrics {
  const [metrics, setMetrics] = useState<RailMetrics>(null);

  useLayoutEffect(() => {
    function measure() {
      if (typeof window === "undefined") return;
      const isDesktop = window.matchMedia(DESKTOP_MQ).matches;
      const anchor = document.querySelector<HTMLElement>("[data-insight-rail-anchor]");

      if (!isDesktop || !anchor) {
        setMetrics(null);
        return;
      }

      const barHeight = anchor.offsetHeight;
      const rect = anchor.getBoundingClientRect();
      // When the context bar is `sticky top-0` its top in the viewport equals
      // the scroll parent's viewport top. So the rail's viewport top, once stuck,
      // is rect.top + barHeight + RAIL_GAP. That yields a fixed height that
      // stays correct regardless of scroll position.
      const railTopInViewport = rect.top + barHeight + RAIL_GAP;
      const maxHeightPx = Math.max(240, window.innerHeight - railTopInViewport - BOTTOM_MARGIN);

      setMetrics({
        stickyTop: barHeight + RAIL_GAP,
        maxHeight: `${Math.round(maxHeightPx)}px`,
      });
    }

    measure();
    const mq = window.matchMedia(DESKTOP_MQ);
    mq.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      mq.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return metrics;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  tasks: Task[];
  customer: Customer;
  sections: InsightRailSections;
  onSectionToggle: (key: InsightRailSectionKey) => void;
}

export function InsightRail({ tasks, customer, sections, onSectionToggle }: Props) {
  const metrics = useRailMetrics();
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

  const allCollapsed =
    !sections.accountDetails && !sections.openTasks && !sections.linkedRecords;

  /** Fixed viewport height + internal scroll only when at least one section is expanded (desktop). */
  const fixedHeightMode = Boolean(metrics && !allCollapsed);

  // Internal scroll + overflow hint affordance (only when fixed-height mode)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState({ hasOverflow: false, atBottom: false });

  const updateHint = useCallback(() => {
    if (!fixedHeightMode) {
      setHint((prev) => (prev.hasOverflow || prev.atBottom ? { hasOverflow: false, atBottom: false } : prev));
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setHint((prev) =>
      prev.hasOverflow === hasOverflow && prev.atBottom === atBottom
        ? prev
        : { hasOverflow, atBottom },
    );
  }, [fixedHeightMode]);

  useLayoutEffect(() => {
    updateHint();
  }, [
    updateHint,
    fixedHeightMode,
    sections.accountDetails,
    sections.openTasks,
    sections.linkedRecords,
    tasks,
    customer.id,
    health.nps,
    linked.length,
  ]);

  useEffect(() => {
    if (!fixedHeightMode) return;
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateHint, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateHint) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", updateHint);
      ro?.disconnect();
    };
  }, [fixedHeightMode, updateHint]);

  function scrollDown() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.round(el.clientHeight * 0.7), behavior: "smooth" });
  }

  const showHint = fixedHeightMode && hint.hasOverflow && !hint.atBottom;

  return (
    <aside
      className="w-[320px] shrink-0 xl:sticky"
      style={
        metrics
          ? {
              top: `${metrics.stickyTop}px`,
              alignSelf: "start",
            }
          : undefined
      }
    >
      <div className="relative overflow-hidden rounded-lg border border-border-default bg-white">
        <div
          ref={scrollRef}
          style={
            fixedHeightMode && metrics ? { maxHeight: metrics.maxHeight } : undefined
          }
          className={cn(fixedHeightMode ? "overflow-y-auto" : "overflow-y-visible")}
        >
          <OpenTasksSection
            tasks={tasks}
            open={sections.openTasks}
            onToggle={() => onSectionToggle("openTasks")}
          />
          <AccountDetailsSection
            customer={customer}
            health={health}
            open={sections.accountDetails}
            onToggle={() => onSectionToggle("accountDetails")}
          />
          <LinkedRecordsSection
            records={linked}
            open={sections.linkedRecords}
            onToggle={() => onSectionToggle("linkedRecords")}
          />
        </div>

        {/* Overflow hint: bottom white gradient + floating "View more" chip.
            Only in fixed-height mode, when content overflows and not at bottom. */}
        {showHint && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent"
            />
            <button
              type="button"
              onClick={scrollDown}
              className={cn(
                "absolute bottom-3 left-1/2 -translate-x-1/2",
                "inline-flex items-center gap-1 rounded-full border border-border-default bg-white",
                "px-2.5 py-1 text-[11px] font-medium text-text-secondary",
                "shadow-[0_2px_8px_rgba(17,24,39,0.08)] transition-colors hover:bg-surface-muted/70",
              )}
            >
              View more
              <ChevronDown size={12} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
