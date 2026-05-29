/** Summary-tab extract sections for Zenith Analytics INC contract workspace (CON-2024-0191). */

export type ZenithLineItemMappingStatus = "mapped" | "needs_mapping";

export interface ZenithSummaryLineItem {
  id: string;
  name: string;
  frequency: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mappingStatus: ZenithLineItemMappingStatus;
}

export interface ZenithSummaryKvRow {
  label: string;
  value: string;
}

export const zenithSummaryLineItems: ZenithSummaryLineItem[] = [
  {
    id: "li-growth-crm",
    name: "Growth CRM",
    frequency: "Yearly",
    quantity: 25,
    unitPrice: 1200,
    totalPrice: 30000,
    mappingStatus: "mapped",
  },
  {
    id: "li-onboarding",
    name: "Onboarding & Training",
    frequency: "One-time",
    quantity: 1,
    unitPrice: 2500,
    totalPrice: 2500,
    mappingStatus: "needs_mapping",
  },
  {
    id: "li-support",
    name: "Premium Support Add-on",
    frequency: "Monthly",
    quantity: 1,
    unitPrice: 4200,
    totalPrice: 4200,
    mappingStatus: "needs_mapping",
  },
];

export function zenithSummaryLineItemsDescription(items: ZenithSummaryLineItem[]): string {
  const names = items.map((i) => i.name);
  if (names.length <= 2) {
    return `Found ${items.length} line item${items.length === 1 ? "" : "s"} in the contract, covering ${names.join(" and ")}. Review quantities, pricing, and mapping to items in your site.`;
  }
  const head = names.slice(0, 2).join(", ");
  const rest = items.length - 2;
  return `Found ${items.length} line items in the contract, covering ${head} and ${rest} more. Review quantities, pricing, and mapping to items in your site.`;
}

export function zenithSummaryLineItemsNeedMappingCount(items: ZenithSummaryLineItem[]): number {
  return items.filter((i) => i.mappingStatus === "needs_mapping").length;
}

export const zenithSummaryBillingRows: ZenithSummaryKvRow[] = [
  { label: "Term", value: "12 months" },
  { label: "Billing cycle", value: "Annual, billed upfront" },
  { label: "Start date", value: "15-Jul-2026" },
  { label: "Payment terms", value: "Net 30" },
];

export const zenithSummaryBillingDescription =
  "A 12 months contract billed annual, billed upfront, starting 15-Jul-2026 with net 30 payment terms.";

/** Billing info tab — extracted terms for Zenith contract (CON-2024-0191). */
export interface ZenithContractBillingInfo {
  term: string;
  billingCycle: string;
  startDate: string;
  paymentTerms: string;
  paymentTermsIsSiteDefault: boolean;
}

export const zenithContractBillingInfo: ZenithContractBillingInfo = {
  term: "12 months",
  billingCycle: "Annual, billed upfront",
  startDate: "15-Jul-2026",
  paymentTerms: "Net 30",
  paymentTermsIsSiteDefault: true,
};

export const zenithPaymentTermsOptions = [
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due on receipt",
] as const;

export const zenithSummaryAddressRows: ZenithSummaryKvRow[] = [
  {
    label: "Billing",
    value: "4th Floor, Lattice Tower, MG Road, Bengaluru, KA 560001, India",
  },
  { label: "Shipping", value: "Same as billing address" },
];

export const zenithSummaryAddressesDescription =
  "Billing address 4th Floor, Lattice Tower, MG Road, Bengaluru, KA 560001, India, shipping to Same as billing address.";

/** Addresses tab — structured fields for Zenith contract (CON-2024-0191). */
export interface ZenithContractAddressFields {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const zenithContractBillingAddress: ZenithContractAddressFields = {
  line1: "4th Floor, Lattice Tower",
  line2: "MG Road",
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
  country: "India",
};

export const zenithContractAddressesDefaults = {
  billing: zenithContractBillingAddress,
  shippingSameAsBilling: true,
};
