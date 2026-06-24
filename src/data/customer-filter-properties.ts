import type { Customer } from "@/data/mock-data";
import type { CustomerListRowData } from "@/data/customer-list-columns";
import {
  operatorRequiresValue,
  type FilterPropertyDef,
} from "@/data/filter-properties";

export type CustomerFilterPropertyDef = FilterPropertyDef;

export const CUSTOMER_FILTER_PROPERTIES: CustomerFilterPropertyDef[] = [
  {
    name: "Customer",
    sampleValues: '"Freshworks", "RetailBuddy"',
    operators: ["is", "is not", "contains", "does not contain", "is empty", "is not empty"],
    valueOptions: ["Freshworks", "RetailBuddy"],
  },
  {
    name: "Email",
    sampleValues: '"john@freshworks.com"',
    operators: ["is", "is not", "contains", "does not contain", "is empty", "is not empty"],
    valueOptions: ["john@freshworks.com"],
  },
  {
    name: "Country",
    sampleValues: '"US", "DE", "IN"',
    operators: ["is any of", "is none of"],
    valueOptions: ["US", "DE", "IN"],
  },
  {
    name: "Language",
    sampleValues: '"en-US", "fr-FR"',
    operators: ["is any of", "is none of"],
    valueOptions: ["en-US", "fr-FR"],
  },
  {
    name: "Currency",
    sampleValues: '"USD", "EUR", "GBP"',
    operators: ["is any of", "is none of"],
    valueOptions: ["USD", "EUR", "GBP"],
  },
  {
    name: "Business Entity",
    sampleValues: '"Chargebee US", "BE_001"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Chargebee US", "BE_001"],
  },
  {
    name: "Customer Since",
    sampleValues: '"Jan 15, 2022"',
    operators: ["is", "is before", "is after", "is between", "within last N days"],
    valueOptions: ["Jan 15, 2022"],
  },
  {
    name: "Customer MRR",
    sampleValues: '"$2,500 / mo", "$850 / mo"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$2,500 / mo", "$850 / mo"],
  },
  {
    name: "Net Terms",
    sampleValues: '"0", "30", "60"',
    operators: ["is any of", "is none of"],
    valueOptions: ["0", "30", "60"],
  },
  {
    name: "Auto-collection",
    sampleValues: '"On", "Off"',
    operators: ["is"],
    valueOptions: ["On", "Off"],
  },
  {
    name: "Reminder Sequence Status",
    sampleValues: '"Stopped", "Exhausted", "In Progress"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Stopped", "Exhausted", "In Progress"],
  },
  {
    name: "Payment Source Type",
    sampleValues: '"Card", "Direct Debit", "PayPal"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Card", "Direct Debit", "PayPal"],
  },
  {
    name: "Payment Source Status",
    sampleValues: '"Valid", "Expiring", "Expired", "Invalid"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Valid", "Expiring", "Expired", "Invalid"],
  },
  {
    name: "Card Expiry Date",
    sampleValues: '"09 / 2025", "03 / 2026"',
    operators: ["is before", "is after", "is between"],
    valueOptions: ["09 / 2025", "03 / 2026"],
  },
  {
    name: "Offline Payment Method",
    sampleValues: '"Bank Transfer", "Check", "ACH"',
    operators: ["is any of", "is none of"],
    valueOptions: ["Bank Transfer", "Check", "ACH"],
  },
  {
    name: "No Primary Payment Method",
    sampleValues: '"Yes", "No"',
    operators: ["is"],
    valueOptions: ["Yes", "No"],
  },
  {
    name: "No Backup Payment Method",
    sampleValues: '"Yes", "No"',
    operators: ["is"],
    valueOptions: ["Yes", "No"],
  },
  {
    name: "Outstanding Amount",
    sampleValues: '"$3,200.00", "$0.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$3,200.00", "$0.00"],
  },
  {
    name: "Overdue Amount",
    sampleValues: '"$1,800.00", "$500.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$1,800.00", "$500.00"],
  },
  {
    name: "Available Balance",
    sampleValues: '"$200.00", "$0.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$200.00", "$0.00"],
  },
  {
    name: "Net Outstanding",
    sampleValues: '"$3,000.00"',
    operators: ["equals", "is greater than", "is less than", "is between"],
    valueOptions: ["$3,000.00"],
  },
];

const PROPERTY_BY_NAME = new Map(
  CUSTOMER_FILTER_PROPERTIES.map((property) => [property.name, property]),
);

export function getCustomerFilterProperty(
  name: string,
): CustomerFilterPropertyDef | undefined {
  return PROPERTY_BY_NAME.get(name);
}

export function operatorsForCustomerProperty(name: string): readonly string[] {
  return getCustomerFilterProperty(name)?.operators ?? [];
}

export { operatorRequiresValue };

function parseAmount(value: string): number | null {
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function textMatch(
  haystack: string,
  needle: string,
  operator: string,
): boolean | null {
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

function deriveAutoCollection(customer: Customer): "On" | "Off" {
  const method = customer.paymentMethod.toLowerCase();
  if (method.includes("card") || method.includes("ach") || method.includes("auto")) {
    return "On";
  }
  return "Off";
}

function matchesReminderSequenceStatus(
  row: CustomerListRowData,
  operator: string,
  value: string,
): boolean {
  const status = (row.reminderSequenceStatus ?? "").toLowerCase();
  const options = value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

  if (operator === "is any of") {
    if (status && options.includes(status)) return true;
    if (
      row.hasSequenceStoppedOrExhausted &&
      options.some((o) => o === "stopped" || o === "exhausted")
    ) {
      return true;
    }
    return false;
  }
  if (operator === "is none of") {
    if (status && options.includes(status)) return false;
    if (
      row.hasSequenceStoppedOrExhausted &&
      options.some((o) => o === "stopped" || o === "exhausted")
    ) {
      return false;
    }
    return true;
  }
  return textMatch(status, value, operator) ?? true;
}

/** Best-effort evaluation for customer list filters (prototype). */
export function matchesCustomerPropertyFilter(
  customer: Customer,
  filter: { field: string; operator?: string; value: string },
  row?: CustomerListRowData,
): boolean {
  const operator = filter.operator ?? "is";
  const value = filter.value.trim();

  if (filter.field === "Reminder Sequence Status" && row) {
    if (!operatorRequiresValue(operator)) return true;
    return matchesReminderSequenceStatus(row, operator, value);
  }

  if (!operatorRequiresValue(operator)) {
    const fieldValue = customerFieldValue(customer, filter.field);
    if (fieldValue === null) return true;
    return textMatch(fieldValue, "", operator) ?? true;
  }

  if (!value) return true;

  const fieldValue = customerFieldValue(customer, filter.field);
  if (fieldValue === null) return true;

  if (operator === "is any of") {
    const options = value.split(",").map((v) => v.trim().toLowerCase());
    return options.includes(fieldValue.toLowerCase());
  }
  if (operator === "is none of") {
    const options = value.split(",").map((v) => v.trim().toLowerCase());
    return !options.includes(fieldValue.toLowerCase());
  }

  const textResult = textMatch(fieldValue, value, operator);
  if (textResult !== null) return textResult;

  const numericField = customerNumericField(customer, filter.field);
  if (numericField !== null) {
    const amountResult = amountMatch(numericField, value, operator);
    if (amountResult !== null) return amountResult;
  }

  return true;
}

function customerFieldValue(customer: Customer, property: string): string | null {
  switch (property) {
    case "Customer":
      return customer.name;
    case "Email":
      return customer.domain ? `billing@${customer.domain}` : "";
    case "Country":
      return customer.region;
    case "Language":
      return "en-US";
    case "Currency":
      return customer.currency;
    case "Business Entity":
      return customer.chargebeeEntity;
    case "Customer Since":
      return customer.createdAt;
    case "Auto-collection":
      return deriveAutoCollection(customer);
    case "Payment Source Type":
      return customer.paymentMethod;
    default:
      return null;
  }
}

function customerNumericField(customer: Customer, property: string): number | null {
  switch (property) {
    case "Outstanding Amount":
    case "Net Outstanding":
      return customer.openAr;
    case "Available Balance":
      return customer.prepaidCreditBalance;
    case "Customer MRR":
      return Math.round(customer.arr / 12);
    default:
      return null;
  }
}
