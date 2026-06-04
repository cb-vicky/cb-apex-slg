import type { Invoice } from "@/data/mock-data";
import { collectionCases, getPaymentsForCustomer, type Payment } from "@/data/billing-data";
import { getEmailSequenceForCustomer } from "@/data/collections-email-sequence";

export type InvoiceListViewId =
  | "all-outstanding"
  | "overdue"
  | "offline-dunning-in-progress"
  | "offline-dunning-stopped"
  | "online-dunning-in-progress"
  | "online-dunning-stopped"
  | "partially-paid"
  | "longest-overdue"
  | "current-due"
  | "aged-0-30"
  | "aged-31-60"
  | "aged-61-90"
  | "aged-90-plus";

export interface InvoiceListView {
  id: InvoiceListViewId;
  label: string;
  primary?: boolean;
}

export const INVOICE_LIST_VIEWS: InvoiceListView[] = [
  { id: "all-outstanding", label: "All Outstanding", primary: true },
  { id: "overdue", label: "Overdue", primary: true },
  { id: "offline-dunning-in-progress", label: "Offline Dunning in Progress" },
  { id: "offline-dunning-stopped", label: "Offline Dunning Stopped/Exhausted" },
  { id: "online-dunning-in-progress", label: "Online Dunning in Progress" },
  { id: "online-dunning-stopped", label: "Online Dunning Stopped/Exhausted" },
  { id: "partially-paid", label: "Partially Paid" },
  { id: "longest-overdue", label: "Longest Overdue" },
  { id: "current-due", label: "Current Due" },
  { id: "aged-0-30", label: "Aged 0–30 days" },
  { id: "aged-31-60", label: "Aged 31–60 days" },
  { id: "aged-61-90", label: "Aged 61–90 days" },
  { id: "aged-90-plus", label: "Aged 90+ days" },
];

export const PRIMARY_INVOICE_LIST_VIEW_IDS = INVOICE_LIST_VIEWS.filter((v) => v.primary).map(
  (v) => v.id,
);

export const SECONDARY_INVOICE_LIST_VIEWS = INVOICE_LIST_VIEWS.filter((v) => !v.primary);

export const DEFAULT_INVOICE_LIST_VIEW_ID: InvoiceListViewId = "all-outstanding";

export interface InvoiceViewContext {
  isOpen: boolean;
  isOverdue: boolean;
  daysPastDue: number;
  daysUntilDue: number;
  hasPartialPayment: boolean;
  offlineDunning: "in-progress" | "stopped" | null;
  onlineDunning: "in-progress" | "stopped" | null;
}

function isOpenInvoice(inv: Invoice): boolean {
  return inv.status !== "Paid";
}

function daysPastDue(dueDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dueDate).getTime()) / 86400000));
}

function daysUntilDue(dueDate: string): number {
  return Math.round((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function invoiceHasPartialPayment(invoiceId: string, payments: Payment[]): boolean {
  return payments.some(
    (p) =>
      p.matchStatus === "partial" &&
      p.allocations.some((a) => a.invoiceId === invoiceId && a.amount > 0),
  );
}

function deriveOfflineDunning(
  invoice: Invoice,
): InvoiceViewContext["offlineDunning"] {
  const collectionCase = collectionCases.find((c) => c.invoiceId === invoice.id);
  if (!collectionCase || collectionCase.stage === "Resolved") return null;
  if (collectionCase.stage === "No Response" || collectionCase.escalated) {
    return "stopped";
  }
  return "in-progress";
}

function deriveOnlineDunning(customerId: string, invoice: Invoice): InvoiceViewContext["onlineDunning"] {
  if (!isOpenInvoice(invoice)) return null;
  const pastDue = daysPastDue(invoice.dueDate) > 0 || invoice.status === "Overdue";
  if (!pastDue) return null;

  const sequence = getEmailSequenceForCustomer(customerId);
  if (!sequence) return null;

  const hasScheduled = sequence.steps.some((s) => s.status === "scheduled");
  if (hasScheduled) return "in-progress";
  return "stopped";
}

export function buildInvoiceViewContext(
  invoice: Invoice,
  paymentsByCustomer: Map<string, Payment[]>,
): InvoiceViewContext {
  const payments = paymentsByCustomer.get(invoice.customerId) ?? [];
  const pastDue = daysPastDue(invoice.dueDate);
  const isOverdue = invoice.status === "Overdue" || pastDue > 0;

  return {
    isOpen: isOpenInvoice(invoice),
    isOverdue,
    daysPastDue: pastDue,
    daysUntilDue: daysUntilDue(invoice.dueDate),
    hasPartialPayment: invoiceHasPartialPayment(invoice.id, payments),
    offlineDunning: deriveOfflineDunning(invoice),
    onlineDunning: deriveOnlineDunning(invoice.customerId, invoice),
  };
}

export function buildInvoiceViewContextMap(
  invoices: Invoice[],
): Map<string, InvoiceViewContext> {
  const paymentsByCustomer = new Map<string, Payment[]>();
  for (const invoice of invoices) {
    if (!paymentsByCustomer.has(invoice.customerId)) {
      paymentsByCustomer.set(invoice.customerId, getPaymentsForCustomer(invoice.customerId));
    }
  }

  const map = new Map<string, InvoiceViewContext>();
  for (const invoice of invoices) {
    map.set(invoice.id, buildInvoiceViewContext(invoice, paymentsByCustomer));
  }
  return map;
}

export function matchesInvoiceListView(
  ctx: InvoiceViewContext,
  viewId: InvoiceListViewId,
): boolean {
  switch (viewId) {
    case "all-outstanding":
      return ctx.isOpen;
    case "overdue":
      return ctx.isOverdue;
    case "offline-dunning-in-progress":
      return ctx.offlineDunning === "in-progress";
    case "offline-dunning-stopped":
      return ctx.offlineDunning === "stopped";
    case "online-dunning-in-progress":
      return ctx.onlineDunning === "in-progress";
    case "online-dunning-stopped":
      return ctx.onlineDunning === "stopped";
    case "partially-paid":
      return ctx.hasPartialPayment;
    case "longest-overdue":
      return ctx.isOverdue && ctx.daysPastDue >= 30;
    case "current-due":
      return ctx.isOpen && !ctx.isOverdue && ctx.daysUntilDue >= 0;
    case "aged-0-30":
      return ctx.isOverdue && ctx.daysPastDue >= 1 && ctx.daysPastDue <= 30;
    case "aged-31-60":
      return ctx.isOverdue && ctx.daysPastDue >= 31 && ctx.daysPastDue <= 60;
    case "aged-61-90":
      return ctx.isOverdue && ctx.daysPastDue >= 61 && ctx.daysPastDue <= 90;
    case "aged-90-plus":
      return ctx.isOverdue && ctx.daysPastDue >= 90;
  }
}

export function filterInvoicesByView(
  invoices: Invoice[],
  viewId: InvoiceListViewId,
  contextMap: Map<string, InvoiceViewContext>,
): Invoice[] {
  return invoices.filter((inv) => {
    const ctx = contextMap.get(inv.id);
    if (!ctx) return false;
    return matchesInvoiceListView(ctx, viewId);
  });
}

export function countInvoicesByView(
  invoices: Invoice[],
  contextMap: Map<string, InvoiceViewContext>,
): Record<InvoiceListViewId, number> {
  return INVOICE_LIST_VIEWS.reduce(
    (acc, view) => {
      acc[view.id] = filterInvoicesByView(invoices, view.id, contextMap).length;
      return acc;
    },
    {} as Record<InvoiceListViewId, number>,
  );
}
