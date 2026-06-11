import type { Column } from "@/components/index-page/ListTable";
import type { Customer, Invoice } from "@/data/mock-data";
import { collectionCases } from "@/data/billing-data";
import { getEmailSequenceForCustomer } from "@/data/collections-email-sequence";
import { getCustomerArProfile } from "@/data/collections-ar-profile";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { currency, shortDate } from "@/lib/utils";

export type CustomerListColumnKey =
  | "company"
  | "outstandingAmount"
  | "overdueAmount"
  | "openInvoiceCount"
  | "autoCollection"
  | "overdue0_30"
  | "overdue31_60"
  | "overdue61_90"
  | "overdue90Plus"
  | "collectionOwner"
  | "oldestOverdueDays"
  | "lastEmailSent"
  | "customerMrr"
  | "businessEntity"
  | "reminderSequenceStatus"
  | "reminderSequenceName"
  | "netTerms"
  | "offlinePaymentMethod"
  | "dunningStatus"
  | "lastPaymentAttemptDate"
  | "cardExpiryDate"
  | "availableBalance"
  | "netOutstanding"
  | "overdue90PlusCount";

export const CUSTOMER_LIST_COLUMN_DEFS: Record<CustomerListColumnKey, Column> = {
  company: { key: "company", label: "Company", width: "180px", sortable: true },
  outstandingAmount: { key: "outstandingAmount", label: "Outstanding Amount", width: "130px", align: "right" },
  overdueAmount: { key: "overdueAmount", label: "Overdue Amount", width: "120px", align: "right" },
  openInvoiceCount: { key: "openInvoiceCount", label: "Open Invoice Count", width: "120px", align: "right" },
  autoCollection: { key: "autoCollection", label: "Auto-collection", width: "110px" },
  overdue0_30: { key: "overdue0_30", label: "0–30 Days Overdue Amount", width: "150px", align: "right" },
  overdue31_60: { key: "overdue31_60", label: "31–60 Days Overdue Amount", width: "155px", align: "right" },
  overdue61_90: { key: "overdue61_90", label: "61–90 Days Overdue Amount", width: "155px", align: "right" },
  overdue90Plus: { key: "overdue90Plus", label: "90+ Days Overdue Amount", width: "150px", align: "right" },
  collectionOwner: { key: "collectionOwner", label: "Collection Owner", width: "130px" },
  oldestOverdueDays: { key: "oldestOverdueDays", label: "Oldest Overdue Invoice (Days)", width: "170px", align: "right" },
  lastEmailSent: { key: "lastEmailSent", label: "Last Email Sent", width: "120px" },
  customerMrr: { key: "customerMrr", label: "Customer MRR", width: "110px", align: "right" },
  businessEntity: { key: "businessEntity", label: "Business Entity", width: "130px" },
  reminderSequenceStatus: { key: "reminderSequenceStatus", label: "Reminder Sequence Status", width: "160px" },
  reminderSequenceName: { key: "reminderSequenceName", label: "Reminder Sequence Name", width: "170px" },
  netTerms: { key: "netTerms", label: "Net Terms", width: "90px", align: "right" },
  offlinePaymentMethod: { key: "offlinePaymentMethod", label: "Offline Payment Method", width: "150px" },
  dunningStatus: { key: "dunningStatus", label: "Dunning Status", width: "120px" },
  lastPaymentAttemptDate: { key: "lastPaymentAttemptDate", label: "Last Payment Attempt Date", width: "160px" },
  cardExpiryDate: { key: "cardExpiryDate", label: "Card Expiry Date", width: "120px" },
  availableBalance: { key: "availableBalance", label: "Available Balance", width: "130px", align: "right" },
  netOutstanding: { key: "netOutstanding", label: "Net Outstanding", width: "120px", align: "right" },
  overdue90PlusCount: { key: "overdue90PlusCount", label: "90+ Days Overdue Count", width: "150px", align: "right" },
};

export function columnsForView(columnKeys: CustomerListColumnKey[]): Column[] {
  return columnKeys.map((key) => CUSTOMER_LIST_COLUMN_DEFS[key]);
}

export interface CustomerListRowData {
  customerId: string;
  company: string;
  outstandingAmount: number;
  overdueAmount: number;
  openInvoiceCount: number;
  autoCollection: "On" | "Off";
  overdue0_30: number;
  overdue31_60: number;
  overdue61_90: number;
  overdue90Plus: number;
  overdue90PlusCount: number;
  collectionOwner: string;
  oldestOverdueDays: number | null;
  lastEmailSent: string | null;
  customerMrr: number;
  businessEntity: string;
  reminderSequenceStatus: string | null;
  reminderSequenceName: string | null;
  netTerms: string;
  offlinePaymentMethod: string;
  dunningStatus: string | null;
  lastPaymentAttemptDate: string | null;
  cardExpiryDate: string | null;
  availableBalance: number;
  netOutstanding: number;
  hasEmail: boolean;
  hasLastEmailSent: boolean;
  hasSequenceStoppedOrExhausted: boolean;
  hasActiveReminderSequence: boolean;
  hasCurrentDueInvoice: boolean;
}

function daysPastDue(dueDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dueDate).getTime()) / 86400000));
}

function isOpenInvoice(inv: Invoice): boolean {
  return inv.status !== "Paid";
}

function isOverdueInvoice(inv: Invoice): boolean {
  return inv.status === "Overdue" || daysPastDue(inv.dueDate) > 0;
}

function bucketAmount(days: number, amount: number): {
  overdue0_30: number;
  overdue31_60: number;
  overdue61_90: number;
  overdue90Plus: number;
  overdue90PlusCount: number;
} {
  if (days <= 0) {
    return { overdue0_30: 0, overdue31_60: 0, overdue61_90: 0, overdue90Plus: 0, overdue90PlusCount: 0 };
  }
  if (days <= 30) {
    return { overdue0_30: amount, overdue31_60: 0, overdue61_90: 0, overdue90Plus: 0, overdue90PlusCount: 0 };
  }
  if (days <= 60) {
    return { overdue0_30: 0, overdue31_60: amount, overdue61_90: 0, overdue90Plus: 0, overdue90PlusCount: 0 };
  }
  if (days <= 90) {
    return { overdue0_30: 0, overdue31_60: 0, overdue61_90: amount, overdue90Plus: 0, overdue90PlusCount: 0 };
  }
  return { overdue0_30: 0, overdue31_60: 0, overdue61_90: 0, overdue90Plus: amount, overdue90PlusCount: 1 };
}

function deriveAutoCollection(customer: Customer): "On" | "Off" {
  const method = customer.paymentMethod.toLowerCase();
  if (method.includes("card") || method.includes("ach") || method.includes("auto")) {
    return "On";
  }
  return "Off";
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

function deriveSequenceReminderStatus(
  customerId: string,
  invoices: Invoice[],
): { status: string | null; stoppedOrExhausted: boolean; hasActive: boolean } {
  const openOverdue = invoices.filter((inv) => isOpenInvoice(inv) && isOverdueInvoice(inv));
  if (openOverdue.length === 0) {
    return { status: null, stoppedOrExhausted: false, hasActive: false };
  }

  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) {
    const stoppedCase = collectionCases.some(
      (c) =>
        c.customerId === customerId &&
        c.stage === "No Response" &&
        openOverdue.some((inv) => inv.id === c.invoiceId),
    );
    return {
      status: stoppedCase ? "Stopped" : null,
      stoppedOrExhausted: stoppedCase,
      hasActive: false,
    };
  }

  const hasScheduled = sequence.steps.some((s) => s.status === "scheduled");
  const allSent = sequence.steps.every((s) => s.status === "sent");
  if (hasScheduled) {
    return { status: "In Progress", stoppedOrExhausted: false, hasActive: true };
  }
  if (allSent) {
    return { status: "Exhausted", stoppedOrExhausted: true, hasActive: false };
  }
  return { status: "Stopped", stoppedOrExhausted: true, hasActive: false };
}

function deriveLastEmailSent(customerId: string): string | null {
  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) return null;
  const sent = sequence.steps
    .filter((s) => s.status === "sent")
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return sent[0] ? shortDate(sent[0].at) : null;
}

function deriveNetTerms(customer: Customer): string {
  if (customer.name.includes("Echo")) return "45";
  if (customer.region === "DE") return "30";
  return customer.poRequired ? "30" : "0";
}

function deriveOfflinePaymentMethod(customer: Customer): string {
  const method = customer.paymentMethod.toLowerCase();
  if (method.includes("wire") || method.includes("transfer")) return "Bank Transfer";
  if (method.includes("check")) return "Check";
  if (method.includes("ach")) return "ACH";
  return customer.paymentMethod || "—";
}

export function buildCustomerListRowData(
  customer: Customer,
  invoices: Invoice[],
  invoiceStatusOverrides?: Record<string, string>,
): CustomerListRowData {
  const merged = mergeInvoiceStatuses(invoices, invoiceStatusOverrides);
  const customerInvoices = merged.filter((i) => i.customerId === customer.id);
  const openInvoices = customerInvoices.filter(isOpenInvoice);
  const overdueInvoices = openInvoices.filter(isOverdueInvoice);

  let overdue0_30 = 0;
  let overdue31_60 = 0;
  let overdue61_90 = 0;
  let overdue90Plus = 0;
  let overdue90PlusCount = 0;
  let overdueAmount = 0;
  let oldestOverdueDays: number | null = null;

  for (const inv of overdueInvoices) {
    const days = daysPastDue(inv.dueDate);
    overdueAmount += inv.amount;
    if (oldestOverdueDays === null || days > oldestOverdueDays) {
      oldestOverdueDays = days;
    }
    const bucket = bucketAmount(days, inv.amount);
    overdue0_30 += bucket.overdue0_30;
    overdue31_60 += bucket.overdue31_60;
    overdue61_90 += bucket.overdue61_90;
    overdue90Plus += bucket.overdue90Plus;
    overdue90PlusCount += bucket.overdue90PlusCount;
  }

  const sequenceMeta = deriveSequenceReminderStatus(customer.id, customerInvoices);
  const profile = getCustomerArProfile(customer.id, customer.billingOwner);
  const collectionOwner =
    profile.collectionOwnerOptions.find((o) => o.id === profile.collectionOwnerId)?.name ??
    customer.billingOwner;

  const hasEmail = profile.internalContacts.some((c) => Boolean(c.email));
  const lastEmailSent = deriveLastEmailSent(customer.id);

  const hasCurrentDueInvoice = openInvoices.some((inv) => {
    const pastDue = daysPastDue(inv.dueDate);
    const dueTodayOrFuture = new Date(inv.dueDate).getTime() >= Date.now() - 86400000;
    return pastDue === 0 && inv.status !== "Overdue" && dueTodayOrFuture;
  });

  const outstandingAmount = customer.openAr > 0 ? customer.openAr : openInvoices.reduce((s, i) => s + i.amount, 0);
  const availableBalance = customer.prepaidCreditBalance;
  const netOutstanding = Math.max(0, outstandingAmount - availableBalance);

  return {
    customerId: customer.id,
    company: customer.name,
    outstandingAmount,
    overdueAmount,
    openInvoiceCount: openInvoices.length,
    autoCollection: deriveAutoCollection(customer),
    overdue0_30,
    overdue31_60,
    overdue61_90,
    overdue90Plus,
    overdue90PlusCount,
    collectionOwner,
    oldestOverdueDays,
    lastEmailSent,
    customerMrr: Math.round(customer.arr / 12),
    businessEntity: customer.chargebeeEntity,
    reminderSequenceStatus: sequenceMeta.status,
    reminderSequenceName: getEmailSequenceForCustomer(customer.id)?.name ?? null,
    netTerms: deriveNetTerms(customer),
    offlinePaymentMethod: deriveOfflinePaymentMethod(customer),
    dunningStatus: deriveDunningStatus(customer.id),
    lastPaymentAttemptDate: customer.crmLastSyncedAt ? shortDate(customer.crmLastSyncedAt) : null,
    cardExpiryDate: customer.paymentMethod.toLowerCase().includes("card") ? "09 / 2025" : null,
    availableBalance,
    netOutstanding,
    hasEmail,
    hasLastEmailSent: lastEmailSent !== null,
    hasSequenceStoppedOrExhausted: sequenceMeta.stoppedOrExhausted,
    hasActiveReminderSequence: sequenceMeta.hasActive,
    hasCurrentDueInvoice,
  };
}

export function buildCustomerListRowDataMap(
  customers: Customer[],
  invoices: Invoice[],
  invoiceStatusOverrides?: Record<string, string>,
): Map<string, CustomerListRowData> {
  const map = new Map<string, CustomerListRowData>();
  for (const customer of customers) {
    map.set(customer.id, buildCustomerListRowData(customer, invoices, invoiceStatusOverrides));
  }
  return map;
}

export function formatCustomerListCell(
  key: CustomerListColumnKey,
  row: CustomerListRowData,
): string {
  switch (key) {
    case "company":
      return row.company;
    case "outstandingAmount":
      return currency(row.outstandingAmount);
    case "overdueAmount":
      return currency(row.overdueAmount);
    case "openInvoiceCount":
      return String(row.openInvoiceCount);
    case "autoCollection":
      return row.autoCollection;
    case "overdue0_30":
      return currency(row.overdue0_30);
    case "overdue31_60":
      return currency(row.overdue31_60);
    case "overdue61_90":
      return currency(row.overdue61_90);
    case "overdue90Plus":
      return currency(row.overdue90Plus);
    case "collectionOwner":
      return row.collectionOwner;
    case "oldestOverdueDays":
      return row.oldestOverdueDays !== null ? String(row.oldestOverdueDays) : "—";
    case "lastEmailSent":
      return row.lastEmailSent ?? "—";
    case "customerMrr":
      return `${currency(row.customerMrr)} / mo`;
    case "businessEntity":
      return row.businessEntity;
    case "reminderSequenceStatus":
      return row.reminderSequenceStatus ?? "—";
    case "reminderSequenceName":
      return row.reminderSequenceName ?? "—";
    case "netTerms":
      return row.netTerms;
    case "offlinePaymentMethod":
      return row.offlinePaymentMethod;
    case "dunningStatus":
      return row.dunningStatus ?? "—";
    case "lastPaymentAttemptDate":
      return row.lastPaymentAttemptDate ?? "—";
    case "cardExpiryDate":
      return row.cardExpiryDate ?? "—";
    case "availableBalance":
      return currency(row.availableBalance);
    case "netOutstanding":
      return currency(row.netOutstanding);
    case "overdue90PlusCount":
      return String(row.overdue90PlusCount);
  }
}

export function cellClassName(key: CustomerListColumnKey, row: CustomerListRowData): string {
  if (key === "company") return "font-medium text-text-primary";
  if (key === "outstandingAmount" || key === "overdueAmount" || key === "overdue90Plus") {
    const amount =
      key === "outstandingAmount"
        ? row.outstandingAmount
        : key === "overdueAmount"
          ? row.overdueAmount
          : row.overdue90Plus;
    return amount > 0 ? "tabular-nums text-red-600 font-medium" : "tabular-nums";
  }
  if (
    key === "overdue0_30" ||
    key === "overdue31_60" ||
    key === "overdue61_90" ||
    key === "netOutstanding" ||
    key === "availableBalance" ||
    key === "customerMrr" ||
    key === "openInvoiceCount" ||
    key === "oldestOverdueDays" ||
    key === "overdue90PlusCount"
  ) {
    return "tabular-nums";
  }
  return "text-text-secondary";
}
