import type { FilterTag } from "@/components/index-page/FilterBar";
import type { Customer } from "@/data/mock-data";
import {
  type CustomerListColumnKey,
  type CustomerListRowData,
  buildCustomerListRowDataMap,
} from "@/data/customer-list-columns";

export type CustomerListViewId =
  | "all-outstanding"
  | "overdue"
  | "ninety-plus-days-overdue"
  | "never-contacted"
  | "sequence-inactive-exhausted"
  | "missing-email"
  | "no-active-sequence"
  | "auto-collection-on"
  | "auto-collection-off"
  | "current-due"
  | "with-available-balance";

export interface CustomerListViewDefaultFilter {
  field: string;
  operator: string;
  value: string;
}

export interface CustomerListView {
  id: CustomerListViewId;
  label: string;
  /** Reference filter logic from product spec (display / docs). */
  filterLogic: string;
  columns: CustomerListColumnKey[];
  defaultFilters: CustomerListViewDefaultFilter[];
}

export const CUSTOMER_LIST_VIEWS: CustomerListView[] = [
  {
    id: "all-outstanding",
    label: "All Outstanding",
    filterLogic: "customer.outstanding_amount > 0",
    columns: [
      "company",
      "outstandingAmount",
      "overdueAmount",
      "openInvoiceCount",
      "autoCollection",
      "overdue0_30",
      "overdue31_60",
      "overdue61_90",
      "overdue90Plus",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Outstanding Amount", operator: "is greater than", value: "0" }],
  },
  {
    id: "overdue",
    label: "Overdue",
    filterLogic: "customer.overdue_amount > 0",
    columns: [
      "company",
      "overdueAmount",
      "outstandingAmount",
      "oldestOverdueDays",
      "autoCollection",
      "overdue0_30",
      "overdue90Plus",
      "lastEmailSent",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Overdue Amount", operator: "is greater than", value: "0" }],
  },
  {
    id: "ninety-plus-days-overdue",
    label: "90+ Days Overdue",
    filterLogic: "customer.90_plus_days_overdue_amount > 0",
    columns: [
      "company",
      "overdue90Plus",
      "overdue90PlusCount",
      "overdue61_90",
      "overdueAmount",
      "oldestOverdueDays",
      "customerMrr",
      "lastEmailSent",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Overdue Amount", operator: "is greater than", value: "0" }],
  },
  {
    id: "never-contacted",
    label: "Never Contacted",
    filterLogic:
      "customer.overdue_amount > 0 AND customer.last_email_sent IS NULL AND customer.dunning_status NOT IN ('In Progress', 'Success')",
    columns: [
      "company",
      "overdueAmount",
      "outstandingAmount",
      "oldestOverdueDays",
      "overdue0_30",
      "overdue90Plus",
      "autoCollection",
      "collectionOwner",
    ],
    defaultFilters: [
      { field: "Overdue Amount", operator: "is greater than", value: "0" },
    ],
  },
  {
    id: "sequence-inactive-exhausted",
    label: "Sequence Inactive / Exhausted",
    filterLogic:
      "customer.auto_collection = 'Off' AND customer has >= 1 invoice where invoice.sequence_reminder_status IN ('Stopped', 'Exhausted')",
    columns: [
      "company",
      "overdueAmount",
      "outstandingAmount",
      "oldestOverdueDays",
      "overdue90Plus",
      "reminderSequenceStatus",
      "reminderSequenceName",
      "lastEmailSent",
      "collectionOwner",
    ],
    defaultFilters: [
      { field: "Auto-collection", operator: "is", value: "Off" },
      {
        field: "Reminder Sequence Status",
        operator: "is any of",
        value: "Stopped, Exhausted",
      },
    ],
  },
  {
    id: "missing-email",
    label: "Missing Email",
    filterLogic: "customer.email IS NULL",
    columns: [
      "company",
      "businessEntity",
      "outstandingAmount",
      "overdueAmount",
      "oldestOverdueDays",
      "overdue90Plus",
      "autoCollection",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Email", operator: "is empty", value: "" }],
  },
  {
    id: "no-active-sequence",
    label: "No Active Sequence / Sequence Stopped",
    filterLogic:
      "customer.auto_collection = 'Off' AND customer.overdue_amount > 0 AND customer has no invoice with active sequence",
    columns: [
      "company",
      "overdueAmount",
      "outstandingAmount",
      "oldestOverdueDays",
      "netTerms",
      "overdue0_30",
      "overdue90Plus",
      "reminderSequenceStatus",
      "lastEmailSent",
      "collectionOwner",
    ],
    defaultFilters: [
      { field: "Auto-collection", operator: "is", value: "Off" },
      { field: "Overdue Amount", operator: "is greater than", value: "0" },
    ],
  },
  {
    id: "auto-collection-on",
    label: "Auto-collection ON",
    filterLogic: "customer.auto_collection = 'On'",
    columns: [
      "company",
      "customerMrr",
      "outstandingAmount",
      "overdueAmount",
      "overdue0_30",
      "overdue90Plus",
      "dunningStatus",
      "lastPaymentAttemptDate",
      "cardExpiryDate",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Auto-collection", operator: "is", value: "On" }],
  },
  {
    id: "auto-collection-off",
    label: "Auto-collection OFF",
    filterLogic: "customer.auto_collection = 'Off'",
    columns: [
      "company",
      "outstandingAmount",
      "overdueAmount",
      "overdue0_30",
      "overdue90Plus",
      "netTerms",
      "offlinePaymentMethod",
      "reminderSequenceStatus",
      "lastEmailSent",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Auto-collection", operator: "is", value: "Off" }],
  },
  {
    id: "current-due",
    label: "Current Due",
    filterLogic:
      "customer has >= 1 invoice where invoice.status = 'payment_due' AND invoice.due_date >= today",
    columns: [
      "company",
      "outstandingAmount",
      "overdueAmount",
      "netTerms",
      "autoCollection",
      "customerMrr",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Outstanding Amount", operator: "is greater than", value: "0" }],
  },
  {
    id: "with-available-balance",
    label: "With Available Balance",
    filterLogic: "customer.available_balance > 0",
    columns: [
      "company",
      "availableBalance",
      "netOutstanding",
      "outstandingAmount",
      "overdueAmount",
      "overdue0_30",
      "overdue90Plus",
      "customerMrr",
      "collectionOwner",
    ],
    defaultFilters: [{ field: "Available Balance", operator: "is greater than", value: "0" }],
  },
];

export const DEFAULT_CUSTOMER_LIST_VIEW_ID: CustomerListViewId = "all-outstanding";

const VIEW_BY_ID = new Map(CUSTOMER_LIST_VIEWS.map((view) => [view.id, view]));

export function getCustomerListView(viewId: CustomerListViewId): CustomerListView {
  return VIEW_BY_ID.get(viewId) ?? CUSTOMER_LIST_VIEWS[0];
}

export function defaultFilterTagsForView(viewId: CustomerListViewId): FilterTag[] {
  const view = getCustomerListView(viewId);
  return view.defaultFilters.map((filter, index) => ({
    id: `view-${viewId}-${index}`,
    field: filter.field,
    operator: filter.operator,
    value: filter.value,
  }));
}

export function matchesCustomerListView(row: CustomerListRowData, viewId: CustomerListViewId): boolean {
  switch (viewId) {
    case "all-outstanding":
      return row.outstandingAmount > 0;
    case "overdue":
      return row.overdueAmount > 0;
    case "ninety-plus-days-overdue":
      return row.overdue90Plus > 0;
    case "never-contacted":
      return (
        row.overdueAmount > 0 &&
        !row.hasLastEmailSent &&
        row.dunningStatus !== "In Progress" &&
        row.dunningStatus !== "Success"
      );
    case "sequence-inactive-exhausted":
      return row.autoCollection === "Off" && row.hasSequenceStoppedOrExhausted;
    case "missing-email":
      return !row.hasEmail;
    case "no-active-sequence":
      return (
        row.autoCollection === "Off" &&
        row.overdueAmount > 0 &&
        !row.hasActiveReminderSequence
      );
    case "auto-collection-on":
      return row.autoCollection === "On";
    case "auto-collection-off":
      return row.autoCollection === "Off";
    case "current-due":
      return row.hasCurrentDueInvoice;
    case "with-available-balance":
      return row.availableBalance > 0;
  }
}

export function filterCustomersByView(
  customers: Customer[],
  viewId: CustomerListViewId,
  rowMap: Map<string, CustomerListRowData>,
): Customer[] {
  return customers.filter((customer) => {
    const row = rowMap.get(customer.id);
    if (!row) return false;
    return matchesCustomerListView(row, viewId);
  });
}

export function countCustomersByView(
  customers: Customer[],
  rowMap: Map<string, CustomerListRowData>,
): Record<CustomerListViewId, number> {
  return CUSTOMER_LIST_VIEWS.reduce(
    (acc, view) => {
      acc[view.id] = filterCustomersByView(customers, view.id, rowMap).length;
      return acc;
    },
    {} as Record<CustomerListViewId, number>,
  );
}

export { buildCustomerListRowDataMap };
