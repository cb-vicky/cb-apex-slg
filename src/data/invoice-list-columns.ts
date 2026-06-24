import type { Column } from "@/components/index-page/ListTable";
import type { Customer, Invoice } from "@/data/mock-data";
import { getCustomerArProfile } from "@/data/collections-ar-profile";
import { getEmailSequenceForCustomer } from "@/data/collections-email-sequence";
import { currency, shortDate } from "@/lib/utils";
import type { InvoiceViewContext } from "@/data/invoice-list-views";

export type InvoiceListColumnKey =
  | "invoiceId"
  | "customer"
  | "contract"
  | "amount"
  | "outstandingAmount"
  | "dueDate"
  | "daysPastDue"
  | "status"
  | "dunningStatus"
  | "reminderSequenceStatus"
  | "lastEmailSent"
  | "collectionOwner"
  | "partialPayment"
  | "offlineDunning"
  | "onlineDunning";

export const INVOICE_LIST_COLUMN_DEFS: Record<InvoiceListColumnKey, Column> = {
  invoiceId: { key: "invoiceId", label: "Invoice", width: "130px", sortable: true },
  customer: { key: "customer", label: "Customer", width: "160px", sortable: true },
  contract: { key: "contract", label: "Contract", width: "130px" },
  amount: { key: "amount", label: "Amount", width: "110px", align: "right" },
  outstandingAmount: {
    key: "outstandingAmount",
    label: "Outstanding Amount",
    width: "140px",
    align: "right",
  },
  dueDate: { key: "dueDate", label: "Due Date", width: "100px", sortable: true },
  daysPastDue: {
    key: "daysPastDue",
    label: "Days Past Due",
    width: "110px",
    align: "right",
  },
  status: { key: "status", label: "Status", width: "120px" },
  dunningStatus: { key: "dunningStatus", label: "Dunning Status", width: "120px" },
  reminderSequenceStatus: {
    key: "reminderSequenceStatus",
    label: "Reminder Sequence Status",
    width: "160px",
  },
  lastEmailSent: { key: "lastEmailSent", label: "Last Email Sent", width: "120px" },
  collectionOwner: { key: "collectionOwner", label: "Collection Owner", width: "130px" },
  partialPayment: { key: "partialPayment", label: "Partial Payment", width: "120px" },
  offlineDunning: { key: "offlineDunning", label: "Offline Dunning", width: "130px" },
  onlineDunning: { key: "onlineDunning", label: "Online Dunning", width: "120px" },
};

export function columnsForInvoiceView(columnKeys: InvoiceListColumnKey[]): Column[] {
  return columnKeys.map((key) => INVOICE_LIST_COLUMN_DEFS[key]);
}

export interface InvoiceListRowData {
  invoiceId: string;
  customer: string;
  contract: string;
  amount: number;
  outstandingAmount: number;
  dueDate: string;
  daysPastDue: number;
  status: string;
  dunningStatus: string | null;
  reminderSequenceStatus: string | null;
  lastEmailSent: string | null;
  collectionOwner: string;
  hasPartialPayment: boolean;
  offlineDunning: InvoiceViewContext["offlineDunning"];
  onlineDunning: InvoiceViewContext["onlineDunning"];
}

function deriveLastEmailSent(customerId: string): string | null {
  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) return null;
  const sent = sequence.steps
    .filter((s) => s.status === "sent")
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return sent[0] ? shortDate(sent[0].at) : null;
}

function deriveDunningStatus(customerId: string): string | null {
  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) return null;
  const hasScheduled = sequence.steps.some((s) => s.status === "scheduled");
  const allSent = sequence.steps.every((s) => s.status === "sent");
  if (hasScheduled) return "In Progress";
  if (allSent) return "Success";
  return "Stopped";
}

function deriveReminderSequenceStatus(customerId: string): string | null {
  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) return null;
  const hasScheduled = sequence.steps.some((s) => s.status === "scheduled");
  const allSent = sequence.steps.every((s) => s.status === "sent");
  if (hasScheduled) return "In Progress";
  if (allSent) return "Exhausted";
  return "Stopped";
}

function dunningDisplay(value: "in-progress" | "stopped" | null): string {
  if (value === "in-progress") return "In Progress";
  if (value === "stopped") return "Stopped";
  return "—";
}

export function buildInvoiceListRowData(
  invoice: Invoice,
  customer: Customer | undefined,
  ctx: InvoiceViewContext,
): InvoiceListRowData {
  const profile = getCustomerArProfile(invoice.customerId, customer?.billingOwner ?? invoice.owner);
  const collectionOwner =
    profile.collectionOwnerOptions.find((o) => o.id === profile.collectionOwnerId)?.name ??
    invoice.owner;

  return {
    invoiceId: invoice.id,
    customer: customer?.name ?? "—",
    contract: invoice.contractId || "—",
    amount: invoice.amount,
    outstandingAmount: invoice.status === "Paid" ? 0 : invoice.amount,
    dueDate: shortDate(invoice.dueDate),
    daysPastDue: ctx.daysPastDue,
    status: invoice.status,
    dunningStatus: deriveDunningStatus(invoice.customerId),
    reminderSequenceStatus: deriveReminderSequenceStatus(invoice.customerId),
    lastEmailSent: deriveLastEmailSent(invoice.customerId),
    collectionOwner,
    hasPartialPayment: ctx.hasPartialPayment,
    offlineDunning: ctx.offlineDunning,
    onlineDunning: ctx.onlineDunning,
  };
}

export function buildInvoiceListRowDataMap(
  invoices: Invoice[],
  customers: Customer[],
  contextMap: Map<string, InvoiceViewContext>,
): Map<string, InvoiceListRowData> {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const map = new Map<string, InvoiceListRowData>();
  for (const invoice of invoices) {
    const ctx = contextMap.get(invoice.id);
    if (!ctx) continue;
    map.set(
      invoice.id,
      buildInvoiceListRowData(invoice, customerById.get(invoice.customerId), ctx),
    );
  }
  return map;
}

export function formatInvoiceListCell(key: InvoiceListColumnKey, row: InvoiceListRowData): string {
  switch (key) {
    case "invoiceId":
      return row.invoiceId;
    case "customer":
      return row.customer;
    case "contract":
      return row.contract;
    case "amount":
      return currency(row.amount);
    case "outstandingAmount":
      return currency(row.outstandingAmount);
    case "dueDate":
      return row.dueDate;
    case "daysPastDue":
      return String(row.daysPastDue);
    case "status":
      return row.status;
    case "dunningStatus":
      return row.dunningStatus ?? "—";
    case "reminderSequenceStatus":
      return row.reminderSequenceStatus ?? "—";
    case "lastEmailSent":
      return row.lastEmailSent ?? "—";
    case "collectionOwner":
      return row.collectionOwner;
    case "partialPayment":
      return row.hasPartialPayment ? "Yes" : "No";
    case "offlineDunning":
      return dunningDisplay(row.offlineDunning);
    case "onlineDunning":
      return dunningDisplay(row.onlineDunning);
  }
}

export function invoiceCellClassName(key: InvoiceListColumnKey, row: InvoiceListRowData): string {
  if (key === "invoiceId") return "font-medium text-blue-600";
  if (key === "customer") return "font-medium text-text-primary";
  if (key === "daysPastDue") {
    return row.daysPastDue > 0
      ? "tabular-nums font-medium text-red-600"
      : "tabular-nums";
  }
  if (key === "amount" || key === "outstandingAmount") {
    return "tabular-nums";
  }
  return "text-text-secondary";
}
