import type { Invoice } from "@/data/mock-data";
import type { InvoiceListRowData } from "@/data/invoice-list-columns";
import type { FilterPropertyDef } from "@/data/filter-properties";
import { operatorRequiresValue } from "@/data/filter-properties";

export type { FilterPropertyDef as InvoiceFilterPropertyDef };

export const INVOICE_FILTER_PROPERTIES: FilterPropertyDef[] = [
  {
    name: "Invoice",
    sampleValues: '"INV-2025-0258", "INV-2026-0041"',
    operators: ["is", "is not", "contains", "does not contain", "is empty", "is not empty"],
    valueOptions: ["INV-2025-0258", "INV-2026-0041"],
  },
  {
    name: "Customer",
    sampleValues: '"Echo Corp", "Northlane Labs"',
    operators: ["is", "is not", "contains", "does not contain", "is empty", "is not empty"],
    valueOptions: ["Echo Corp", "Northlane Labs", "Lumina AI"],
  },
  {
    name: "Status",
    sampleValues: '"Overdue", "Payment Due", "Paid"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Overdue", "Payment Due", "Paid", "Pending Review", "Pending Approval", "Draft"],
  },
  {
    name: "Amount",
    sampleValues: '"$4,200.00", "$12,800.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$4,200.00", "$12,800.00"],
  },
  {
    name: "Outstanding Amount",
    sampleValues: '"$3,200.00", "$0.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$3,200.00", "$0.00"],
  },
  {
    name: "Due Date",
    sampleValues: '"Mar 15, 2026", "Apr 1, 2026"',
    operators: ["is", "is before", "is after", "is between"],
    valueOptions: ["Mar 15, 2026", "Apr 1, 2026"],
  },
  {
    name: "Days Past Due",
    sampleValues: '"0", "30", "90"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["0", "30", "90"],
  },
  {
    name: "Dunning Status",
    sampleValues: '"In Progress", "Stopped", "Success"',
    operators: ["is any of", "is none of"],
    valueOptions: ["In Progress", "Stopped", "Success"],
  },
  {
    name: "Reminder Sequence Status",
    sampleValues: '"In Progress", "Stopped", "Exhausted"',
    operators: ["is any of", "is none of"],
    valueOptions: ["In Progress", "Stopped", "Exhausted"],
  },
  {
    name: "Offline Dunning",
    sampleValues: '"In Progress", "Stopped"',
    operators: ["is any of", "is none of"],
    valueOptions: ["In Progress", "Stopped"],
  },
  {
    name: "Online Dunning",
    sampleValues: '"In Progress", "Stopped"',
    operators: ["is any of", "is none of"],
    valueOptions: ["In Progress", "Stopped"],
  },
  {
    name: "Partial Payment",
    sampleValues: '"Yes", "No"',
    operators: ["is"],
    valueOptions: ["Yes", "No"],
  },
  {
    name: "Collection Owner",
    sampleValues: '"Sarah Chen", "Mike Ross"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Sarah Chen", "Mike Ross", "Alex Kim"],
  },
  {
    name: "Contract",
    sampleValues: '"CON-2024-0189"',
    operators: ["is", "is not", "contains", "is empty", "is not empty"],
    valueOptions: ["CON-2024-0189"],
  },
];

const PROPERTY_BY_NAME = new Map(
  INVOICE_FILTER_PROPERTIES.map((property) => [property.name, property]),
);

export function getInvoiceFilterProperty(name: string): FilterPropertyDef | undefined {
  return PROPERTY_BY_NAME.get(name);
}

function parseAmount(value: string): number | null {
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function textMatch(haystack: string, needle: string, operator: string): boolean | null {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  switch (operator) {
    case "is":
      return h === n;
    case "is not":
      return h !== n;
    case "contains":
      return h.includes(n);
    case "does not contain":
      return !h.includes(n);
    case "is empty":
      return h.length === 0;
    case "is not empty":
      return h.length > 0;
    default:
      return null;
  }
}

function amountMatch(actual: number, filterValue: string, operator: string): boolean | null {
  const expected = parseAmount(filterValue);
  if (expected === null) return null;
  switch (operator) {
    case "equals":
      return actual === expected;
    case "is greater than":
      return actual > expected;
    case "is less than":
      return actual < expected;
    default:
      return null;
  }
}

function numberMatch(actual: number, filterValue: string, operator: string): boolean | null {
  const expected = Number.parseInt(filterValue, 10);
  if (!Number.isFinite(expected)) return null;
  switch (operator) {
    case "equals":
      return actual === expected;
    case "is greater than":
      return actual > expected;
    case "is less than":
      return actual < expected;
    default:
      return null;
  }
}

function dunningLabel(value: "in-progress" | "stopped" | null): string {
  if (value === "in-progress") return "In Progress";
  if (value === "stopped") return "Stopped";
  return "";
}

/** Best-effort evaluation for invoice list filters (prototype). */
export function matchesInvoicePropertyFilter(
  invoice: Invoice,
  filter: { field: string; operator?: string; value: string },
  row?: InvoiceListRowData,
): boolean {
  const operator = filter.operator ?? "is";
  const value = filter.value.trim();

  if (!row) return true;

  if (!operatorRequiresValue(operator)) {
    const fieldValue = invoiceFieldValue(invoice, filter.field, row);
    if (fieldValue === null) return true;
    return textMatch(fieldValue, "", operator) ?? true;
  }

  if (!value) return true;

  if (operator === "is any of") {
    const options = value.split(",").map((v) => v.trim().toLowerCase());
    const fieldValue = invoiceFieldValue(invoice, filter.field, row);
    if (fieldValue === null) return true;
    return options.includes(fieldValue.toLowerCase());
  }
  if (operator === "is none of") {
    const options = value.split(",").map((v) => v.trim().toLowerCase());
    const fieldValue = invoiceFieldValue(invoice, filter.field, row);
    if (fieldValue === null) return true;
    return !options.includes(fieldValue.toLowerCase());
  }

  const fieldValue = invoiceFieldValue(invoice, filter.field, row);
  if (fieldValue === null) return true;

  const textResult = textMatch(fieldValue, value, operator);
  if (textResult !== null) return textResult;

  if (filter.field === "Days Past Due") {
    const numberResult = numberMatch(row.daysPastDue, value, operator);
    if (numberResult !== null) return numberResult;
  }

  const numericField = invoiceNumericField(invoice, filter.field, row);
  if (numericField !== null) {
    const amountResult = amountMatch(numericField, value, operator);
    if (amountResult !== null) return amountResult;
  }

  return true;
}

function invoiceFieldValue(
  invoice: Invoice,
  property: string,
  row: InvoiceListRowData,
): string | null {
  switch (property) {
    case "Invoice":
      return invoice.id;
    case "Customer":
      return row.customer;
    case "Status":
      return invoice.status;
    case "Due Date":
      return row.dueDate;
    case "Dunning Status":
      return row.dunningStatus ?? "";
    case "Reminder Sequence Status":
      return row.reminderSequenceStatus ?? "";
    case "Offline Dunning":
      return dunningLabel(row.offlineDunning);
    case "Online Dunning":
      return dunningLabel(row.onlineDunning);
    case "Partial Payment":
      return row.hasPartialPayment ? "Yes" : "No";
    case "Collection Owner":
      return row.collectionOwner;
    case "Contract":
      return invoice.contractId;
    default:
      return null;
  }
}

function invoiceNumericField(
  invoice: Invoice,
  property: string,
  row: InvoiceListRowData,
): number | null {
  switch (property) {
    case "Amount":
      return invoice.amount;
    case "Outstanding Amount":
      return row.outstandingAmount;
    case "Days Past Due":
      return row.daysPastDue;
    default:
      return null;
  }
}
