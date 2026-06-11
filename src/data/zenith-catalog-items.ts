/** Chargebee site catalog items for Zenith contract line-item mapping (Items tab). */

export interface ZenithCatalogSiteItem {
  id: string;
  sku: string;
  name: string;
  /** Chargebee product family — Plan, Addon, or Charge. */
  productType: "Plan" | "Addon" | "Charge";
  itemType: "Recurring" | "One-time" | "Usage";
  billingFrequency: string;
  unitPrice: number;
  currency: string;
  status: "Active" | "Archived";
  createdAt: string;
  description: string;
}

export const zenithCatalogSiteItems: ZenithCatalogSiteItem[] = [
  {
    id: "item-apex-platform",
    sku: "APEX-PLATFORM",
    name: "Apex Platform",
    productType: "Plan",
    itemType: "Recurring",
    billingFrequency: "Yearly",
    unitPrice: 1200,
    currency: "USD",
    status: "Active",
    createdAt: "2023-04-12",
    description: "Core platform subscription — seat-based annual plan.",
  },
  {
    id: "item-growth-crm",
    sku: "GROWTH-CRM-YR",
    name: "Growth CRM",
    productType: "Plan",
    itemType: "Recurring",
    billingFrequency: "Yearly",
    unitPrice: 1200,
    currency: "USD",
    status: "Active",
    createdAt: "2024-01-08",
    description: "CRM module with yearly billing and volume tiers.",
  },
  {
    id: "item-growth-crm-mo",
    sku: "GROWTH-CRM-MO",
    name: "Growth CRM",
    productType: "Plan",
    itemType: "Recurring",
    billingFrequency: "Monthly",
    unitPrice: 110,
    currency: "USD",
    status: "Active",
    createdAt: "2024-01-08",
    description: "CRM module — monthly list price per seat.",
  },
  {
    id: "item-onboarding",
    sku: "ONBOARDING-PKG",
    name: "Onboarding Package",
    productType: "Charge",
    itemType: "One-time",
    billingFrequency: "One-time",
    unitPrice: 2500,
    currency: "USD",
    status: "Active",
    createdAt: "2023-11-20",
    description: "Implementation and training bundle — one-time fee.",
  },
  {
    id: "item-support-premium",
    sku: "SUPPORT-PREMIUM",
    name: "Premium Support",
    productType: "Addon",
    itemType: "Recurring",
    billingFrequency: "Monthly",
    unitPrice: 4200,
    currency: "USD",
    status: "Active",
    createdAt: "2023-06-15",
    description: "24×7 premium support add-on with dedicated channel.",
  },
  {
    id: "item-support-standard",
    sku: "SUPPORT-STD",
    name: "Standard Support",
    productType: "Addon",
    itemType: "Recurring",
    billingFrequency: "Monthly",
    unitPrice: 800,
    currency: "USD",
    status: "Active",
    createdAt: "2022-09-01",
    description: "Business-hours support — per account.",
  },
  {
    id: "item-ai-credits",
    sku: "APEX-AI-CREDITS",
    name: "AI Credits",
    productType: "Addon",
    itemType: "Usage",
    billingFrequency: "Monthly",
    unitPrice: 0.02,
    currency: "USD",
    status: "Active",
    createdAt: "2024-03-01",
    description: "Metered AI usage credits — billed in arrears.",
  },
  {
    id: "item-analytics-pro",
    sku: "APEX-ANALYTICS-PRO",
    name: "Apex Analytics Pro",
    productType: "Addon",
    itemType: "Recurring",
    billingFrequency: "Yearly",
    unitPrice: 960,
    currency: "USD",
    status: "Active",
    createdAt: "2023-08-22",
    description: "Advanced analytics and reporting suite.",
  },
  {
    id: "item-data-export",
    sku: "DATA-EXPORT",
    name: "Data Export Pack",
    productType: "Charge",
    itemType: "One-time",
    billingFrequency: "One-time",
    unitPrice: 500,
    currency: "USD",
    status: "Active",
    createdAt: "2024-05-10",
    description: "Bulk export entitlement — single purchase.",
  },
  {
    id: "item-legacy-crm",
    sku: "LEGACY-CRM",
    name: "Legacy CRM (v1)",
    productType: "Plan",
    itemType: "Recurring",
    billingFrequency: "Yearly",
    unitPrice: 600,
    currency: "USD",
    status: "Archived",
    createdAt: "2020-02-14",
    description: "Deprecated SKU — grandfathered accounts only.",
  },
];

export function getZenithCatalogItemById(id: string): ZenithCatalogSiteItem | undefined {
  return zenithCatalogSiteItems.find((item) => item.id === id);
}

export function filterZenithCatalogItems(query: string): ZenithCatalogSiteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return zenithCatalogSiteItems;
  return zenithCatalogSiteItems.filter((item) =>
    [item.name, item.sku, item.productType, item.itemType, item.billingFrequency, item.description, item.status]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export function suggestSkuFromProductName(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return slug || "NEW-ITEM";
}

export function itemTypeFromFrequency(frequency: string): ZenithCatalogSiteItem["itemType"] {
  const f = frequency.toLowerCase();
  if (f.includes("one-time") || f.includes("one time")) return "One-time";
  if (f.includes("usage") || f.includes("meter")) return "Usage";
  return "Recurring";
}
