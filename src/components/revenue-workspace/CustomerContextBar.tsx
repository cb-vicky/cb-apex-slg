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
import type { IngestionSession, IngestionSectionId, IngestionSectionState } from "@/context/ingest-context-core";
import { getExtractedContract } from "@/data/ingest-data";
import { useZenithContractChrome } from "./contract/zenith/ZenithContractChromeContext";
import {
  zenithContentTabForIngestionSub,
  type IngestionSubTab as IngestionSubTabSync,
} from "./ingestion/ingestion-zenith-sync";
import type { ZenithTabCompletionStatus } from "./contract/zenith/zenith-contract-tab-status";
import type { Stage } from "./stage";
import {
  derivePriorityChips,
  mergeInvoiceStatuses,
  type PriorityChip,
  type StatusSeverity,
} from "./derive-stage-data";
import {
  CONNECT_TAB_SUMMARY,
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

/** Hysteresis thresholds to prevent flickering during slow scrolling */
const SCROLL_THRESHOLD_COLLAPSE = 50;
const SCROLL_THRESHOLD_EXPAND = 20;

/** Customer title stack — expanded / collapsed (breadcrumb lives in same row) */
const HEADER_TITLE_PT = { expanded: 18, collapsed: 8 } as const;
const HEADER_TITLE_PB = { expanded: 16, collapsed: 10 } as const;
const HEADER_TABS_GAP = { expanded: 12, collapsed: 10 } as const;
const MORE_BUTTON_WIDTH = 96;
const OVERFLOW_THRESHOLD = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Trapezoidal tab shape constants (from reference customer-tabs-v2.jsx)
// ─────────────────────────────────────────────────────────────────────────────
/** How much narrower the top is than the bottom (px) — creates the trapezoid slant */
const TOP_INSET = 18;
/** Top corner radius — kept smaller to avoid jarring visual shift between expanded/collapsed states */
const TOP_R = 10;
/** Colors — PAGE_BG matches shell's --color-grey-100 */
const TAB_BLUE = "#2563eb";
const TAB_BLUE_DARK = "#1d4ed8";
const PAGE_BG = "#f3f4f6";
const TAB_HOVER_BG = "#e9eaed";
const BORDER_GREY = "#d1d5db";

/** Negative margin overlap between adjacent tabs (px) — must match TAB_OVERLAP_CLASS */
const TAB_OVERLAP = 22;
const TAB_OVERLAP_CLASS = "-ml-[22px]";
/** Minimum tab width (px) — close button now floats outside, so closable widths can shrink */
const TAB_MIN_WIDTH_PARENT = 80;
const TAB_MIN_WIDTH_CLOSABLE = 116;
const TAB_MIN_WIDTH_CLASS = {
  parent: "min-w-[80px]",
  closable: "min-w-[116px]",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Trapezoidal SVG tab shape (buildTabPath + TabSVG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the SVG path for a trapezoidal tab — narrower at top, wider at bottom.
 * The path is OPEN (no Z) so the stroke doesn't render on the bottom edge.
 * Uses quadratic curves for smooth top corner fillets.
 */
function buildTabPath(W: number, H: number, inset = TOP_INSET, R = TOP_R): string {
  const L = Math.sqrt(inset * inset + H * H);
  const ux = inset / L;
  const uy = H / L;
  return [
    `M 0 ${H}`,
    `L ${inset - R * ux} ${R * uy}`,
    `Q ${inset} 0 ${inset + R} 0`,
    `L ${W - inset - R} 0`,
    `Q ${W - inset} 0 ${W - inset + R * ux} ${R * uy}`,
    `L ${W} ${H}`,
  ].join(" ");
}

/** Pill corner radius and inset for the hanging context pills */
const PILL_INSET = 10;
const PILL_R = 8;

/**
 * Builds the SVG path for an inverted trapezoidal pill — wider at top, narrower at bottom.
 * The path is OPEN (no Z) so the stroke doesn't render on the TOP edge.
 * Uses quadratic curves for smooth bottom corner fillets.
 */
function buildInvertedPillPath(W: number, H: number, inset = PILL_INSET, R = PILL_R): string {
  const L = Math.sqrt(inset * inset + H * H);
  const ux = inset / L;
  const uy = H / L;
  // Path goes: top-left → down left slant → bottom-left corner → bottom edge → bottom-right corner → up right slant → top-right
  // Open path so top edge is not stroked
  return [
    `M 0 0`,
    `L ${inset - R * ux} ${H - R * uy}`,
    `Q ${inset} ${H} ${inset + R} ${H}`,
    `L ${W - inset - R} ${H}`,
    `Q ${W - inset} ${H} ${W - inset + R * ux} ${H - R * uy}`,
    `L ${W} 0`,
  ].join(" ");
}

/**
 * SVG overlay for the inverted pill shape — renders wider top, narrower bottom.
 * Used for the context info pills that hang below the tab bar.
 */
function InvertedPillSVG({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  if (width < 10 || height < 10) return null;
  const path = buildInvertedPillPath(width, height, PILL_INSET, PILL_R);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <path
        d={path}
        fill="rgba(255,255,255,0.85)"
        stroke={BORDER_GREY}
        strokeWidth={1}
        style={{ 
          filter: "drop-shadow(0 4px 12px rgba(17,24,39,0.08))",
        }}
      />
    </svg>
  );
}

/**
 * SVG overlay for a tab — renders the trapezoidal shape.
 * Active: solid blue fill with darker blue stroke.
 * Inactive: page-bg fill (or white when collapsed) with grey stroke.
 */
function TabSVG({
  width,
  height,
  active,
  hovered,
  collapsed,
}: {
  width: number;
  height: number;
  active: boolean;
  hovered?: boolean;
  collapsed?: boolean;
}) {
  if (width < 10 || height < 10) return null;
  const path = buildTabPath(width, height, TOP_INSET, TOP_R);

  // Inactive tabs are white when collapsed, page-bg when expanded
  const inactiveFill = collapsed ? "#ffffff" : PAGE_BG;
  const fill = active ? TAB_BLUE : hovered ? TAB_HOVER_BG : inactiveFill;
  const stroke = active ? TAB_BLUE_DARK : hovered ? "#9ca3af" : BORDER_GREY;

  return (
    <svg
      className="tab-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        style={{ transition: "fill 160ms ease, stroke 160ms ease" }}
      />
    </svg>
  );
}

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
  ingestion: { tab: "Ingestion", crumb: "Ingestion" },
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

/** Invoicing sub-tab type */
export type InvoicingSubTab = "invoices" | "credit-notes";

/** Ingestion sub-tab type (exported for use in CustomerRevenueWorkspace) */
export type { IngestionSubTab };

/** Context data for the left info pill */
interface ContextPillData {
  /** For Overview: ARR */
  arr?: number;
  /** For Overview: Next renewal date */
  nextRenewal?: string;
  /** For Tasks: Critical task count */
  criticalTaskCount?: number;
  /** For Threads: Unread count */
  unreadThreadCount?: number;
  /** For Threads: Total thread count */
  totalThreadCount?: number;
  /** For Quotes parent: Quote count */
  quoteCount?: number;
  /** For Quote record: TCV */
  quoteTcv?: number;
  /** For Contracts parent: Contract count */
  contractCount?: number;
  /** For Contract record: TCV */
  contractTcv?: number;
  /** For Invoicing parent: Invoice count */
  invoiceCount?: number;
  /** For Invoicing parent: Credit note count */
  creditNoteCount?: number;
  /** For Invoice record: Amount */
  invoiceAmount?: number;
  /** For Collections: Open AR */
  openAr?: number;
}

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
  /** Data for the left context info pill */
  contextPillData?: ContextPillData;
  /** Current invoicing sub-tab (invoices | credit-notes) */
  invoicingSubTab?: InvoicingSubTab;
  /** Callback when invoicing sub-tab changes */
  onInvoicingSubTabChange?: (tab: InvoicingSubTab) => void;
  /** Active ingestion session for this customer (if any) */
  ingestionSession?: IngestionSession;
  /** Current ingestion sub-tab */
  ingestionSubTab?: IngestionSubTab;
  /** Callback when ingestion sub-tab changes */
  onIngestionSubTabChange?: (tab: IngestionSubTab) => void;
}

const TAB_COLLAPSE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const TAB_COLLAPSE_MS = "380ms";

/** Format currency with K/M suffix for compact display */
function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/** Format date as short string (e.g., "May 15, 2026") */
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Height for the hanging context pills */
const CONTEXT_PILL_HEIGHT = 34;

/**
 * Invoicing tab pill — shows tabs for Invoices and Credit Notes counts.
 * Used in the ContextInfoPill when on the invoicing parent stage.
 * Features a smooth sliding underline animation when switching tabs.
 */
function InvoicingTabPill({
  invoiceCount,
  creditNoteCount,
  activeSubTab,
  onSubTabChange,
}: {
  invoiceCount: number;
  creditNoteCount: number;
  activeSubTab: InvoicingSubTab;
  onSubTabChange: (tab: InvoicingSubTab) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const invoicesButtonRef = useRef<HTMLButtonElement>(null);
  const creditNotesButtonRef = useRef<HTMLButtonElement>(null);
  const invoicesTextRef = useRef<HTMLSpanElement>(null);
  const creditNotesTextRef = useRef<HTMLSpanElement>(null);
  
  const [pillWidth, setPillWidth] = useState(0);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Measure pill width
  useEffect(() => {
    if (!pillRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPillWidth(entry.contentRect.width);
    });
    ro.observe(pillRef.current);
    setPillWidth(pillRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // Calculate underline position based on active tab
  const updateUnderlinePosition = useCallback(() => {
    const pill = pillRef.current;
    const activeButtonRef = activeSubTab === "invoices" ? invoicesButtonRef : creditNotesButtonRef;
    const activeTextRef = activeSubTab === "invoices" ? invoicesTextRef : creditNotesTextRef;
    
    if (!pill || !activeButtonRef.current || !activeTextRef.current) return;
    
    const pillRect = pill.getBoundingClientRect();
    const buttonRect = activeButtonRef.current.getBoundingClientRect();
    const textWidth = activeTextRef.current.offsetWidth;
    
    // Calculate underline width (50% of text width) and center it under the text
    const underlineWidth = textWidth * 0.5;
    const buttonCenter = buttonRect.left - pillRect.left + buttonRect.width / 2;
    const underlineLeft = buttonCenter - underlineWidth / 2;
    
    setUnderlineStyle({
      left: underlineLeft,
      width: underlineWidth,
    });
    
    // Mark as initialized after first measurement
    if (!isInitialized) {
      requestAnimationFrame(() => setIsInitialized(true));
    }
  }, [activeSubTab, isInitialized]);

  // Update underline position when active tab changes or on mount
  useEffect(() => {
    updateUnderlinePosition();
  }, [updateUnderlinePosition, invoiceCount, creditNoteCount]);

  // Also update on window resize
  useEffect(() => {
    const handleResize = () => updateUnderlinePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateUnderlinePosition]);

  const tabs: { id: InvoicingSubTab; label: string; count: number; buttonRef: React.RefObject<HTMLButtonElement | null>; textRef: React.RefObject<HTMLSpanElement | null> }[] = [
    { id: "invoices", label: "Invoices", count: invoiceCount, buttonRef: invoicesButtonRef, textRef: invoicesTextRef },
    { id: "credit-notes", label: "Credit Notes", count: creditNoteCount, buttonRef: creditNotesButtonRef, textRef: creditNotesTextRef },
  ];

  return (
    <div
      ref={pillRef}
      className="relative inline-flex items-center justify-center"
      style={{ height: CONTEXT_PILL_HEIGHT, minWidth: 160 }}
    >
      <InvertedPillSVG width={pillWidth} height={CONTEXT_PILL_HEIGHT} />
      <div ref={tabsContainerRef} className="relative z-10 flex items-center gap-4 px-4 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          
          return (
            <button
              key={tab.id}
              ref={tab.buttonRef}
              type="button"
              onClick={() => onSubTabChange(tab.id)}
              className="group/subtab relative flex flex-col items-center"
            >
              <span
                ref={tab.textRef}
                className={cn(
                  "text-[12px] font-semibold transition-colors duration-200",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-500 group-hover/subtab:text-slate-700"
                )}
              >
                {tab.count} {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Single animated underline that slides between tabs - positioned at bottom of pill */}
      <span
        className="absolute bottom-[1px] z-20 h-[2.5px] rounded-full bg-blue-600"
        style={{
          left: underlineStyle.left,
          width: underlineStyle.width,
          transition: isInitialized 
            ? "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      />
    </div>
  );
}

type IngestionSubTab = IngestionSectionId | `pdf-${string}` | "contract-preview" | "invoice-preview";

function getSectionStatusDot(state: IngestionSectionState): "red" | "amber" | "green" | null {
  switch (state) {
    case "issues":
      return "red";
    case "review":
      return "amber";
    case "done":
      return "green";
    default:
      return null;
  }
}

function zenithStatusDot(status: ZenithTabCompletionStatus): "red" | "amber" | "green" | null {
  if (status === "complete") return "green";
  if (status === "pending") return "amber";
  return null;
}

/**
 * Ingestion tab pill — renders section tabs + PDF tabs (Frame 1) or
 * Back / Contract Preview / Invoice Preview (Frame 2). Underline tracks the
 * active sub-tab; tab change is delegated to the parent.
 */
function IngestionTabPill({
  session,
  activeSubTab,
  onSubTabChange,
}: {
  session: IngestionSession;
  activeSubTab: IngestionSubTab;
  onSubTabChange: (tab: IngestionSubTab) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(0);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const zenithChrome = useZenithContractChrome();

  const extracted = useMemo(() => getExtractedContract(session.sampleId), [session.sampleId]);

  function pillTabStatusDot(tabId: IngestionSubTabSync): "red" | "amber" | "green" | null {
    const zenithTab = zenithContentTabForIngestionSub(tabId);
    if (zenithChrome && zenithTab) {
      return zenithStatusDot(zenithChrome.getContentTabStatus(zenithTab));
    }
    if (
      tabId === "summary" ||
      tabId === "items" ||
      tabId === "billing" ||
      tabId === "addresses" ||
      tabId === "additional"
    ) {
      return getSectionStatusDot(session.sections[tabId]);
    }
    return null;
  }

  const isFrame2 = activeSubTab === "contract-preview";

  const reviewTabs: { id: IngestionSubTab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "items", label: "Items" },
    { id: "billing", label: "Billing info" },
    { id: "addresses", label: "Addresses" },
    { id: "invoice-preview", label: "Invoice Preview" },
  ];

  const pdfTabs = extracted.documents.map((doc) => ({
    id: `pdf-${doc.id}` as const,
    label: doc.name.length > 20 ? doc.name.slice(0, 17) + "..." : doc.name,
  }));

  const frame2Tabs: { id: IngestionSubTab; label: string }[] = [
    { id: "contract-preview", label: "Contract Preview" },
  ];

  const invoicePreviewDisabled =
    zenithChrome?.getContentTabStatus("Invoice Preview") === "disabled";

  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const textRefs = useRef<Map<string, HTMLSpanElement | null>>(new Map());

  useEffect(() => {
    if (!pillRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPillWidth(entry.contentRect.width);
    });
    ro.observe(pillRef.current);
    setPillWidth(pillRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const updateUnderlinePosition = useCallback(() => {
    const pill = pillRef.current;
    const activeButton = tabRefs.current.get(activeSubTab);
    const activeText = textRefs.current.get(activeSubTab);

    if (!pill || !activeButton || !activeText) return;

    const pillRect = pill.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const textWidth = activeText.offsetWidth;

    const underlineWidth = textWidth * 0.5;
    const buttonCenter = buttonRect.left - pillRect.left + buttonRect.width / 2;
    const underlineLeft = buttonCenter - underlineWidth / 2;

    setUnderlineStyle({
      left: underlineLeft,
      width: underlineWidth,
    });

    if (!isInitialized) {
      requestAnimationFrame(() => setIsInitialized(true));
    }
  }, [activeSubTab, isInitialized]);

  useEffect(() => {
    updateUnderlinePosition();
  }, [updateUnderlinePosition]);

  useEffect(() => {
    const handleResize = () => updateUnderlinePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateUnderlinePosition]);

  return (
    <div
      ref={pillRef}
      className="relative inline-flex items-center justify-center"
      style={{ height: CONTEXT_PILL_HEIGHT, minWidth: 400 }}
    >
      <InvertedPillSVG width={pillWidth} height={CONTEXT_PILL_HEIGHT} />
      <div className="relative z-10 flex items-center gap-1 px-3 py-1.5">
        {isFrame2 ? (
          <>
            {/* Back to ingestion */}
            <button
              type="button"
              onClick={() => onSubTabChange("summary")}
              className="group/subtab relative flex items-center gap-1 rounded px-2 py-0.5"
            >
              <ChevronRight size={11} className="rotate-180 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500 group-hover/subtab:text-slate-700 transition-colors duration-200">
                Back to ingestion
              </span>
            </button>

            <span className="mx-1 text-slate-300">|</span>

            {/* Frame 2 preview tabs */}
            {frame2Tabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              const dotColor = pillTabStatusDot(tab.id);
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current.set(tab.id, el); }}
                  type="button"
                  onClick={() => onSubTabChange(tab.id)}
                  className="group/subtab relative flex items-center gap-1 rounded px-2 py-0.5"
                >
                  {dotColor && (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        dotColor === "amber" && "bg-amber-500",
                        dotColor === "green" && "bg-emerald-500",
                      )}
                    />
                  )}
                  <span
                    ref={(el) => { textRefs.current.set(tab.id, el); }}
                    className={cn(
                      "text-[11px] font-medium transition-colors duration-200",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 group-hover/subtab:text-slate-700",
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            {reviewTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              const dotColor = pillTabStatusDot(tab.id);
              const isDisabled =
                tab.id === "invoice-preview" && invoicePreviewDisabled;

              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current.set(tab.id, el); }}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onSubTabChange(tab.id)}
                  className={cn(
                    "group/subtab relative flex items-center gap-1.5 rounded px-2 py-0.5",
                    isDisabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {dotColor && (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        dotColor === "red" && "bg-red-500",
                        dotColor === "amber" && "bg-amber-500",
                        dotColor === "green" && "bg-emerald-500",
                      )}
                    />
                  )}
                  <span
                    ref={(el) => { textRefs.current.set(tab.id, el); }}
                    className={cn(
                      "text-[11px] font-medium transition-colors duration-200",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 group-hover/subtab:text-slate-700",
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Pipe separator */}
            {pdfTabs.length > 0 && (
              <span className="mx-1 text-slate-300">|</span>
            )}

            {/* PDF tabs */}
            {pdfTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current.set(tab.id, el); }}
                  type="button"
                  onClick={() => onSubTabChange(tab.id)}
                  className="group/subtab relative flex items-center gap-1 rounded px-2 py-0.5"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-slate-400">
                    <path d="M4 1h6l4 4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M10 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span
                    ref={(el) => { textRefs.current.set(tab.id, el); }}
                    className={cn(
                      "text-[11px] font-medium transition-colors duration-200",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-500 group-hover/subtab:text-slate-700",
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Animated underline */}
      <span
        className="absolute bottom-[1px] z-20 h-[2.5px] rounded-full bg-blue-600"
        style={{
          left: underlineStyle.left,
          width: underlineStyle.width,
          transition: isInitialized
            ? "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      />
    </div>
  );
}

/**
 * Context info pill — shows contextual data based on active tab.
 * Uses inverted trapezoidal shape (wider top, narrower bottom).
 */
function ContextInfoPill({
  activeTab,
  customer,
  contextPillData,
  invoicingSubTab,
  onInvoicingSubTabChange,
  ingestionSession,
  ingestionSubTab,
  onIngestionSubTabChange,
}: {
  activeTab: WorkspaceTab;
  customer: Customer;
  contextPillData?: ContextPillData;
  invoicingSubTab?: InvoicingSubTab;
  onInvoicingSubTabChange?: (tab: InvoicingSubTab) => void;
  ingestionSession?: IngestionSession;
  ingestionSubTab?: IngestionSubTab;
  onIngestionSubTabChange?: (tab: IngestionSubTab) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(0);
  
  const stage = activeTab.stage;
  const isRecord = activeTab.kind === "record";
  const recordId = isRecord ? activeTab.recordId : undefined;
  
  // Check if we should show the invoicing tabbed pill (before hooks to avoid conditional hook calls)
  const showInvoicingTabPill = !isRecord && stage === "invoicing" && invoicingSubTab && onInvoicingSubTabChange;
  const showIngestionTabPill = !isRecord && stage === "ingestion" && ingestionSession && ingestionSubTab && onIngestionSubTabChange;

  // Reset width and re-measure when tab changes (not just when coming back from invoicing)
  // This ensures the pill size matches the new content
  useEffect(() => {
    if (showInvoicingTabPill || showIngestionTabPill) return; // Skip when showing tabbed pills
    
    // Reset to 0 first to avoid stale width
    setPillWidth(0);
    
    // Wait for DOM to update, then measure
    const rafId = requestAnimationFrame(() => {
      if (pillRef.current) {
        setPillWidth(pillRef.current.offsetWidth);
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [stage, isRecord, recordId, showInvoicingTabPill, showIngestionTabPill]);

  // Set up ResizeObserver for dynamic content changes
  useEffect(() => {
    if (showInvoicingTabPill || showIngestionTabPill || !pillRef.current) return;
    
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPillWidth(entry.contentRect.width);
    });
    ro.observe(pillRef.current);
    
    return () => ro.disconnect();
  }, [showInvoicingTabPill, showIngestionTabPill]);

  // Return the ingestion tabbed pill early if applicable
  if (showIngestionTabPill) {
    return (
      <IngestionTabPill
        session={ingestionSession}
        activeSubTab={ingestionSubTab}
        onSubTabChange={onIngestionSubTabChange}
      />
    );
  }
  
  // Return the invoicing tabbed pill early if applicable
  if (showInvoicingTabPill) {
    return (
      <InvoicingTabPill
        invoiceCount={contextPillData?.invoiceCount ?? 0}
        creditNoteCount={contextPillData?.creditNoteCount ?? 0}
        activeSubTab={invoicingSubTab}
        onSubTabChange={onInvoicingSubTabChange}
      />
    );
  }

  // Build the content based on active tab
  let content: ReactNode = null;

  if (isRecord && recordId) {
    // Record tab content
    switch (stage) {
      case "quote": {
        const tcv = contextPillData?.quoteTcv;
        content = (
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">{recordId}</span>
            {tcv !== undefined && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[12px] font-semibold text-slate-700">{formatCompactCurrency(tcv)}</span>
              </>
            )}
          </span>
        );
        break;
      }
      case "contract": {
        const tcv = contextPillData?.contractTcv;
        content = (
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">{recordId}</span>
            {tcv !== undefined && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[12px] font-semibold text-slate-700">{formatCompactCurrency(tcv)}</span>
              </>
            )}
          </span>
        );
        break;
      }
      case "invoicing": {
        const amount = contextPillData?.invoiceAmount;
        content = (
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">{recordId}</span>
            {amount !== undefined && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[12px] font-semibold text-slate-700">{formatCompactCurrency(amount)}</span>
              </>
            )}
          </span>
        );
        break;
      }
      default:
        content = <span className="text-[11px] font-medium text-slate-500">{recordId}</span>;
    }
  } else {
    // Parent tab content
    switch (stage) {
      case "customer": {
        content = (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">ARR</span>
              <span className="text-[12px] font-semibold text-slate-700">{formatCompactCurrency(customer.arr)}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Renewal</span>
              <span className="text-[12px] font-medium text-slate-600">{formatShortDate(customer.nextRenewalDate)}</span>
            </span>
          </span>
        );
        break;
      }
      case "tasks": {
        const criticalCount = contextPillData?.criticalTaskCount ?? 0;
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Critical</span>
            <span className={cn(
              "text-[12px] font-semibold",
              criticalCount > 0 ? "text-red-600" : "text-slate-600"
            )}>
              {criticalCount}
            </span>
          </span>
        );
        break;
      }
      case "threads": {
        const unreadCount = contextPillData?.unreadThreadCount ?? 0;
        const totalCount = contextPillData?.totalThreadCount ?? 0;
        content = unreadCount > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Unread</span>
            <span className="text-[12px] font-semibold text-amber-600">{unreadCount}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Threads</span>
            <span className="text-[12px] font-medium text-slate-600">{totalCount}</span>
          </span>
        );
        break;
      }
      case "quote": {
        const count = contextPillData?.quoteCount ?? customer.openQuoteCount ?? 0;
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Quotes</span>
            <span className="text-[12px] font-semibold text-slate-700">{count}</span>
          </span>
        );
        break;
      }
      case "contract": {
        const count = contextPillData?.contractCount ?? customer.activeContractCount ?? 0;
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Contracts</span>
            <span className="text-[12px] font-semibold text-slate-700">{count}</span>
          </span>
        );
        break;
      }
      case "invoicing": {
        // Tabbed pill is handled above with early return
        // This is fallback for when invoicingSubTab is not provided
        const count = contextPillData?.invoiceCount ?? 0;
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Invoices</span>
            <span className="text-[12px] font-semibold text-slate-700">{count}</span>
          </span>
        );
        break;
      }
      case "payment": {
        const openAr = contextPillData?.openAr ?? customer.openAr ?? 0;
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Open AR</span>
            <span className={cn(
              "text-[12px] font-semibold",
              openAr > 0 ? "text-amber-600" : "text-slate-600"
            )}>
              {formatCompactCurrency(openAr)}
            </span>
          </span>
        );
        break;
      }
      case "ingestion": {
        // The ingestion tabbed pill handles this case with early return above
        // This is fallback for when ingestionSubTab is not provided
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Ingestion</span>
            <span className="text-[12px] font-medium text-slate-600">In progress</span>
          </span>
        );
        break;
      }
      case "revrec": {
        content = (
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Arrangements</span>
            <span className="text-[12px] font-medium text-slate-600">1</span>
          </span>
        );
        break;
      }
      default:
        content = null;
    }
  }

  if (!content) return null;

  return (
    <div
      ref={pillRef}
      className="relative inline-flex items-center justify-center"
      style={{ height: CONTEXT_PILL_HEIGHT, minWidth: 80 }}
    >
      <InvertedPillSVG width={pillWidth} height={CONTEXT_PILL_HEIGHT} />
      <span className="relative z-10 px-4 py-1.5">{content}</span>
    </div>
  );
}

/**
 * Actions pill wrapper — wraps the recordSlot content in inverted trapezoidal shape.
 * Uses the same height as ContextInfoPill for visual consistency.
 */
function ActionsPillWrapper({ children }: { children: ReactNode }) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState(0);

  useEffect(() => {
    if (!pillRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPillWidth(entry.contentRect.width);
    });
    ro.observe(pillRef.current);
    setPillWidth(pillRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={pillRef}
      className="relative inline-flex items-center justify-center"
      style={{ height: CONTEXT_PILL_HEIGHT, minWidth: 100 }}
    >
      <InvertedPillSVG width={pillWidth} height={CONTEXT_PILL_HEIGHT} />
      <span className="relative z-10 flex items-center px-4">{children}</span>
    </div>
  );
}

function tabStatusClass(
  severity: StatusSeverity,
  active: boolean,
  group: "tab" | "connect" = "tab",
): string {
  const hoverPrefix = group === "connect" ? "group-hover/connect:" : "group-hover/tab:";
  const hover = TAB_STATUS_HOVER_CLASS[severity].replace("group-hover/tab:", hoverPrefix);
  if (active) {
    return cn("text-blue-500/70", `${hoverPrefix}text-blue-600`);
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
  contextPillData,
  invoicingSubTab,
  onInvoicingSubTabChange,
  ingestionSession,
  ingestionSubTab,
  onIngestionSubTabChange,
}: Props) {
  const navigate = useNavigate();
  const { invoiceStatusOverrides } = useIngestContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const rafRef = useRef<number>(0);
  const collapseTransitionLockRef = useRef(false);
  const collapseTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  /** Never stretch tabs — keep them tightly spaced with extra space on the right. */
  const tabsFillWidth = false;

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

    let wasCollapsed = false;
    const TRANSITION_LOCK_MS = 450; // Lock state changes during transition

    const updateScrollState = () => {
      const top = scrollContainer.scrollTop;
      setIsScrolled(top > 0);
      
      // Don't change collapse state if we're in the middle of a transition
      if (collapseTransitionLockRef.current) return;
      
      // Hysteresis: use different thresholds for collapse vs expand
      // to prevent flickering during slow scrolling
      let shouldCollapse = wasCollapsed;
      
      if (wasCollapsed) {
        // Currently collapsed — only expand if we scroll above the lower threshold
        if (top < SCROLL_THRESHOLD_EXPAND) {
          shouldCollapse = false;
        }
      } else {
        // Currently expanded — only collapse if we scroll past the higher threshold
        if (top > SCROLL_THRESHOLD_COLLAPSE) {
          shouldCollapse = true;
        }
      }
      
      // Only trigger state change if it actually changed
      if (shouldCollapse !== wasCollapsed) {
        wasCollapsed = shouldCollapse;
        
        // Lock further state changes during the transition
        collapseTransitionLockRef.current = true;
        if (collapseTransitionTimeoutRef.current) {
          clearTimeout(collapseTransitionTimeoutRef.current);
        }
        collapseTransitionTimeoutRef.current = setTimeout(() => {
          collapseTransitionLockRef.current = false;
        }, TRANSITION_LOCK_MS);
        
        setIsCollapsed(shouldCollapse);
      }
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
      if (collapseTransitionTimeoutRef.current) {
        clearTimeout(collapseTransitionTimeoutRef.current);
      }
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

  /** Sync More tab height with siblings — true when any visible tab has a subtitle row. */
  const anyVisibleTabHasSubtitle = visibleTabs.some(
    (tab) => Boolean(resolveWorkspaceTabSummary(tab, parentTabSummaries, recordTabSummaries)?.subtitle),
  );

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
          className="flex flex-col gap-1 rounded-br-[0px] pl-7 pr-8 transition-all duration-300 ease-out"
          style={{
            paddingTop: isCollapsed ? HEADER_TITLE_PT.collapsed : HEADER_TITLE_PT.expanded,
            paddingBottom: isCollapsed ? HEADER_TITLE_PB.collapsed : HEADER_TITLE_PB.expanded,
          }}
        >
          {/* Breadcrumb row with team meta on the right */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Breadcrumbs crumbs={crumbs} onNavigate={navigate} collapsed={isCollapsed} />
            </div>
            <CustomerTeamMeta customer={customer} collapsed={isCollapsed} />
          </div>
          {/* Customer name row with priority chips on the right (center aligned) */}
          <div className="flex items-center justify-between gap-4">
            <h1
              className="min-w-0 flex-1 truncate font-bold leading-tight tracking-tight text-text-primary transition-all duration-300 ease-out"
              style={{ fontSize: isCollapsed ? 16 : 28 }}
            >
              {customer.name}
            </h1>
            <CustomerPriorityChips chips={priorityChips} collapsed={isCollapsed} />
          </div>
        </div>
      </div>

      <div
        ref={tabsContainerRef}
        data-tabs-anchor=""
        className={cn(
          "relative -mt-px w-full min-w-0 overflow-x-clip overflow-y-visible transition-[background-color,backdrop-filter] duration-300 ease-out",
          isScrolled && "bg-gray-100/75 backdrop-blur-md backdrop-saturate-150",
        )}
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
                  stage={tab.stage}
                  isRecord={tab.kind === "record"}
                  recordId={tab.kind === "record" ? tab.recordId : undefined}
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
                    stage={tab.stage}
                    isRecord={tab.kind === "record"}
                    recordId={tab.kind === "record" ? tab.recordId : undefined}
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
            tabsCompact={isCollapsed}
            showSubtitleSlot={anyVisibleTabHasSubtitle}
            isOpen={false}
            forMeasure
            onClick={() => {}}
          />
        </div>

        <div
          ref={visibleStripRef}
          className="relative flex w-full min-w-0 items-end justify-center overflow-x-clip overflow-y-visible px-4"
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
              stage={tab.stage}
              isRecord={tab.kind === "record"}
              recordId={tab.kind === "record" ? tab.recordId : undefined}
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
            tabsCompact={isCollapsed}
            showSubtitleSlot={anyVisibleTabHasSubtitle}
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

      {/* Full-width horizontal line below the tabs — header separator */}
      <div className="relative h-px w-full" style={{ background: BORDER_GREY }}>
        {/* Context pills that hang below the line with 1px gap so line is visible */}
        <div className="absolute left-0 right-0 top-[1px] flex items-start justify-between px-6">
          {/* Left info pill */}
          <ContextInfoPill
            activeTab={activeTab}
            customer={customer}
            contextPillData={contextPillData}
            invoicingSubTab={invoicingSubTab}
            onInvoicingSubTabChange={onInvoicingSubTabChange}
            ingestionSession={ingestionSession}
            ingestionSubTab={ingestionSubTab}
            onIngestionSubTabChange={onIngestionSubTabChange}
          />
          
          {/* Right actions pill */}
          {recordSlot ? (
            <ActionsPillWrapper>{recordSlot}</ActionsPillWrapper>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Spacer to account for hanging pills + 1px gap */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          height: CONTEXT_PILL_HEIGHT + 1 + (isCollapsed ? HEADER_TABS_GAP.collapsed : HEADER_TABS_GAP.expanded),
        }}
      />
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
        "shrink-0 text-[12px] text-text-muted whitespace-nowrap transition-all duration-300 ease-out",
        collapsed && "pointer-events-none opacity-0",
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
        "flex max-w-[58%] shrink-0 flex-wrap items-center justify-end gap-1.5 transition-all duration-300 ease-out",
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

/** Fixed tab height for trapezoidal tabs */
const TAB_HEIGHT = { expanded: 62, collapsed: 30 } as const;

/** Character limits for truncation */
const TITLE_CHAR_LIMIT_PARENT = 11;
const TITLE_CHAR_LIMIT_RECORD = 8;
const SUBTITLE_CHAR_LIMIT = 10;

/** Truncate text with ellipsis if it exceeds the character limit */
function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "…";
}

// ---------------------------------------------------------------------------
// Rich tooltip content generation
// ---------------------------------------------------------------------------

interface TooltipContent {
  title: string;
  status?: string;
  statusColor?: "green" | "amber" | "red" | "blue" | "gray";
  message: string;
  details?: string[];
}

const QUIRKY_HEALTHY_MESSAGES: Record<Stage, string[]> = {
  customer: [
    "Looking good! This customer is in great shape.",
    "All systems go. Keep up the stellar work!",
  ],
  tasks: [
    "You're all caught up! Time for a coffee break ☕",
    "Zero tasks pending. Go you!",
    "Inbox zero energy. Treat yourself!",
  ],
  threads: [
    "All caught up on conversations!",
    "No unread messages. Your future self thanks you.",
  ],
  quote: [
    "Quotes are looking healthy!",
    "No pending approvals. Smooth sailing!",
  ],
  contract: [
    "Contracts are in good standing.",
    "Everything's active and running smoothly.",
  ],
  ingestion: [
    "Contract ingestion in progress.",
    "Review the extracted data and approve.",
  ],
  invoicing: [
    "All invoices paid or on track!",
    "Billing is squeaky clean.",
  ],
  payment: [
    "Collections? What collections! All clear.",
    "No overdue payments. Finance team high-five!",
  ],
  revrec: [
    "Revenue recognition is on track.",
    "No blockers. Auditors will be happy!",
  ],
};

function getQuirkyMessage(stage: Stage): string {
  const messages = QUIRKY_HEALTHY_MESSAGES[stage];
  return messages[Math.floor(Math.random() * messages.length)];
}

function generateTooltipContent(
  stage: Stage,
  label: string,
  subtitle?: string,
  severity?: StatusSeverity,
  isRecord?: boolean,
  recordId?: string,
): TooltipContent {
  const sev = severity ?? "gray";
  const isHealthy = sev === "green" || !subtitle;
  
  if (isRecord && recordId) {
    return generateRecordTooltipContent(stage, label, recordId, subtitle, sev);
  }
  
  switch (stage) {
    case "customer":
      return {
        title: label,
        status: subtitle,
        statusColor: sev,
        message: isHealthy 
          ? getQuirkyMessage("customer")
          : "Review customer health signals and take action on any flagged items.",
      };
      
    case "tasks":
      if (!subtitle || subtitle.includes("None") || subtitle === "0 pending") {
        return {
          title: "Tasks",
          status: "All clear",
          statusColor: "green",
          message: getQuirkyMessage("tasks"),
        };
      }
      return {
        title: "Tasks",
        status: subtitle,
        statusColor: sev,
        message: sev === "amber" 
          ? "You have pending tasks that need attention. Stay on top of it!"
          : "Review and complete your pending tasks to keep things moving.",
        details: sev === "amber" ? ["Some tasks may be approaching deadlines"] : undefined,
      };
      
    case "threads":
      if (!subtitle || subtitle.includes("caught up") || subtitle === "0 unread") {
        return {
          title: "Threads",
          status: "All caught up",
          statusColor: "green",
          message: getQuirkyMessage("threads"),
        };
      }
      return {
        title: "Threads",
        status: subtitle,
        statusColor: sev,
        message: "You have unread messages waiting for your response.",
        details: ["Respond promptly to maintain customer satisfaction"],
      };
      
    case "quote":
      if (isHealthy) {
        return {
          title: "Quotes",
          status: subtitle ?? "On track",
          statusColor: "green",
          message: getQuirkyMessage("quote"),
        };
      }
      if (subtitle?.includes("draft")) {
        return {
          title: "Quotes",
          status: subtitle,
          statusColor: sev,
          message: "Drafts are waiting to be finalized and sent to the customer.",
          details: ["Review pricing and terms", "Get internal approval if needed"],
        };
      }
      if (subtitle?.includes("pending") || subtitle?.includes("Pending")) {
        return {
          title: "Quotes",
          status: subtitle,
          statusColor: sev,
          message: "Quotes are awaiting approval before they can be sent.",
          details: ["Check approval queue", "Follow up with approvers if delayed"],
        };
      }
      if (subtitle?.includes("awaiting") || subtitle?.includes("Awaiting")) {
        return {
          title: "Quotes",
          status: subtitle,
          statusColor: sev,
          message: "Quotes have been sent and are awaiting customer response.",
          details: ["Consider a follow-up if no response in 3-5 days"],
        };
      }
      return {
        title: "Quotes",
        status: subtitle,
        statusColor: sev,
        message: "Review the current quote status and take appropriate action.",
      };
      
    case "contract":
      if (subtitle?.includes("Scheduled")) {
        return {
          title: "Contracts",
          status: "Scheduled",
          statusColor: "blue",
          message: "A new contract is scheduled to start soon.",
          details: [
            "The scheduled contract will auto-activate on its start date",
            "Current contract will close when the new one begins",
          ],
        };
      }
      if (subtitle?.includes("Active") || isHealthy) {
        return {
          title: "Contracts",
          status: subtitle ?? "Active",
          statusColor: "green",
          message: getQuirkyMessage("contract"),
        };
      }
      if (subtitle?.includes("Closing") || subtitle?.includes("Extended")) {
        return {
          title: "Contracts",
          status: subtitle,
          statusColor: sev,
          message: "Contract is in transition. Review the timeline and next steps.",
          details: ["Ensure renewal or replacement contract is in place"],
        };
      }
      return {
        title: "Contracts",
        status: subtitle,
        statusColor: sev,
        message: "Review contract status and ensure compliance.",
      };
      
    case "invoicing":
      if (subtitle === "No Due" || subtitle?.includes("Paid") || isHealthy) {
        return {
          title: "Invoicing",
          status: subtitle ?? "All clear",
          statusColor: "green",
          message: getQuirkyMessage("invoicing"),
        };
      }
      if (subtitle === "Unpaid") {
        return {
          title: "Invoicing",
          status: "Unpaid invoices",
          statusColor: sev,
          message: sev === "red" 
            ? "There are overdue invoices requiring immediate attention."
            : "Open invoices are awaiting payment.",
          details: sev === "red" 
            ? ["Escalate to collections if significantly overdue", "Review payment terms"]
            : ["Monitor payment status", "Send reminders if approaching due date"],
        };
      }
      return {
        title: "Invoicing",
        status: subtitle,
        statusColor: sev,
        message: "Review invoicing status and ensure timely processing.",
      };
      
    case "payment":
      if (subtitle?.includes("No open") || isHealthy) {
        return {
          title: "Collections",
          status: subtitle ?? "No open AR",
          statusColor: "green",
          message: getQuirkyMessage("payment"),
        };
      }
      if (sev === "red") {
        return {
          title: "Collections",
          status: subtitle,
          statusColor: "red",
          message: "Critical: Overdue payments require immediate action.",
          details: [
            "Contact customer about payment",
            "Review collection workflow",
            "Consider escalation if unresponsive",
          ],
        };
      }
      return {
        title: "Collections",
        status: subtitle,
        statusColor: sev,
        message: "Monitor accounts receivable and follow up as needed.",
      };
      
    case "revrec":
      if (subtitle === "—" || !subtitle) {
        return {
          title: "RevRec",
          status: "No data",
          statusColor: "gray",
          message: "No revenue recognition data available for this customer.",
        };
      }
      if (isHealthy || subtitle?.includes("On track")) {
        return {
          title: "RevRec",
          status: subtitle,
          statusColor: "green",
          message: getQuirkyMessage("revrec"),
        };
      }
      if (sev === "red" || subtitle?.includes("blocker")) {
        return {
          title: "RevRec",
          status: subtitle,
          statusColor: "red",
          message: "Revenue recognition has blockers that need resolution.",
          details: [
            "Review arrangement obligations",
            "Ensure deliverables are documented",
            "Clear blockers before period close",
          ],
        };
      }
      return {
        title: "RevRec",
        status: subtitle,
        statusColor: sev,
        message: "Review revenue recognition status for compliance.",
      };
      
    default:
      return {
        title: label,
        status: subtitle,
        statusColor: sev,
        message: "View details for this section.",
      };
  }
}

function generateRecordTooltipContent(
  stage: Stage,
  label: string,
  recordId: string,
  subtitle?: string,
  severity?: StatusSeverity,
): TooltipContent {
  const sev = severity ?? "gray";
  
  switch (stage) {
    case "quote":
      return {
        title: `Quote ${recordId}`,
        status: subtitle,
        statusColor: sev,
        message: sev === "green" 
          ? "This quote is in good standing."
          : sev === "amber"
            ? "This quote needs attention or is awaiting action."
            : "Review quote details and status.",
      };
    case "contract":
      return {
        title: `Contract ${recordId}`,
        status: subtitle,
        statusColor: sev,
        message: sev === "green"
          ? "Contract is active and healthy."
          : sev === "blue"
            ? "Contract has scheduled changes coming up."
            : "Review contract status and terms.",
      };
    case "invoicing":
      return {
        title: `Invoice ${recordId}`,
        status: subtitle,
        statusColor: sev,
        message: sev === "green"
          ? "Invoice is paid or processed."
          : sev === "red"
            ? "Invoice is overdue and needs follow-up."
            : "Review invoice status.",
      };
    default:
      return {
        title: label,
        status: subtitle,
        statusColor: sev,
        message: "View record details.",
      };
  }
}

const STATUS_DOT_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  gray: "bg-slate-400",
};

/** Cursor-following tooltip component for tab hover */
function TabTooltip({
  content,
  visible,
  mouseX,
  mouseY,
}: {
  content: TooltipContent;
  visible: boolean;
  mouseX: number;
  mouseY: number;
}) {
  return createPortal(
    <div
      className={cn(
        "fixed z-[9999] pointer-events-none transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        left: mouseX + 14,
        top: mouseY + 18,
      }}
    >
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl min-w-[200px] max-w-[280px]">
        {/* Title with status dot */}
        <div className="flex items-center gap-2">
          <span 
            className="text-[14px] font-semibold text-slate-800" 
            style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
          >
            {content.title}
          </span>
          {content.status && content.statusColor && (
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
              content.statusColor === "green" && "bg-emerald-50 text-emerald-700",
              content.statusColor === "amber" && "bg-amber-50 text-amber-700",
              content.statusColor === "red" && "bg-red-50 text-red-700",
              content.statusColor === "blue" && "bg-blue-50 text-blue-700",
              content.statusColor === "gray" && "bg-slate-100 text-slate-600",
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT_COLORS[content.statusColor])} />
              {content.status}
            </span>
          )}
        </div>
        
        {/* Message */}
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
          {content.message}
        </p>
        
        {/* Details list */}
        {content.details && content.details.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {content.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const WorkspaceTabButton = forwardRef<
  HTMLDivElement,
  {
    label: string;
    subtitle?: string;
    subtitleSeverity?: StatusSeverity;
    /** Stage this tab belongs to — used for rich tooltip content */
    stage: Stage;
    /** Whether this is a record tab (quote/contract/invoice detail) vs parent tab */
    isRecord?: boolean;
    /** Record ID if this is a record tab */
    recordId?: string;
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
    stage,
    isRecord = false,
    recordId,
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
  void measureLayout;
  const hasSubtitle = Boolean(subtitle);
  const showSubtitleRow = hasSubtitle && !tabsCompact;
  const minWidthClass = closable ? TAB_MIN_WIDTH_CLASS.closable : TAB_MIN_WIDTH_CLASS.parent;

  const innerRef = useRef<HTMLDivElement>(null);
  const [tabSize, setTabSize] = useState({ w: 0, h: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabHeight = tabsCompact ? TAB_HEIGHT.collapsed : TAB_HEIGHT.expanded;

  // Initial measurement after mount - use rAF to ensure layout is complete
  useLayoutEffect(() => {
    if (forMeasure || !innerRef.current) return;
    
    // Immediate measurement attempt
    const measure = () => {
      if (!innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTabSize({ w: rect.width, h: rect.height });
      }
    };
    
    measure();
    
    // Also schedule a measurement after paint to catch initial navigation
    const rafId = requestAnimationFrame(() => {
      measure();
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [forMeasure, label, subtitle]);

  useLayoutEffect(() => {
    if (forMeasure) return;
    isTransitioningRef.current = true;
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      if (innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        setTabSize({ w: rect.width, h: rect.height });
      }
    }, 400);
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [forMeasure, tabsCompact]);

  useEffect(() => {
    if (forMeasure || !innerRef.current) return;
    
    // ResizeObserver for ongoing size changes
    const ro = new ResizeObserver((entries) => {
      if (!innerRef.current || isTransitioningRef.current) return;
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setTabSize({ w: width, h: height });
        }
      }
    });
    ro.observe(innerRef.current);
    
    return () => ro.disconnect();
  }, [forMeasure]);

  const titleCharLimit = isRecord ? TITLE_CHAR_LIMIT_RECORD : TITLE_CHAR_LIMIT_PARENT;
  const truncatedLabel = truncateText(label, titleCharLimit);
  const truncatedSubtitle = subtitle ? truncateText(subtitle, SUBTITLE_CHAR_LIMIT) : undefined;
  
  // Generate rich tooltip content based on stage, status, and context
  const tooltipContent = useMemo(() => 
    generateTooltipContent(stage, label, subtitle, subtitleSeverity, isRecord, recordId),
    [stage, label, subtitle, subtitleSeverity, isRecord, recordId]
  );
  
  // Show tooltip for ALL tabs on hover, not just truncated ones
  const showTooltip = isHovered && !forMeasure;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      ref={ref}
      data-tab-key={dataTabKey}
      className={cn(
        "group/tab relative shrink-0 transition-[height]",
        fillWidth ? cn("flex-1", minWidthClass) : "inline-flex",
        !forMeasure && !first && TAB_OVERLAP_CLASS,
      )}
      style={{
        zIndex: active ? 100 : zIndex,
        height: tabHeight,
        transitionDuration: TAB_COLLAPSE_MS,
        transitionTimingFunction: TAB_COLLAPSE_EASE,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Rich cursor-following tooltip shown on hover for ALL tabs */}
      <TabTooltip 
        content={tooltipContent}
        visible={showTooltip} 
        mouseX={mousePos.x}
        mouseY={mousePos.y}
      />
      
      <div
        ref={innerRef}
        role="button"
        tabIndex={forMeasure ? -1 : 0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
        style={{
          height: tabHeight,
          transitionDuration: TAB_COLLAPSE_MS,
          transitionTimingFunction: TAB_COLLAPSE_EASE,
        }}
        className={cn(
          "relative inline-flex items-center justify-center text-center cursor-pointer",
          minWidthClass,
          fillWidth ? "w-full max-w-[130px]" : "w-max max-w-[130px]",
          "transition-[height,transform]",
          active && "cursor-default",
        )}
      >
        {!forMeasure && <TabSVG width={tabSize.w} height={tabSize.h} active={active} hovered={isHovered} collapsed={tabsCompact} />}
        <span
          className={cn(
            "relative z-[2] flex w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden text-center",
            showSubtitleRow ? "gap-0.5 px-6 pt-1.5 pb-1" : "gap-0 px-6",
          )}
          style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        >
        <span
          className={cn(
            "w-full text-center leading-tight font-semibold whitespace-nowrap transition-all duration-200",
            tabsCompact ? "text-[12px]" : "text-[14px]",
            active
              ? "text-white"
              : "text-slate-600 group-hover/tab:text-slate-800",
          )}
          style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
        >
          {truncatedLabel}
        </span>
          {hasSubtitle && (
            <span
              className={cn(
                "grid transition-[grid-template-rows,margin] ease-[cubic-bezier(0.32,0.72,0,1)]",
                showSubtitleRow ? "mt-0.5 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr]",
              )}
              style={{ transitionDuration: TAB_COLLAPSE_MS }}
            >
              <span className="min-h-0 overflow-hidden">
                <span
                  className={cn(
                    "block w-full text-center text-[11px] leading-snug font-medium transition-[opacity,transform] ease-[cubic-bezier(0.32,0.72,0,1)]",
                    showSubtitleRow
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-0.5 opacity-0",
                    active ? "text-white/80" : tabStatusClass(subtitleSeverity, false),
                  )}
                  style={{ transitionDuration: TAB_COLLAPSE_MS }}
                >
                  {truncatedSubtitle}
                </span>
              </span>
            </span>
          )}
        </span>
      </div>
      {closable && !forMeasure && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            "absolute -top-2 left-1/2 -translate-x-1/2 z-[60] inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border shadow-sm cursor-pointer",
            "transition-all duration-150 ease-out",
            "bg-white border-gray-300 text-slate-500",
            "hover:bg-red-50 hover:border-red-300 hover:text-red-600",
            "pointer-events-none opacity-0 scale-90",
            "group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 group-hover/tab:scale-100",
          )}
          aria-label={`Close ${label}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// More tab + menu — width overflow, user-hidden parents, disabled parents
// ---------------------------------------------------------------------------

const MORE_TAB_WIDTH = 102;

const MoreTabButton = forwardRef<
  HTMLDivElement,
  {
    tabsCompact?: boolean;
    /** Mirror the sibling tab height — true when at least one visible tab shows a subtitle row. */
    showSubtitleSlot?: boolean;
    isOpen: boolean;
    forMeasure?: boolean;
    onClick: () => void;
  }
>(function MoreTabButton(
  { tabsCompact = false, showSubtitleSlot = true, isOpen, forMeasure, onClick },
  ref,
) {
  const showSubtitleRow = !tabsCompact && showSubtitleSlot;
  const tabHeight = tabsCompact ? TAB_HEIGHT.collapsed : TAB_HEIGHT.expanded;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={cn(
        "group/more relative inline-flex shrink-0 transition-[height]",
        !forMeasure && TAB_OVERLAP_CLASS,
      )}
      style={{
        height: tabHeight,
        width: MORE_TAB_WIDTH,
        transitionDuration: TAB_COLLAPSE_MS,
        transitionTimingFunction: TAB_COLLAPSE_EASE,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={forMeasure}
        tabIndex={forMeasure ? -1 : undefined}
        style={{
          height: tabHeight,
          width: MORE_TAB_WIDTH,
          transitionDuration: TAB_COLLAPSE_MS,
          transitionTimingFunction: TAB_COLLAPSE_EASE,
        }}
        className="relative inline-flex items-center justify-center text-center cursor-pointer transition-[height]"
      >
        {!forMeasure && <TabSVG width={MORE_TAB_WIDTH} height={tabHeight} active={false} hovered={isHovered || isOpen} collapsed={tabsCompact} />}
        <span
          className={cn(
            "relative z-[2] flex w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden text-center px-6",
            showSubtitleRow ? "gap-0" : "gap-0",
          )}
          style={{ transitionDuration: TAB_COLLAPSE_MS, transitionTimingFunction: TAB_COLLAPSE_EASE }}
        >
          <span
            className={cn(
              "flex w-full items-center justify-center gap-1 whitespace-nowrap text-center font-semibold leading-tight transition-all duration-200",
              tabsCompact ? "text-[12px]" : "text-[14px]",
              "text-slate-600 group-hover/more:text-slate-800",
            )}
            style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}
          >
            More
            <ChevronDown
              size={tabsCompact ? 11 : 13}
              strokeWidth={2.4}
              className={cn(
                "shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
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
                  "block w-full text-center text-[11px] font-medium transition-[opacity,transform] ease-[cubic-bezier(0.32,0.72,0,1)]",
                  showSubtitleRow
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-0.5 opacity-0",
                  "text-slate-400",
                )}
                style={{ transitionDuration: TAB_COLLAPSE_MS }}
                aria-hidden
              >
                options
              </span>
            </span>
          </span>
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
    tabsCompact?: boolean;
    showSubtitleSlot?: boolean;
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
    tabsCompact = false,
    showSubtitleSlot = true,
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
        tabsCompact={tabsCompact}
        showSubtitleSlot={showSubtitleSlot}
        isOpen={isOpen}
        onClick={onToggle}
      />
      {menuPanel && createPortal(menuPanel, document.body)}
    </div>
  );
});
