import {
  itemTypeFromFrequency,
  suggestSkuFromProductName,
} from "@/data/zenith-catalog-items";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";

export type ZenithCreateItemPayload = {
  name: string;
  sku: string;
  itemType: "Recurring" | "One-time" | "Usage";
  billingFrequency: string;
  unitPrice: number;
};

export type BillingFrequencyOption =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "one_time";

export type PricingModelOption = "flat_fee" | "per_unit" | "tiered";

export type BillingCyclesOption = "forever" | "fixed";

export interface CreateCatalogItemFormState {
  externalName: string;
  internalName: string;
  itemId: string;
  hasTrialPeriod: boolean;
  billingFrequency: BillingFrequencyOption;
  pricingModel: PricingModelOption;
  price: string;
  currency: string;
  billingCycles: BillingCyclesOption;
  priceVariant: string;
  description: string;
  showDescriptionOnInvoices: boolean;
  showDescriptionOnQuotes: boolean;
  invoiceNotes: string;
  subjectToTax: boolean;
}

const FREQUENCY_LABELS: Record<BillingFrequencyOption, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  one_time: "One-time",
};

function normalizeBillingFrequency(raw: string): BillingFrequencyOption {
  const value = raw.trim().toLowerCase();
  if (value.includes("day")) return "daily";
  if (value.includes("week")) return "weekly";
  if (value.includes("month")) return "monthly";
  if (value.includes("quarter")) return "quarterly";
  if (value.includes("year") || value.includes("annual")) return "yearly";
  if (value.includes("one")) return "one_time";
  return "monthly";
}

export function billingFrequencyLabel(option: BillingFrequencyOption): string {
  return FREQUENCY_LABELS[option];
}

export function buildInitialCreateCatalogItemForm(
  item: ZenithSummaryLineItem,
): CreateCatalogItemFormState {
  const internalName = item.name.trim();
  return {
    externalName: internalName,
    internalName,
    itemId: suggestSkuFromProductName(internalName),
    hasTrialPeriod: false,
    billingFrequency: normalizeBillingFrequency(item.frequency),
    pricingModel: "flat_fee",
    price: item.unitPrice > 0 ? String(item.unitPrice) : "",
    currency: "USD",
    billingCycles: "forever",
    priceVariant: "",
    description: "",
    showDescriptionOnInvoices: false,
    showDescriptionOnQuotes: false,
    invoiceNotes: "",
    subjectToTax: true,
  };
}

export function isCreateCatalogItemFormComplete(state: CreateCatalogItemFormState): boolean {
  return (
    state.internalName.trim().length > 0 &&
    state.itemId.trim().length > 0 &&
    state.price.trim().length > 0
  );
}

export function toCreateCatalogItemPayload(
  state: CreateCatalogItemFormState,
): ZenithCreateItemPayload {
  const unitPrice = Number.parseFloat(state.price.replace(/,/g, "")) || 0;
  const billingFrequency = billingFrequencyLabel(state.billingFrequency);

  return {
    name: state.internalName.trim() || state.externalName.trim(),
    sku: state.itemId.trim(),
    itemType: itemTypeFromFrequency(billingFrequency),
    billingFrequency,
    unitPrice,
  };
}
