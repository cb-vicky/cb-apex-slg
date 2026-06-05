import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  ingestionFrameForSub,
  ingestionSubToZenithTab,
  zenithTabToIngestionSub,
  type IngestionSubTab,
} from "@/components/revenue-workspace/ingestion/ingestion-zenith-sync";
import {
  getContractLineItemsForIngest,
  type ContractBillingGapResolution,
  type ContractLineItem,
} from "@/data/contract-line-items";
import { getExtractedContract, type IngestQueueSampleId } from "@/data/ingest-data";
import {
  ZENITH_CONTRACT_SCROLL_COLLAPSE_AT,
  ZENITH_CONTRACT_SCROLL_EXPAND_AT,
  ZENITH_CONTRACT_CONTENT_TABS,
  type ZenithContractActiveTab,
  type ZenithContractContentTab,
} from "./zenith-contract-tabs";
import {
  areZenithContractItemsComplete,
  areZenithSummaryPrerequisiteTabsComplete,
  isZenithInvoicePreviewEnabled,
  isZenithSubscriptionPreviewEnabled,
  type ZenithTabCompletionStatus,
} from "./zenith-contract-tab-status";
import { useIngestContext } from "@/context/IngestContext";

/** Static invoice ID for the Zenith first invoice */
const ZENITH_FIRST_INVOICE_ID = "INV-ZA-2026-001";
import {
  DEFAULT_ZENITH_CONTRACT_REVIEW_STATUS,
  type ZenithContractReviewStatus,
} from "./zenith-contract-review-status";
import { getMainScrollContainer } from "./zenith-contract-scroll";
import {
  newZenithCommentId,
  ZENITH_COMMENT_CURRENT_USER,
  type ZenithContractComment,
} from "@/data/zenith-contract-comments";

export interface ZenithCommentFocus {
  tab: ZenithContractActiveTab;
  anchorLabel: string;
}

export interface ZenithContractChromeValue {
  activeTab: ZenithContractActiveTab;
  setActiveTab: (tab: ZenithContractActiveTab) => void;
  /** Set when ingestion runs inside Customer 360 (for send-for-approval + queue linkage). */
  ingestionQueueItemId?: string;
  ingestionCustomerId?: string;
  ingestionSampleId?: IngestQueueSampleId;
  isScrollCollapsed: boolean;
  getContentTabStatus: (tab: ZenithContractContentTab) => ZenithTabCompletionStatus;
  contractLineItems: ContractLineItem[];
  setContractLineItems: (items: ContractLineItem[]) => void;
  billingGapResolutions: Record<string, ContractBillingGapResolution>;
  setBillingGapResolutions: (
    updater: (
      prev: Record<string, ContractBillingGapResolution>,
    ) => Record<string, ContractBillingGapResolution>,
  ) => void;
  reviewStatus: ZenithContractReviewStatus;
  setReviewStatus: (status: ZenithContractReviewStatus) => void;
  comments: ZenithContractComment[];
  commentCount: number;
  commentsPanelOpen: boolean;
  commentFocus: ZenithCommentFocus | null;
  openCommentsPanel: (focus?: ZenithCommentFocus) => void;
  closeCommentsPanel: () => void;
  addComment: (input: { tab: ZenithContractActiveTab; anchorLabel: string; text: string }) => void;
  toggleCommentPin: (commentId: string) => void;
}

const ZenithContractChromeContext = createContext<ZenithContractChromeValue | null>(null);

export function useZenithContractChrome(): ZenithContractChromeValue | null {
  return useContext(ZenithContractChromeContext);
}

export function ZenithContractChromeProvider({
  enabled,
  resetKey,
  ingestionUrlSync = false,
  ingestionQueueItemId,
  ingestionCustomerId,
  ingestionSampleId,
  children,
}: {
  enabled: boolean;
  /** Resets active tab when contract record changes. */
  resetKey?: string;
  /** When true, active tab syncs with Customer 360 `?sub=` / `?frame=` ingestion params. */
  ingestionUrlSync?: boolean;
  ingestionQueueItemId?: string;
  ingestionCustomerId?: string;
  /** Workbench ingest sample — drives Items-tab line item seed (`sample2`, `sample5`, …). */
  ingestionSampleId?: IngestQueueSampleId;
  children: ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoiceStatusOverrides } = useIngestContext();
  
  // Check if the Zenith invoice has been submitted for approval or posted
  const zenithInvoiceStatus = invoiceStatusOverrides[ZENITH_FIRST_INVOICE_ID];
  const isIngestionComplete = zenithInvoiceStatus === "Pending Approval" || zenithInvoiceStatus === "Posted";
  
  const [activeTab, setActiveTabState] = useState<ZenithContractActiveTab>("Summary");
  // Ingestion workflows default to collapsed; user can expand via scroll or interaction
  const [isScrollCollapsed, setIsScrollCollapsed] = useState(ingestionUrlSync);
  const [contractLineItems, setContractLineItems] = useState<ContractLineItem[]>(() =>
    getContractLineItemsForIngest({ sampleId: ingestionSampleId }),
  );
  const [billingGapResolutions, setBillingGapResolutionsState] = useState<
    Record<string, ContractBillingGapResolution>
  >({});
  const [reviewStatus, setReviewStatus] = useState<ZenithContractReviewStatus>(
    DEFAULT_ZENITH_CONTRACT_REVIEW_STATUS,
  );
  const [comments, setComments] = useState<ZenithContractComment[]>([]);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [commentFocus, setCommentFocus] = useState<ZenithCommentFocus | null>(null);
  const rafRef = useRef(0);
  /** True while the collapse/expand CSS transition is playing (200ms). During this
   *  window the sticky header height is in flux which causes scroll events driven
   *  by the browser clamping scrollTop — we must not react to those. */
  const transitioningRef = useRef(false);
  const transitionTimerRef = useRef(0);

  const itemsTabComplete = areZenithContractItemsComplete({
    items: contractLineItems,
    sampleId: ingestionSampleId,
    billingGapResolutions,
  });

  const setBillingGapResolutions = useCallback(
    (
      updater: (
        prev: Record<string, ContractBillingGapResolution>,
      ) => Record<string, ContractBillingGapResolution>,
    ) => {
      setBillingGapResolutionsState((prev) => updater(prev));
    },
    [],
  );

  const summaryTabComplete = areZenithSummaryPrerequisiteTabsComplete({
    itemsComplete: itemsTabComplete,
  });

  const subscriptionPreviewEnabled = isZenithSubscriptionPreviewEnabled({
    itemsComplete: itemsTabComplete,
  });

  const invoicePreviewEnabled = isZenithInvoicePreviewEnabled({
    itemsComplete: itemsTabComplete,
  });

  const isInvoicePosted = zenithInvoiceStatus === "Posted";
  
  /**
   * Tab status logic:
   * - Items: complete only when all line items mapped + billing gaps resolved
   * - Summary: complete when Items complete (auto-derived)
   * - Billing info / Addresses: always complete by default (no explicit "mark as done")
   * - Subscription Preview: enabled when Items complete
   * - Invoice Preview: enabled when Items complete; "complete" once invoice posted
   */
  const getContentTabStatus = useCallback(
    (tab: ZenithContractContentTab): ZenithTabCompletionStatus => {
      if (tab === "Items") return itemsTabComplete ? "complete" : "pending";
      if (tab === "Summary") return summaryTabComplete ? "complete" : "pending";
      if (tab === "Subscription Preview") {
        return subscriptionPreviewEnabled ? "pending" : "disabled";
      }
      if (tab === "Invoice Preview") {
        if (isInvoicePosted) return "complete";
        return invoicePreviewEnabled ? "pending" : "disabled";
      }
      // Billing info, Addresses: always complete by default
      return "complete";
    },
    [itemsTabComplete, summaryTabComplete, subscriptionPreviewEnabled, invoicePreviewEnabled, isInvoicePosted],
  );

  const openCommentsPanel = useCallback((focus?: ZenithCommentFocus) => {
    setCommentFocus(focus ?? null);
    setCommentsPanelOpen(true);
  }, []);

  const closeCommentsPanel = useCallback(() => {
    setCommentsPanelOpen(false);
    setCommentFocus(null);
  }, []);

  const addComment = useCallback(
    ({ tab, anchorLabel, text }: { tab: ZenithContractActiveTab; anchorLabel: string; text: string }) => {
      setComments((prev) => [
        ...prev,
        {
          id: newZenithCommentId(),
          tab,
          anchorLabel,
          text,
          author: ZENITH_COMMENT_CURRENT_USER.name,
          role: ZENITH_COMMENT_CURRENT_USER.role,
          timestamp: new Date().toISOString(),
          pinned: false,
        },
      ]);
    },
    [],
  );

  const toggleCommentPin = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, pinned: !comment.pinned } : comment,
      ),
    );
  }, []);

  const setActiveTab = useCallback(
    (tab: ZenithContractActiveTab) => {
      const scrollContainer = getMainScrollContainer();
      const scrollTop = scrollContainer?.scrollTop ?? 0;
      const keepPinnedChrome = scrollTop > ZENITH_CONTRACT_SCROLL_COLLAPSE_AT;

      setActiveTabState(tab);

      if (ingestionUrlSync) {
        const documents = ingestionSampleId ? getExtractedContract(ingestionSampleId).documents : undefined;
        const sub = zenithTabToIngestionSub(tab, documents);
        const params = new URLSearchParams(searchParams);
        params.set("sub", sub);
        params.set("frame", ingestionFrameForSub(sub));
        setSearchParams(params, { replace: true });
        // Ingestion workflows keep tabs collapsed throughout — no scroll-driven expansion
        return;
      }

      if (!scrollContainer) return;

      if (!keepPinnedChrome) {
        scrollContainer.scrollTop = 0;
        setIsScrollCollapsed(false);
        return;
      }

      setIsScrollCollapsed(scrollTop > ZENITH_CONTRACT_SCROLL_EXPAND_AT);
    },
    [ingestionUrlSync, ingestionSampleId, searchParams, setSearchParams],
  );

  /** Reset workflow state only when the ingestion session changes — not on every sub-tab URL change. */
  useEffect(() => {
    if (!enabled) {
      setIsScrollCollapsed(false);
      return;
    }

    // Ingestion workflows default to collapsed; non-ingestion contexts start expanded
    setIsScrollCollapsed(ingestionUrlSync);

    const seedLineItems = getContractLineItemsForIngest({ sampleId: ingestionSampleId });

    if (isIngestionComplete) {
      const completedLineItems = seedLineItems.map((item) => ({
        ...item,
        mappingStatus: "mapped" as const,
        catalogLink: item.catalogLink ?? ("system_match" as const),
      }));
      setContractLineItems(completedLineItems);
    } else {
      setContractLineItems(seedLineItems);
    }

    setBillingGapResolutionsState({});
    setReviewStatus(DEFAULT_ZENITH_CONTRACT_REVIEW_STATUS);
    setComments([]);
    setCommentsPanelOpen(false);
    setCommentFocus(null);
    // Note: Initial tab is set separately via the tab-sync effect below
  }, [enabled, resetKey, isIngestionComplete, ingestionUrlSync, ingestionSampleId]);

  /** Keep zenith tab aligned when URL changes — handles both ingestion sub-tabs and direct zenithTab params. */
  useEffect(() => {
    if (!enabled) return;
    
    if (ingestionUrlSync) {
      const sub = (searchParams.get("sub") ?? "summary") as IngestionSubTab;
      const documents = ingestionSampleId ? getExtractedContract(ingestionSampleId).documents : undefined;
      const next = ingestionSubToZenithTab(sub, documents);
      setActiveTabState((prev) => (prev === next ? prev : next));
    } else {
      const zenithTabParam = searchParams.get("zenithTab");
      if (zenithTabParam && (ZENITH_CONTRACT_CONTENT_TABS as readonly string[]).includes(zenithTabParam)) {
        setActiveTabState((prev) => (prev === zenithTabParam ? prev : (zenithTabParam as ZenithContractActiveTab)));
      }
    }
  }, [enabled, ingestionUrlSync, ingestionSampleId, searchParams]);

  /** Mark a chrome height transition as in-progress for `durationMs`. */
  const startTransition = useCallback((durationMs = 220) => {
    transitioningRef.current = true;
    clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      transitioningRef.current = false;
    }, durationMs);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Ingestion workflows keep tabs collapsed throughout — skip scroll-driven toggling
    if (ingestionUrlSync) return;

    const scrollContainer = getMainScrollContainer();
    if (!scrollContainer) return;

    const update = () => {
      // Ignore spurious scroll events that fire while the sticky header is
      // animating its height (the browser clamps scrollTop, which fires scroll).
      if (transitioningRef.current) return;

      const top = scrollContainer.scrollTop;
      setIsScrollCollapsed((prev) => {
        const next = prev
          ? top > ZENITH_CONTRACT_SCROLL_EXPAND_AT
          : top > ZENITH_CONTRACT_SCROLL_COLLAPSE_AT;
        if (next !== prev) startTransition();
        return next;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(update));

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(transitionTimerRef.current);
    };
  }, [enabled, ingestionUrlSync, startTransition]);


  const value: ZenithContractChromeValue | null = enabled
    ? {
        activeTab,
        setActiveTab,
        ingestionQueueItemId,
        ingestionCustomerId,
        ingestionSampleId,
        isScrollCollapsed,
        getContentTabStatus,
        contractLineItems,
        setContractLineItems,
        billingGapResolutions,
        setBillingGapResolutions,
        reviewStatus,
        setReviewStatus,
        comments,
        commentCount: comments.length,
        commentsPanelOpen,
        commentFocus,
        openCommentsPanel,
        closeCommentsPanel,
        addComment,
        toggleCommentPin,
      }
    : null;

  return (
    <ZenithContractChromeContext.Provider value={value}>{children}</ZenithContractChromeContext.Provider>
  );
}
