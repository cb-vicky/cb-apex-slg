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
  zenithSummaryLineItems,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
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
  isScrollCollapsed: boolean;
  getContentTabStatus: (tab: ZenithContractContentTab) => ZenithTabCompletionStatus;
  markTabComplete: (tab: ZenithContractContentTab) => void;
  unmarkTabComplete: (tab: ZenithContractContentTab) => void;
  contractLineItems: ZenithSummaryLineItem[];
  setContractLineItems: (items: ZenithSummaryLineItem[]) => void;
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
  children,
}: {
  enabled: boolean;
  /** Resets active tab when contract record changes. */
  resetKey?: string;
  children: ReactNode;
}) {
  const [searchParams] = useSearchParams();
  const { invoiceStatusOverrides } = useIngestContext();
  
  // Check if the Zenith invoice has been submitted for approval or posted
  const zenithInvoiceStatus = invoiceStatusOverrides[ZENITH_FIRST_INVOICE_ID];
  const isIngestionComplete = zenithInvoiceStatus === "Pending Approval" || zenithInvoiceStatus === "Posted";
  
  const [activeTab, setActiveTabState] = useState<ZenithContractActiveTab>("Summary");
  const [isScrollCollapsed, setIsScrollCollapsed] = useState(false);
  const [contractLineItems, setContractLineItems] = useState<ZenithSummaryLineItem[]>(() => [
    ...zenithSummaryLineItems,
  ]);
  const [manualTabComplete, setManualTabComplete] = useState<
    Partial<Record<ZenithContractContentTab, boolean>>
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

  const itemsTabComplete = areZenithContractItemsComplete(contractLineItems);

  const summaryTabComplete = areZenithSummaryPrerequisiteTabsComplete({
    itemsComplete: itemsTabComplete,
    manualComplete: manualTabComplete,
  });

  const invoicePreviewEnabled = isZenithInvoicePreviewEnabled({
    itemsComplete: itemsTabComplete,
    manualComplete: manualTabComplete,
  });

  const isInvoicePosted = zenithInvoiceStatus === "Posted";
  
  const getContentTabStatus = useCallback(
    (tab: ZenithContractContentTab): ZenithTabCompletionStatus => {
      if (tab === "Items") return itemsTabComplete ? "complete" : "pending";
      if (tab === "Summary") return summaryTabComplete ? "complete" : "pending";
      if (tab === "Invoice Preview") {
        if (isInvoicePosted) return "complete";
        return invoicePreviewEnabled ? "pending" : "disabled";
      }
      return manualTabComplete[tab] ? "complete" : "pending";
    },
    [itemsTabComplete, summaryTabComplete, invoicePreviewEnabled, manualTabComplete, isInvoicePosted],
  );

  const markTabComplete = useCallback((tab: ZenithContractContentTab) => {
    if (tab === "Items" || tab === "Summary") return;
    setManualTabComplete((prev) => ({ ...prev, [tab]: true }));
  }, []);

  const unmarkTabComplete = useCallback((tab: ZenithContractContentTab) => {
    if (tab === "Items" || tab === "Summary") return;
    setManualTabComplete((prev) => {
      const next = { ...prev };
      delete next[tab];
      return next;
    });
  }, []);

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

  const setActiveTab = useCallback((tab: ZenithContractActiveTab) => {
    const scrollContainer = getMainScrollContainer();
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const keepPinnedChrome = scrollTop > ZENITH_CONTRACT_SCROLL_COLLAPSE_AT;

    setActiveTabState(tab);

    if (!scrollContainer) return;

    if (!keepPinnedChrome) {
      scrollContainer.scrollTop = 0;
      setIsScrollCollapsed(false);
      return;
    }

    // Sub-tabs are pinned — preserve scroll position and condensed chrome.
    setIsScrollCollapsed(scrollTop > ZENITH_CONTRACT_SCROLL_EXPAND_AT);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsScrollCollapsed(false);
      return;
    }
    
    // Check for zenithTab URL parameter to set initial tab
    const zenithTabParam = searchParams.get("zenithTab");
    const initialTab: ZenithContractActiveTab = 
      zenithTabParam && (ZENITH_CONTRACT_CONTENT_TABS as readonly string[]).includes(zenithTabParam)
        ? zenithTabParam as ZenithContractActiveTab
        : "Summary";
    
    setActiveTabState(initialTab);
    setIsScrollCollapsed(false);
    
    // If ingestion is complete (invoice submitted), pre-populate all items as mapped
    // and all manual tabs as complete
    if (isIngestionComplete) {
      // Mark all line items as mapped
      const completedLineItems = zenithSummaryLineItems.map((item) => ({
        ...item,
        mappingStatus: "mapped" as const,
      }));
      setContractLineItems(completedLineItems);
      
      // Mark all manual tabs as complete
      setManualTabComplete({
        "Billing info": true,
        "Addresses": true,
      });
    } else {
      setContractLineItems([...zenithSummaryLineItems]);
      setManualTabComplete({});
    }
    
    setReviewStatus(DEFAULT_ZENITH_CONTRACT_REVIEW_STATUS);
    setComments([]);
    setCommentsPanelOpen(false);
    setCommentFocus(null);
  }, [enabled, resetKey, searchParams, isIngestionComplete]);

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
  }, [enabled, startTransition]);


  const value: ZenithContractChromeValue | null = enabled
    ? {
        activeTab,
        setActiveTab,
        isScrollCollapsed,
        getContentTabStatus,
        markTabComplete,
        unmarkTabComplete,
        contractLineItems,
        setContractLineItems,
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
