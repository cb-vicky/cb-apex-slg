import type { Customer } from "@/data/mock-data";

/** Additional site customers for the new-deal customer link modal search table demo. */
function linkSearchCustomer(
  id: string,
  name: string,
  domain: string,
  overrides: Partial<Customer> = {},
): Customer {
  return {
    id,
    name,
    commercialAccount: `${name} – Global`,
    billingLegalEntity: `${name} Inc.`,
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Enterprise",
    tier: "Tier 2",
    ae: "Jordan Kim",
    csm: "Priya Mehta",
    billingOwner: "Alex Nguyen",
    arr: 120000,
    tcv: 240000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    openAr: 0,
    nextRenewalDate: "2026-10-01",
    riskBadges: [],
    createdAt: "2024-03-15",
    domain,
    industry: "Software",
    region: "North America",
    crmAccountId: `001Dn000${id.replace(/\D/g, "").slice(-6)}`,
    crmSyncStatus: "Synced",
    crmLastSyncedAt: "2026-04-01T08:00:00Z",
    paymentMethod: "ACH",
    currency: "USD",
    taxRegion: "US – California",
    poRequired: false,
    activeContractCount: 1,
    openQuoteCount: 0,
    ...overrides,
  };
}

export const customerLinkSearchSeedCustomers: Customer[] = [
  linkSearchCustomer("cust_link_search_010", "Atlas BioSystems", "atlasbio.com"),
  linkSearchCustomer("cust_link_search_011", "Beacon Data Co", "beacondata.io", {
    segment: "Mid-Market",
    csm: "Rachel Torres",
  }),
  linkSearchCustomer("cust_link_search_012", "Cascade Financial", "cascadefin.com", {
    paymentMethod: "Wire",
    poRequired: true,
  }),
  linkSearchCustomer("cust_link_search_013", "Driftwood Media", "driftwoodmedia.com", {
    industry: "Media",
    region: "United Kingdom",
    taxRegion: "UK – England",
    currency: "GBP",
  }),
  linkSearchCustomer("cust_link_search_014", "Ember Security", "embersec.com", {
    csm: "David Chen",
    activeContractCount: 2,
  }),
  linkSearchCustomer("cust_link_search_015", "Forge Robotics", "forgerobotics.com", {
    industry: "Robotics",
    ae: "Marcus Lee",
  }),
  linkSearchCustomer("cust_link_search_016", "Granite Health", "granitehealth.com", {
    industry: "Healthcare",
    poRequired: true,
  }),
  linkSearchCustomer("cust_link_search_017", "Harbor Logistics", "harborlogistics.com", {
    industry: "Logistics",
    region: "North America",
    csm: "Daniel Fischer",
  }),
  linkSearchCustomer("cust_link_search_018", "Iris Networks", "irisnetworks.com", {
    segment: "Mid-Market",
    activeContractCount: 0,
    openQuoteCount: 1,
  }),
  linkSearchCustomer("cust_link_search_019", "Juniper Commerce", "junipercommerce.com", {
    ae: "Sophia Brandt",
    csm: "Lena Schulz",
  }),
  linkSearchCustomer("cust_link_search_020", "Keystone Analytics", "keystoneanalytics.com", {
    industry: "Analytics",
    arr: 310000,
    tcv: 620000,
  }),
];
