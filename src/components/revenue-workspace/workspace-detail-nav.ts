import type { Contract, Customer, Quote } from "@/data/mock-data";
import { getCustomerExternalLinkedRecords } from "./derive-stage-data";
import { getTasks } from "@/data/mock-data";
import { getRevenueArrangement } from "@/data/revrec-data";
import type { Stage } from "./stage";

export interface DetailNavItem {
  id: string;
  label: string;
}

export interface DetailNavContext {
  stage: Stage;
  customer: Customer;
  quote: Quote | null;
  contract: Contract | null;
  quotes: Quote[];
  contracts: Contract[];
}

export function getDetailNavItems(ctx: DetailNavContext): DetailNavItem[] {
  switch (ctx.stage) {
    case "customer":
      return getCustomerNavItems(ctx);
    case "quote":
      return getQuoteNavItems();
    case "contract":
      return getContractNavItems(ctx.contract);
    case "invoicing":
      return getInvoicingNavItems();
    case "payment":
      return getPaymentNavItems();
    case "revrec":
      return getRevRecNavItems(ctx.contract);
    default:
      return [];
  }
}

function getCustomerNavItems(ctx: DetailNavContext): DetailNavItem[] {
  const linked = getCustomerExternalLinkedRecords(ctx.customer, ctx.quotes, ctx.contracts);
  const openTasks = getTasks(ctx.customer.id).filter((t) => t.status === "Open");

  const items: DetailNavItem[] = [
    { id: "ws-section-customer-nba", label: "Next action" },
    { id: "ws-section-customer-metrics", label: "Commercial snapshot" },
  ];
  if (linked.length > 0) {
    items.push({ id: "ws-section-customer-linked", label: "Linked records" });
  }
  items.push(
    { id: "ws-section-customer-account", label: "Account details" },
  );
  if (openTasks.length > 0) {
    items.push({ id: "ws-section-customer-open-tasks", label: "Open tasks" });
  }
  items.push(
    { id: "ws-section-customer-insights", label: "AI insights" },
    { id: "ws-section-customer-support", label: "Support & comms" },
    { id: "ws-section-customer-lifecycle", label: "Lifecycle" },
    { id: "ws-section-customer-activity", label: "Recent activity" },
  );
  return items;
}

function getQuoteNavItems(): DetailNavItem[] {
  return [
    { id: "ws-section-quote-overview", label: "Overview" },
    { id: "ws-section-quote-approvals", label: "Approvals" },
    { id: "ws-section-quote-pricing", label: "Pricing" },
    { id: "ws-section-quote-terms", label: "Commercial terms" },
    { id: "ws-section-quote-crm", label: "CRM" },
    { id: "ws-section-quote-related", label: "Related records" },
    { id: "ws-section-quote-timeline", label: "Recent activity" },
  ];
}

function getContractNavItems(contract: Contract | null): DetailNavItem[] {
  if (!contract) return [];

  const items: DetailNavItem[] = [
    { id: "ws-section-contract-overview", label: "Overview" },
  ];
  if (contract.closure) {
    items.push({ id: "ws-section-contract-closure", label: "Closure" });
  }
  items.push(
    { id: "ws-section-contract-terms", label: "Commercial terms" },
    { id: "ws-section-contract-enforcement", label: "Enforcement" },
    { id: "ws-section-contract-billing", label: "Billing schedule" },
    { id: "ws-section-contract-amendments", label: "Amendments" },
    { id: "ws-section-contract-finance", label: "Finance impact" },
  );
  if (contract.comparisonToQuote.length > 0) {
    items.push({ id: "ws-section-contract-differences", label: "Quote differences" });
  }
  items.push(
    { id: "ws-section-contract-documents", label: "Documents" },
    { id: "ws-section-contract-timeline", label: "Recent activity" },
  );
  return items;
}

function getInvoicingNavItems(): DetailNavItem[] {
  return [
    { id: "ws-section-invoice-overview", label: "Overview" },
    { id: "ws-section-invoice-composition", label: "Line items" },
    { id: "ws-section-invoice-billing-basis", label: "Billing basis" },
    { id: "ws-section-invoice-delivery", label: "Delivery" },
    { id: "ws-section-invoice-schedule", label: "Schedule" },
  ];
}

function getPaymentNavItems(): DetailNavItem[] {
  return [
    { id: "ws-section-payment-ar", label: "AR overview" },
    { id: "ws-section-payment-receivables", label: "Open receivables" },
    { id: "ws-section-payment-collections", label: "Collections" },
    { id: "ws-section-payment-cash", label: "Cash application" },
  ];
}

function getRevRecNavItems(contract: Contract | null): DetailNavItem[] {
  if (!contract || !getRevenueArrangement(contract.id)) return [];

  return [
    { id: "ws-section-revrec-overview", label: "Overview" },
    { id: "ws-section-revrec-obligations", label: "Obligations" },
    { id: "ws-section-revrec-schedule", label: "Recognition schedule" },
    { id: "ws-section-revrec-close", label: "Close readiness" },
  ];
}
