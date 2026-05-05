import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, MessageSquare, PanelRightOpen, X } from "lucide-react";
import type { DrawerEntityType, DrawerMode, EntityState, TransitionDrawerIntent } from "@/data/contract-transition";
import { transitionTypeFromIntent } from "@/data/contract-transition";
import { useIngestContext } from "@/context/IngestContext";
import { ValidationPanel, type ValidationItem } from "./ValidationPanel";
import type { ApprovalComment } from "@/data/ingest-data";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { buildIngestResult, getExtractedContract } from "@/data/ingest-data";
import {
  customers as seedCustomers,
  contracts,
  getContractsForCustomer,
  type Contract,
} from "@/data/mock-data";
import {
  buildZenithScheduledContract,
  buildZenithSessionCustomer,
  buildZenithSessionInvoice,
  ZENITH_CONTRACT_ID,
  ZENITH_CUSTOMER_ID,
  ZENITH_INVOICE_ID,
} from "@/data/zenith-ingest-session";
import { INGEST_DRAWER_NEW_CUSTOMER_ID } from "./ingest-drawer-constants";
import { DrawerRailIndent } from "./DrawerSelectShell";
import type { QueueItem } from "@/data/queue-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, cn, shortDate } from "@/lib/utils";
import { TransitionIntentSelector } from "./TransitionIntentSelector";
import {
  CustomerMappingSection,
  type NewCustomerFormValues,
} from "./sections/CustomerMappingSection";
import { BillingStructureSection } from "./sections/BillingStructureSection";
import { PrepaidOnlyBillingSelect } from "./sections/PrepaidOnlyBillingSelect";
import { ContractProcessingSummarySection } from "./sections/ContractProcessingSummarySection";
import { TransitionContractTermsSection } from "./sections/TransitionContractTermsSection";
import { ContractTransitionSection } from "./sections/ContractTransitionSection";
import { FinancialPreviewSection } from "./sections/FinancialPreviewSection";
import { CatalogMappingSection } from "./sections/CatalogMappingSection";
import { InvoicePlanSection } from "./sections/InvoicePlanSection";
import { ApprovalPolicyInlineSection } from "./sections/ApprovalPolicyInlineSection";
import { ValidationSummaryPanel } from "./panels/ValidationSummaryPanel";
import { TransitionSummaryPanel } from "./panels/TransitionSummaryPanel";
import { ActivationTimelinePanel } from "./panels/ActivationTimelinePanel";
import {
  deriveIngestDrawerValidation,
  firstInvoiceAmount,
  type BillingKind,
} from "./ingest-drawer-derive";
import { ApprovalPanelOverlay } from "./ApprovalPanelOverlay";
import { IngestDocumentPreviewPane } from "./IngestDocumentPreviewPane";
import { IngestFieldGroup, type IngestFieldGroupChip } from "./IngestFieldGroup";
import { getDrawerState, openDrawer, patchFlowSession } from "@/store/drawer-store";
import { useDrawerStore } from "@/store/useDrawerStore";

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TODAY = new Date().toISOString().slice(0, 10);

function entityStateToBadge(s: EntityState): string {
  switch (s) {
    case "queued":
      return "Queued";
    case "in_progress":
      return "In Progress";
    case "draft":
      return "Draft";
    case "ready":
      return "Ready";
    case "pending_approval":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "executed":
      return "Executed";
    default:
      return "Draft";
  }
}

export interface IngestDrawerProps {
  entityType: DrawerEntityType;
  mode?: DrawerMode;
  entityId?: string;
  context?: { customerId?: string; contractId?: string; latePhase?: "extend" | "resolve" };
  onClose: () => void;
  /** Full-page queue ingest: wider layout with comments column (used from `/queue/:id`). */
  presentation?: "drawer" | "page";
  /** When true, the sticky chrome is rendered by `UnifiedFlowShell` instead. */
  omitHeader?: boolean;
  /** Unified flow: approver recap on Map & terms — same layout, fields non-editable. */
  readOnly?: boolean;
}

export function IngestDrawer({
  entityType,
  mode,
  entityId,
  context,
  onClose,
  presentation = "drawer",
  omitHeader = false,
  readOnly = false,
}: IngestDrawerProps) {
  const navigate = useNavigate();
  const ingestCtx = useIngestContext();
  const {
    queueItems,
    applyQueueItemOverride,
    sessionCustomers,
    sessionContracts,
    sessionProductSkus,
    addSessionProductSku,
    addSessionCustomer,
    addSessionContract,
    addSessionInvoice,
    setIngestResult,
    setPendingRenewalIngestion,
    contractGraceExtensions,
    setContractGraceExtension,
    showRenewalToast,
    approvalRequests,
    addApprovalComment,
    ensureQueueIngestDiscussion,
    submitInvoiceForApproval,
  } = ingestCtx;

  const { persona } = useDemoPersona();
  const { flow: drawerFlow } = useDrawerStore();
  const { setTrailingActions } = useUnifiedDrawerChrome();

  const queueItem = useMemo(
    () => (entityId ? queueItems.find((q) => q.id === entityId) : undefined),
    [entityId, queueItems],
  );

  /** Unified ingest shell: Early Renewal queue rows stay on the renewal intent (same IA as operator mapping). */
  useEffect(() => {
    if (!omitHeader || !queueItem || queueItem.scenario !== "Early Renewal") return;
    setIntent("early_renewal");
  }, [omitHeader, queueItem?.id, queueItem?.scenario]);

  const mergedCustomers = useMemo(() => {
    const byId = new Map(seedCustomers.map((c) => [c.id, c]));
    sessionCustomers.forEach((c) => byId.set(c.id, c));
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionCustomers]);

  const extracted = useMemo(() => {
    if (!queueItem?.sampleId) return null;
    return getExtractedContract(queueItem.sampleId);
  }, [queueItem]);

  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    if (entityType !== "queue_item" || !entityId) {
      if (context?.customerId) setCustomerId(context.customerId);
      else if (mergedCustomers[0]) setCustomerId(mergedCustomers[0].id);
      return;
    }
    const q = ingestCtx.queueItems.find((x) => x.id === entityId);
    if (!q) return;
    if (q.customerId) setCustomerId(q.customerId);
    else if (q.scenario === "New Business") setCustomerId(INGEST_DRAWER_NEW_CUSTOMER_ID);
    else if (mergedCustomers[0]) setCustomerId(mergedCustomers[0].id);
    // Intentionally omit mergedCustomers from deps so changing session customers does not reset the row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, context?.customerId, ingestCtx.queueItems]);

  const [newCustomer, setNewCustomer] = useState<NewCustomerFormValues>({
    name: "",
    billingLegalEntity: "",
    domain: "",
  });
  const [newCustomerAcknowledged, setNewCustomerAcknowledged] = useState(false);

  useEffect(() => {
    if (!extracted || queueItem?.scenario !== "New Business") return;
    setNewCustomer({
      name: extracted.customerName,
      billingLegalEntity: extracted.customerLegalEntity,
      domain: "",
    });
  }, [extracted, queueItem?.id, queueItem?.scenario]);

  useEffect(() => {
    setNewCustomerAcknowledged(false);
  }, [customerId, entityId]);
  const [intent, setIntent] = useState<TransitionDrawerIntent>(() => {
    if (mode === "late_renewal" || context?.latePhase === "resolve") return "late_extend";
    if (context?.latePhase === "extend") return "late_extend";
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    if (q?.scenario === "Early Renewal") return "early_renewal";
    if (q?.scenario === "Amendment") return "amendment";
    if (context?.contractId && !q) return "amendment";
    return "new_deal";
  });
  const [entityStatus, setEntityStatus] = useState<EntityState>(() => {
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    if (q?.status === "Ingested" || q?.status === "Invoice review") return "executed";
    if (q?.status === "Pending Review" || q?.status === "Returned") return "queued";
    if (q?.status === "In Progress") return "in_progress";
    return "draft";
  });
  const [billingKind, setBillingKind] = useState<BillingKind>("prepaid");
  const [invoiceTiming, setInvoiceTiming] = useState<"on_approval" | "on_activation">("on_activation");
  const [startDate, setStartDate] = useState(() => {
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    const ex = q?.sampleId ? getExtractedContract(q.sampleId) : null;
    return ex?.terms.startDate ?? addDays(TODAY, 5);
  });
  const [endDate, setEndDate] = useState(() => {
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    const ex = q?.sampleId ? getExtractedContract(q.sampleId) : null;
    return ex?.terms.endDate ?? addDays(TODAY, 365);
  });
  const [billingFrequency, setBillingFrequency] = useState(() => {
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    const ex = q?.sampleId ? getExtractedContract(q.sampleId) : null;
    return ex?.terms.billingFrequency ?? "Annual";
  });
  const [autoRenew, setAutoRenew] = useState(() => {
    const q = entityId ? ingestCtx.queueItems.find((x) => x.id === entityId) : undefined;
    const ex = q?.sampleId ? getExtractedContract(q.sampleId) : null;
    return ex?.terms.autoRenew ?? true;
  });
  const [futureInvoices, setFutureInvoices] = useState<"always" | "if_changed" | "never">("if_changed");
  const [executionDate, setExecutionDate] = useState(addDays(TODAY, 14));
  const [graceDays, setGraceDays] = useState(30);
  const [graceBilling, setGraceBilling] = useState<"continue" | "pause">("continue");
  const [resolution, setResolution] = useState<"renew" | "replace" | "terminate">("renew");
  const [latePhase] = useState<"extend" | "resolve">(() => {
    if (mode === "late_renewal") return "resolve";
    if (context?.latePhase) return context.latePhase;
    return "extend";
  });
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalVariant, setApprovalVariant] = useState<"approve_activate" | "approve_transition" | "submit">("submit");
  const [ingestPreviewCollapsed, setIngestPreviewCollapsed] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fieldsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (billingKind === "postpaid") {
      setInvoiceTiming("on_activation");
    }
  }, [billingKind]);

  const isQueueIngest = entityType === "queue_item" && mode === "ingest";
  const isPageWorkspace = presentation === "page" && isQueueIngest;
  const useUnifiedIngestGrid = Boolean(
    omitHeader && presentation === "drawer" && isQueueIngest && drawerFlow?.scenario === "ingest_invoice",
  );
  const triColQueueIngest = isQueueIngest && (isPageWorkspace || useUnifiedIngestGrid);

  const pageApproval = useMemo(
    () => (queueItem ? approvalRequests.find((r) => r.ingestId === queueItem.id) : undefined),
    [approvalRequests, queueItem],
  );

  useLayoutEffect(() => {
    if (!triColQueueIngest || !queueItem) return;
    ensureQueueIngestDiscussion(queueItem.id, {
      customerId: queueItem.customerId,
      customerName: queueItem.customerName,
    });
  }, [triColQueueIngest, queueItem, ensureQueueIngestDiscussion]);

  useEffect(() => {
    if (isQueueIngest) {
      setBillingKind("prepaid");
    }
  }, [isQueueIngest]);

  function handlePageIngestComment(text: string) {
    if (!pageApproval) return;
    const comment: ApprovalComment = {
      id: `qc-${Date.now()}`,
      author: "You",
      role: persona === "approver" ? "Approver" : "Billing Ops",
      text,
      timestamp: new Date().toISOString(),
    };
    addApprovalComment(pageApproval.id, comment);
  }

  const newCustomerComplete =
    newCustomer.name.trim().length > 0 &&
    newCustomer.billingLegalEntity.trim().length > 0 &&
    newCustomer.domain.trim().length > 0;

  const activeContract = useMemo(() => {
    if (!customerId || customerId === INGEST_DRAWER_NEW_CUSTOMER_ID) return null;
    const seed = getContractsForCustomer(customerId);
    const sess = sessionContracts.filter((c) => c.customerId === customerId);
    const byId = new Map<string, (typeof seed)[0]>();
    seed.forEach((c) => byId.set(c.id, c));
    sess.forEach((c) => byId.set(c.id, c));
    return [...byId.values()].find((c) => c.status === "Active") ?? null;
  }, [customerId, sessionContracts]);

  const priorContract = useMemo(() => {
    if (!context?.contractId) return null;
    return contracts.find((c) => c.id === context.contractId) ?? null;
  }, [context]);

  const graceForPrior = context?.contractId ? contractGraceExtensions[context.contractId] : undefined;
  
  // Late renewal: detect if prior contract is in extension
  const isLateRenewal = queueItem?.scenario === "Late Renewal";
  const priorContractId = queueItem?.activeContractId;
  const priorContractForLateRenewal = priorContractId 
    ? contracts.find((c) => c.id === priorContractId) 
    : undefined;
  const graceExtensionForLateRenewal = priorContractId 
    ? contractGraceExtensions[priorContractId] 
    : undefined;
  const showLateRenewalBanner = isLateRenewal && priorContractForLateRenewal && graceExtensionForLateRenewal;

  const customerLabel =
    customerId === INGEST_DRAWER_NEW_CUSTOMER_ID
      ? newCustomer.name.trim() || "New customer"
      : mergedCustomers.find((c) => c.id === customerId)?.name ?? "—";
  const tcv = extracted?.terms.tcv ?? queueItem?.tcv ?? priorContract?.tcv ?? 0;
  const settlementAmount = Math.round(tcv * 0.08);
  const extensionCharge = Math.round((tcv / 365) * graceDays * 0.15);

  const validation = useMemo(
    () =>
      deriveIngestDrawerValidation({
        customerId,
        customers: mergedCustomers,
        extracted,
        sessionProductSkus,
        billingKind,
        invoiceTiming,
        startDate,
        endDate,
        tcv,
        lineItemCount: extracted?.products.length ?? 0,
        newCustomerComplete,
        newCustomerAcknowledged,
      }),
    [
      customerId,
      mergedCustomers,
      extracted,
      sessionProductSkus,
      billingKind,
      invoiceTiming,
      startDate,
      endDate,
      tcv,
      newCustomerComplete,
      newCustomerAcknowledged,
    ],
  );

  const customerNotFoundIssue = extracted?.issues.find((i) => i.type === "customer_not_found");
  const createCustomerIssueForDrawer =
    queueItem &&
    !queueItem.customerId &&
    customerId === INGEST_DRAWER_NEW_CUSTOMER_ID &&
    customerNotFoundIssue &&
    !newCustomerAcknowledged
      ? { message: customerNotFoundIssue.message }
      : null;

  const validationItems: ValidationItem[] = useMemo(() => {
    const hasCustomerIssue = validation.businessIssues.some((i) => i.id === "biz-customer");
    const hasDateIssue = validation.businessIssues.some((i) => i.id === "biz-dates");
    const hasCatalogIssue = validation.extractedRemaining.some((i) => i.type === "product_mismatch");
    const hasLineIssue = validation.businessIssues.some((i) => i.id === "biz-lines");

    return [
      {
        id: "customer",
        label: "Customer",
        status: hasCustomerIssue ? "error" : customerId ? "valid" : "pending",
        hint: customerId ? customerLabel : "Not selected",
      },
      {
        id: "billing",
        label: "Billing",
        status: "valid",
        hint: billingKind === "prepaid" ? "Prepaid" : billingKind === "hybrid" ? "Hybrid" : "Postpaid",
      },
      {
        id: "terms",
        label: "Contract terms",
        status: hasDateIssue ? "error" : "valid",
        hint: `${startDate} — ${endDate}`,
      },
      {
        id: "catalog",
        label: "Catalog mapping",
        status: hasCatalogIssue || hasLineIssue ? "warning" : "valid",
        hint: `${extracted?.products.length ?? 0} line items`,
      },
    ];
  }, [validation, customerId, customerLabel, billingKind, startDate, endDate, extracted]);

  /**
   * Per-group status chip displayed in the field-group header. Mirrors the
   * left-rail validation panel so the two surfaces use identical nouns + state.
   */
  const groupChips = useMemo(() => {
    const toneByStatus: Record<ValidationItem["status"], IngestFieldGroupChip["tone"]> = {
      valid: "valid",
      warning: "warning",
      error: "error",
      pending: "neutral",
    };
    const byId: Record<string, IngestFieldGroupChip | undefined> = {};
    validationItems.forEach((item) => {
      byId[item.id] = item.hint
        ? { label: item.hint, tone: toneByStatus[item.status] }
        : undefined;
    });
    return byId;
  }, [validationItems]);

  const transitionChip = useMemo<IngestFieldGroupChip | undefined>(() => {
    if (intent === "early_renewal") {
      return { label: `Execute ${shortDate(executionDate)}`, tone: "neutral" };
    }
    if (intent === "amendment") {
      return { label: `+${currency(tcv * 0.04)} ARR`, tone: "neutral" };
    }
    if (intent === "late_extend") {
      if (latePhase === "extend") {
        return {
          label: `${graceDays} days · billing ${graceBilling === "continue" ? "continues" : "paused"}`,
          tone: "warning",
        };
      }
      const label =
        resolution === "renew" ? "Renew" : resolution === "replace" ? "Replace" : "Terminate";
      return { label, tone: "neutral" };
    }
    return undefined;
  }, [intent, executionDate, tcv, latePhase, graceDays, graceBilling, resolution]);

  const transitionGroupTitle = useMemo(() => {
    if (intent === "early_renewal") return "Transition — early renewal";
    if (intent === "amendment") return "Transition — amendment";
    if (intent === "late_extend") {
      return latePhase === "extend"
        ? "Transition — late renewal extend"
        : "Transition — late renewal resolve";
    }
    return "Transition";
  }, [intent, latePhase]);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const el = sectionRefs.current[sectionId];
    if (el && fieldsContainerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const showNewCustomerKvSummary =
    !!queueItem &&
    !queueItem.customerId &&
    customerId === INGEST_DRAWER_NEW_CUSTOMER_ID &&
    !!customerNotFoundIssue &&
    newCustomerAcknowledged;

  const productMismatchIssue = extracted?.issues.find((i) => i.type === "product_mismatch");
  const hasUnmappedCatalogSkus = Boolean(
    extracted?.products.some((p) => !p.matched && !sessionProductSkus.includes(p.extractedSku)),
  );
  const catalogMappingIssueForDrawer =
    intent === "new_deal" && productMismatchIssue && hasUnmappedCatalogSkus
      ? { message: productMismatchIssue.message, detail: productMismatchIssue.detail }
      : null;

  const showUnifiedOperatorFooter =
    Boolean(
      omitHeader &&
        drawerFlow?.scenario === "ingest_invoice" &&
        drawerFlow.step === "ingest" &&
        persona === "operator" &&
        isQueueIngest &&
        (intent === "new_deal" || intent === "early_renewal") &&
        queueItem &&
        (queueItem.status === "Pending Review" ||
          queueItem.status === "In Progress" ||
          queueItem.status === "Returned"),
    );

  const transitionType = transitionTypeFromIntent(intent) ?? "new_deal";
  const summaryType =
    intent === "late_extend" && latePhase === "resolve" ? "late_renewal" : transitionType;

  const allowedIntents = useMemo((): TransitionDrawerIntent[] | "all" => {
    if (mode === "late_renewal") return "all";
    if (!queueItem) return "all";
    if (!queueItem.ingestable) return "all";
    if (queueItem.scenario === "Early Renewal") return ["early_renewal", "new_deal", "amendment"];
    if (queueItem.scenario === "Amendment") return ["amendment", "new_deal"];
    return ["new_deal", "amendment", "early_renewal", "late_extend"];
  }, [queueItem, mode]);

  const showIntentSelector = mode !== "late_renewal";

  const timelineSteps = useMemo(() => {
    const act = startDate;
    const invDetail =
      billingKind === "postpaid"
        ? "Postpaid — cycle invoices"
        : billingKind === "hybrid"
          ? "Hybrid — commit invoice + usage in arrears"
          : invoiceTiming === "on_activation"
            ? "On activation"
            : "On approval";
    return [
      { label: "Approval", detail: entityStatus === "executed" ? "Completed" : "Pending", done: entityStatus !== "draft" },
      { label: "Activation", detail: `Target ${act}`, done: entityStatus === "executed" },
      {
        label: "Invoice sent",
        detail: invDetail,
        done: entityStatus === "executed" && billingKind !== "postpaid",
      },
    ];
  }, [startDate, entityStatus, billingKind, invoiceTiming]);

  function openIngestCommentsPage() {
    if (queueItem) {
      onClose();
      navigate(`/queue/${queueItem.id}?focus=comments`);
      return;
    }
    if (context?.customerId) {
      navigate(
        `/customers/${context.customerId}?tab=contract${context.contractId ? `&contractId=${context.contractId}` : ""}`,
      );
    }
  }

  function openLinkedInvoiceApproval() {
    if (!queueItem?.invoiceId) return;
    const { flow } = getDrawerState();
    if (flow?.scenario === "ingest_invoice") {
      patchFlowSession({
        step: "invoice_review",
        furthestUnlockedStep: "invoice_review",
        invoiceId: queueItem.invoiceId,
        queueItemId: queueItem.id,
        ingestReadOnly: false,
      });
      return;
    }
    onClose();
    openDrawer({
      entityType: "invoice",
      mode: "invoice_approval",
      entityId: queueItem.invoiceId,
      context: { queueItemId: queueItem.id },
    });
  }

  function handleSaveDraft() {
    setEntityStatus("draft");
  }

  function handleEarlyRenewalQueueFinish(q: QueueItem) {
    if (!q.activeContractId || !q.customerId) return;
    setPendingRenewalIngestion(q.activeContractId, {
      queueItemId: q.id,
      sampleId: "sample3",
      renewalTcv: q.tcv,
      customerId: q.customerId,
      pendingContractId: "CON-2026-0VH1",
    });
    const { flow } = getDrawerState();
    if (flow?.scenario === "ingest_invoice") {
      patchFlowSession({
        step: "close_prior",
        furthestUnlockedStep: "close_prior",
      });
      return;
    }
    onClose();
    navigate(
      `/customers/${q.customerId}?tab=contract&contractId=${q.activeContractId}&closeIntent=early-renewal&queueItemId=${q.id}`,
    );
  }

  function handleLateRenewalQueueFinish(q: QueueItem) {
    if (!q.activeContractId || !q.customerId) return;

    // Create the scheduled renewal contract — reflects operator-chosen (possibly backdated)
    // effective date, end date, and billing frequency from the ingest form.
    const renewalContract: Contract = {
      id: "CON-2026-0NL1",
      customerId: q.customerId,
      sourceQuoteId: "",
      status: "Scheduled",
      tcv: q.tcv,
      term: "12 months",
      effectiveDate: startDate,
      endDate: endDate,
      signedDate: "2026-04-18",
      renewalDate: endDate,
      billingFrequency: billingFrequency,
      paymentTerms: "Net 30",
      prepaidCreditTotal: 85000,
      prepaidCreditBalance: 85000,
      minAnnualCommit: 140000,
      owner: "Alex Nguyen",
      products: [
        {
          name: "Apex Platform – Enterprise",
          sku: "APEX-PLATFORM",
          type: "recurring",
          quantity: 350,
          unitPrice: 48,
          discountApplied: 12,
          minimumCommit: 0,
          prepaidCredits: 0,
          overageRate: 0,
          billingCadence: "Monthly",
        },
        {
          name: "AI Agent Credits – Prepaid Block",
          sku: "APEX-AI-CREDITS",
          type: "one-time",
          quantity: 1,
          unitPrice: 85000,
          discountApplied: 0,
          minimumCommit: 0,
          prepaidCredits: 85000,
          overageRate: 0.018,
          billingCadence: "Upfront",
        },
        {
          name: "Premium Support – 24/7",
          sku: "APEX-SUPPORT",
          type: "recurring",
          quantity: 1,
          unitPrice: 2200,
          discountApplied: 0,
          minimumCommit: 0,
          prepaidCredits: 0,
          overageRate: 0,
          billingCadence: "Monthly",
        },
      ],
      enforcement: {
        sourceType: "API",
        linkedQuoteId: "",
        saleOrderStatus: "Pending",
        enforcementStatus: "Pending",
        productMappingIssues: [],
        missingFields: [],
        provisioningStatus: "Not started",
        entitlementStatus: "Not started",
        manualOverrides: [],
        blockingIssues: [],
      },
      billingSchedule: [],
      amendments: [],
      comparisonToQuote: [],
      invoicesGenerated: 0,
      creditNotes: 0,
      openAr: 0,
      paymentsReceived: 0,
      unappliedCash: 0,
      revRecSummary: { recognized: 0, deferred: q.tcv, status: "Not started" },
      signedDocumentUrl: "",
      ingestionTimestamp: new Date().toISOString(),
      extractionConfidence: 96,
      quoteMatchConfidence: 0,
      importantClauses: [],
      timeline: [],
      coTermBehavior: "Standard",
      replacesContractId: q.activeContractId,
    };
    addSessionContract(renewalContract);

    setPendingRenewalIngestion(q.activeContractId, {
      queueItemId: q.id,
      sampleId: "sample4",
      renewalTcv: q.tcv,
      customerId: q.customerId,
      pendingContractId: "CON-2026-0NL1",
    });

    // Late Renewal reuses the same `ingest_invoice` scenario as Early Renewal,
    // so the drawer/steps/components are identical. Just advance to close_prior.
    const { flow } = getDrawerState();
    if (flow?.scenario === "ingest_invoice" || flow?.scenario === "late_renewal_resolve") {
      patchFlowSession({
        scenario: "ingest_invoice",
        step: "close_prior",
        furthestUnlockedStep: "close_prior",
        queueItemId: q.id,
        customerId: q.customerId,
        contractId: q.activeContractId,
      });
      return;
    }
    onClose();
    navigate(
      `/customers/${q.customerId}?tab=contract&contractId=${q.activeContractId}&closeIntent=late-renewal&queueItemId=${q.id}`,
    );
  }

  function handleExecuteIngest(q: QueueItem) {
    if (validation.flags.hasBlockingErrors) return;
    const needsRiskConfirm =
      validation.flags.isHybridDeal ||
      validation.businessIssues.some((i) => i.id === "warn-discount");
    if (
      needsRiskConfirm &&
      !window.confirm(
        "Submit with open warnings? Confirm hybrid/discount policy alignment before continuing.",
      )
    ) {
      return;
    }
    if (q.sampleId === "sample3") {
      handleEarlyRenewalQueueFinish(q);
      return;
    }
    if (q.sampleId === "sample4") {
      handleLateRenewalQueueFinish(q);
      return;
    }
    if (!q.sampleId) {
      handleEarlyRenewalQueueFinish(q);
      return;
    }

    const resolvedCustomerId =
      customerId === INGEST_DRAWER_NEW_CUSTOMER_ID ? ZENITH_CUSTOMER_ID : customerId;
    const contractId =
      resolvedCustomerId === ZENITH_CUSTOMER_ID ? ZENITH_CONTRACT_ID : `CON-INGEST-${resolvedCustomerId}`;
    const invoiceId =
      resolvedCustomerId === ZENITH_CUSTOMER_ID ? ZENITH_INVOICE_ID : `INV-INGEST-${resolvedCustomerId}`;

    const sessionCustomer =
      customerId === INGEST_DRAWER_NEW_CUSTOMER_ID
        ? buildZenithSessionCustomer({
            name: newCustomer.name.trim(),
            billingLegalEntity: newCustomer.billingLegalEntity.trim(),
            domain: newCustomer.domain.trim(),
          })
        : mergedCustomers.find((c) => c.id === resolvedCustomerId);
    if (!sessionCustomer) return;

    if (customerId === INGEST_DRAWER_NEW_CUSTOMER_ID) {
      addSessionCustomer(sessionCustomer);
    }

    addSessionContract(
      buildZenithScheduledContract({
        contractId,
        customerId: resolvedCustomerId,
        invoiceId,
        startDate,
        endDate,
        billingFrequency,
      }),
    );
    const invoiceAmount = firstInvoiceAmount({
      billingKind: "prepaid",
      tcv,
      prepaidFirstInvoice: tcv,
    });
    addSessionInvoice(
      buildZenithSessionInvoice({
        id: invoiceId,
        customerId: resolvedCustomerId,
        contractId,
        // Invoice effective date defaults to today (operator can backdate
        // in the next step via Critical Fields).
        date: TODAY,
        amount: invoiceAmount,
        status: "Pending Review",
      }),
    );

    const result = buildIngestResult(q.sampleId, resolvedCustomerId, {
      customerLabel: sessionCustomer.name,
      contractId,
      invoiceId,
      customerAction: customerId === INGEST_DRAWER_NEW_CUSTOMER_ID ? "created" : "reused",
    });
    setIngestResult(result);

    applyQueueItemOverride(q.id, {
      status: "Invoice review",
      contractId,
      invoiceId,
      customerId: resolvedCustomerId,
    });
    setEntityStatus("executed");
    if (isPageWorkspace) {
      navigate(`/contracts/${contractId}`);
      openDrawer({
        entityType: "queue_item",
        mode: "ingest",
        entityId: q.id,
        flow: {
          scenario: "ingest_invoice",
          step: "invoice_review",
          furthestUnlockedStep: "invoice_review",
          queueItemId: q.id,
          invoiceId,
          contractId,
          customerId: resolvedCustomerId,
        },
      });
      return;
    }
    const { flow } = getDrawerState();
    if (flow?.scenario === "ingest_invoice") {
      patchFlowSession({
        step: "invoice_review",
        furthestUnlockedStep: "invoice_review",
        invoiceId,
        contractId,
        customerId: resolvedCustomerId,
        queueItemId: q.id,
      });
      return;
    }
    onClose();
  }

  const runIngestRef = useRef(handleExecuteIngest);
  runIngestRef.current = handleExecuteIngest;

  useEffect(() => {
    if (!showUnifiedOperatorFooter || !queueItem) {
      setTrailingActions(null);
      return;
    }
    setTrailingActions(
      <button
        type="button"
        disabled={!queueItem.ingestable || !queueItem.sampleId || validation.flags.hasBlockingErrors}
        onClick={() => runIngestRef.current(queueItem)}
        className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={14} className="opacity-90" aria-hidden />
      </button>,
    );
    return () => setTrailingActions(null);
  }, [
    showUnifiedOperatorFooter,
    queueItem,
    queueItem?.ingestable,
    queueItem?.sampleId,
    validation.flags.hasBlockingErrors,
    setTrailingActions,
  ]);

  function handleConfigureExtension() {
    if (!context?.contractId || !context.customerId) return;
    const until = addDays(TODAY, graceDays);
    setContractGraceExtension(context.contractId, {
      contractId: context.contractId,
      customerId: context.customerId,
      until,
      billingMode: graceBilling,
      markedAt: new Date().toISOString(),
      resolved: false,
    });
    setEntityStatus("executed");
    showRenewalToast("Grace extension recorded — resolve before period ends.", context.customerId);
    const { flow } = getDrawerState();
    if (flow?.scenario === "late_grace") {
      const graceInvId = `INV-GRACE-${context.contractId.replace(/[^A-Z0-9]/gi, "").slice(-8)}`;
      submitInvoiceForApproval(graceInvId, {
        customerId: context.customerId,
        customerName:
          mergedCustomers.find((c) => c.id === context.customerId)?.name ?? "Customer",
        invoiceAmount: Math.round(extensionCharge),
        invoiceDate: TODAY,
      });
      patchFlowSession({
        step: "approval",
        furthestUnlockedStep: "approval",
        invoiceId: graceInvId,
        contractId: context.contractId,
        customerId: context.customerId,
      });
      return;
    }
    onClose();
    navigate(`/customers/${context.customerId}?tab=contract&contractId=${context.contractId}`);
  }

  function handleResolveExtension() {
    if (!context?.contractId || !context.customerId) return;
    setContractGraceExtension(context.contractId, {
      ...(graceForPrior ?? {
        contractId: context.contractId,
        customerId: context.customerId,
        until: TODAY,
        billingMode: "continue",
        markedAt: TODAY,
      }),
      resolved: true,
    });
    const { flow } = getDrawerState();
    if (flow?.scenario === "late_grace") {
      const resInvId = `INV-GRACE-RESOLVE-${context.contractId.replace(/[^A-Z0-9]/gi, "").slice(-8)}`;
      submitInvoiceForApproval(resInvId, {
        customerId: context.customerId,
        customerName:
          mergedCustomers.find((c) => c.id === context.customerId)?.name ?? "Customer",
        invoiceAmount: 0,
        invoiceDate: TODAY,
      });
      patchFlowSession({
        step: "approval",
        furthestUnlockedStep: "approval",
        invoiceId: resInvId,
        contractId: context.contractId,
        customerId: context.customerId,
      });
      return;
    }
    onClose();
    navigate(`/customers/${context.customerId}?tab=contract&contractId=${context.contractId}`);
  }

  const activationSummary =
    isQueueIngest && intent === "new_deal"
      ? `Scheduled to activate on ${startDate} (invoice held until activation after approval).`
      : billingKind === "postpaid"
        ? `Activates on ${startDate} — no upfront invoice; usage billed on cycle.`
        : billingKind === "hybrid"
          ? `Activates after commit invoice approval; usage bills monthly from ${startDate}.`
          : `Scheduled to activate on ${startDate} (${invoiceTiming === "on_activation" ? "invoice held until activation" : "invoice on approval"}).`;

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col bg-white",
        omitHeader ? "min-h-0 flex-1 overflow-hidden" : "h-full",
      )}
    >
      {/* Sticky header + primary actions (top-right only) */}
      {!omitHeader ? (
      <header className="sticky top-0 z-20 shrink-0 border-b border-gray-100 bg-white">
        {queueItem ? (
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isPageWorkspace ? (
                <button
                  type="button"
                  onClick={() => navigate("/queue")}
                  className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Back to queue"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              )}
              <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] text-text-muted">
                <button
                  type="button"
                  onClick={() => {
                    if (!isPageWorkspace) onClose();
                    navigate("/queue");
                  }}
                  className="text-text-secondary transition-colors hover:text-text-primary"
                >
                  Queue
                </button>
                <ChevronRight size={11} className="shrink-0 text-text-muted/50" />
                <span className="truncate font-medium text-text-primary">{queueItem.id}</span>
                {isPageWorkspace && queueItem.documentName ? (
                  <>
                    <ChevronRight size={11} className="shrink-0 text-text-muted/50" />
                    <span className="truncate max-w-[min(280px,40vw)] text-text-secondary">{queueItem.documentName}</span>
                  </>
                ) : null}
              </nav>
            </div>
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={openIngestCommentsPage}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-default px-3 py-2 text-[13px] font-medium text-text-secondary hover:bg-surface-muted"
              >
                <MessageSquare size={14} />
                Open comments
              </button>
              {isQueueIngest &&
                intent === "new_deal" &&
                queueItem.status === "Ingested" &&
                persona === "approver" &&
                queueItem.invoiceId && (
                  <button
                    type="button"
                    onClick={openLinkedInvoiceApproval}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-emerald-500"
                  >
                    Review invoice
                  </button>
                )}
              {isQueueIngest && intent === "new_deal" && !(queueItem.status === "Ingested" && persona === "approver") && (
                <>
                  {queueItem.status !== "Ingested" &&
                    queueItem.status !== "Invoice review" && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="rounded-md border border-border-default px-3.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-surface-muted"
                    >
                      Save draft
                    </button>
                  )}
                  {queueItem.status === "Ingested" ? (
                    <span className="rounded-md border border-border-subtle bg-surface-muted px-3.5 py-2 text-[13px] font-medium text-text-secondary">
                      Ingested · awaiting approver
                    </span>
                  ) : queueItem.status === "Invoice review" ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-950">
                      Invoice review · send for approval
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        !queueItem?.ingestable ||
                        !queueItem.sampleId ||
                        validation.flags.hasBlockingErrors
                      }
                      onClick={() => queueItem && handleExecuteIngest(queueItem)}
                      className="rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Ingest contract
                    </button>
                  )}
                </>
              )}
              {isQueueIngest && intent !== "new_deal" && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-md border border-border-default px-3.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-surface-muted"
                  >
                    Save draft
                  </button>
                  {intent === "early_renewal" && queueItem?.ingestable && queueItem.activeContractId ? (
                    <button
                      type="button"
                      onClick={() => queueItem && handleEarlyRenewalQueueFinish(queueItem)}
                      className="rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Proceed to close prior contract
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEntityStatus("pending_approval");
                        onClose();
                        if (context?.customerId) {
                          navigate(
                            `/customers/${context.customerId}?tab=contract${context.contractId ? `&contractId=${context.contractId}` : ""}`,
                          );
                        }
                      }}
                      className="rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      Continue in workspace
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-2 px-5 py-2.5">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={entityStateToBadge(entityStatus)} />
                <h2 className="truncate text-[15px] font-semibold text-text-primary">
                  {priorContract?.id ?? "Contract transition"}
                </h2>
              </div>
              <p className="text-[11px] text-text-muted">
                {context?.contractId ? `Contract workspace · ${TODAY}` : "Transition workspace"}
              </p>
            </div>
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
              {!isQueueIngest && intent === "late_extend" && latePhase === "extend" && (
                <button
                  type="button"
                  onClick={handleConfigureExtension}
                  className="rounded-md bg-[color:var(--color-info)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Configure extension
                </button>
              )}
              {!isQueueIngest && intent === "late_extend" && latePhase === "resolve" && (
                <button
                  type="button"
                  onClick={handleResolveExtension}
                  className="rounded-md bg-[color:var(--color-info)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Resolve extension
                </button>
              )}
              {!isQueueIngest && intent !== "late_extend" && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-md border border-border-default px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalVariant("submit");
                      setApprovalOpen(true);
                    }}
                    className="rounded-md border border-border-default px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface-muted"
                  >
                    Submit transition
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalVariant("approve_transition");
                      setApprovalOpen(true);
                    }}
                    className="rounded-md bg-[color:var(--color-info)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Approve transition
                  </button>
                </>
              )}
              {context?.customerId && (
                <button
                  type="button"
                  onClick={openIngestCommentsPage}
                  className="inline-flex items-center gap-1 rounded-md border border-border-default px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-muted"
                >
                  <MessageSquare size={12} />
                  Open comments
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </header>
      ) : null}

      {/* Body — queue ingest: tri-column (comments · fields · preview) or narrow rail + preview. */}
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden",
          triColQueueIngest
            ? "grid min-h-0 min-w-0 grid-cols-[minmax(0,25%)_minmax(0,35%)_minmax(0,40%)] [grid-template-rows:minmax(0,1fr)]"
            : "flex min-w-0",
        )}
      >
        {isQueueIngest ? (
          triColQueueIngest ? (
            <>
              <div className="min-h-0 max-h-full min-w-0 overflow-hidden border-r border-border-default bg-gray-50">
                <ValidationPanel
                  title="Validations"
                  items={validationItems}
                  onItemClick={scrollToSection}
                  activeItemId={activeSectionId ?? undefined}
                  comments={pageApproval?.comments ?? []}
                  onSubmitComment={readOnly || !queueItem ? undefined : handlePageIngestComment}
                  commentsTitle="Discussion"
                />
              </div>
              <div ref={fieldsContainerRef} className="min-h-0 max-h-full min-w-0 overflow-y-auto overscroll-y-contain border-r border-border-default">
                <div className="px-6 py-5 text-[14px] leading-snug">
                  {queueItem && !queueItem.ingestable && (
                    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900">
                      This queue item is not ingestable in the prototype. Use{" "}
                      {readOnly ? (
                        <span className="font-semibold">Open comments</span>
                      ) : (
                        <button type="button" className="font-semibold underline" onClick={openIngestCommentsPage}>
                          Open comments
                        </button>
                      )}{" "}
                      for manual handling.
                    </div>
                  )}

                  <fieldset
                    disabled={readOnly}
                    className="min-w-0 border-0 p-0 disabled:opacity-[0.92]"
                  >
                    <div className="flex min-w-0 flex-col gap-4">
                      {showIntentSelector && !readOnly && (
                        <TransitionIntentSelector value={intent} onChange={setIntent} allowed={allowedIntents} />
                      )}

                      {showLateRenewalBanner && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                              <p className="text-[13px] font-semibold text-amber-950">This customer has a contract in extension</p>
                              <p className="mt-0.5 text-[12px] text-amber-900">
                                Contract {priorContractForLateRenewal?.id} is in grace period through {shortDate(graceExtensionForLateRenewal?.until ?? "")} ·
                                billing {graceExtensionForLateRenewal?.billingMode === "continue" ? "continued" : "paused"}.
                                Closing it will resolve the grace extension automatically as part of this renewal.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <IngestFieldGroup
                        ref={(el) => { sectionRefs.current["customer"] = el; }}
                        title="Customer"
                        chip={groupChips["customer"]}
                      >
                        <CustomerMappingSection
                          customers={mergedCustomers}
                          selectedCustomerId={customerId}
                          onSelectCustomer={setCustomerId}
                          allowCreateNew={Boolean(queueItem && !queueItem.customerId)}
                          newCustomer={newCustomer}
                          onNewCustomerChange={(p) => setNewCustomer((prev) => ({ ...prev, ...p }))}
                          activeContractSummary={
                            activeContract ? `${activeContract.id} · ${currency(activeContract.tcv)} TCV` : null
                          }
                          createCustomerIssue={createCustomerIssueForDrawer}
                          onConfirmCreateCustomer={() => {
                            if (newCustomerComplete) setNewCustomerAcknowledged(true);
                          }}
                          createCustomerConfirmDisabled={!newCustomerComplete}
                          showNewCustomerKvSummary={showNewCustomerKvSummary}
                          onEditNewCustomer={() => setNewCustomerAcknowledged(false)}
                        />
                      </IngestFieldGroup>

                      <IngestFieldGroup
                        ref={(el) => { sectionRefs.current["billing"] = el; }}
                        title="Billing & invoicing"
                        chip={groupChips["billing"]}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <PrepaidOnlyBillingSelect kind={billingKind} onKindChange={setBillingKind} />
                            <DrawerRailIndent>
                              <ContractProcessingSummarySection tcv={tcv} startDate={startDate} />
                            </DrawerRailIndent>
                          </div>
                          {intent !== "new_deal" && (
                            <FinancialPreviewSection
                              intent={intent}
                              tcv={tcv}
                              settlementAmount={settlementAmount}
                              extensionCharge={extensionCharge}
                              billingKind={billingKind}
                            />
                          )}
                        </div>
                      </IngestFieldGroup>

                      <IngestFieldGroup
                        ref={(el) => { sectionRefs.current["terms"] = el; }}
                        title="Contract terms"
                        chip={groupChips["terms"]}
                      >
                        <TransitionContractTermsSection
                          startDate={startDate}
                          endDate={endDate}
                          onStartChange={setStartDate}
                          onEndChange={setEndDate}
                          billingFrequency={billingFrequency}
                          onFrequencyChange={setBillingFrequency}
                          autoRenew={autoRenew}
                          onAutoRenewChange={setAutoRenew}
                          activationSummary={activationSummary}
                          allowBackdate={isLateRenewal}
                        />
                      </IngestFieldGroup>

                      {intent !== "new_deal" && (
                        <IngestFieldGroup title={transitionGroupTitle} chip={transitionChip}>
                          <ContractTransitionSection
                            intent={intent}
                            executionDate={executionDate}
                            onExecutionDateChange={setExecutionDate}
                            amendmentDelta={tcv * 0.04}
                            graceDays={graceDays}
                            onGraceDaysChange={setGraceDays}
                            graceBilling={graceBilling}
                            onGraceBillingChange={setGraceBilling}
                            resolution={resolution}
                            onResolutionChange={setResolution}
                            latePhase={latePhase}
                          />
                        </IngestFieldGroup>
                      )}

                      {extracted && (
                        <IngestFieldGroup
                          ref={(el) => { sectionRefs.current["catalog"] = el; }}
                          title="Catalog mapping"
                          chip={groupChips["catalog"]}
                        >
                          <CatalogMappingSection
                            layout="drawer"
                            products={extracted.products}
                            onMarkMapped={(sku) => addSessionProductSku(sku)}
                            catalogMappingIssue={catalogMappingIssueForDrawer}
                            sessionMappedSkus={sessionProductSkus}
                          />
                        </IngestFieldGroup>
                      )}
                    </div>
                  </fieldset>
                </div>
              </div>
              <div className="flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden border-l border-border-default">
                {!ingestPreviewCollapsed ? (
                  <IngestDocumentPreviewPane
                    extracted={extracted}
                    documentTitle={queueItem?.documentName ?? "Contract.pdf"}
                    onCollapse={() => setIngestPreviewCollapsed(true)}
                  />
                ) : (
                  <div className="flex min-h-0 flex-1 flex-row bg-gray-100">
                    <div className="min-h-0 min-w-0 flex-1" aria-hidden />
                    <div className="flex shrink-0 border-l border-border-default bg-white">
                      <button
                        type="button"
                        onClick={() => setIngestPreviewCollapsed(false)}
                        className="flex h-full min-h-[200px] w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                        title="Show document preview"
                      >
                        <PanelRightOpen size={14} />
                        <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Preview</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex min-h-0 min-w-0 w-full flex-col overflow-hidden sm:w-[420px] sm:min-w-[420px] sm:max-w-[420px] sm:shrink-0">
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-snug">
                  {queueItem && !queueItem.ingestable && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[12px] text-amber-900">
                      This queue item is not ingestable in the prototype. Use{" "}
                      <button type="button" className="font-semibold underline" onClick={openIngestCommentsPage}>
                        Open comments
                      </button>{" "}
                      for manual handling.
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {showIntentSelector && (
                      <TransitionIntentSelector value={intent} onChange={setIntent} allowed={allowedIntents} />
                    )}

                    <IngestFieldGroup title="Customer" chip={groupChips["customer"]}>
                      <CustomerMappingSection
                        customers={mergedCustomers}
                        selectedCustomerId={customerId}
                        onSelectCustomer={setCustomerId}
                        allowCreateNew={Boolean(queueItem && !queueItem.customerId)}
                        newCustomer={newCustomer}
                        onNewCustomerChange={(p) => setNewCustomer((prev) => ({ ...prev, ...p }))}
                        activeContractSummary={
                          activeContract ? `${activeContract.id} · ${currency(activeContract.tcv)} TCV` : null
                        }
                        createCustomerIssue={createCustomerIssueForDrawer}
                        onConfirmCreateCustomer={() => {
                          if (newCustomerComplete) setNewCustomerAcknowledged(true);
                        }}
                        createCustomerConfirmDisabled={!newCustomerComplete}
                        showNewCustomerKvSummary={showNewCustomerKvSummary}
                        onEditNewCustomer={() => setNewCustomerAcknowledged(false)}
                      />
                    </IngestFieldGroup>

                    <IngestFieldGroup title="Billing & invoicing" chip={groupChips["billing"]}>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <PrepaidOnlyBillingSelect kind={billingKind} onKindChange={setBillingKind} />
                          <DrawerRailIndent>
                            <ContractProcessingSummarySection tcv={tcv} startDate={startDate} />
                          </DrawerRailIndent>
                        </div>
                        {intent !== "new_deal" && (
                          <FinancialPreviewSection
                            intent={intent}
                            tcv={tcv}
                            settlementAmount={settlementAmount}
                            extensionCharge={extensionCharge}
                            billingKind={billingKind}
                          />
                        )}
                      </div>
                    </IngestFieldGroup>

                    <IngestFieldGroup title="Contract terms" chip={groupChips["terms"]}>
                      <TransitionContractTermsSection
                        startDate={startDate}
                        endDate={endDate}
                        onStartChange={setStartDate}
                        onEndChange={setEndDate}
                        billingFrequency={billingFrequency}
                        onFrequencyChange={setBillingFrequency}
                        autoRenew={autoRenew}
                        onAutoRenewChange={setAutoRenew}
                        activationSummary={activationSummary}
                        allowBackdate={isLateRenewal}
                      />
                    </IngestFieldGroup>

                    {intent !== "new_deal" && (
                      <IngestFieldGroup title={transitionGroupTitle} chip={transitionChip}>
                        <ContractTransitionSection
                          intent={intent}
                          executionDate={executionDate}
                          onExecutionDateChange={setExecutionDate}
                          amendmentDelta={tcv * 0.04}
                          graceDays={graceDays}
                          onGraceDaysChange={setGraceDays}
                          graceBilling={graceBilling}
                          onGraceBillingChange={setGraceBilling}
                          resolution={resolution}
                          onResolutionChange={setResolution}
                          latePhase={latePhase}
                        />
                      </IngestFieldGroup>
                    )}

                    {extracted && (
                      <IngestFieldGroup title="Catalog mapping" chip={groupChips["catalog"]}>
                        <CatalogMappingSection
                          layout="drawer"
                          products={extracted.products}
                          onMarkMapped={(sku) => addSessionProductSku(sku)}
                          catalogMappingIssue={catalogMappingIssueForDrawer}
                          sessionMappedSkus={sessionProductSkus}
                        />
                      </IngestFieldGroup>
                    )}
                  </div>
                </div>
              </div>

              <>
                <div
                  className={cn(
                    "hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-border-default md:flex",
                    ingestPreviewCollapsed && "md:!hidden",
                  )}
                >
                  <IngestDocumentPreviewPane
                    extracted={extracted}
                    documentTitle={queueItem?.documentName ?? "Contract.pdf"}
                    onCollapse={() => setIngestPreviewCollapsed(true)}
                  />
                </div>

                {ingestPreviewCollapsed && (
                  <div className="hidden shrink-0 border-l border-border-default md:block">
                    <button
                      type="button"
                      onClick={() => setIngestPreviewCollapsed(false)}
                      className="flex h-full w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                      title="Show document preview"
                    >
                      <PanelRightOpen size={14} />
                      <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Preview</span>
                    </button>
                  </div>
                )}
              </>
            </>
          )
        ) : (
          <>
            <div className="min-w-0 flex-1 overflow-y-auto px-4 py-3">
              {showIntentSelector && (
                <TransitionIntentSelector value={intent} onChange={setIntent} allowed={allowedIntents} className="mb-3" />
              )}

              <div className="flex flex-col gap-4">
                <IngestFieldGroup title="Customer" chip={groupChips["customer"]}>
                  <CustomerMappingSection
                    customers={mergedCustomers}
                    selectedCustomerId={customerId}
                    onSelectCustomer={setCustomerId}
                    allowCreateNew={false}
                    newCustomer={{ name: "", billingLegalEntity: "", domain: "" }}
                    onNewCustomerChange={() => {}}
                    activeContractSummary={
                      activeContract ? `${activeContract.id} · ${currency(activeContract.tcv)} TCV` : null
                    }
                  />
                </IngestFieldGroup>

                <IngestFieldGroup title="Billing & invoicing" chip={groupChips["billing"]}>
                  <div className="flex flex-col gap-5">
                    <BillingStructureSection
                      kind={billingKind}
                      onKindChange={setBillingKind}
                      invoiceTiming={invoiceTiming}
                      onInvoiceTimingChange={setInvoiceTiming}
                    />
                    {extracted && (
                      <InvoicePlanSection
                        billingKind={billingKind}
                        invoiceTiming={invoiceTiming}
                        startDate={startDate}
                        billingFrequency={billingFrequency}
                        tcv={tcv}
                      />
                    )}
                    <FinancialPreviewSection
                      intent={intent}
                      tcv={tcv}
                      settlementAmount={settlementAmount}
                      extensionCharge={extensionCharge}
                      billingKind={billingKind}
                    />
                    <ApprovalPolicyInlineSection
                      futureInvoices={futureInvoices}
                      onChange={setFutureInvoices}
                    />
                  </div>
                </IngestFieldGroup>

                <IngestFieldGroup title="Contract terms" chip={groupChips["terms"]}>
                  <TransitionContractTermsSection
                    startDate={startDate}
                    endDate={endDate}
                    onStartChange={setStartDate}
                    onEndChange={setEndDate}
                    billingFrequency={billingFrequency}
                    onFrequencyChange={setBillingFrequency}
                    autoRenew={autoRenew}
                    onAutoRenewChange={setAutoRenew}
                    activationSummary={activationSummary}
                  />
                </IngestFieldGroup>

                {intent !== "new_deal" && (
                  <IngestFieldGroup title={transitionGroupTitle} chip={transitionChip}>
                    <ContractTransitionSection
                      intent={intent}
                      executionDate={executionDate}
                      onExecutionDateChange={setExecutionDate}
                      amendmentDelta={tcv * 0.04}
                      graceDays={graceDays}
                      onGraceDaysChange={setGraceDays}
                      graceBilling={graceBilling}
                      onGraceBillingChange={setGraceBilling}
                      resolution={resolution}
                      onResolutionChange={setResolution}
                      latePhase={latePhase}
                    />
                  </IngestFieldGroup>
                )}

                {extracted && (
                  <IngestFieldGroup
                    title="Catalog mapping"
                    chip={groupChips["catalog"]}
                    bodyClassName="p-0"
                  >
                    <CatalogMappingSection
                      products={extracted.products}
                      onMarkMapped={(sku) => addSessionProductSku(sku)}
                    />
                  </IngestFieldGroup>
                )}
              </div>
            </div>

            <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-border-subtle bg-surface-muted/30 p-3 md:block lg:w-[320px]">
              <div className="flex flex-col gap-3">
                <ValidationSummaryPanel
                  issues={validation.extractedRemaining}
                  drawerIssues={validation.businessIssues}
                />
                <TransitionSummaryPanel
                  type={summaryType}
                  tcv={tcv}
                  customerLabel={customerLabel}
                  settlementLabel={intent === "early_renewal" ? `Settlement draft: ${currency(settlementAmount)}` : undefined}
                />
                <ActivationTimelinePanel steps={timelineSteps} />
              </div>
            </aside>

            <ApprovalPanelOverlay
              open={approvalOpen}
              onClose={() => setApprovalOpen(false)}
              title={approvalVariant === "approve_activate" ? "Activate contract" : "Transition approval"}
              variant={approvalVariant}
              onSubmit={() => {
                setEntityStatus("pending_approval");
                setApprovalOpen(false);
              }}
              onApprove={() => {
                setEntityStatus("executed");
                setApprovalOpen(false);
                onClose();
                if (context?.customerId) {
                  navigate(`/customers/${context.customerId}?tab=contract${context.contractId ? `&contractId=${context.contractId}` : ""}`);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
