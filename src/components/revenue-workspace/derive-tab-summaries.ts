import { getCollectionCommentsForCustomer, getPinnedCollectionComments } from "@/data/collections-comments";
import type { Customer, Quote, Contract, Invoice } from "@/data/mock-data";
import { getThreadsForCustomer } from "@/data/email-threads";
import { getOpenTasksForCustomer } from "@/data/customer-tasks";
import type { Stage } from "./stage";
import {
  ADD_COLLECTION_COMMENT_RECORD_ID,
} from "./workspace-tabs";
import {
  deriveContractStatus,
  deriveCustomerStatus,
  derivePaymentStatus,
  deriveQuoteStatus,
  deriveRevRecStatus,
  mergeContractsWithRuntimeClosures,
  mergeInvoiceStatuses,
  type StatusSeverity,
} from "./derive-stage-data";
import type { WorkspaceTab } from "./workspace-tabs";
import { tabKey } from "./workspace-tabs";
import type { ContractGraceExtension } from "@/data/contract-transition";
import type { ContractClosure } from "@/data/mock-data";

export interface TabSummary {
  subtitle: string;
  severity: StatusSeverity;
}

export const CONNECT_TAB_SUMMARY: TabSummary = {
  subtitle: "5+ apps",
  severity: "blue",
};

/** Default second line on the More tab when nothing is in overflow. */
export const MORE_TAB_DEFAULT_SUBTITLE = "Connect apps";

/** Severity tint on subtitle — only on tab hover (default is mid-grey). */
export const TAB_STATUS_HOVER_CLASS: Record<StatusSeverity, string> = {
  green: "group-hover/tab:text-emerald-600",
  amber: "group-hover/tab:text-amber-600",
  red: "group-hover/tab:text-red-600",
  blue: "group-hover/tab:text-blue-600",
  gray: "group-hover/tab:text-text-secondary",
};

function truncateStatus(text: string, max = 24): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function invoiceStatusSeverity(status: string): StatusSeverity {
  if (status === "Overdue") return "red";
  if (status === "Pending Review" || status === "Held") return "amber";
  if (status === "Paid") return "green";
  return "blue";
}

export function deriveQuoteRecordTabSummary(quote: Quote): TabSummary {
  const { text, severity } = deriveQuoteStatus(quote);
  return { subtitle: truncateStatus(text), severity };
}

export function deriveContractRecordTabSummary(
  contract: Contract,
  invoiceStatusOverrides?: Record<string, string>,
): TabSummary {
  const { text, severity } = deriveContractStatus(contract, invoiceStatusOverrides);
  return { subtitle: truncateStatus(text), severity };
}

export function deriveInvoiceRecordTabSummary(invoice: Invoice): TabSummary {
  if (invoice.holdReason) {
    return { subtitle: "On hold", severity: "amber" };
  }
  if (invoice.status === "Overdue") {
    return { subtitle: "Overdue", severity: "red" };
  }
  if (invoice.status === "Pending Review") {
    return { subtitle: "Pending review", severity: "amber" };
  }
  if (invoice.status === "Paid") {
    return { subtitle: "Paid", severity: "green" };
  }
  if (invoice.status === "Sent") {
    return { subtitle: "Sent", severity: "amber" };
  }
  return {
    subtitle: truncateStatus(invoice.status),
    severity: invoiceStatusSeverity(invoice.status),
  };
}

export function buildRecordTabSummaries(input: {
  quotes: Quote[];
  contracts: Contract[];
  invoices: Invoice[];
  invoiceStatusOverrides?: Record<string, string>;
}): Record<string, TabSummary> {
  const mergedInvoices = mergeInvoiceStatuses(
    input.invoices,
    input.invoiceStatusOverrides,
  );
  const map: Record<string, TabSummary> = {};

  for (const q of input.quotes) {
    map[`record:quote:${q.id}`] = deriveQuoteRecordTabSummary(q);
  }
  for (const c of input.contracts) {
    map[`record:contract:${c.id}`] = deriveContractRecordTabSummary(
      c,
      input.invoiceStatusOverrides,
    );
  }
  for (const inv of mergedInvoices) {
    map[`record:invoicing:${inv.id}`] = deriveInvoiceRecordTabSummary(inv);
  }

  map[`record:comments:${ADD_COLLECTION_COMMENT_RECORD_ID}`] = {
    subtitle: "New",
    severity: "amber",
  };

  return map;
}

export function resolveWorkspaceTabSummary(
  tab: WorkspaceTab,
  parentSummaries: Partial<Record<Stage, TabSummary>>,
  recordSummaries: Record<string, TabSummary>,
): TabSummary | undefined {
  if (tab.kind === "parent") return parentSummaries[tab.stage];
  return recordSummaries[tabKey(tab)];
}

/** Second line for the More tab — one group name plus overflow count (e.g. "Collections +1"). */
export function buildMoreTabSubtitle(
  overflowTabs: WorkspaceTab[],
  hiddenParents: Stage[],
  stageDisplay: Record<Stage, { tab: string }>,
): string {
  const labels: string[] = [];
  for (const tab of overflowTabs) {
    labels.push(stageDisplay[tab.stage].tab);
  }
  for (const stage of hiddenParents) {
    labels.push(stageDisplay[stage].tab);
  }
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels[0]} +${labels.length - 1}`;
}

const PAID_INVOICE_STATUSES = new Set(["Paid", "Void", "Draft"]);

function isQuoteDraft(q: Quote): boolean {
  return q.status === "Draft";
}

function isQuoteResolved(q: Quote): boolean {
  if (q.status === "Draft" || q.status === "Sent") return false;
  if (q.approval.status === "pending") return false;
  return true;
}

export function deriveQuotesTabSummary(quotes: Quote[]): TabSummary | null {
  if (quotes.length === 0) return null;

  const drafts = quotes.filter(isQuoteDraft);
  if (drafts.length > 0) {
    return {
      subtitle: drafts.length === 1 ? "1 in draft" : `${drafts.length} in draft`,
      severity: "amber",
    };
  }

  if (quotes.every(isQuoteResolved)) {
    return {
      subtitle: quotes.length === 1 ? "1 quote" : `${quotes.length} quotes`,
      severity: "green",
    };
  }

  const pending = quotes.filter((q) => q.approval.status === "pending");
  if (pending.length > 0) {
    return {
      subtitle: pending.length === 1 ? "Pending approval" : `${pending.length} pending`,
      severity: "amber",
    };
  }

  const sent = quotes.filter((q) => q.status === "Sent");
  if (sent.length > 0) {
    return {
      subtitle: sent.length === 1 ? "Awaiting response" : `${sent.length} awaiting`,
      severity: "amber",
    };
  }

  return {
    subtitle: `${quotes.length} quotes`,
    severity: "blue",
  };
}

export function deriveContractsTabSummary(
  contracts: Contract[],
  invoiceStatusOverrides?: Record<string, string>,
): TabSummary | null {
  if (contracts.length === 0) return null;

  const scheduled = contracts.filter((c) => c.status === "Scheduled");
  if (scheduled.length > 0) {
    return {
      subtitle: scheduled.length === 1 ? "Scheduled" : `${scheduled.length} scheduled`,
      severity: "blue",
    };
  }

  const primary =
    contracts.find((c) => c.status === "Active") ??
    contracts.find((c) => c.status === "Closing") ??
    contracts.find((c) => c.status === "Extended") ??
    contracts[0];

  const { text, severity } = deriveContractStatus(primary, invoiceStatusOverrides);
  const short =
    text.length > 28 ? `${text.slice(0, 26)}…` : text;
  return { subtitle: short, severity };
}

export function deriveInvoicingTabSummary(
  invoices: Invoice[],
): TabSummary | null {
  if (invoices.length === 0) return null;

  const hasUnpaid = invoices.some((i) => !PAID_INVOICE_STATUSES.has(i.status));
  if (hasUnpaid) {
    const overdue = invoices.filter((i) => i.status === "Overdue").length;
    return {
      subtitle: "Unpaid",
      severity: overdue > 0 ? "red" : "amber",
    };
  }

  return { subtitle: "No Due", severity: "green" };
}

export function deriveTasksTabSummary(customerId: string): TabSummary {
  const pending = getOpenTasksForCustomer(customerId).length;
  if (pending === 0) {
    return { subtitle: "None pending", severity: "green" };
  }
  return {
    subtitle: pending === 1 ? "1 pending" : `${pending} pending`,
    severity: pending >= 3 ? "amber" : "blue",
  };
}

export function deriveThreadsTabSummary(customerId: string): TabSummary {
  const unread = getThreadsForCustomer(customerId).filter((t) => t.unread).length;
  if (unread === 0) {
    return { subtitle: "All caught up", severity: "green" };
  }
  return {
    subtitle: unread === 1 ? "1 unread" : `${unread} unread`,
    severity: "amber",
  };
}

export function deriveCollectionsTabSummary(
  customerId: string,
  invoiceStatusOverrides?: Record<string, string>,
): TabSummary | null {
  const { text, severity } = derivePaymentStatus(customerId, invoiceStatusOverrides);
  const short = text === "No open AR" ? "No open AR" : text.split(" · ")[0];
  return { subtitle: short, severity };
}

export function deriveCommentsTabSummary(customerId: string): TabSummary {
  const count = getCollectionCommentsForCustomer(customerId).length;
  const pinned = getPinnedCollectionComments(customerId).length;
  if (count === 0) return { subtitle: "No comments", severity: "gray" };
  if (pinned > 0) {
    return {
      subtitle: pinned === 1 ? "1 pinned" : `${pinned} pinned`,
      severity: "amber",
    };
  }
  return {
    subtitle: count === 1 ? "1 comment" : `${count} comments`,
    severity: "blue",
  };
}

export interface ParentTabSummaryInput {
  customer: Customer;
  quotes: Quote[];
  contracts: Contract[];
  invoices: Invoice[];
  invoiceStatusOverrides?: Record<string, string>;
  contractClosures?: Record<string, ContractClosure>;
  contractGraceExtensions?: Record<string, ContractGraceExtension>;
  primaryContractId?: string | null;
}

export function deriveParentTabSummaries(
  input: ParentTabSummaryInput,
): Partial<Record<Stage, TabSummary>> {
  const {
    customer,
    quotes,
    contracts: contractsRaw,
    invoices,
    invoiceStatusOverrides,
    contractClosures = {},
    contractGraceExtensions = {},
    primaryContractId,
  } = input;

  const contracts = mergeContractsWithRuntimeClosures(
    contractsRaw,
    contractClosures,
    contractGraceExtensions,
  );
  const mergedInvoices = mergeInvoiceStatuses(invoices, invoiceStatusOverrides);

  const customerStatus = deriveCustomerStatus(customer, invoiceStatusOverrides);
  const summaries: Partial<Record<Stage, TabSummary>> = {
    customer: {
      subtitle:
        customerStatus.text.length > 24
          ? `${customerStatus.text.slice(0, 22)}…`
          : customerStatus.text,
      severity: customerStatus.severity,
    },
    tasks: deriveTasksTabSummary(customer.id),
    threads: deriveThreadsTabSummary(customer.id),
  };

  const quotesSummary = deriveQuotesTabSummary(quotes);
  if (quotesSummary) summaries.quote = quotesSummary;

  const contractsSummary = deriveContractsTabSummary(contracts, invoiceStatusOverrides);
  if (contractsSummary) summaries.contract = contractsSummary;

  const invoicingSummary = deriveInvoicingTabSummary(mergedInvoices);
  if (invoicingSummary) summaries.invoicing = invoicingSummary;

  const collectionsSummary = deriveCollectionsTabSummary(customer.id, invoiceStatusOverrides);
  if (collectionsSummary) summaries.payment = collectionsSummary;

  summaries.comments = deriveCommentsTabSummary(customer.id);

  if (primaryContractId) {
    const rev = deriveRevRecStatus(primaryContractId);
    summaries.revrec = {
      subtitle: rev.text.length > 24 ? `${rev.text.slice(0, 22)}…` : rev.text,
      severity: rev.severity,
    };
  } else if (contracts.length > 0) {
    summaries.revrec = { subtitle: "—", severity: "gray" };
  }

  return summaries;
}
