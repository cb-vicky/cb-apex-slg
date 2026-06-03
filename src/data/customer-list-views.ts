import type { Customer, Invoice } from "@/data/mock-data";
import { collectionCases } from "@/data/billing-data";
import { getCustomerArProfile } from "@/data/collections-ar-profile";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";

export type CustomerListViewId =
  | "all-outstanding"
  | "overdue"
  | "high-value-disputes"
  | "without-billing-email"
  | "current-due"
  | "aged-0-30"
  | "aged-31-60"
  | "aged-61-90"
  | "aged-90-plus"
  | "less-likely-to-pay";

export interface CustomerListView {
  id: CustomerListViewId;
  label: string;
}

export const CUSTOMER_LIST_VIEWS: CustomerListView[] = [
  { id: "all-outstanding", label: "All Outstanding" },
  { id: "overdue", label: "Overdue" },
  { id: "high-value-disputes", label: "High value disputes" },
  { id: "without-billing-email", label: "Without billing email" },
  { id: "current-due", label: "Current Due" },
  { id: "aged-0-30", label: "Aged 0–30 days" },
  { id: "aged-31-60", label: "Aged 31–60 days" },
  { id: "aged-61-90", label: "Aged 61–90 days" },
  { id: "aged-90-plus", label: "Aged 90+ days" },
  { id: "less-likely-to-pay", label: "Less likely to pay" },
];

export const DEFAULT_CUSTOMER_LIST_VIEW_ID: CustomerListViewId = "all-outstanding";

export interface CustomerArViewContext {
  hasOutstanding: boolean;
  hasOverdue: boolean;
  maxDaysOverdue: number;
  hasCurrentDue: boolean;
  hasHighValueDispute: boolean;
  missingBillingEmail: boolean;
  lessLikelyToPay: boolean;
}

function isOpenInvoice(inv: Invoice): boolean {
  return inv.status !== "Paid";
}

function daysPastDue(dueDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dueDate).getTime()) / 86400000));
}

function hasBillingEmailOnFile(customer: Customer): boolean {
  const profile = getCustomerArProfile(customer.id, customer.billingOwner);
  return profile.internalContacts.some(
    (c) =>
      c.roleLabel.toLowerCase().includes("billing") ||
      c.email.toLowerCase().includes("billing") ||
      c.email.toLowerCase().startsWith("ap@"),
  );
}

export function buildCustomerArViewContext(
  customer: Customer,
  invoices: Invoice[],
): CustomerArViewContext {
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const openInvoices = customerInvoices.filter(isOpenInvoice);

  const overdueInvoices = openInvoices.filter(
    (inv) => inv.status === "Overdue" || daysPastDue(inv.dueDate) > 0,
  );
  const maxDaysOverdue =
    overdueInvoices.length > 0
      ? Math.max(...overdueInvoices.map((inv) => daysPastDue(inv.dueDate)))
      : 0;

  const cases = collectionCases.filter((c) => c.customerId === customer.id);
  const hasDispute =
    cases.some((c) => Boolean(c.disputeReason)) ||
    openInvoices.some((inv) => Boolean(inv.disputeReason));

  const hasOutstanding = customer.openAr > 0 || openInvoices.length > 0;
  const hasHighValueDispute = hasDispute && customer.openAr >= 10000;

  const hasCurrentDue = openInvoices.some((inv) => {
    const pastDue = daysPastDue(inv.dueDate);
    return pastDue === 0 && inv.status !== "Overdue";
  });

  const lessLikelyToPay = cases.some(
    (c) =>
      c.stage === "No Response" ||
      (c.daysOverdue >= 14 && !c.ptpDate && c.stage !== "Resolved"),
  );

  return {
    hasOutstanding,
    hasOverdue: overdueInvoices.length > 0,
    maxDaysOverdue,
    hasCurrentDue,
    hasHighValueDispute,
    missingBillingEmail: !hasBillingEmailOnFile(customer),
    lessLikelyToPay,
  };
}

export function buildCustomerArViewContextMap(
  customers: Customer[],
  invoices: Invoice[],
  invoiceStatusOverrides?: Record<string, string>,
): Map<string, CustomerArViewContext> {
  const merged = mergeInvoiceStatuses(invoices, invoiceStatusOverrides);
  const map = new Map<string, CustomerArViewContext>();
  for (const customer of customers) {
    map.set(customer.id, buildCustomerArViewContext(customer, merged));
  }
  return map;
}

export function matchesCustomerListView(
  ctx: CustomerArViewContext,
  viewId: CustomerListViewId,
): boolean {
  switch (viewId) {
    case "all-outstanding":
      return ctx.hasOutstanding;
    case "overdue":
      return ctx.hasOverdue;
    case "high-value-disputes":
      return ctx.hasHighValueDispute;
    case "without-billing-email":
      return ctx.hasOutstanding && ctx.missingBillingEmail;
    case "current-due":
      return ctx.hasCurrentDue;
    case "aged-0-30":
      return ctx.maxDaysOverdue >= 1 && ctx.maxDaysOverdue <= 30;
    case "aged-31-60":
      return ctx.maxDaysOverdue >= 31 && ctx.maxDaysOverdue <= 60;
    case "aged-61-90":
      return ctx.maxDaysOverdue >= 61 && ctx.maxDaysOverdue <= 90;
    case "aged-90-plus":
      return ctx.maxDaysOverdue >= 90;
    case "less-likely-to-pay":
      return ctx.lessLikelyToPay;
  }
}

export function filterCustomersByView(
  customers: Customer[],
  viewId: CustomerListViewId,
  contextMap: Map<string, CustomerArViewContext>,
): Customer[] {
  return customers.filter((c) => {
    const ctx = contextMap.get(c.id);
    if (!ctx) return false;
    return matchesCustomerListView(ctx, viewId);
  });
}

export function countCustomersByView(
  customers: Customer[],
  contextMap: Map<string, CustomerArViewContext>,
): Record<CustomerListViewId, number> {
  return CUSTOMER_LIST_VIEWS.reduce(
    (acc, view) => {
      acc[view.id] = filterCustomersByView(customers, view.id, contextMap).length;
      return acc;
    },
    {} as Record<CustomerListViewId, number>,
  );
}
