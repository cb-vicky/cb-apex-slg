import {
  Fragment,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  forwardRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { SIDEBAR_LAYOUT_EVENT } from "@/components/layout/Sidebar";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import { getContractsForCustomer, getInvoices } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import type { Stage } from "./stage";
import {
  derivePriorityChips,
  mergeInvoiceStatuses,
  type PriorityChip,
  type StatusSeverity,
} from "./derive-stage-data";
import {
  buildMoreTabSubtitle,
  CONNECT_TAB_SUMMARY,
  MORE_TAB_DEFAULT_SUBTITLE,
  resolveWorkspaceTabSummary,
  TAB_STATUS_HOVER_CLASS,
  type TabSummary,
} from "./derive-tab-summaries";
import {
  buildTabStrip,
  EMPTY_VISIBILITY_OVERRIDES,
  findLastUnselectedVisibleTab,
  isTabClosable,
  resolveTabVisibility,
  tabKey,
  tabLabel,
  tabsEqual,
  STAGE_ORDER,
  type OpenRecordTab,
  type VisibilityOverrides,
  type WorkspaceTab,
} from "./workspace-tabs";

const SCROLL_THRESHOLD = 40;

/** Customer title stack — expanded / collapsed (breadcrumb lives in same row) */
const HEADER_TITLE_PT = { expanded: 18, collapsed: 8 } as const;
const HEADER_TITLE_PB = { expanded: 16, collapsed: 10 } as const;
const HEADER_TABS_GAP = { expanded: 12, collapsed: 10 } as const;
const MORE_BUTTON_WIDTH = 96;
const OVERFLOW_THRESHOLD = 1;
/** Negative margin overlap between adjacent folder tabs (px) — must match TAB_OVERLAP_CLASS */
const TAB_OVERLAP = 18;
const TAB_OVERLAP_CLASS = "-ml-[18px]";
/** Folder-tab corners — subtle left edge, curvy right edge */
const TAB_CORNER_RADIUS =
  "rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[36px] rounded-br-[36px]";
/** Minimum tab width (px) — keeps label + close control from colliding when many tabs are open */
const TAB_MIN_WIDTH_PARENT = 92;
const TAB_MIN_WIDTH_CLOSABLE = 160;
const TAB_MIN_WIDTH_CLASS = {
  parent: "min-w-[92px]",
  closable: "min-w-[160px]",
} as const;

function tabMinWidthPx(tab: WorkspaceTab): number {
  return isTabClosable(tab) ? TAB_MIN_WIDTH_CLOSABLE : TAB_MIN_WIDTH_PARENT;
}
const MEASURE_RETRY_MAX = 16;
const TAB_FLIP_EASING = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const TAB_FLIP_MS = 280;

const stageDisplay: Record<Stage, { tab: string; crumb: string }> = {
  customer: { tab: "Overview", crumb: "Overview" },
  tasks: { tab: "Tasks", crumb: "Tasks" },
  threads: { tab: "Threads", crumb: "Threads" },
  quote: { tab: "Quotes", crumb: "Quote" },
  contract: { tab: "Contracts", crumb: "Contract" },
  invoicing: { tab: "Invoicing", crumb: "Invoice" },
  payment: { tab: "Collections", crumb: "Collection" },
  revrec: { tab: "RevRec", crumb: "Arrangement" },
};

const DISABLED_TOOLTIP = "No content to show";
const EMPTY_DISABLED_STAGES = new Set<Stage>();

function overflowKeysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((k, i) => k === b[i]);
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
  overdue: "Overdue",
  "promise-to-pay": "Promise-to-pay",
  disputes: "Disputes",
  "blocked-missing-details": "Blocked – missing details",
};

interface Props {
  customer: Customer;
  activeTab: WorkspaceTab;
  hiddenParentStages: Set<Stage>;
  openRecordTabs: OpenRecordTab[];
  disabledStages?: Set<Stage>;
  from?: string;
  recordId?: string;
  onTabSelect: (tab: WorkspaceTab) => void;
  onParentClose: (stage: Stage) => void;
  onRecordClose: (stage: OpenRecordTab["stage"], recordId: string) => void;
  onRestoreParent: (stage: Stage) => void;
  parentTabSummaries?: Partial<Record<Stage, TabSummary>>;
  recordTabSummaries?: Record<string, TabSummary>;
  recordSlot?: ReactNode;
}

const TAB_COLLAPSE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const TAB_COLLAPSE_MS = "380ms";

function tabStatusClass(
  severity: StatusSeverity,
  active: boolean,
  group: "tab" | "connect" = "tab",
): string {
  const hoverPrefix = group === "connect" ? "group-hover/connect:" : "group-hover/tab:";
  const hover = TAB_STATUS_HOVER_CLASS[severity].replace("group-hover/tab:", hoverPrefix);
  if (active) {
    return cn("text-blue-100/80", `${hoverPrefix}text-blue-50`);
  }
  return cn("text-text-muted", hover);
}

export function CustomerContextBar({
  customer,
  activeTab,
  hiddenParentStages,
  openRecordTabs,
  disabledStages,
  from,
  recordId,
  onTabSelect,
  onParentClose,
  onRecordClose,
  onRestoreParent,
  parentTabSummaries = {},
  recordTabSummaries = {},
  recordSlot,
}: Props) {
  const navigate = useNavigate();
  const { invoiceStatusOverrides } = useIngestContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const rafRef = useRef<number>(0);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const visibleStripRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFlipRef = useRef<Map<string, DOMRect> | null>(null);
  const [measuredOverflowKeys, setMeasuredOverflowKeys] = useState<string[]>([]);
  const [visibilityOverrides, setVisibilityOverrides] =
    useState<VisibilityOverrides>(EMPTY_VISIBILITY_OVERRIDES);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  const activeStage = activeTab.kind === "parent" ? activeTab.stage : activeTab.stage;
  const disabled = disabledStages ?? EMPTY_DISABLED_STAGES;
  const activeTabKey = tabKey(activeTab);

  const fullStrip = buildTabStrip(hiddenParentStages, openRecordTabs, disabled);
  const stripSignature = fullStrip.map(tabKey).join("|");
  const fullStripRef = useRef(fullStrip);
  fullStripRef.current = fullStrip;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const hiddenParents = STAGE_ORDER.filter((s) => hiddenParentStages.has(s));
  const disabledParents = STAGE_ORDER.filter((s) => disabled.has(s));
  const needsMoreMenu = hiddenParents.length > 0 || disabledParents.length > 0;

  const commitMeasuredOverflow = useCallback((next: string[]) => {
    const valid = new Set(fullStripRef.current.map(tabKey));
    const filtered = next.filter((k) => valid.has(k));
    setMeasuredOverflowKeys((prev) => (overflowKeysEqual(prev, filtered) ? prev : filtered));
  }, []);

  useEffect(() => {
    setVisibilityOverrides(EMPTY_VISIBILITY_OVERRIDES);
  }, [stripSignature]);

  const captureVisibleTabPositions = useCallback(() => {
    const map = new Map<string, DOMRect>();
    visibleStripRef.current
      ?.querySelectorAll<HTMLElement>("[data-tab-key]")
      .forEach((el) => {
        const key = el.dataset.tabKey;
        if (key) map.set(key, el.getBoundingClientRect());
      });
    return map;
  }, []);

  const playTabStripFlip = useCallback((before: Map<string, DOMRect>) => {
    const nodes = visibleStripRef.current?.querySelectorAll<HTMLElement>("[data-tab-key]");
    if (!nodes?.length) return;

    nodes.forEach((el) => {
      const key = el.dataset.tabKey;
      if (!key) return;

      const prev = before.get(key);
      const next = el.getBoundingClientRect();

      if (!prev) {
        el.animate(
          [
            { opacity: 0, transform: "translateX(14px) scale(0.97)" },
            { opacity: 1, transform: "translateX(0) scale(1)" },
          ],
          { duration: TAB_FLIP_MS, easing: TAB_FLIP_EASING, fill: "forwards" },
        );
        return;
      }

      const dx = prev.left - next.left;
      if (Math.abs(dx) < 2) return;

      el.style.transform = `translateX(${dx}px)`;
      el.style.transition = "none";

      requestAnimationFrame(() => {
        el.style.transition = `transform ${TAB_FLIP_MS}ms ${TAB_FLIP_EASING}`;
        el.style.transform = "translateX(0)";
        const onEnd = () => {
          el.style.transition = "";
          el.style.transform = "";
          el.removeEventListener("transitionend", onEnd);
        };
        el.addEventListener("transitionend", onEnd);
      });
    });
  }, []);

  const measureOverflow = useCallback((): boolean => {
    const container = tabsContainerRef.current;
    if (!container || container.offsetWidth === 0) return false;

    const strip = fullStripRef.current;
    const widthOf = (key: string) => measureRefs.current.get(key)?.offsetWidth ?? 0;
    const moreWidth = widthOf("measure:more") || MORE_BUTTON_WIDTH;
    const maxTabsWidth = Math.max(
      0,
      container.offsetWidth * OVERFLOW_THRESHOLD - moreWidth + TAB_OVERLAP,
    );

    const tabWidths = strip.map((tab) => {
      const key = tabKey(tab);
      const isActive = tabsEqual(activeTabRef.current, tab);
      let natural = widthOf(`measure:${key}`);
      if (isTabClosable(tab) && isActive) {
        const expanded = widthOf(`measure:${key}:expanded`);
        const compact = natural;
        natural = expanded > 0 ? expanded : compact;
      }
      return Math.max(natural, tabMinWidthPx(tab));
    });

    if (tabWidths.some((w) => w === 0)) return false;

    const sumWithOverlap = (widths: number[]) => {
      if (widths.length === 0) return 0;
      return widths.reduce((sum, w, i) => sum + w - (i > 0 ? TAB_OVERLAP : 0), 0);
    };

    const stripWidth = sumWithOverlap(tabWidths);
    if (stripWidth <= maxTabsWidth && !needsMoreMenu) {
      commitMeasuredOverflow([]);
      return true;
    }

    let usedWidth = 0;
    const overflowKeys: string[] = [];

    for (let i = 0; i < strip.length; i++) {
      const key = tabKey(strip[i]);
      const tabWidth = tabWidths[i];
      const overlap = usedWidth > 0 ? TAB_OVERLAP : 0;
      const wouldFit = usedWidth + tabWidth - overlap <= maxTabsWidth;
      const forceFirst = overflowKeys.length === 0 && usedWidth === 0;

      if (wouldFit || forceFirst) {
        usedWidth += tabWidth - overlap;
      } else {
        overflowKeys.push(key);
      }
    }

    const activeKey = tabKey(activeTabRef.current);
    if (overflowKeys.includes(activeKey)) {
      const withoutActive = overflowKeys.filter((k) => k !== activeKey);
      for (let i = strip.length - 1; i >= 0; i--) {
        const key = tabKey(strip[i]);
        if (key !== activeKey && !withoutActive.includes(key)) {
          withoutActive.push(key);
          break;
        }
      }
      overflowKeys.length = 0;
      overflowKeys.push(...withoutActive);
    }

    commitMeasuredOverflow(overflowKeys);
    return true;
  }, [needsMoreMenu, commitMeasuredOverflow]);

  const measureOverflowRef = useRef(measureOverflow);
  measureOverflowRef.current = measureOverflow;

  useLayoutEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    let cancelled = false;
    let attempts = 0;

    const runMeasure = () => {
      if (cancelled) return;
      const ready = measureOverflowRef.current();
      if (!ready && attempts < MEASURE_RETRY_MAX) {
        attempts += 1;
        requestAnimationFrame(runMeasure);
      } else {
        attempts = 0;
      }
    };

    const scheduleMeasure = () => {
      attempts = 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(runMeasure);
      });
    };

    scheduleMeasure();

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(container);

    const mainScroll = document.querySelector<HTMLElement>("[data-main-scroll-container]");
    if (mainScroll) ro.observe(mainScroll);

    const onSidebarLayout = () => {
      scheduleMeasure();
    };
    window.addEventListener(SIDEBAR_LAYOUT_EVENT, onSidebarLayout);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener(SIDEBAR_LAYOUT_EVENT, onSidebarLayout);
    };
  }, [stripSignature, activeTabKey, needsMoreMenu, isCollapsed]);

  const { visible: visibleTabs, overflow: overflowTabs } = resolveTabVisibility(
    fullStrip,
    measuredOverflowKeys,
    visibilityOverrides,
  );
  const visibleTabKeys = visibleTabs.map(tabKey).join("|");
  /** Stretch visible tabs only when nothing overflows and mins still fit the bar. */
  const tabsFillWidth =
    overflowTabs.length === 0 &&
    (() => {
      const container = tabsContainerRef.current;
      if (!container || visibleTabs.length === 0) return true;
      const moreW = measureRefs.current.get("measure:more")?.offsetWidth ?? MORE_BUTTON_WIDTH;
      const maxW = Math.max(0, container.offsetWidth - moreW + TAB_OVERLAP);
      const minSum = visibleTabs.reduce(
        (sum, tab, i) => sum + tabMinWidthPx(tab) - (i > 0 ? TAB_OVERLAP : 0),
        0,
      );
      return minSum <= maxW;
    })();

  useLayoutEffect(() => {
    if (!pendingFlipRef.current) return;
    const before = pendingFlipRef.current;
    pendingFlipRef.current = null;
    playTabStripFlip(before);
  }, [visibleTabKeys, activeTabKey, playTabStripFlip]);

  const selectTab = useCallback(
    (tab: WorkspaceTab) => {
      const key = tabKey(tab);
      const { visible, overflow } = resolveTabVisibility(
        fullStripRef.current,
        measuredOverflowKeys,
        visibilityOverrides,
      );
      const isInOverflow = overflow.some((t) => tabKey(t) === key);

      if (!isInOverflow) {
        onTabSelect(tab);
        return;
      }

      const lastUnselected = findLastUnselectedVisibleTab(
        fullStripRef.current,
        visible,
        tab,
      );

      pendingFlipRef.current = captureVisibleTabPositions();

      if (lastUnselected) {
        const demoteKey = tabKey(lastUnselected);
        setVisibilityOverrides((prev) => {
          const promoted = new Set(prev.promotedToVisible);
          const demoted = new Set(prev.demotedToOverflow);
          promoted.add(key);
          demoted.add(demoteKey);
          promoted.delete(demoteKey);
          demoted.delete(key);
          return { promotedToVisible: promoted, demotedToOverflow: demoted };
        });
      }

      onTabSelect(tab);
    },
    [
      measuredOverflowKeys,
      visibilityOverrides,
      onTabSelect,
      captureVisibleTabPositions,
    ],
  );

  const setMeasureRef = (key: string, el: HTMLElement | null) => {
    if (el) measureRefs.current.set(key, el);
    else measureRefs.current.delete(key);
  };

  const moreMenuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (moreButtonRef.current?.contains(target)) return;
      if (moreMenuPanelRef.current?.contains(target)) return;
      setShowMoreDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreDropdown]);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>("[data-main-scroll-container]");
    if (!scrollContainer) return;

    const updateScrollState = () => {
      const top = scrollContainer.scrollTop;
      setIsScrolled(top > 0);
      setIsCollapsed(top > SCROLL_THRESHOLD);
    };
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScrollState);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(updateScrollState));
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const crumbs = buildCrumbs({
    from,
    customerName: customer.name,
    customerId: customer.id,
    activeStage,
    recordId,
  });

  const customerInvoices = useMemo(
    () => mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides),
    [customer.id, invoiceStatusOverrides],
  );

  const primaryContract = useMemo(() => {
    const contracts = getContractsForCustomer(customer.id);
    return contracts.find((c) => c.status === "Active") ?? contracts[0] ?? null;
  }, [customer.id]);

  const priorityChips = useMemo(
    () => derivePriorityChips(customer, customerInvoices, primaryContract),
    [customer, customerInvoices, primaryContract],
  );

  const moreOverflowSubtitle = buildMoreTabSubtitle(
    overflowTabs,
    hiddenParents,
    stageDisplay,
  );
  const moreTabSubtitle = moreOverflowSubtitle || MORE_TAB_DEFAULT_SUBTITLE;

  /** More is always shown — Connect and overflow tabs live in its menu. */
  const showMoreButton = true;

  /** Slot before More — without changing tab z-index rules. */
  const moreZIndex = (() => {
    if (visibleTabs.length === 0) return 1;
    const lastIdx = visibleTabs.length - 1;
    const lastTab = visibleTabs[lastIdx];
    const lastZ = tabsEqual(activeTab, lastTab) ? 50 : 10 - lastIdx;
    return Math.max(1, lastZ - 1);
  })();

  return (
    <div data-insight-rail-anchor="" className="sticky top-0 z-20 bg-transparent">
      <div
        className={cn(
          "bg-transparent transition-[background-color,backdrop-filter] duration-300 ease-out",
          isScrolled && "bg-gray-100/75 backdrop-blur-md backdrop-saturate-150",
        )}
      >
        <div
          className="flex items-end justify-between gap-4 rounded-br-[0px] pl-4 pr-8 transition-all duration-300 ease-out"
          style={{
            paddingTop: isCollapsed ? HEADER_TITLE_PT.collapsed : HEADER_TITLE_PT.expanded,
            paddingBottom: isCollapsed ? HEADER_TITLE_PB.collapsed : HEADER_TITLE_PB.expanded,
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Breadcrumbs crumbs={crumbs} onNavigate={navigate} collapsed={isCollapsed} />
            <h1
              className="truncate font-bold leading-tight tracking-tight text-text-primary transition-all duration-300 ease-out"
              style={{ fontSize: isCollapsed ? 16 : 28 }}
            >
              {customer.name}
            </h1>
            <CustomerTeamMeta customer={customer} collapsed={isCollapsed} />
          </div>
          <CustomerPriorityChips chips={priorityChips} collapsed={isCollapsed} />
        </div>
      </div>

      <div
        ref={tabsContainerRef}
        data-tabs-anchor=""
        className="relative -mt-px w-full min-w-0 overflow-x-clip overflow-y-visible"
      >
        {/* Off-screen measure row — stable widths; avoids visible-strip oscillation */}
        <div
          className="pointer-events-none absolute -left-[9999px] top-0 flex items-end"
          aria-hidden
        >
          {fullStrip.map((tab, idx) => {
            const key = tabKey(tab);
            const isActive = tabsEqual(activeTab, tab);
            const closable = isTabClosable(tab);
            const label = tabLabel(tab, stageDisplay);
            const summary = resolveWorkspaceTabSummary(
              tab,
              parentTabSummaries,
              recordTabSummaries,
            );
            return (
              <Fragment key={`measure-${key}`}>
                <WorkspaceTabButton
                  ref={(el) => setMeasureRef(`measure:${key}`, el)}
                  label={label}
                  subtitle={summary?.subtitle}
                  subtitleSeverity={summary?.severity}
                  active={isActive}
                  closable={closable}
                  first={idx === 0}
                  zIndex={0}
                  forMeasure
                  measureLayout="compact"
                  tabsCompact={false}
                  onClick={() => {}}
                  onClose={() => {}}
                />
                {closable && (
                  <WorkspaceTabButton
                    ref={(el) => setMeasureRef(`measure:${key}:expanded`, el)}
                    label={label}
                    subtitle={summary?.subtitle}
                    subtitleSeverity={summary?.severity}
                    active={isActive}
                    closable
                    first={false}
                    zIndex={0}
                    forMeasure
                    measureLayout="expanded"
                    tabsCompact={false}
                    onClick={() => {}}
                    onClose={() => {}}
                  />
                )}
              </Fragment>
            );
          })}
          <MoreTabButton
            ref={(el) => setMeasureRef("measure:more", el)}
            subtitle={moreTabSubtitle}
            tabsCompact={isCollapsed}
            isOpen={false}
            forMeasure
            onClick={() => {}}
          />
        </div>

        <div
          ref={visibleStripRef}
          className="flex w-full min-w-0 items-end overflow-x-clip overflow-y-visible pb-1 pr-6"
        >
        {visibleTabs.map((tab, idx) => {
          const key = tabKey(tab);
          const isActive = tabsEqual(activeTab, tab);
          const label = tabLabel(tab, stageDisplay);
          const closable = isTabClosable(tab);
          const summary = resolveWorkspaceTabSummary(
            tab,
            parentTabSummaries,
            recordTabSummaries,
          );
          return (
            <WorkspaceTabButton
              key={key}
              dataTabKey={key}
              label={label}
              subtitle={summary?.subtitle}
              subtitleSeverity={summary?.severity}
              active={isActive}
              closable={closable}
              first={idx === 0}
              zIndex={isActive ? 50 : 10 - idx}
              tabsCompact={isCollapsed}
              fillWidth={tabsFillWidth}
              onClick={() => selectTab(tab)}
              onClose={
                tab.kind === "parent"
                  ? () => onParentClose(tab.stage)
                  : () => onRecordClose(tab.stage, tab.recordId)
              }
            />
          );
        })}

        {showMoreButton && (
          <MoreMenu
            ref={moreButtonRef}
            menuPanelRef={moreMenuPanelRef}
            zIndex={moreZIndex}
            subtitle={moreTabSubtitle}
            tabsCompact={isCollapsed}
            isOpen={showMoreDropdown}
            onToggle={() => setShowMoreDropdown((v) => !v)}
            overflowTabs={overflowTabs}
            hiddenParents={hiddenParents}
            disabledParents={disabledParents}
            activeTab={activeTab}
            stageDisplay={stageDisplay}
            onTabSelect={(tab) => {
              selectTab(tab);
              setShowMoreDropdown(false);
            }}
            onRestoreParent={(stage) => {
              onRestoreParent(stage);
              setShowMoreDropdown(false);
            }}
          />
        )}
        </div>
      </div>

      {recordSlot ? (
        <div className="flex justify-end pl-4 pr-8 pt-3 pb-4">
          {recordSlot}
        </div>
      ) : (
        <div
          className="transition-all duration-300 ease-out"
          style={{
            height: isCollapsed ? HEADER_TABS_GAP.collapsed : HEADER_TABS_GAP.expanded,
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer header — team meta + priority chips
// ---------------------------------------------------------------------------

const PRIORITY_CHIP_TONE: Record<PriorityChip["severity"], string> = {
  red: "border-red-200/90 bg-red-50 text-red-800",
  amber: "border-amber-200/90 bg-amber-50 text-amber-900",
};

function CustomerTeamMeta({
  customer,
  collapsed,
}: {
  customer: Customer;
  collapsed?: boolean;
}) {
  return (
    <p
      className={cn(
        "pt-1.5 text-[12px] text-text-muted transition-all duration-300 ease-out",
        collapsed
          ? "pointer-events-none h-0 overflow-hidden pt-0 opacity-0"
          : "whitespace-nowrap",
      )}
    >
      AE: {customer.ae}&ensp;·&ensp;CSM: {customer.csm}&ensp;·&ensp;Billing:{" "}
      {customer.billingOwner}
    </p>
  );
}

function CustomerPriorityChips({
  chips,
  collapsed,
}: {
  chips: PriorityChip[];
  collapsed?: boolean;
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex max-w-[58%] shrink-0 flex-wrap items-end justify-end gap-1.5 pb-0.5 transition-all duration-300 ease-out",
        collapsed && "pointer-events-none opacity-0",
      )}
      aria-label="Customer priority signals"
    >
      {chips.map((chip) => (
        <span
          key={`${chip.label}-${chip.value}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight",
            PRIORITY_CHIP_TONE[chip.severity],
          )}
          title={`${chip.label}: ${chip.value}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-75">
            {chip.label}
          </span>
          <span className="font-semibold">{chip.value}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumbs
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
  collapsed,
}: {
  crumbs: Crumb[];
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}) {
  return (
    <nav
      className={cn(
        "flex w-full min-w-0 shrink-0 items-center gap-1 overflow-x-auto whitespace-nowrap leading-none text-text-muted transition-all duration-300 ease-out [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        collapsed ? "text-[11px]" : "text-[13px]",
      )}
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const muted = crumb.kind === "customer";
        return (
          <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight
                size={collapsed ? 10 : 12}
                className="text-text-muted/50 transition-all duration-300 ease-out"
              />
            )}
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
// Tab button — single selected state; optional close
// ---------------------------------------------------------------------------

const WorkspaceTabButton = forwardRef<
  HTMLDivElement,
  {
    label: string;
    subtitle?: string;
    subtitleSeverity?: StatusSeverity;
    active: boolean;
    closable: boolean;
    first: boolean;
    zIndex: number;
    dataTabKey?: string;
    forMeasure?: boolean;
    /** Off-screen sizing: compact (label only) vs expanded (with close). */
    measureLayout?: "compact" | "expanded";
    /** Collapsed context bar — hide subtitle row with animation. */
    tabsCompact?: boolean;
    /** Distribute tab width evenly across the full tab bar (no width overflow). */
    fillWidth?: boolean;
    onClick: () => void;
    onClose: () => void;
  }
>(function WorkspaceTabButton(
  {
    label,
    subtitle,
    subtitleSeverity = "gray",
    active,
    closable,
    first,
    zIndex,
    dataTabKey,
    forMeasure,
    measureLayout = "compact",
    tabsCompact = false,
    fillWidth = false,
    onClick,
    onClose,
  },
  ref,
) {
  const isExpandedLayout =
    forMeasure ? measureLayout === "expanded" : active || false;
  const hasSubtitle = Boolean(subtitle);
  const showSubtitleRow = hasSubtitle && !tabsCompact;
  const minWidthClass = closable ? TAB_MIN_WIDTH_CLASS.closable : TAB_MIN_WIDTH_CLASS.parent;

  return (
    <div
      ref={ref}
      data-tab-key={dataTabKey}
      className={cn(
        "group/tab relative",
        fillWidth ? cn("flex-1", minWidthClass) : "inline-flex",
        !forMeasure && !first && TAB_OVERLAP_CLASS,
      )}
      style={{ zIndex }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={forMeasure}
        tabIndex={forMeasure ? -1 : undefined}
        style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        className={cn(
          "relative inline-flex items-center justify-center text-center",
          minWidthClass,
          fillWidth ? "w-full max-w-none" : "w-max max-w-[220px]",
          TAB_CORNER_RADIUS,
          "border",
          "transition-[min-height,padding,gap,background-color,border-color,color,box-shadow]",
          showSubtitleRow
            ? cn("min-h-[56px] gap-1.5 py-2", closable ? "px-5 pr-9" : "px-5")
            : cn("min-h-[40px] gap-0 py-2.5", closable ? "px-5 pr-9" : "px-5"),
          active
            ? "border-blue-600 bg-blue-600 text-white shadow-[0_8px_18px_-4px_rgba(37,99,235,0.5)]"
            : cn(
                "border-gray-200 bg-white shadow-[0_3px_10px_-2px_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.06)]",
                "hover:border-gray-300 hover:bg-gray-100 hover:shadow-[0_6px_16px_-3px_rgba(0,0,0,0.16),0_2px_4px_0_rgba(0,0,0,0.06)]",
              ),
        )}
      >
        <span
          className={cn(
            "flex w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden text-center",
            showSubtitleRow ? "gap-1" : "gap-0",
          )}
          style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        >
          <span
            className={cn(
              "w-full truncate text-center text-[13px] leading-snug font-semibold transition-colors duration-200",
              active
                ? "text-white"
                : "text-text-secondary group-hover/tab:text-text-primary",
            )}
          >
            {label}
          </span>
          {hasSubtitle && (
            <span
              className={cn(
                "grid transition-[grid-template-rows,margin] ease-[cubic-bezier(0.32,0.72,0,1)]",
                showSubtitleRow ? "mt-0 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr]",
              )}
              style={{ transitionDuration: TAB_COLLAPSE_MS }}
            >
              <span className="min-h-0 overflow-hidden">
                <span
                  className={cn(
                    "block w-full truncate text-center text-[11px] leading-snug font-medium transition-[opacity,transform] ease-[cubic-bezier(0.32,0.72,0,1)]",
                    showSubtitleRow
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-0.5 opacity-0",
                    tabStatusClass(subtitleSeverity, active),
                  )}
                  style={{ transitionDuration: TAB_COLLAPSE_MS }}
                >
                  {subtitle}
                </span>
              </span>
            </span>
          )}
        </span>
        {closable && (
          <span
            role="button"
            tabIndex={forMeasure ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onClose();
              }
            }}
            className={cn(
              "absolute top-1/2 right-2 z-10 inline-flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center transition-opacity ease-out",
              isExpandedLayout
                ? "opacity-100"
                : "pointer-events-none opacity-0 group-hover/tab:pointer-events-auto group-hover/tab:opacity-100",
            )}
            style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
            aria-label={`Close ${label}`}
          >
            <span
              className={cn(
                "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full transition-colors duration-150",
                active
                  ? "text-white/90 hover:bg-white/20 hover:text-white"
                  : "text-text-muted hover:bg-gray-200/80 hover:text-text-secondary",
              )}
            >
              <X size={11} strokeWidth={2.5} />
            </span>
          </span>
        )}
      </button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// More tab + menu — width overflow, user-hidden parents, disabled parents
// ---------------------------------------------------------------------------

const MoreTabButton = forwardRef<
  HTMLDivElement,
  {
    subtitle: string;
    tabsCompact?: boolean;
    isOpen: boolean;
    forMeasure?: boolean;
    onClick: () => void;
  }
>(function MoreTabButton(
  { subtitle, tabsCompact = false, isOpen, forMeasure, onClick },
  ref,
) {
  const showSubtitleRow = !tabsCompact;

  return (
    <div
      ref={ref}
      className={cn(
        "group/more relative inline-flex shrink-0",
        !forMeasure && TAB_OVERLAP_CLASS,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={forMeasure}
        tabIndex={forMeasure ? -1 : undefined}
        style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        className={cn(
          "relative inline-flex w-max max-w-[240px] items-center justify-center text-center",
          TAB_CORNER_RADIUS,
          "border transition-[min-height,padding,gap,background-color,border-color,box-shadow]",
          showSubtitleRow
            ? "min-h-[56px] gap-1.5 px-5 py-2"
            : "min-h-[40px] px-5 py-2.5",
          isOpen
            ? "border-gray-300 bg-gray-100 shadow-[0_6px_16px_-3px_rgba(0,0,0,0.16),0_2px_4px_0_rgba(0,0,0,0.06)]"
            : cn(
                "border-gray-200 bg-white shadow-[0_3px_10px_-2px_rgba(0,0,0,0.14),0_1px_3px_0_rgba(0,0,0,0.06)]",
                "hover:border-gray-300 hover:bg-gray-100 hover:shadow-[0_6px_16px_-3px_rgba(0,0,0,0.16),0_2px_4px_0_rgba(0,0,0,0.06)]",
              ),
        )}
      >
        <span
          className={cn(
            "flex w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden text-center",
            showSubtitleRow ? "gap-1" : "gap-0",
          )}
          style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        >
          <span
            className={cn(
              "w-full truncate text-center text-[13px] font-semibold leading-snug transition-colors duration-200",
              isOpen
                ? "text-text-primary"
                : "text-text-secondary group-hover/more:text-text-primary",
            )}
          >
            More
          </span>
          <span
            className={cn(
              "grid transition-[grid-template-rows] ease-[cubic-bezier(0.32,0.72,0,1)]",
              showSubtitleRow ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
            style={{ transitionDuration: TAB_COLLAPSE_MS }}
          >
            <span className="min-h-0 overflow-hidden">
              <span
                className={cn(
                  "block w-full truncate text-center text-[11px] font-medium leading-snug text-text-muted transition-[opacity,transform] ease-[cubic-bezier(0.32,0.72,0,1)]",
                  showSubtitleRow
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-0.5 opacity-0",
                  "group-hover/more:text-text-secondary",
                )}
                style={{ transitionDuration: TAB_COLLAPSE_MS }}
              >
                {subtitle}
              </span>
            </span>
          </span>
        </span>
        <span
          className={cn(
            "absolute top-1/2 right-2.5 z-10 inline-flex w-4 -translate-y-1/2 items-center justify-center transition-opacity ease-out",
            isOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0 group-hover/more:pointer-events-auto group-hover/more:opacity-100",
          )}
          style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
          aria-hidden
        >
          <ChevronDown
            size={14}
            strokeWidth={2.2}
            className={cn(
              "shrink-0 text-text-muted transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>
    </div>
  );
});

const MoreMenu = forwardRef<
  HTMLDivElement,
  {
    menuPanelRef: RefObject<HTMLDivElement | null>;
    zIndex: number;
    subtitle: string;
    tabsCompact?: boolean;
    isOpen: boolean;
    onToggle: () => void;
    overflowTabs: WorkspaceTab[];
    hiddenParents: Stage[];
    disabledParents: Stage[];
    activeTab: WorkspaceTab;
    stageDisplay: Record<Stage, { tab: string; crumb: string }>;
    onTabSelect: (tab: WorkspaceTab) => void;
    onRestoreParent: (stage: Stage) => void;
  }
>(function MoreMenu(
  {
    menuPanelRef,
    zIndex,
    subtitle,
    tabsCompact = false,
    isOpen,
    onToggle,
    overflowTabs,
    hiddenParents,
    disabledParents,
    activeTab,
    stageDisplay,
    onTabSelect,
    onRestoreParent,
  },
  ref,
) {
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);

  const updateMenuPosition = useCallback(() => {
    const anchor = (ref as RefObject<HTMLDivElement | null>)?.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setMenuStyle({ top: rect.bottom + 6, left: rect.left });
  }, [ref]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const menuPanel = isOpen && menuStyle && (
    <div
      ref={menuPanelRef}
      role="menu"
      className={cn(
        "fixed z-[200] min-w-[200px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl",
        "animate-in fade-in slide-in-from-top-2 duration-150",
      )}
      style={{ top: menuStyle.top, left: menuStyle.left }}
    >
      {overflowTabs.map((tab) => {
        const isActive = tabsEqual(activeTab, tab);
        const label = tabLabel(tab, stageDisplay);
        return (
          <button
            key={tabKey(tab)}
            type="button"
            role="menuitem"
            onClick={() => onTabSelect(tab)}
            className={cn(
              "flex w-full items-center px-4 py-2 text-left text-[13px] transition-colors",
              isActive
                ? "bg-blue-50 font-semibold text-blue-700"
                : "font-medium text-text-primary hover:bg-gray-50",
            )}
          >
            {label}
          </button>
        );
      })}

      {hiddenParents.length > 0 && overflowTabs.length > 0 && (
        <div className="my-1.5 border-t border-gray-100" />
      )}

      {hiddenParents.map((stage) => (
        <button
          key={`hidden-${stage}`}
          type="button"
          role="menuitem"
          onClick={() => onRestoreParent(stage)}
          className="flex w-full items-center px-4 py-2 text-left text-[13px] font-medium text-text-primary transition-colors hover:bg-gray-50"
        >
          {stageDisplay[stage].tab}
        </button>
      ))}

      {disabledParents.length > 0 && (overflowTabs.length > 0 || hiddenParents.length > 0) && (
        <div className="my-1.5 border-t border-gray-100" />
      )}

      {disabledParents.map((stage) => (
        <div
          key={`disabled-${stage}`}
          title={DISABLED_TOOLTIP}
          className="flex w-full cursor-not-allowed items-center px-4 py-2 text-[13px] font-medium text-text-muted/60"
        >
          {stageDisplay[stage].tab}
        </div>
      ))}

      <div className="my-1.5 border-t border-gray-100" />

      <button
        type="button"
        role="menuitem"
        className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600">
          <Plus size={13} strokeWidth={2.5} aria-hidden className="shrink-0" />
          Connect
        </span>
        <span className="text-[11px] font-medium text-text-muted">
          {CONNECT_TAB_SUMMARY.subtitle}
        </span>
      </button>
    </div>
  );

  return (
    <div ref={ref} className="relative shrink-0" style={{ zIndex: isOpen ? 50 : zIndex }}>
      <MoreTabButton
        subtitle={subtitle}
        tabsCompact={tabsCompact}
        isOpen={isOpen}
        onClick={onToggle}
      />
      {menuPanel && createPortal(menuPanel, document.body)}
    </div>
  );
});
