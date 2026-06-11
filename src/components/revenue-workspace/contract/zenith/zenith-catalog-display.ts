import type { ZenithCatalogSiteItem } from "@/data/zenith-catalog-items";

export function formatCatalogUnitPrice(item: ZenithCatalogSiteItem): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency,
    minimumFractionDigits: item.unitPrice < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(item.unitPrice);
}

export function catalogProductType(item: ZenithCatalogSiteItem): string {
  return item.productType;
}

export function catalogPricingModel(item: ZenithCatalogSiteItem): string {
  if (item.itemType === "Usage") return "Per unit";
  if (item.itemType === "One-time") return "Flat fee";
  return "Flat fee";
}

export function catalogBillingCycle(item: ZenithCatalogSiteItem): string {
  return item.itemType === "One-time" ? "Fixed" : "Forever";
}

export function catalogTrialLabel(_item: ZenithCatalogSiteItem): string {
  return "No trial";
}

export function catalogTaxableLabel(item: ZenithCatalogSiteItem): string {
  const hash = item.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 4 === 0 ? "No" : "Yes";
}

export interface CatalogColumnFilters {
  item: string;
  itemType: string;
  status: string;
  frequency: string;
  pricingModel: string;
  unitPrice: string;
  billingCycle: string;
  trial: string;
  taxable: string;
}

export const emptyCatalogColumnFilters: CatalogColumnFilters = {
  item: "",
  itemType: "",
  status: "",
  frequency: "",
  pricingModel: "",
  unitPrice: "",
  billingCycle: "",
  trial: "",
  taxable: "",
};

export function applyCatalogColumnFilters(
  items: ZenithCatalogSiteItem[],
  filters: CatalogColumnFilters,
): ZenithCatalogSiteItem[] {
  return items.filter((item) => {
    if (filters.item) {
      const q = filters.item.trim().toLowerCase();
      if (![item.name, item.sku].join(" ").toLowerCase().includes(q)) return false;
    }
    if (filters.itemType && item.productType !== filters.itemType) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.frequency && item.billingFrequency !== filters.frequency) return false;
    if (filters.pricingModel && catalogPricingModel(item) !== filters.pricingModel) return false;
    if (filters.unitPrice) {
      const price = formatCatalogUnitPrice(item).toLowerCase();
      if (!price.includes(filters.unitPrice.trim().toLowerCase())) return false;
    }
    if (filters.billingCycle && catalogBillingCycle(item) !== filters.billingCycle) return false;
    if (filters.trial && catalogTrialLabel(item) !== filters.trial) return false;
    if (filters.taxable && catalogTaxableLabel(item) !== filters.taxable) return false;
    return true;
  });
}
