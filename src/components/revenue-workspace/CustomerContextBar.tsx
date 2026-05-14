import { useRef, useState, useEffect, useLayoutEffect, useCallback, forwardRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import type { RevenueArrangement } from "@/data/revrec-data";
import type { Stage } from "./RevenueJourneyRail";

/** Stages that support the list-then-detail pattern with grouped sub-tabs */
const LIST_DETAIL_STAGES: Stage[] = ["quote", "contract", "invoicing"];

const SCROLL_THRESHOLD = 40;

/** Minimum width reserved for the "More" button when it's needed */
const MORE_BUTTON_WIDTH = 72;

/** Threshold: if tabs exceed this % of container width, show "More" */
const OVERFLOW_THRESHOLD = 0.70;

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

/** Open child records for each list-detail stage */
export interface OpenChildTabs {
  quote: string[];
  contract: string[];
  invoicing: string[];
}

/** Currently selected child per stage (which sub-tab is active) */
export interface SelectedChildPerStage {
  quote?: string;
  contract?: string;
  invoicing?: string;
}

const STAGE_ORDER: Stage[] = ["customer", "tasks", "threads", "quote", "contract", "invoicing", "payment", "revrec"];

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
  /** All open child tabs across stages (persistent until explicitly closed) */
  openChildTabs: OpenChildTabs;
  /** Currently selected child for each stage */
  selectedChild: SelectedChildPerStage;
  /** Called when user selects a child tab */
  onChildSelect: (stage: "quote" | "contract" | "invoicing", childId: string) => void;
  /** Called when user closes a specific child tab */
  onChildClose: (stage: "quote" | "contract" | "invoicing", childId: string) => void;
  /** Called when user clicks the parent tab to return to list view */
  onParentClick: (stage: "quote" | "contract" | "invoicing") => void;
  /**
   * Slot rendered below the tabs row, inside the sticky frame, to host the
   * detail-record context bar (glass card). Pass `null`/`undefined` and the
   * rail collapses to just the tabs row.
   */
  recordSlot?: ReactNode;
}

export function CustomerContextBar({
  customer,
  activeStage,
  onStageChange,
  disabledStages,
  from,
  recordId,
  openChildTabs,
  selectedChild,
  onChildSelect,
  onChildClose,
  onParentClick,
  recordSlot,
}: Props) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rafRef = useRef<number>(0);

  // Overflow state
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<Stage | "connect", HTMLElement>>(new Map());
  const [overflowStages, setOverflowStages] = useState<Stage[]>([]);
  const [connectInOverflow, setConnectInOverflow] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  // Animation state for FLIP
  const prevActiveStage = useRef<Stage | null>(null);
  const tabPositions = useRef<Map<Stage | "connect", DOMRect>>(new Map());
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingAnimation = useRef(false);
  
  // Prevent clicks during animation
  const animatingStyle = isAnimating ? { pointerEvents: "none" as const } : undefined;

  // Reorder stages: active stage first, then rest in natural order
  const orderedStages = useCallback((): Stage[] => {
    const rest = STAGE_ORDER.filter((s) => s !== activeStage);
    return [activeStage, ...rest];
  }, [activeStage]);

  // Capture current tab positions
  const capturePositions = useCallback(() => {
    const positions = new Map<Stage | "connect", DOMRect>();
    tabRefs.current.forEach((el, stageId) => {
      positions.set(stageId, el.getBoundingClientRect());
    });
    return positions;
  }, []);

  // Capture positions before activeStage change triggers re-render
  // This runs synchronously when activeStage prop changes but before DOM updates
  if (prevActiveStage.current !== null && prevActiveStage.current !== activeStage && !pendingAnimation.current) {
    // Capture "before" positions right now, before React updates the DOM
    tabPositions.current = capturePositions();
    pendingAnimation.current = true;
  }

  // FLIP Animation: Animate tabs after DOM has been updated
  useLayoutEffect(() => {
    // First render: just initialize
    if (prevActiveStage.current === null) {
      prevActiveStage.current = activeStage;
      tabPositions.current = capturePositions();
      return;
    }

    // No pending animation
    if (!pendingAnimation.current) {
      return;
    }

    pendingAnimation.current = false;
    const prevPositions = tabPositions.current;
    
    // Calculate deltas between old and new positions
    const animations: { el: HTMLElement; deltaX: number }[] = [];
    
    tabRefs.current.forEach((el, stageId) => {
      const prevRect = prevPositions.get(stageId);
      if (!prevRect) return;
      
      const newRect = el.getBoundingClientRect();
      const deltaX = prevRect.left - newRect.left;
      
      if (Math.abs(deltaX) > 2) {
        animations.push({ el, deltaX });
      }
    });

    if (animations.length > 0) {
      setIsAnimating(true);
      
      // FLIP - Invert: Apply inverse transform instantly (appear at old position)
      animations.forEach(({ el, deltaX }) => {
        el.style.transform = `translateX(${deltaX}px)`;
        el.style.transition = "none";
      });

      // Force reflow to ensure transform is applied
      void tabsContainerRef.current?.offsetHeight;

      // FLIP - Play: Animate to final position (new position)
      requestAnimationFrame(() => {
        animations.forEach(({ el }) => {
          el.style.transition = "transform 600ms cubic-bezier(0.25, 0.1, 0.25, 1)";
          el.style.transform = "translateX(0)";
        });

        // Clean up after animation completes
        setTimeout(() => {
          animations.forEach(({ el }) => {
            el.style.transform = "";
            el.style.transition = "";
          });
          setIsAnimating(false);
        }, 600);
      });
    }

    prevActiveStage.current = activeStage;
    // Update stored positions for next animation
    tabPositions.current = capturePositions();
  }, [activeStage, capturePositions]);

  // Measure and determine overflow based on 70% threshold
  const measureOverflow = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const maxTabsWidth = containerWidth * OVERFLOW_THRESHOLD;
    const stages = orderedStages();
    
    // Measure total width of all tabs including Connect
    let totalWidth = 0;
    for (const stageId of stages) {
      const tabEl = tabRefs.current.get(stageId);
      if (tabEl) {
        totalWidth += tabEl.offsetWidth - 12; // Account for negative margin overlap
      }
    }
    totalWidth += 12; // Add back first tab's full width (no overlap)
    
    const connectEl = tabRefs.current.get("connect");
    const connectWidth = connectEl?.offsetWidth ?? 80;
    totalWidth += connectWidth - 12; // Connect also overlaps

    // If total width exceeds threshold, start overflow
    if (totalWidth > maxTabsWidth) {
      let usedWidth = 0;
      const visible: Stage[] = [];
      const overflow: Stage[] = [];

      // First, measure each tab and determine what fits
      for (const stageId of stages) {
        const tabEl = tabRefs.current.get(stageId);
        if (!tabEl) continue;

        const tabWidth = tabEl.offsetWidth;
        const marginAdjust = visible.length > 0 ? 12 : 0;
        const wouldFit = usedWidth + tabWidth - marginAdjust + MORE_BUTTON_WIDTH <= maxTabsWidth;

        if (wouldFit || visible.length === 0) {
          visible.push(stageId);
          usedWidth += tabWidth - marginAdjust;
        } else {
          overflow.push(stageId);
        }
      }

      // Check if Connect fits
      const connectFits = usedWidth + connectWidth - 12 + MORE_BUTTON_WIDTH <= maxTabsWidth;

      setOverflowStages(overflow);
      setConnectInOverflow(!connectFits);
    } else {
      // Everything fits, no overflow
      setOverflowStages([]);
      setConnectInOverflow(false);
    }
  }, [orderedStages]);

  // ResizeObserver for container
  useLayoutEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      measureOverflow();
    });
    ro.observe(container);

    // Initial measurement
    requestAnimationFrame(() => {
      measureOverflow();
    });

    return () => ro.disconnect();
  }, [measureOverflow]);

  // Re-measure when active stage or child tabs change
  useEffect(() => {
    requestAnimationFrame(() => {
      measureOverflow();
    });
  }, [activeStage, openChildTabs, measureOverflow]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showMoreDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreButtonRef.current && !moreButtonRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreDropdown]);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>("[data-main-scroll-container]");
    if (!scrollContainer) return;

    const updateCollapsed = () => {
      setIsCollapsed(scrollContainer.scrollTop > SCROLL_THRESHOLD);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateCollapsed);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    
    requestAnimationFrame(() => {
      requestAnimationFrame(updateCollapsed);
    });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const crumbs = buildCrumbs({ from, customerName: customer.name, customerId: customer.id, activeStage, recordId });

  // Get visible stages (ordered, excluding overflow)
  const visibleStages = orderedStages().filter((s) => !overflowStages.includes(s));

  // Check if More button should be shown
  const showMoreButton = overflowStages.length > 0 || connectInOverflow;

  // Register tab ref
  const setTabRef = (stageId: Stage | "connect", el: HTMLElement | null) => {
    if (el) {
      tabRefs.current.set(stageId, el);
    } else {
      tabRefs.current.delete(stageId);
    }
  };

  return (
    <div data-insight-rail-anchor="" className="sticky top-0 z-20 bg-transparent">
      {/* === Customer header (white, top-rounded to match canvas) === */}
      <div className="rounded-br-[24px] border-b border-border-default bg-white">
        {/* breadcrumb */}
        <div
          className="flex items-center px-6 transition-all duration-300 ease-out"
          style={{ height: isCollapsed ? 32 : 44 }}
        >
          <Breadcrumbs crumbs={crumbs} onNavigate={navigate} collapsed={isCollapsed} />
        </div>

        {/* title + owners */}
        <div
          className="flex items-end justify-between gap-4 px-6 transition-all duration-300 ease-out"
          style={{
            paddingTop: isCollapsed ? 0 : 4,
            paddingBottom: isCollapsed ? 8 : 16,
          }}
        >
          <h1
            className="min-w-0 truncate font-semibold leading-tight tracking-tight text-text-primary transition-all duration-300 ease-out"
            style={{ fontSize: isCollapsed ? 16 : 26 }}
          >
            {customer.name}
          </h1>
          <p
            className="shrink-0 whitespace-nowrap text-[12px] text-text-muted pb-[3px] transition-all duration-300 ease-out origin-right"
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? 'translateX(20px)' : 'translateX(0)',
              pointerEvents: isCollapsed ? 'none' : 'auto',
            }}
          >
            AE: {customer.ae}&ensp;·&ensp;CSM: {customer.csm}&ensp;·&ensp;Billing: {customer.billingOwner}
          </p>
        </div>
      </div>

      {/* === Tabs — pulled up 1px to collapse header's bottom border === */}
      <div ref={tabsContainerRef} data-tabs-anchor="" className="-mt-px flex items-end" style={animatingStyle}>
        {visibleStages.map((stageId, idx) => {
          const isActive = stageId === activeStage;
          const isDisabled = disabledStages?.has(stageId) ?? false;
          const isListDetailStage = LIST_DETAIL_STAGES.includes(stageId);
          
          const stageKey = stageId as "quote" | "contract" | "invoicing";
          const openChildren = isListDetailStage ? openChildTabs[stageKey] : [];
          const hasOpenChildren = openChildren.length > 0;
          const currentSelectedChild = isListDetailStage ? selectedChild[stageKey] : undefined;

          if (hasOpenChildren) {
            const isExpanded = isActive;
            
            return (
              <GroupedTabButton
                key={stageId}
                ref={(el) => setTabRef(stageId, el)}
                parentLabel={stageDisplay[stageId].tab}
                childIds={openChildren}
                selectedChildId={currentSelectedChild}
                isExpanded={isExpanded}
                first={idx === 0}
                zIndex={isActive ? 50 : 10 - idx}
                onParentClick={() => onParentClick(stageKey)}
                onChildSelect={(childId) => {
                  onStageChange(stageId);
                  onChildSelect(stageKey, childId);
                }}
                onChildClose={(childId) => onChildClose(stageKey, childId)}
                onExpandClick={() => onStageChange(stageId)}
              />
            );
          }

          return (
            <TabButton
              key={stageId}
              ref={(el) => setTabRef(stageId, el)}
              label={stageDisplay[stageId].tab}
              active={isActive}
              disabled={isDisabled}
              first={idx === 0}
              zIndex={isActive ? 50 : 10 - idx}
              onClick={() => !isDisabled && onStageChange(stageId)}
            />
          );
        })}

        {/* More dropdown for overflow tabs */}
        {showMoreButton && (
          <MoreTabButton
            ref={moreButtonRef}
            stages={overflowStages}
            activeStage={activeStage}
            disabledStages={disabledStages}
            stageDisplay={stageDisplay}
            openChildTabs={openChildTabs}
            showConnect={connectInOverflow}
            isOpen={showMoreDropdown}
            onToggle={() => setShowMoreDropdown((v) => !v)}
            onStageSelect={(stageId) => {
              onStageChange(stageId);
              setShowMoreDropdown(false);
            }}
            zIndex={1}
          />
        )}

        {/* Connect tab - only show if not in overflow */}
        <ConnectTab
          ref={(el) => setTabRef("connect", el)}
          zIndex={0}
          hidden={connectInOverflow}
        />
      </div>

      {/* === Record context slot — aligned to start of parent tab === */}
      {recordSlot ? (
        <div className="px-6 pt-3 pb-4">
          <div className="w-full">{recordSlot}</div>
        </div>
      ) : (
        <div className="transition-all duration-300 ease-out" style={{ height: isCollapsed ? 8 : 12 }} />
      )}
    </div>
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
  collapsed,
}: {
  crumbs: Crumb[];
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}) {
  return (
    <nav
      className={cn(
        "flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap leading-none text-text-muted transition-all duration-300 ease-out [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        collapsed ? "text-[11px]" : "text-[13px]"
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
// Tab button (with subtle shadow for elevation)
// ---------------------------------------------------------------------------

const TabButton = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    active: boolean;
    disabled: boolean;
    first: boolean;
    zIndex: number;
    onClick: () => void;
  }
>(function TabButton({ label, active, disabled, first, zIndex, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ zIndex }}
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-b-[16px] rounded-t-none px-6 py-2.5 text-[13px]",
        "border",
        "transition-[background-color,border-color,color,box-shadow] duration-200",
        !first && "-ml-3",
        active
          ? "border-blue-600 bg-blue-600 font-semibold text-white shadow-[0_6px_14px_-4px_rgba(37,99,235,0.45)]"
          : disabled
          ? "cursor-not-allowed border-gray-200 bg-white text-text-muted/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]"
          : "border-gray-200 bg-white font-medium text-text-secondary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:border-gray-300 hover:text-text-primary hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]",
      )}
    >
      {label}
    </button>
  );
});

// ---------------------------------------------------------------------------
// More tab button — dropdown for overflow tabs
// ---------------------------------------------------------------------------

const MoreTabButton = forwardRef<
  HTMLDivElement,
  {
    stages: Stage[];
    activeStage: Stage;
    disabledStages?: Set<Stage>;
    stageDisplay: Record<Stage, { tab: string; crumb: string }>;
    openChildTabs: OpenChildTabs;
    showConnect?: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onStageSelect: (stage: Stage) => void;
    zIndex: number;
  }
>(function MoreTabButton(
  { stages, activeStage, disabledStages, stageDisplay, openChildTabs, showConnect, isOpen, onToggle, onStageSelect, zIndex },
  ref
) {
  const itemCount = stages.length + (showConnect ? 1 : 0);
  
  return (
    <div ref={ref} className="relative -ml-3" style={{ zIndex }}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5",
          "rounded-b-[16px] rounded-t-none px-5 py-2.5 text-[13px]",
          "border transition-all duration-200",
          isOpen
            ? "border-gray-300 bg-gray-100 font-medium text-text-primary shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]"
            : "border-gray-200 bg-white font-medium text-text-secondary shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:border-gray-300 hover:text-text-primary",
        )}
      >
        More
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
          {itemCount}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1.5 z-50",
            "min-w-[180px] rounded-xl border border-gray-200 bg-white py-1.5",
            "shadow-xl",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          {stages.map((stageId) => {
            const isActive = stageId === activeStage;
            const isDisabled = disabledStages?.has(stageId) ?? false;
            const isListDetailStage = LIST_DETAIL_STAGES.includes(stageId);
            const stageKey = stageId as "quote" | "contract" | "invoicing";
            const openChildren = isListDetailStage ? openChildTabs[stageKey] : [];
            const hasOpenChildren = openChildren.length > 0;

            return (
              <button
                key={stageId}
                type="button"
                onClick={() => !isDisabled && onStageSelect(stageId)}
                disabled={isDisabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[13px]",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : isDisabled
                    ? "cursor-not-allowed text-text-muted/60"
                    : "font-medium text-text-primary hover:bg-gray-50",
                )}
              >
                <span>{stageDisplay[stageId].tab}</span>
                {hasOpenChildren && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                      isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600",
                    )}
                  >
                    +{openChildren.length}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Connect option */}
          {showConnect && (
            <>
              {stages.length > 0 && <div className="my-1.5 border-t border-gray-100" />}
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2 text-left text-[13px]",
                  "font-medium text-blue-600 hover:bg-blue-50 transition-colors duration-150",
                )}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Connect</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Grouped Tab button (fused pills, horizontal layout)
// - Parent tab: blue when in list mode, subtle blue when sub-tab is selected
// - Sub-tabs: white when unselected, blue when selected
// - Overflow: "More" dropdown when > MAX_VISIBLE_CHILDREN
// ---------------------------------------------------------------------------

const MAX_VISIBLE_CHILDREN = 3;

const GroupedTabButton = forwardRef<
  HTMLDivElement,
  {
    parentLabel: string;
    childIds: string[];
    selectedChildId?: string;
    isExpanded: boolean;
    first: boolean;
    zIndex: number;
    onParentClick: () => void;
    onChildSelect: (childId: string) => void;
    onChildClose: (childId: string) => void;
    onExpandClick: () => void;
  }
>(function GroupedTabButton(
  {
    parentLabel,
    childIds,
    selectedChildId,
    isExpanded,
    first,
    zIndex,
    onParentClick,
    onChildSelect,
    onChildClose,
    onExpandClick,
  },
  ref
) {
  const [showOverflow, setShowOverflow] = useState(false);
  const childCount = childIds.length;
  const hasSelectedChild = selectedChildId !== undefined;
  
  // Split children into visible and overflow
  const visibleChildren = childIds.slice(0, MAX_VISIBLE_CHILDREN);
  const overflowChildren = childIds.slice(MAX_VISIBLE_CHILDREN);
  const hasOverflow = overflowChildren.length > 0;
  const selectedInOverflow = selectedChildId && overflowChildren.includes(selectedChildId);

  // Collapsed state (when not the active stage): show parent with "+N" badge
  if (!isExpanded) {
    return (
      <div ref={ref} className={cn("inline-flex", !first && "-ml-3")} style={{ zIndex }}>
        <button
          type="button"
          onClick={onExpandClick}
          className={cn(
            "relative inline-flex items-center gap-1.5",
            "rounded-b-[16px] rounded-t-none px-5 py-2.5 text-[13px] transition-all duration-200",
            "border border-gray-200 bg-white font-medium text-text-secondary",
            "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]",
            "hover:border-gray-300 hover:text-text-primary",
          )}
        >
          {parentLabel}
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-[11px] font-semibold text-white">
            +{childCount}
          </span>
        </button>
      </div>
    );
  }

  // Expanded state: fused horizontal pills
  return (
    <div
      ref={ref}
      style={{ zIndex: hasSelectedChild ? zIndex : 50 }}
      className={cn(
        "relative inline-flex items-stretch",
        "rounded-b-[18px] rounded-t-none",
        "border",
        hasSelectedChild ? "border-blue-400" : "border-blue-600",
        hasSelectedChild 
          ? "shadow-[0_4px_12px_-4px_rgba(37,99,235,0.3)]" 
          : "shadow-[0_6px_14px_-4px_rgba(37,99,235,0.45)]",
        !first && "-ml-3",
      )}
    >
      {/* Parent tab segment */}
      <button
        type="button"
        onClick={onParentClick}
        className={cn(
          "relative inline-flex items-center justify-center",
          "rounded-bl-[16px] rounded-t-none px-5 py-2.5 text-[13px] transition-all duration-200",
          hasSelectedChild
            ? "bg-blue-100 font-medium text-blue-700 hover:bg-blue-200/80"
            : "bg-blue-600 font-semibold text-white hover:bg-blue-700",
          childCount > 0 && "border-r",
          hasSelectedChild ? "border-blue-300" : "border-blue-500",
        )}
      >
        {parentLabel}
      </button>

      {/* Visible child tabs */}
      {visibleChildren.map((childId, idx) => {
        const isSelected = childId === selectedChildId;
        const isLastVisible = idx === visibleChildren.length - 1 && !hasOverflow;
        
        return (
          <div
            key={childId}
            onClick={() => onChildSelect(childId)}
            className={cn(
              "relative inline-flex items-center gap-1.5 cursor-pointer",
              "px-3 py-2.5 text-[13px] transition-all duration-200",
              isLastVisible && "rounded-br-[16px]",
              !isLastVisible && "border-r",
              isSelected
                ? "bg-blue-600 font-semibold text-white border-blue-500"
                : "bg-blue-100 font-medium text-blue-700 hover:bg-blue-200/80 border-blue-300",
            )}
          >
            <span className="truncate max-w-[100px]">{childId}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChildClose(childId);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChildClose(childId);
                }
              }}
              className={cn(
                "inline-flex items-center justify-center shrink-0",
                "h-[18px] w-[18px] rounded-full",
                "transition-all duration-150",
                isSelected
                  ? "bg-white/20 text-white/90 hover:bg-white/30 hover:text-white"
                  : "bg-blue-200 text-blue-600 hover:bg-blue-300 hover:text-blue-700",
              )}
              aria-label={`Close ${childId}`}
            >
              <X size={11} strokeWidth={2.5} />
            </span>
          </div>
        );
      })}

      {/* Overflow "More" button */}
      {hasOverflow && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOverflow(!showOverflow)}
            className={cn(
              "inline-flex items-center gap-1 h-full",
              "rounded-br-[16px] px-3 py-2.5 text-[13px] transition-all duration-200",
              "border-l",
              selectedInOverflow
                ? "bg-blue-600 font-semibold text-white border-blue-500"
                : "bg-blue-100 font-medium text-blue-700 hover:bg-blue-200/80 border-blue-300",
            )}
          >
            +{overflowChildren.length}
            <ChevronRight size={14} className={cn("transition-transform", showOverflow && "rotate-90")} />
          </button>
          
          {/* Overflow dropdown */}
          {showOverflow && (
            <div
              className={cn(
                "absolute right-0 top-full mt-1 z-50",
                "flex flex-col min-w-[160px]",
                "rounded-lg border border-gray-200 bg-white",
                "shadow-lg",
                "animate-in fade-in slide-in-from-top-2 duration-150",
                "overflow-hidden",
              )}
            >
              {overflowChildren.map((childId, idx) => {
                const isSelected = childId === selectedChildId;
                const isLast = idx === overflowChildren.length - 1;
                
                return (
                  <div
                    key={childId}
                    onClick={() => {
                      onChildSelect(childId);
                      setShowOverflow(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 cursor-pointer",
                      "px-3 py-2 text-[13px] transition-all duration-150",
                      !isLast && "border-b border-gray-100",
                      isSelected
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "bg-white font-medium text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span className="truncate">{childId}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChildClose(childId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          onChildClose(childId);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center justify-center shrink-0",
                        "h-[20px] w-[20px] rounded-full",
                        "transition-all duration-150",
                        isSelected
                          ? "text-blue-500 hover:bg-blue-100"
                          : "text-gray-400 hover:bg-gray-200",
                      )}
                      aria-label={`Close ${childId}`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const ConnectTab = forwardRef<HTMLButtonElement, { zIndex: number; hidden?: boolean }>(
  function ConnectTab({ zIndex, hidden }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        style={{ zIndex }}
        className={cn(
          "relative -ml-3 inline-flex items-center justify-center gap-1.5",
          "rounded-b-[16px] rounded-t-none px-6 py-2.5 text-[13px] transition-all",
          "border border-gray-200 bg-white font-medium text-blue-600 hover:border-blue-300 hover:text-blue-700",
          hidden && "invisible pointer-events-none",
        )}
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden}
      >
        <Plus size={13} strokeWidth={2.5} aria-hidden />
        Connect
      </button>
    );
  }
);
