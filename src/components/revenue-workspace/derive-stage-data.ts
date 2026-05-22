import type { Customer, Quote, Contract, Invoice, ContractClosure, InvoiceScheduleItem } from "@/data/mock-data";
import type { ContractGraceExtension } from "@/data/contract-transition";
import type { QueueItem } from "@/data/queue-data";
import type { ApprovalRequest } from "@/data/ingest-data";
import { getContractsForCustomer, getInvoices, getTasks } from "@/data/mock-data";
import {
  getCollectionCasesForCustomer,
  getCreditNotesForCustomer,
  getCustomerArSummary,
  getInvoiceEnrichment,
  getPaymentsForCustomer,
} from "@/data/billing-data";
import { getRevenueArrangement, type RevenueArrangement } from "@/data/revrec-data";
import { getTicketsForCustomer } from "@/data/support-data";
import type { Stage } from "./stage";
import { currency, shortDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// PRIORITY CHIPS (next to customer name in the context bar)
// Actionable red/amber signals only. Max 3. Red outranks amber.
// ---------------------------------------------------------------------------

export type ChipSeverity = "red" | "amber";

export interface PriorityChip {
  label: string; // e.g. "OPEN AR"
  value: string; // e.g. "$24,300"
  severity: ChipSeverity;
}

export function derivePriorityChips(
  customer: Customer,
  customerInvoices: Invoice[],
  contract: Contract | null,
): PriorityChip[] {
  const chips: PriorityChip[] = [];

  // RED --------------------------------------------------------------------
  if (customer.openAr > 0) {
    chips.push({ label: "OPEN AR", value: currency(customer.openAr), severity: "red" });
  }
  const overdueInvoices = customerInvoices.filter((i) => i.status === "Overdue");
  if (overdueInvoices.length > 0) {
    const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);
    chips.push({
      label: "OVERDUE",
      value:
        overdueTotal > 0
          ? currency(overdueTotal)
          : `${overdueInvoices.length} inv`,
      severity: "red",
    });
  }
  const pendingReview = customerInvoices.filter((i) => i.status === "Pending Review").length;
  if (pendingReview > 0) {
    chips.push({
      label: "REVIEW",
      value: `${pendingReview} invoice${pendingReview > 1 ? "s" : ""}`,
      severity: "amber",
    });
  }
  if (contract && contract.enforcement.blockingIssues.length > 0) {
    chips.push({ label: "ENFORCEMENT", value: "Blocked", severity: "red" });
  }

  // AMBER ------------------------------------------------------------------
  if (customer.prepaidCreditTotal > 0) {
    const usedPct = Math.round(
      ((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100,
    );
    if (usedPct >= 70) {
      chips.push({ label: "CREDITS", value: `${usedPct}% used`, severity: "amber" });
    }
  }
  if (customer.nextRenewalDate) {
    const days = Math.round((new Date(customer.nextRenewalDate).getTime() - Date.now()) / 86400000);
    if (days > 0 && days <= 30) {
      chips.push({ label: "RENEWAL", value: `${days}d`, severity: "amber" });
    }
  }
  const heldCount = customerInvoices.filter((i) => i.holdReason).length;
  if (heldCount > 0) {
    chips.push({ label: "HELD", value: `${heldCount} invoice${heldCount > 1 ? "s" : ""}`, severity: "amber" });
  }

  // Red first, then amber; cap at 3
  chips.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));
  return chips.slice(0, 3);
}

// ---------------------------------------------------------------------------
// CONTEXT METRICS (right side of customer identity row, stage-dependent)
// Always exactly 3.
// ---------------------------------------------------------------------------

export interface ContextMetric {
  label: string; // short uppercase, e.g. "ARR"
  value: string; // pre-formatted, e.g. "$476,200"
}

function daysUntil(iso: string | undefined | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

function humanDuration(days: number): string {
  if (days <= 0) return "today";
  if (days < 45) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 18) return `${months}mo`;
  const years = Math.round(months / 12);
  return `${years}y`;
}

export function deriveContextMetrics(
  stage: Stage,
  customer: Customer,
  quote: Quote | null,
  contract: Contract | null,
  invoice: Invoice | undefined,
  arrangement: RevenueArrangement | undefined,
  invoiceStatusOverrides?: Record<string, string>,
): ContextMetric[] {
  const customerOverview: ContextMetric[] = [
    { label: "ARR", value: currency(customer.arr) },
    { label: "TCV", value: currency(customer.tcv) },
    {
      label: "RENEWAL IN",
      value: (() => {
        const d = daysUntil(customer.nextRenewalDate);
        return d === null ? "—" : humanDuration(d);
      })(),
    },
  ];

  switch (stage) {
    case "quote":
      if (!quote) return customerOverview;
      return [
        { label: "TCV", value: currency(quote.tcv ?? quote.amount) },
        { label: "DISCOUNT", value: `${quote.discountPct}%` },
        { label: "EXPIRES", value: shortDate(quote.expiryDate) },
      ];
    case "contract":
      if (!contract) return customerOverview;
      return [
        { label: "TCV", value: currency(contract.tcv) },
        { label: "MIN COMMIT", value: `${currency(contract.minAnnualCommit)}/yr` },
        { label: "RENEWAL", value: shortDate(contract.renewalDate) },
      ];
    case "invoicing":
      if (!invoice) return customerOverview;
      return [
        { label: "AMOUNT", value: currency(invoice.amount) },
        { label: "DUE", value: shortDate(invoice.dueDate) },
        { label: "CONTRACT", value: invoice.contractId || "—" },
      ];
    case "payment": {
      const mergedInv = mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides);
      const summary = getCustomerArSummary(customer.id, mergedInv);
      const overdue = mergedInv.filter((i) => i.status === "Overdue");
      const oldest = overdue[0] ? daysSince(overdue[0].dueDate) : null;
      return [
        { label: "OPEN AR", value: currency(summary.totalOpen) },
        { label: "OVERDUE", value: currency(summary.totalOverdue) },
        { label: "OLDEST", value: oldest === null ? "—" : `${oldest}d` },
      ];
    }
    case "revrec":
      if (!arrangement) return customerOverview;
      return [
        { label: "RECOGNIZED", value: currency(arrangement.recognizedToDate) },
        { label: "DEFERRED", value: currency(arrangement.deferred) },
        { label: "CLOSE", value: arrangement.closeStatus ?? arrangement.status },
      ];
    case "customer":
    default:
      return customerOverview;
  }
}

// ---------------------------------------------------------------------------
// STAGE STATUS (journey rail labels)
// ---------------------------------------------------------------------------

export type StatusSeverity = "green" | "amber" | "red" | "blue" | "gray";

export interface StageStatus {
  text: string;
  severity: StatusSeverity;
}

const severityToColor: Record<StatusSeverity, string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  blue: "text-blue-600",
  gray: "text-gray-500",
};

export function severityColor(severity: StatusSeverity): string {
  return severityToColor[severity];
}

export function deriveCustomerStatus(
  customer: Customer,
  invoiceStatusOverrides?: Record<string, string>,
): StageStatus {
  const merged = mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides);
  const liveOverdue = merged.some((i) => i.status === "Overdue");
  const livePendingReview = merged.some((i) => i.status === "Pending Review");
  const sessionAware = invoiceStatusOverrides !== undefined && Object.keys(invoiceStatusOverrides).length > 0;

  if (customer.riskBadges.length === 0) {
    if (liveOverdue) return { text: "Overdue invoices", severity: "red" };
    if (livePendingReview) return { text: "Invoice review pending", severity: "amber" };
    return { text: "Healthy", severity: "green" };
  }

  const badgeOverdue = customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"));
  const hasEscalation = customer.riskBadges.some((b) => b.toLowerCase().includes("escalation"));
  const overdueDrivesRed = sessionAware ? liveOverdue : badgeOverdue || liveOverdue;
  const severity: StatusSeverity = overdueDrivesRed || hasEscalation ? "red" : "amber";
  return {
    text: `${customer.riskBadges.length} risk flag${customer.riskBadges.length > 1 ? "s" : ""}`,
    severity,
  };
}

export function deriveQuoteStatus(quote: Quote): StageStatus {
  if (quote.approval.status === "pending") {
    return { text: `Pending Approval · ${quote.approval.currentApprover.split(",")[0]}`, severity: "amber" };
  }
  if (quote.approval.status === "rejected") {
    return { text: "Rejected", severity: "red" };
  }
  if (quote.status === "Draft") {
    return { text: "Draft", severity: "blue" };
  }
  if (quote.status === "Sent") {
    return { text: "Sent · awaiting response", severity: "amber" };
  }
  if (quote.status === "Accepted" || quote.approval.status === "approved") {
    return { text: `Approved · ${currency(quote.amount)}`, severity: "green" };
  }
  return { text: quote.status, severity: "blue" };
}

export function deriveContractStatus(
  contract: Contract,
  invoiceStatusOverrides?: Record<string, string>,
): StageStatus {
  const scheduleView = mergeBillingScheduleWithInvoiceOverrides(contract.billingSchedule, invoiceStatusOverrides);

  // Scheduled contracts (renewal not yet active — prior contract still closing)
  if (contract.status === "Scheduled") {
    const activationDate = contract.scheduledStartDate ?? contract.effectiveDate;
    return {
      text: `Scheduled · activates ${shortDate(activationDate)}`,
      severity: "blue",
    };
  }

  if (contract.status === "Extended") {
    return { text: "Grace extension active", severity: "amber" };
  }

  // Handle closure statuses
  if (contract.closure) {
    const effectiveDate = new Date(contract.closure.effectiveDate);
    const today = new Date();
    const isFuture = effectiveDate > today;
    
    if (isFuture) {
      const daysRemaining = Math.ceil((effectiveDate.getTime() - today.getTime()) / 86400000);
      return { text: `Closing in ${daysRemaining}d`, severity: "amber" };
    }
    
    // Past effective date
    if (contract.closure.reason === "non_payment") {
      return { text: "Terminated", severity: "red" };
    }
    return { text: "Closed", severity: "gray" as StatusSeverity };
  }

  const parts: string[] = [];
  parts.push(contract.status);
  if (contract.amendments.length > 0) {
    parts.push(`${contract.amendments.length} amendment${contract.amendments.length > 1 ? "s" : ""}`);
  }
  const hasBlocking = contract.enforcement.blockingIssues.length > 0;
  const hasOverdueSchedule = scheduleView.some((s) => s.status === "Overdue");
  const severity: StatusSeverity = hasBlocking ? "red" : hasOverdueSchedule ? "amber" : "green";
  return { text: parts.join(" + "), severity };
}

/**
 * Applies session overlays: closure outcomes first, then open grace extensions
 * (late renewal), so list + detail + index views match IngestContext.
 */
export function mergeContractsWithRuntimeClosures(
  contracts: Contract[],
  contractClosures: Record<string, ContractClosure>,
  contractGraceExtensions?: Record<string, ContractGraceExtension>,
): Contract[] {
  return contracts.map((c) => {
    const runtimeClosure = contractClosures[c.id];
    if (runtimeClosure) {
      const today = new Date().toISOString().slice(0, 10);
      const effectiveDate = runtimeClosure.effectiveDate;
      const isFuture = effectiveDate > today;
      return {
        ...c,
        status: isFuture
          ? "Closing"
          : runtimeClosure.reason === "non_payment"
            ? "Terminated"
            : "Closed",
        closure: runtimeClosure,
      };
    }
    const grace = contractGraceExtensions?.[c.id];
    if (grace && !grace.resolved) {
      return { ...c, status: "Extended" };
    }
    return c;
  });
}

/** Applies session `invoiceStatusOverrides` so rail/chips match Approval Detail outcomes. */
export function mergeInvoiceStatuses(
  invoices: Invoice[],
  overrides: Record<string, string> | undefined,
): Invoice[] {
  if (!overrides || Object.keys(overrides).length === 0) return invoices;
  return invoices.map((inv) => {
    const st = overrides[inv.id];
    return st !== undefined ? { ...inv, status: st } : inv;
  });
}

/** Applies session invoice status to contract billing schedule rows that reference an `invoiceId`. */
export function mergeBillingScheduleWithInvoiceOverrides(
  schedule: InvoiceScheduleItem[],
  overrides: Record<string, string> | undefined,
): InvoiceScheduleItem[] {
  if (!overrides || Object.keys(overrides).length === 0) return schedule;
  return schedule.map((row) => {
    if (!row.invoiceId) return row;
    const st = overrides[row.invoiceId];
    return st !== undefined ? { ...row, status: st } : row;
  });
}

/** Snapshot from `IngestContext` so NBA + insights match queue, closures, grace, and invoice overrides. */
export type CustomerWorkspaceSession = {
  queueItems: QueueItem[];
  contractClosures: Record<string, ContractClosure>;
  contractGraceExtensions: Record<string, ContractGraceExtension>;
  invoiceStatusOverrides: Record<string, string>;
  sessionContracts: Contract[];
  /** In-session first-invoice approvals (ingest → approver gate before contract activates). */
  approvalRequests?: ApprovalRequest[];
};

const QUEUE_NBA_STATUSES = new Set<string>(["Pending Review", "In Progress"]);

function contractsSessionView(customerId: string, session?: CustomerWorkspaceSession): Contract[] {
  const seed = getContractsForCustomer(customerId);
  const mergedList =
    session && session.sessionContracts.length > 0
      ? (() => {
          const byId = new Map(seed.map((c) => [c.id, c]));
          for (const c of session.sessionContracts) {
            if (c.customerId === customerId && !byId.has(c.id)) byId.set(c.id, c);
          }
          return [...byId.values()];
        })()
      : seed;
  return mergeContractsWithRuntimeClosures(
    mergedList,
    session?.contractClosures ?? {},
    session?.contractGraceExtensions,
  );
}

function invoicesSessionView(customerId: string, session?: CustomerWorkspaceSession): Invoice[] {
  return mergeInvoiceStatuses(getInvoices(customerId), session?.invoiceStatusOverrides);
}

export function deriveInvoicingStatus(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): StageStatus {
  const inv = mergeInvoiceStatuses(getInvoices(customerId), invoiceStatusOverrides);
  const pendingReview = inv.filter((i) => i.status === "Pending Review").length;
  const overdue = inv.filter((i) => i.status === "Overdue").length;
  const held = inv.filter((i) => i.holdReason).length;

  const parts: string[] = [];
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (pendingReview > 0) parts.push(`${pendingReview} pending review`);
  if (held > 0) parts.push(`${held} held`);

  if (parts.length === 0) {
    return { text: "All clear", severity: "green" };
  }
  const severity: StatusSeverity = overdue > 0 ? "red" : "amber";
  return { text: parts.join(" · "), severity };
}

export function derivePaymentStatus(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): StageStatus {
  const merged = mergeInvoiceStatuses(getInvoices(customerId), invoiceStatusOverrides);
  const summary = getCustomerArSummary(customerId, merged);
  const payments = getPaymentsForCustomer(customerId);
  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");

  const parts: string[] = [];
  if (summary.overdueCount > 0) parts.push(`${summary.overdueCount} overdue`);
  if (unapplied.length > 0) parts.push(`${currency(unapplied.reduce((s, p) => s + p.amount, 0))} unapplied`);
  if (summary.totalOpen > 0 && summary.overdueCount === 0) parts.push(`${currency(summary.totalOpen)} open`);

  if (parts.length === 0) {
    return { text: "No open AR", severity: "green" };
  }
  const severity: StatusSeverity = summary.overdueCount > 0 ? "red" : "amber";
  return { text: parts.join(" · "), severity };
}

export function deriveRevRecStatus(contractId: string): StageStatus {
  const arr = getRevenueArrangement(contractId);
  if (!arr) return { text: "No arrangement", severity: "blue" };
  const unresolvedBlockers = arr.closeBlockers.filter((b) => !b.resolved).length;
  const hasCritical = arr.closeBlockers.some((b) => !b.resolved && b.severity === "critical");
  if (unresolvedBlockers > 0) {
    return {
      text: `${unresolvedBlockers} blocker${unresolvedBlockers > 1 ? "s" : ""}`,
      severity: hasCritical ? "red" : "amber",
    };
  }
  return { text: arr.status === "Active" ? "Healthy" : arr.status, severity: "green" };
}

export function deriveAllStageStatuses(
  customer: Customer,
  quote: Quote | null,
  contract: Contract | null,
  invoiceStatusOverrides?: Record<string, string>,
): Record<Stage, StageStatus> {
  return {
    customer: deriveCustomerStatus(customer, invoiceStatusOverrides),
    tasks: { text: "Tasks", severity: "blue" },
    threads: { text: "Threads", severity: "blue" },
    quote: quote ? deriveQuoteStatus(quote) : { text: "No quote", severity: "blue" },
    contract: contract ? deriveContractStatus(contract, invoiceStatusOverrides) : { text: "No contract yet", severity: "blue" },
    invoicing: contract ? deriveInvoicingStatus(customer.id, invoiceStatusOverrides) : { text: "—", severity: "blue" },
    payment: contract ? derivePaymentStatus(customer.id, invoiceStatusOverrides) : { text: "—", severity: "blue" },
    revrec: contract ? deriveRevRecStatus(contract.id) : { text: "—", severity: "blue" },
  };
}

// ---------------------------------------------------------------------------
// AI INSIGHTS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface InsightItem {
  severity: "warning" | "info" | "success";
  text: string;
}

export interface InsightCTA {
  label: string;
  to: string;
}

export interface EnrichedCustomerInsight {
  id: string;
  severity: InsightItem["severity"];
  text: string;
  ctas: InsightCTA[];
  /** When true, show a subtle “Add to workbench” — only if no open task already covers this theme */
  showAddToWorkbench: boolean;
  workbenchPreviewTitle: string;
}

function customerWorkspacePath(customerId: string): string {
  return `/customers/${customerId}`;
}

function openTasksCoverPhrases(customerId: string, phrases: string[]): boolean {
  const open = getTasks(customerId).filter((t) => t.status === "Open");
  return open.some((task) => {
    const t = task.title.toLowerCase();
    return phrases.some((p) => t.includes(p.toLowerCase()));
  });
}

export function getCustomerInsightsEnriched(
  customer: Customer,
  session?: CustomerWorkspaceSession,
): EnrichedCustomerInsight[] {
  const base = customerWorkspacePath(customer.id);
  const invoices = invoicesSessionView(customer.id, session);
  const contracts = contractsSessionView(customer.id, session);
  const sessionItems: EnrichedCustomerInsight[] = [];

  if (session?.queueItems?.length) {
    const mine = session.queueItems
      .filter((q) => q.customerId === customer.id && QUEUE_NBA_STATUSES.has(q.status))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    for (const q of mine) {
      sessionItems.push({
        id: `ins-queue-${q.id}`,
        severity: q.scenario === "Early Renewal" ? "warning" : "info",
        text: `Ingestion queue: ${q.documentName} — ${q.status} (${q.scenario}, ${currency(q.tcv)} TCV).`,
        ctas: [{ label: "Open queue", to: "/queue" }],
        showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["queue", "ingest", "ingestion"]),
        workbenchPreviewTitle: `Process queued document: ${q.documentName}`,
      });
    }
  }

  for (const c of contracts) {
    if (c.status === "Extended") {
      const ext = session?.contractGraceExtensions?.[c.id];
      sessionItems.push({
        id: `ins-grace-${c.id}`,
        severity: "warning",
        text: `Grace period active on contract ${c.id}${ext?.until ? ` through ${shortDate(ext.until)}` : ""} — align billing and renewal.`,
        ctas: [{ label: "Open contract", to: `${base}?tab=contract&contractId=${c.id}` }],
        showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["grace", "extension"]),
        workbenchPreviewTitle: "Resolve grace extension and renewal timeline",
      });
    }
    if (c.status === "Closing" && c.closure) {
      sessionItems.push({
        id: `ins-closing-${c.id}`,
        severity: "warning",
        text: `Contract ${c.id} is scheduled to close on ${shortDate(c.closure.effectiveDate)}.`,
        ctas: [{ label: "Review contract", to: `${base}?tab=contract&contractId=${c.id}` }],
        showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["closure", "close"]),
        workbenchPreviewTitle: "Confirm contract closure and downstream billing",
      });
    }
  }

  const overdueList = invoices.filter((i) => i.status === "Overdue");
  const firstOverdue = [...overdueList].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )[0];
  const sortedContracts = [...contracts].sort(
    (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
  );
  const prepaidContract = contracts.find((c) => c.prepaidCreditTotal > 0) ?? contracts[0];

  const items: EnrichedCustomerInsight[] = [];

  if (customer.prepaidCreditTotal > 0) {
    const pct = Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100);
    if (pct > 70) {
      const text = `Prepaid credit ${pct}% consumed — ${currency(customer.prepaidCreditBalance)} remaining`;
      const ctas: InsightCTA[] =
        prepaidContract
          ? [{ label: "View contract", to: `${base}?tab=contract&contractId=${prepaidContract.id}` }]
          : [];
      items.push({
        id: "ins-prepaid-burn",
        severity: "warning",
        text,
        ctas,
        showAddToWorkbench: ctas.length > 0 && !openTasksCoverPhrases(customer.id, ["prepaid", "burn"]),
        workbenchPreviewTitle: "Review prepaid credit burn with finance & CSM",
      });
    }
  }

  if (customer.openAr > 0) {
    const ctas: InsightCTA[] = [{ label: "Payment workspace", to: `${base}?tab=payment` }];
    items.push({
      id: "ins-open-ar",
      severity: "warning",
      text: `${currency(customer.openAr)} in open accounts receivable`,
      ctas,
      showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["receivable", "open ar", "collect"]),
      workbenchPreviewTitle: `Follow up on ${currency(customer.openAr)} open AR`,
    });
  }

  if (customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"))) {
    const ctas: InsightCTA[] =
      firstOverdue
        ? [{ label: "Open invoice", to: `${base}?tab=invoicing&invoiceId=${firstOverdue.id}` }]
        : [{ label: "Invoicing", to: `${base}?tab=invoicing` }];
    items.push({
      id: "ins-overdue-signal",
      severity: "warning",
      text: "Customer has overdue invoices requiring attention",
      ctas,
      showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["overdue"]),
      workbenchPreviewTitle: "Coordinate collections on overdue invoices",
    });
  }

  if (customer.riskBadges.some((b) => b.toLowerCase().includes("mismatch"))) {
    items.push({
      id: "ins-entity-mismatch",
      severity: "info",
      text: "Legal entity mismatch detected between billing and CRM",
      ctas: [{ label: "Commercial snapshot", to: `${base}?tab=customer` }],
      showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["mismatch", "legal entity", "entity"]),
      workbenchPreviewTitle: "Resolve legal entity mismatch (billing vs CRM)",
    });
  }

  if (customer.nextRenewalDate) {
    const days = Math.round((new Date(customer.nextRenewalDate).getTime() - Date.now()) / 86400000);
    if (days < 90 && days > 0) {
      const rc = sortedContracts[0];
      const ctas: InsightCTA[] =
        rc ? [{ label: "Renewal contract", to: `${base}?tab=contract&contractId=${rc.id}` }] : [];
      items.push({
        id: "ins-renewal-window",
        severity: "info",
        text: `Contract renewal in ${days} days — start planning`,
        ctas,
        showAddToWorkbench: ctas.length > 0 && !openTasksCoverPhrases(customer.id, ["renewal"]),
        workbenchPreviewTitle: "Prepare renewal proposal and stakeholder review",
      });
    }
  }

  if (customer.crmSyncStatus === "Stale") {
    items.push({
      id: "ins-crm-stale",
      severity: "info",
      text: "CRM sync is stale — last update was over 2 weeks ago",
      ctas: [],
      showAddToWorkbench: !openTasksCoverPhrases(customer.id, ["crm", "sync"]),
      workbenchPreviewTitle: "Refresh CRM sync and validate account mapping",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "ins-healthy",
      severity: "success",
      text: "Account in healthy state — no immediate action required",
      ctas: [],
      showAddToWorkbench: false,
      workbenchPreviewTitle: "",
    });
  }

  const combined = [...sessionItems, ...items];
  const hasNonHealthy = combined.some((i) => i.id !== "ins-healthy");
  if (hasNonHealthy) {
    return combined.filter((i) => i.id !== "ins-healthy");
  }
  return combined;
}

export function getCustomerInsights(customer: Customer, session?: CustomerWorkspaceSession): InsightItem[] {
  return getCustomerInsightsEnriched(customer, session).map(({ severity, text }) => ({ severity, text }));
}

export type PrimaryCustomerActionKind =
  | "overdue"
  | "open_ar"
  | "crm_stale"
  | "renewal"
  | "prepaid_burn"
  | "support_escalated"
  | "queue_ingest"
  | "grace_extension"
  | "contract_closing"
  | "invoice_activation_pending"
  | "none";

export interface PrimaryCustomerAction {
  kind: PrimaryCustomerActionKind;
  label: string;
  description: string;
  learnMoreBody: string;
  executeTo: string;
  executeLabel: string;
  learnMoreLabel: string;
}

export function getPrimaryCustomerAction(
  customer: Customer,
  session?: CustomerWorkspaceSession,
): PrimaryCustomerAction {
  const base = customerWorkspacePath(customer.id);
  const invoices = invoicesSessionView(customer.id, session);
  const contracts = contractsSessionView(customer.id, session);
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const overdueSorted = [...overdue].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const firstOverdue = overdueSorted[0];
  const sortedContracts = [...contracts].sort(
    (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
  );
  const renewalContract = sortedContracts[0];
  const prepaidContract = contracts.find((c) => c.prepaidCreditTotal > 0) ?? contracts[0];

  if (overdue.length > 0 && firstOverdue) {
    const total = overdue.reduce((s, i) => s + i.amount, 0);
    return {
      kind: "overdue",
      label: `${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""} · ${currency(total)} past due`,
      description: `Start with the oldest due date to limit aging and renewal risk.`,
      learnMoreBody:
        "Overdue balances affect cash, DSO, and renewal leverage. Prioritize the oldest invoice, confirm dispute vs. neglect, align with collections on next steps, and document promised pay dates in the payment workspace.",
      executeTo: `${base}?tab=invoicing&invoiceId=${firstOverdue.id}`,
      executeLabel: "Review invoice",
      learnMoreLabel: "Why this matters",
    };
  }

  if (session?.queueItems?.length) {
    const pendingQueue = session.queueItems
      .filter((q) => q.customerId === customer.id && QUEUE_NBA_STATUSES.has(q.status))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    if (pendingQueue.length > 0) {
      const q = pendingQueue[0];
      return {
        kind: "queue_ingest",
        label: `Ingest queued document · ${currency(q.tcv)} TCV`,
        description: `${q.documentName} — ${q.scenario} (${q.status}).`,
        learnMoreBody:
          "Queue items represent signed commercial documents awaiting extraction and mapping. Clear the queue early so billing, renewals, and rev rec stay aligned with what was actually sold.",
        executeTo: "/queue",
        executeLabel: "Open queue",
        learnMoreLabel: "Why queue matters",
      };
    }
  }

  const extended = contracts.find((c) => c.status === "Extended");
  if (extended) {
    const ext = session?.contractGraceExtensions?.[extended.id];
    return {
      kind: "grace_extension",
      label: `Grace extension active${ext?.until ? ` · until ${shortDate(ext.until)}` : ""}`,
      description: `Contract ${extended.id} is in a grace period — confirm commercial dates and billing timing.`,
      learnMoreBody:
        "Grace extensions usually follow late renewals or billing disputes. Confirm the new commercial dates, entitlement end, and invoice timing so downstream AR and rev rec do not drift.",
      executeTo: `${base}?tab=contract&contractId=${extended.id}`,
      executeLabel: "Open contract",
      learnMoreLabel: "Operational impact",
    };
  }

  const closing = contracts.find((c) => c.status === "Closing" && c.closure);
  if (closing?.closure) {
    return {
      kind: "contract_closing",
      label: `Contract closing · ${shortDate(closing.closure.effectiveDate)}`,
      description: `Validate billing wind-down and replacement terms for ${closing.id}.`,
      learnMoreBody:
        "A scheduled closure affects renewal timing, true-ups, and revenue recognition. Review closure reason, credit notes, and any replacement quote or ingest before the effective date.",
      executeTo: `${base}?tab=contract&contractId=${closing.id}`,
      executeLabel: "Review contract",
      learnMoreLabel: "Closure checklist",
    };
  }

  const pendingApprovals = session?.approvalRequests?.filter(
    (r) => r.customerId === customer.id && r.status === "Pending Approval",
  );
  if (pendingApprovals?.length) {
    for (const c of contracts) {
      if (c.status !== "Scheduled" || c.customerId !== customer.id) continue;
      const invoiceIds = new Set(
        (c.billingSchedule ?? [])
          .map((row) => row.invoiceId)
          .filter((id): id is string => Boolean(id)),
      );
      const approval = pendingApprovals.find((r) => invoiceIds.has(r.invoiceId));
      if (approval) {
        const qs = new URLSearchParams({ from: "customer" });
        if (approval.ingestId) qs.set("ingestId", approval.ingestId);
        return {
          kind: "invoice_activation_pending",
          label: `Invoice pending approval · blocks ${c.id} activation`,
          description: `${approval.invoiceId} needs approval before billing can run.`,
          learnMoreBody:
            "First-invoice approval gates activation for ingested deals. The approver validates amounts and terms against the signed document; once approved, billing can run and the contract moves to active.",
          executeTo: `/approvals/invoices/${approval.invoiceId}?${qs.toString()}`,
          executeLabel: "Review approval",
          learnMoreLabel: "Why this blocks activation",
        };
      }
    }
  }

  if (customer.openAr > 0 && overdue.length === 0) {
    return {
      kind: "open_ar",
      label: `Collect open AR · ${currency(customer.openAr)} outstanding`,
      description: `No overdue invoices yet — keep aging tight before the next bill cycle.`,
      learnMoreBody:
        "Open AR that is not yet overdue still needs allocation, cash application, and customer confirmation. Use the payment workspace to match unapplied cash, verify PO coverage, and clear holds so invoices stay on track.",
      executeTo: `${base}?tab=payment`,
      executeLabel: "Payment workspace",
      learnMoreLabel: "How collections uses this",
    };
  }

  if (customer.crmSyncStatus === "Stale") {
    return {
      kind: "crm_stale",
      label: "CRM sync stale · data may be misaligned",
      description: "Downstream quotes and renewal context could be affected.",
      learnMoreBody:
        "A stale CRM sync means AE/CSM context, ship-to/bill-to, and opportunity stage may not match billing. Reconcile the commercial account record before major quotes or amendments.",
      executeTo: `${base}?tab=customer`,
      learnMoreLabel: "What to verify",
      executeLabel: "View account",
    };
  }

  const renewTs = customer.nextRenewalDate?.trim() ? new Date(customer.nextRenewalDate).getTime() : NaN;
  if (Number.isFinite(renewTs) && renewalContract) {
    const days = Math.round((renewTs - Date.now()) / 86400000);
    if (days > 0 && days < 90) {
      return {
        kind: "renewal",
        label: `Renewal in ${days} days · ${shortDate(customer.nextRenewalDate)}`,
        description: `Align commercial, finance, and legal early.`,
        learnMoreBody:
          "Starting 90 days out gives time for pricing, usage true-up, co-termination targets, and security/legal review without forcing a rushed signature.",
        executeTo: `${base}?tab=contract&contractId=${renewalContract.id}`,
        executeLabel: "Open contract",
        learnMoreLabel: "Renewal playbook",
      };
    }
  }

  if (customer.prepaidCreditTotal > 0 && prepaidContract) {
    const pct = Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100);
    if (pct > 70) {
      return {
        kind: "prepaid_burn",
        label: `${pct}% credits consumed · ${currency(customer.prepaidCreditBalance)} remaining`,
        description: `Review usage vs. forecast and consider a top-up or amendment.`,
        learnMoreBody:
          "High burn on prepaid credits can drive surprise overages or mid-term true-ups. Review usage vs. forecast with the customer and consider a top-up or contract amendment before limits hit.",
        executeTo: `${base}?tab=contract&contractId=${prepaidContract.id}`,
        executeLabel: "View usage context",
        learnMoreLabel: "Finance & CS angle",
      };
    }
  }

  const tickets = getTicketsForCustomer(customer.id);
  const escalated = tickets.filter((t) => t.status === "Escalated");
  if (escalated.length > 0) {
    return {
      kind: "support_escalated",
      label: `${escalated.length} escalated ticket${escalated.length > 1 ? "s" : ""} · blocking billing/renewal`,
      description: `Align with support on owner and SLA, then tie resolution back to open AR or contract terms.`,
      learnMoreBody:
        "Escalations usually tie to disputes, data fixes, or executive attention. Read the latest thread, align with support on owner and SLA, then tie resolution back to open AR or contract terms as needed.",
      executeTo: `${base}?tab=customer#support-comms-anchor`,
      executeLabel: "View tickets",
      learnMoreLabel: "Triage tips",
    };
  }

  return {
    kind: "none",
    label: "Account stable · no urgent action needed",
    description: "Use lifecycle tabs when you are ready to go deeper.",
    learnMoreBody:
      "When nothing is red, focus on proactive hygiene: confirm the next renewal thread, scan for upcoming invoice holds, and keep CRM and billing owners aligned on any mid-term changes.",
    executeTo: `${base}?tab=quote`,
    executeLabel: "Browse quotes",
    learnMoreLabel: "Stay proactive",
  };
}

export function getQuoteInsights(quote: Quote, contract: Contract | null): InsightItem[] {
  const items: InsightItem[] = [];
  if (quote.discountPct > 15) {
    items.push({ severity: "warning", text: `Discount (${quote.discountPct}%) exceeds policy threshold — requires approval` });
  }
  if (contract && quote.commercialTerms.paymentTerms !== contract.paymentTerms && contract.paymentTerms) {
    items.push({ severity: "warning", text: `Payment terms (${quote.commercialTerms.paymentTerms}) differ from prior contract (${contract.paymentTerms})` });
  }
  const creditProduct = quote.products.find((p) => p.prepaidCredits && p.prepaidCredits > 0);
  if (creditProduct) {
    items.push({ severity: "info", text: `Quote includes ${creditProduct.prepaidCredits?.toLocaleString()} prepaid credits — burn-down suggests customer may need more` });
  }
  if (quote.crmSyncStatus !== "Synced") {
    items.push({ severity: "warning", text: `CRM sync status: ${quote.crmSyncStatus} — opportunity data may be stale` });
  }
  if (quote.approval.status === "pending") {
    const days = quote.approval.pendingSince ? Math.round((Date.now() - new Date(quote.approval.pendingSince).getTime()) / 86400000) : 0;
    if (days > 3) items.push({ severity: "warning", text: `Approval pending for ${days} days with ${quote.approval.currentApprover}` });
  }
  if (contract && quote.commercialTerms.contractTerm !== contract.term && contract.term) {
    items.push({ severity: "info", text: `Contract term (${quote.commercialTerms.contractTerm}) differs from current contract (${contract.term})` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Quote is in good standing — no issues detected" });
  return items;
}

export function getContractInsights(contract: Contract | null, customerInvoices: Invoice[]): InsightItem[] {
  if (!contract) return [{ severity: "info", text: "No contract found for this customer." }];
  const items: InsightItem[] = [];

  // Closure-related insights (priority)
  if (contract.closure) {
    const effectiveDate = new Date(contract.closure.effectiveDate);
    const today = new Date();
    const isFuture = effectiveDate > today;
    const daysRemaining = Math.ceil((effectiveDate.getTime() - today.getTime()) / 86400000);

    if (isFuture) {
      items.push({ severity: "warning", text: `Contract closing in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — wind-down period active` });
    } else {
      items.push({ severity: "info", text: `Contract closed on ${shortDate(contract.closure.effectiveDate)}` });
    }

    if (contract.closure.settlementType === "credit_note" && contract.closure.creditNoteId) {
      items.push({ severity: "info", text: `Credit note ${contract.closure.creditNoteId} pending — ${currency(contract.closure.finalAmount)}` });
    }
    if (contract.closure.settlementType === "termination_charge" && contract.closure.invoiceId) {
      items.push({ severity: "info", text: `Termination invoice ${contract.closure.invoiceId} pending — ${currency(contract.closure.finalAmount)}` });
    }
    if (contract.closure.approvalRequired) {
      items.push({ severity: "warning", text: `Settlement requires approval — ${contract.closure.approvalReason}` });
    }
  }

  const overdueInvoices = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  if (overdueInvoices.length > 0) {
    const oldest = overdueInvoices[0];
    const daysOverdue = Math.round((Date.now() - new Date(oldest.dueDate).getTime()) / 86400000);
    items.push({ severity: "warning", text: `Invoice ${oldest.id} is ${daysOverdue} days overdue (${currency(oldest.amount)})` });
  }
  if (contract.comparisonToQuote.length > 0) {
    items.push({ severity: "warning", text: `Signed contract differs from quote on ${contract.comparisonToQuote.length} field${contract.comparisonToQuote.length > 1 ? "s" : ""}: ${contract.comparisonToQuote.map((d) => d.field).join(", ")}` });
  }
  if (contract.prepaidCreditTotal > 0 && !contract.closure) {
    const burnDays = contract.prepaidCreditBalance > 0
      ? Math.round(contract.prepaidCreditBalance / ((contract.prepaidCreditTotal - contract.prepaidCreditBalance) / Math.max(1, Math.round((Date.now() - new Date(contract.effectiveDate).getTime()) / 86400000))))
      : 0;
    if (burnDays > 0 && burnDays < 60) items.push({ severity: "info", text: `Minimum commit will exhaust in ~${burnDays} days at current burn rate` });
  }
  if (contract.renewalDate && !contract.closure) {
    const daysToRenewal = Math.round((new Date(contract.renewalDate).getTime() - Date.now()) / 86400000);
    if (daysToRenewal > 0 && daysToRenewal < 90) items.push({ severity: "info", text: `Renewal in ${daysToRenewal} days — start planning` });
  }
  if (contract.enforcement.productMappingIssues.length === 0 && contract.enforcement.enforcementStatus === "Enforced" && !contract.closure) {
    items.push({ severity: "success", text: "Product mapping complete — all SKUs matched" });
  }
  if (contract.enforcement.blockingIssues.length > 0) {
    items.push({ severity: "warning", text: `${contract.enforcement.blockingIssues.length} enforcement blocking issue${contract.enforcement.blockingIssues.length > 1 ? "s" : ""}` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Contract is healthy — no issues" });
  return items;
}

export function getInvoicingInsights(invoice: Invoice, contract: Contract): InsightItem[] {
  const items: InsightItem[] = [];
  const enrichment = getInvoiceEnrichment(invoice.id);
  if (enrichment && enrichment.paymentTerms !== contract.paymentTerms) {
    items.push({ severity: "warning", text: `Invoice payment terms (${enrichment.paymentTerms}) differ from contract (${contract.paymentTerms})` });
  }
  if (invoice.holdReason) {
    items.push({ severity: "warning", text: `Invoice on hold: ${invoice.holdReason}` });
  }
  if (invoice.disputeReason) {
    items.push({ severity: "warning", text: `Dispute active: ${invoice.disputeReason}` });
  }
  if (enrichment && enrichment.reviewChecklist.some((c) => c.status === "fail")) {
    const failCount = enrichment.reviewChecklist.filter((c) => c.status === "fail").length;
    items.push({ severity: "warning", text: `${failCount} validation check${failCount > 1 ? "s" : ""} failed — resolve before sending` });
  }
  const creditNotes = getCreditNotesForCustomer(invoice.customerId).filter((cn) => cn.invoiceId === invoice.id);
  if (creditNotes.length > 0) {
    const pending = creditNotes.filter((cn) => cn.status !== "Issued");
    if (pending.length > 0) items.push({ severity: "info", text: `${pending.length} credit note${pending.length > 1 ? "s" : ""} pending for this invoice` });
  }
  if (enrichment && enrichment.poNumber) {
    items.push({ severity: "success", text: "PO number available — ready for delivery" });
  } else if (enrichment && !enrichment.poNumber) {
    items.push({ severity: "warning", text: "PO number missing — invoice cannot be sent" });
  }
  if (contract.amendments.length > 0) {
    const recent = contract.amendments.filter((a) => a.status !== "Applied" && a.status !== "Completed");
    if (recent.length > 0) items.push({ severity: "info", text: `${recent.length} pending amendment${recent.length > 1 ? "s" : ""} may affect upcoming invoices` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Invoice is in good standing" });
  return items;
}

export function getPaymentInsights(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): InsightItem[] {
  const items: InsightItem[] = [];
  const merged = mergeInvoiceStatuses(getInvoices(customerId), invoiceStatusOverrides);
  const summary = getCustomerArSummary(customerId, merged);
  const payments = getPaymentsForCustomer(customerId);
  const cases = getCollectionCasesForCustomer(customerId);

  if (summary.avgDaysToPay > 15) {
    items.push({ severity: "warning", text: `Customer typically pays ${summary.avgDaysToPay} days after due date` });
  }
  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");
  if (unapplied.length > 0) {
    items.push({ severity: "info", text: `${currency(unapplied.reduce((s, p) => s + p.amount, 0))} unapplied cash — review bank references for match` });
  }
  const partial = payments.filter((p) => p.matchStatus === "partial");
  if (partial.length > 0) {
    items.push({ severity: "info", text: `Partial payment on ${partial[0].allocations[0]?.invoiceId ?? "unknown"} — ${currency(partial[0].amount)} received` });
  }
  if (cases.some((c) => c.disputeReason)) {
    const disputeCase = cases.find((c) => c.disputeReason);
    items.push({ severity: "warning", text: `Active dispute: ${disputeCase?.disputeReason}` });
  }
  if (summary.totalOverdue > 0 && summary.overdueCount > 0) {
    items.push({ severity: "warning", text: `${currency(summary.totalOverdue)} overdue across ${summary.overdueCount} invoice${summary.overdueCount > 1 ? "s" : ""} — may impact renewal` });
  }
  const ptpCases = cases.filter((c) => c.ptpDate);
  if (ptpCases.length > 0) {
    items.push({ severity: "info", text: `Customer committed to pay by ${ptpCases[0].ptpDate}` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "No outstanding collection issues" });
  return items;
}

export function getRevRecInsights(arrangement: RevenueArrangement | undefined): InsightItem[] {
  if (!arrangement) return [{ severity: "info", text: "No revenue arrangement found — will be created on contract enforcement" }];
  const items: InsightItem[] = [];
  const unresolvedBlockers = arrangement.closeBlockers.filter((b) => !b.resolved);
  if (unresolvedBlockers.length > 0) {
    const critical = unresolvedBlockers.filter((b) => b.severity === "critical");
    if (critical.length > 0) items.push({ severity: "warning", text: `${critical.length} critical blocker${critical.length > 1 ? "s" : ""} preventing period close` });
    const warnings = unresolvedBlockers.filter((b) => b.severity === "warning");
    if (warnings.length > 0) items.push({ severity: "info", text: `${warnings.length} warning${warnings.length > 1 ? "s" : ""} to review before close` });
  }
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  if (pendingAmendments.length > 0) {
    items.push({ severity: "warning", text: `Amendment ${pendingAmendments[0].amendmentId} has not updated the recognition schedule` });
  }
  const pendingAdj = arrangement.adjustments.filter((a) => a.status === "pending_approval");
  if (pendingAdj.length > 0) {
    items.push({ severity: "info", text: `${pendingAdj.length} manual adjustment${pendingAdj.length > 1 ? "s" : ""} awaiting approval` });
  }
  const failedExports = arrangement.journalExports.filter((je) => je.status === "failed" || (je.status === "pending" && je.failReason));
  if (failedExports.length > 0) {
    items.push({ severity: "warning", text: `Journal export blocked for ${failedExports[0].period}: ${failedExports[0].failReason || "pending resolution"}` });
  }
  const usageBased = arrangement.obligations.filter((o) => o.obligationType === "usage-based");
  if (usageBased.length > 0) {
    items.push({ severity: "info", text: `${usageBased.length} obligation${usageBased.length > 1 ? "s" : ""} using usage-based recognition — variable consideration applies` });
  }
  if (items.length === 0) items.push({ severity: "success", text: "Revenue arrangement is healthy — ready for close" });
  return items;
}

// ---------------------------------------------------------------------------
// LINKED RECORDS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface LinkedRecord {
  label: string;
  id: string;
}

export function getQuoteLinkedRecords(quote: Quote | null): LinkedRecord[] {
  if (!quote) return [];
  const records: LinkedRecord[] = [];
  if (quote.relatedContractId) records.push({ label: "Active Contract", id: quote.relatedContractId });
  if (quote.crmOpportunityLink) records.push({ label: "CRM Opportunity", id: quote.crmOpportunityLink.split("/").pop() ?? "—" });
  return records;
}

export function getContractLinkedRecords(contract: Contract | null, customerQuotes: Quote[], customerInvoices: Invoice[]): LinkedRecord[] {
  if (!contract) return [];
  const records: LinkedRecord[] = [];
  if (contract.sourceQuoteId) records.push({ label: "Source Quote", id: contract.sourceQuoteId });
  const pendingQuotes = customerQuotes.filter((q) => q.status !== "Accepted" && q.relatedContractId === contract.id);
  for (const q of pendingQuotes.slice(0, 2)) records.push({ label: `Quote (${q.status.toLowerCase()})`, id: q.id });
  const overdueInv = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  for (const inv of overdueInv.slice(0, 2)) records.push({ label: "Overdue Invoice", id: inv.id });
  return records;
}

export function getInvoicingLinkedRecords(invoice: Invoice, customerId: string): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  if (invoice.contractId) records.push({ label: "Source Contract", id: invoice.contractId });
  const cns = getCreditNotesForCustomer(customerId).filter((cn) => cn.invoiceId === invoice.id);
  for (const cn of cns) records.push({ label: "Credit Note", id: cn.id });
  const cases = getCollectionCasesForCustomer(customerId).filter((c) => c.invoiceId === invoice.id);
  for (const c of cases) records.push({ label: "Collection Case", id: c.id });
  return records;
}

export function getPaymentLinkedRecords(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): LinkedRecord[] {
  const records: LinkedRecord[] = [];
  const inv = mergeInvoiceStatuses(getInvoices(customerId), invoiceStatusOverrides);
  const overdue = inv.filter((i) => i.status === "Overdue");
  for (const i of overdue.slice(0, 2)) records.push({ label: "Overdue Invoice", id: i.id });
  const held = inv.filter((i) => i.holdReason);
  for (const i of held.slice(0, 2)) records.push({ label: "Held Invoice", id: i.id });
  const cns = getCreditNotesForCustomer(customerId);
  for (const cn of cns.slice(0, 2)) records.push({ label: "Credit Note", id: cn.id });
  const tickets = getTicketsForCustomer(customerId).filter((t) => t.status !== "Resolved");
  for (const t of tickets.slice(0, 1)) records.push({ label: "Support Ticket", id: t.id });
  return records;
}

export function getRevRecLinkedRecords(arrangement: RevenueArrangement | undefined): LinkedRecord[] {
  if (!arrangement) return [];
  const records: LinkedRecord[] = [];
  records.push({ label: "Source Contract", id: arrangement.contractId });
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  for (const ai of pendingAmendments) records.push({ label: `Amendment (${ai.scheduleUpdateState.toLowerCase()})`, id: ai.amendmentId });
  const blockedExports = arrangement.journalExports.filter((je) => je.status === "pending" || je.status === "failed");
  for (const je of blockedExports.slice(0, 1)) records.push({ label: `Journal (${je.status})`, id: je.id });
  return records;
}

// ---------------------------------------------------------------------------
// NEXT BEST ACTIONS (dynamic per stage)
// ---------------------------------------------------------------------------

export interface NextAction {
  label: string;
  description: string;
}

export function getCustomerActions(
  customer: Customer,
  invoiceStatusOverrides?: Record<string, string>,
): NextAction[] {
  const actions: NextAction[] = [];
  const invoices = mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides);
  const overdue = invoices.filter((i) => i.status === "Overdue");
  if (overdue.length > 0) {
    const total = overdue.reduce((s, i) => s + i.amount, 0);
    actions.push({
      label: overdue.length === 1 ? "Resolve overdue invoice" : "Resolve overdue invoices",
      description: `${overdue.length} past due — ${currency(total)} total`,
    });
  }
  if (customer.openAr > 0 && overdue.length === 0) {
    actions.push({ label: "Review open AR", description: `${currency(customer.openAr)} outstanding` });
  }
  if (customer.crmSyncStatus === "Stale") {
    actions.push({ label: "Refresh CRM sync", description: "Account data may be stale for downstream alignment" });
  }
  const renewTs = customer.nextRenewalDate?.trim() ? new Date(customer.nextRenewalDate).getTime() : NaN;
  if (Number.isFinite(renewTs)) {
    const days = Math.round((renewTs - Date.now()) / 86400000);
    if (days > 0 && days < 90) {
      actions.push({
        label: "Start renewal planning",
        description: `Renewal in ${days} days (${shortDate(customer.nextRenewalDate)})`,
      });
    }
  }
  if (customer.prepaidCreditTotal > 0) {
    const pct = Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100);
    if (pct > 70) {
      actions.push({
        label: "Review prepaid credit burn",
        description: `${pct}% consumed — ${currency(customer.prepaidCreditBalance)} remaining`,
      });
    }
  }
  const tickets = getTicketsForCustomer(customer.id);
  const escalated = tickets.filter((t) => t.status === "Escalated");
  if (escalated.length > 0) {
    actions.push({
      label: "Address escalated support",
      description: `${escalated.length} ticket${escalated.length > 1 ? "s" : ""} escalated`,
    });
  }
  if (actions.length === 0) {
    actions.push({
      label: "No immediate actions",
      description: "Account posture looks stable — monitor lifecycle tabs for updates.",
    });
  }
  return actions;
}

export function getQuoteActions(quote: Quote | null): NextAction[] {
  if (!quote) return [];
  const actions: NextAction[] = [];
  if (quote.approval.status === "pending") {
    actions.push({ label: "Follow up on approval", description: `Pending with ${quote.approval.currentApprover} since ${shortDate(quote.approval.pendingSince)}` });
  }
  if (quote.status === "Sent" && !quote.customerAcceptedAt) {
    actions.push({ label: "Follow up with customer", description: `Quote sent — no response yet` });
  }
  if (quote.status === "Draft") {
    actions.push({ label: "Complete and send quote", description: `Draft quote needs finalization` });
  }
  if (quote.discountPct > 15) {
    actions.push({ label: "Review discount level", description: `${quote.discountPct}% discount — verify margin impact` });
  }
  return actions;
}

export function getContractActions(contract: Contract | null, customerInvoices: Invoice[]): NextAction[] {
  if (!contract) return [];
  const actions: NextAction[] = [];

  // Closure-related actions (priority)
  if (contract.closure) {
    const effectiveDate = new Date(contract.closure.effectiveDate);
    const today = new Date();
    const isFuture = effectiveDate > today;
    const daysRemaining = Math.ceil((effectiveDate.getTime() - today.getTime()) / 86400000);

    if (isFuture) {
      actions.push({ label: `Contract closing on ${shortDate(contract.closure.effectiveDate)}`, description: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining in wind-down` });
    }

    if (contract.closure.settlementType === "credit_note" && contract.closure.creditNoteId) {
      actions.push({ label: `Process credit note ${contract.closure.creditNoteId}`, description: `${currency(contract.closure.finalAmount)} pending approval` });
    }
    if (contract.closure.settlementType === "termination_charge" && contract.closure.invoiceId) {
      actions.push({ label: `Review termination invoice ${contract.closure.invoiceId}`, description: `${currency(contract.closure.finalAmount)} pending approval` });
    }
  }

  const overdue = customerInvoices.filter((i) => i.status === "Overdue" && i.contractId === contract.id);
  if (overdue.length > 0) {
    actions.push({ label: `Resolve overdue invoice`, description: `${overdue[0].id} is past due (${currency(overdue[0].amount)})` });
  }
  const held = customerInvoices.filter((i) => i.holdReason && i.contractId === contract.id);
  if (held.length > 0) {
    actions.push({ label: `Collect PO for held invoice`, description: `${held[0].id} on hold: ${held[0].holdReason}` });
  }
  if (contract.renewalDate && !contract.closure) {
    const days = Math.round((new Date(contract.renewalDate).getTime() - Date.now()) / 86400000);
    if (days > 0 && days < 90) actions.push({ label: "Start renewal planning", description: `Contract ends ${shortDate(contract.renewalDate)}` });
  }
  if (contract.enforcement.blockingIssues.length > 0) {
    actions.push({ label: "Resolve enforcement blockers", description: contract.enforcement.blockingIssues[0] });
  }
  return actions;
}

export function getInvoicingActions(invoice: Invoice): NextAction[] {
  const actions: NextAction[] = [];
  if (invoice.holdReason) {
    actions.push({ label: `Release hold on ${invoice.id}`, description: `Held: ${invoice.holdReason}` });
  }
  if (invoice.status === "Overdue") {
    const days = Math.round((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000);
    actions.push({ label: `Send overdue reminder`, description: `${invoice.id} is ${days} days past due` });
  }
  if (invoice.status === "Pending Review") {
    actions.push({ label: `Review and approve ${invoice.id}`, description: `${currency(invoice.amount)} pending review` });
  }
  const cns = getCreditNotesForCustomer(invoice.customerId).filter((cn) => cn.invoiceId === invoice.id && cn.status !== "Issued");
  if (cns.length > 0) {
    actions.push({ label: `Process credit note ${cns[0].id}`, description: `${currency(cns[0].amount)} pending — ${cns[0].reason.substring(0, 50)}` });
  }
  return actions;
}

export function getPaymentActions(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): NextAction[] {
  const actions: NextAction[] = [];
  const payments = getPaymentsForCustomer(customerId);
  const cases = getCollectionCasesForCustomer(customerId);
  const merged = mergeInvoiceStatuses(getInvoices(customerId), invoiceStatusOverrides);
  const summary = getCustomerArSummary(customerId, merged);

  const unapplied = payments.filter((p) => p.matchStatus === "unapplied");
  if (unapplied.length > 0) {
    actions.push({ label: `Match unapplied ${currency(unapplied[0].amount)}`, description: `${unapplied[0].method} — Ref: ${unapplied[0].bankReference}` });
  }
  const partial = payments.filter((p) => p.matchStatus === "partial");
  if (partial.length > 0) {
    actions.push({ label: `Resolve partial payment`, description: `${currency(partial[0].amount)} received against ${partial[0].allocations[0]?.invoiceId ?? "unknown"}` });
  }
  const ptpCases = cases.filter((c) => c.ptpDate);
  if (ptpCases.length > 0) {
    actions.push({ label: "Follow up on promised payment", description: `Customer committed to pay by ${ptpCases[0].ptpDate}` });
  }
  const noResponse = cases.filter((c) => c.stage === "No Response");
  if (noResponse.length > 0) {
    actions.push({ label: `Escalate ${noResponse[0].invoiceId}`, description: `No response after ${noResponse[0].followUpHistory.length} attempts` });
  }
  if (summary.overdueCount > 0 && actions.length === 0) {
    actions.push({ label: "Record payment", description: `${currency(summary.totalOverdue)} overdue` });
  }
  return actions;
}

export function getRevRecActions(arrangement: RevenueArrangement | undefined): NextAction[] {
  if (!arrangement) return [];
  const actions: NextAction[] = [];
  const pendingAmendments = arrangement.amendmentImpacts.filter((ai) => ai.scheduleUpdateState.toLowerCase().includes("pending"));
  if (pendingAmendments.length > 0) {
    actions.push({ label: `Rerun schedule for ${pendingAmendments[0].amendmentId}`, description: pendingAmendments[0].description });
  }
  const pendingAdj = arrangement.adjustments.filter((a) => a.status === "pending_approval");
  if (pendingAdj.length > 0) {
    actions.push({ label: `Approve adjustment ${pendingAdj[0].id}`, description: `${pendingAdj[0].reason}` });
  }
  const unresolvedBlockers = arrangement.closeBlockers.filter((b) => !b.resolved);
  if (unresolvedBlockers.length > 0) {
    actions.push({ label: "Resolve close blockers", description: `${unresolvedBlockers.length} blocker${unresolvedBlockers.length > 1 ? "s" : ""} preventing period close` });
  }
  const failedExports = arrangement.journalExports.filter((je) => je.status === "failed");
  if (failedExports.length > 0) {
    actions.push({ label: "Re-export failed journal entries", description: `${failedExports[0].period}: ${failedExports[0].failReason}` });
  }
  return actions;
}

// ---------------------------------------------------------------------------
// CUSTOMER HEALTH (dynamic from support data)
// ---------------------------------------------------------------------------

export interface CustomerHealthData {
  nps: number;
  supportTickets30d: number;
  openEscalations: number;
  churnRisk: "High" | "Medium" | "Low";
  churnColor: string;
}

export function deriveCustomerHealth(customer: Customer): CustomerHealthData {
  const tickets = getTicketsForCustomer(customer.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = tickets.filter((t) => new Date(t.lastUpdatedAt) >= thirtyDaysAgo);
  const escalations = tickets.filter((t) => t.status === "Escalated");

  const hasOverdue = customer.riskBadges.some((b) => b.toLowerCase().includes("overdue"));
  const hasEscalation = customer.riskBadges.some((b) => b.toLowerCase().includes("escalation"));
  const hasBurn = customer.riskBadges.some((b) => b.toLowerCase().includes("burn"));

  const riskScore = (hasOverdue ? 2 : 0) + (hasEscalation ? 2 : 0) + (hasBurn ? 1 : 0) + (escalations.length > 0 ? 1 : 0);
  const churnRisk: "High" | "Medium" | "Low" = riskScore >= 4 ? "High" : riskScore >= 2 ? "Medium" : "Low";
  const churnColor = churnRisk === "High" ? "text-red-600" : churnRisk === "Medium" ? "text-amber-600" : "text-emerald-600";

  const nps = riskScore >= 4 ? 32 : riskScore >= 2 ? 52 : 72;

  return {
    nps,
    supportTickets30d: recent.length,
    openEscalations: escalations.length,
    churnRisk,
    churnColor,
  };
}

// ---------------------------------------------------------------------------
// CUSTOMER-LEVEL EXTERNAL LINKED RECORDS
// Cross-tab aggregation — external system references only
// (CRM accounts/opportunities, signed contract documents, etc.)
// Internal records (invoices, credit notes, tickets) live elsewhere.
// ---------------------------------------------------------------------------

export type ExternalRecordKind = "crm-account" | "crm-opportunity" | "contract-document";

export interface ExternalLinkedRecord {
  kind: ExternalRecordKind;
  label: string;        // e.g. "CRM Account", "CRM Opportunity (QT-…)"
  value: string;        // e.g. "001Dn000008xA4Z" or "006Dn000004xK3Z"
  href?: string;        // clickable external URL when available
  sublabel?: string;    // optional small secondary line
}

export function getCustomerExternalLinkedRecords(
  customer: Customer,
  quotes: Quote[],
  contracts: Contract[],
): ExternalLinkedRecord[] {
  const records: ExternalLinkedRecord[] = [];

  // CRM account (one per customer)
  if (customer.crmAccountId) {
    records.push({
      kind: "crm-account",
      label: "CRM Account",
      value: customer.crmAccountId,
      sublabel: customer.crmSyncStatus ? `Sync: ${customer.crmSyncStatus}` : undefined,
    });
  }

  // CRM opportunities — dedupe by lineageId, take latest version per deal
  const latestByLineage = new Map<string, Quote>();
  for (const q of quotes) {
    if (!q.crmOpportunityLink) continue;
    const existing = latestByLineage.get(q.lineageId);
    if (!existing || q.version > existing.version) latestByLineage.set(q.lineageId, q);
  }
  for (const q of latestByLineage.values()) {
    const oppId = q.crmOpportunityLink.split("/").pop() ?? q.crmOpportunityLink;
    records.push({
      kind: "crm-opportunity",
      label: `CRM Opportunity · ${q.id}`,
      value: oppId,
      href: q.crmOpportunityLink,
    });
  }

  // Signed contract documents
  for (const c of contracts) {
    if (!c.signedDocumentUrl) continue;
    records.push({
      kind: "contract-document",
      label: `Signed Contract · ${c.id}`,
      value: filenameFromUrl(c.signedDocumentUrl) ?? "Contract PDF",
      href: c.signedDocumentUrl,
      sublabel: c.extractionConfidence ? `Extraction ${Math.round(c.extractionConfidence)}%` : undefined,
    });
  }

  return records;
}

function filenameFromUrl(url: string): string | null {
  try {
    const path = new URL(url, "https://example.com").pathname;
    const last = path.split("/").filter(Boolean).pop();
    return last ?? null;
  } catch {
    return url.split("/").pop() ?? null;
  }
}
