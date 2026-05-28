/** People and subscription context shown in Collection tab → AR Overview. */

export interface ArPerson {
  id: string;
  name: string;
  email: string;
}

export interface ArInternalContact extends ArPerson {
  role: "primary" | "secondary" | "additional";
  roleLabel: string;
}

export interface SubscriptionStatusItem {
  tone: "active" | "paused" | "past_due" | "scheduled";
  count: number;
  label: string;
  /** Optional suffix, e.g. "5 days ago" for paused subs */
  detail?: string;
}

export interface SubscriptionDetail {
  id: string;
  name: string;
  plan: string;
  statusLabel: string;
  tone: SubscriptionStatusItem["tone"];
  /** Secondary line — MRR, renewal date, pause reason, etc. */
  meta?: string;
}

export interface SubscriptionDetailGroup {
  groupLabel: string;
  tone: SubscriptionStatusItem["tone"];
  items: SubscriptionDetail[];
}

export interface CustomerArProfile {
  customerId: string;
  collectionOwnerId: string;
  collectionOwnerOptions: ArPerson[];
  internalContacts: ArInternalContact[];
  subscriptions: SubscriptionStatusItem[];
  subscriptionDetails: SubscriptionDetailGroup[];
}

const COLLECTION_OWNERS: ArPerson[] = [
  { id: "owner_priya", name: "Priya Mehta", email: "priya.mehta@chargebee.com" },
  { id: "owner_alex", name: "Alex Nguyen", email: "alex.nguyen@chargebee.com" },
  { id: "owner_lena", name: "Lena Schulz", email: "lena.schulz@chargebee.com" },
  { id: "owner_jordan", name: "Jordan Blake", email: "jordan.blake@chargebee.com" },
];

const ECHO_INTERNAL: ArInternalContact[] = [
  {
    id: "int_arjun",
    role: "primary",
    roleLabel: "Primary contact",
    name: "Arjun Mehta",
    email: "arjun.mehta@chargebee.com",
  },
  {
    id: "int_liam",
    role: "secondary",
    roleLabel: "Secondary contact",
    name: "Liam Parker",
    email: "liam.parker@chargebee.com",
  },
  {
    id: "int_sofia",
    role: "additional",
    roleLabel: "Billing ops",
    name: "Sofia Reyes",
    email: "sofia.reyes@chargebee.com",
  },
];

const NORTHLANE_INTERNAL: ArInternalContact[] = [
  {
    id: "int_maya",
    role: "primary",
    roleLabel: "Primary contact",
    name: "Maya Chen",
    email: "maya.chen@chargebee.com",
  },
  {
    id: "int_derek",
    role: "secondary",
    roleLabel: "Secondary contact",
    name: "Derek Walsh",
    email: "derek.walsh@chargebee.com",
  },
];

const VERDANT_INTERNAL: ArInternalContact[] = [
  {
    id: "int_nina",
    role: "primary",
    roleLabel: "Primary contact",
    name: "Nina Kowalski",
    email: "nina.kowalski@chargebee.com",
  },
  {
    id: "int_omar",
    role: "secondary",
    roleLabel: "Secondary contact",
    name: "Omar Hassan",
    email: "omar.hassan@chargebee.com",
  },
  {
    id: "int_tess",
    role: "additional",
    roleLabel: "RevOps liaison",
    name: "Tess Howard",
    email: "tess.howard@chargebee.com",
  },
];

const ECHO_SUBSCRIPTION_DETAILS: SubscriptionDetailGroup[] = [
  {
    groupLabel: "Active subscriptions",
    tone: "active",
    items: [
      {
        id: "SUB-EC-1001",
        name: "APEX Platform — Enterprise",
        plan: "Annual · co-termed to Jul 2026",
        statusLabel: "Active",
        tone: "active",
        meta: "$14,000 / mo MRR",
      },
      {
        id: "SUB-EC-1002",
        name: "AI Agent Credits — Overage pool",
        plan: "Usage · monthly true-up",
        statusLabel: "Active",
        tone: "active",
        meta: "$2,400 / mo avg burn",
      },
      {
        id: "SUB-EC-1003",
        name: "Premium Support",
        plan: "Add-on · Net 45",
        statusLabel: "Active",
        tone: "active",
        meta: "$1,600 / mo",
      },
      {
        id: "SUB-EC-1004",
        name: "RevRec Bridge Module",
        plan: "Pilot · included through Q2",
        statusLabel: "Active",
        tone: "active",
        meta: "No charge until Jul 2026",
      },
    ],
  },
  {
    groupLabel: "Paused subscriptions",
    tone: "paused",
    items: [
      {
        id: "SUB-EC-1005",
        name: "Sandbox Expansion Pack",
        plan: "Add-on · 50 seats",
        statusLabel: "Paused",
        tone: "paused",
        meta: "Paused 5 days ago · budget hold on AP side",
      },
    ],
  },
];

const NORTHLANE_SUBSCRIPTION_DETAILS: SubscriptionDetailGroup[] = [
  {
    groupLabel: "Active subscriptions",
    tone: "active",
    items: [
      {
        id: "SUB-NL-2001",
        name: "APEX Platform — Growth",
        plan: "Quarterly · Q2 2026",
        statusLabel: "Active",
        tone: "active",
        meta: "$45,600 / quarter",
      },
      {
        id: "SUB-NL-2002",
        name: "Usage metering — API events",
        plan: "Usage · in arrears",
        statusLabel: "Active",
        tone: "active",
        meta: "$8,200 / mo estimated",
      },
    ],
  },
  {
    groupLabel: "Past due subscriptions",
    tone: "past_due",
    items: [
      {
        id: "SUB-NL-2003",
        name: "Q4 2025 Overage true-up",
        plan: "One-time · disputed",
        statusLabel: "Past due",
        tone: "past_due",
        meta: "16 days overdue · $31,200 open",
      },
    ],
  },
];

const VERDANT_SUBSCRIPTION_DETAILS: SubscriptionDetailGroup[] = [
  {
    groupLabel: "Active subscriptions",
    tone: "active",
    items: [
      {
        id: "SUB-VH-3001",
        name: "APEX Platform — Scale",
        plan: "Annual · PO-backed",
        statusLabel: "Active",
        tone: "active",
        meta: "$108,000 / yr",
      },
      {
        id: "SUB-VH-3002",
        name: "Field sales seats",
        plan: "Per seat · 120 licenses",
        statusLabel: "Active",
        tone: "active",
        meta: "$4,800 / mo",
      },
      {
        id: "SUB-VH-3003",
        name: "Usage — workflow automations",
        plan: "Metered · monthly",
        statusLabel: "Active",
        tone: "active",
        meta: "$3,600 / mo avg",
      },
    ],
  },
  {
    groupLabel: "Scheduled renewals",
    tone: "scheduled",
    items: [
      {
        id: "SUB-VH-3004",
        name: "Platform renewal — FY27",
        plan: "Renewal quote QT-2026-0098",
        statusLabel: "Scheduled",
        tone: "scheduled",
        meta: "Starts Oct 2026 · pending signature",
      },
    ],
  },
];

const profiles: Record<string, CustomerArProfile> = {
  cust_echo_001: {
    customerId: "cust_echo_001",
    collectionOwnerId: "owner_priya",
    collectionOwnerOptions: COLLECTION_OWNERS,
    internalContacts: ECHO_INTERNAL,
    subscriptions: [
      { tone: "active", count: 4, label: "Active" },
      { tone: "paused", count: 1, label: "Paused", detail: "5 days ago" },
    ],
    subscriptionDetails: ECHO_SUBSCRIPTION_DETAILS,
  },
  cust_northlane_003: {
    customerId: "cust_northlane_003",
    collectionOwnerId: "owner_priya",
    collectionOwnerOptions: COLLECTION_OWNERS,
    internalContacts: NORTHLANE_INTERNAL,
    subscriptions: [
      { tone: "active", count: 2, label: "Active" },
      { tone: "past_due", count: 1, label: "Past due", detail: "16 days" },
    ],
    subscriptionDetails: NORTHLANE_SUBSCRIPTION_DETAILS,
  },
  cust_verdant_005: {
    customerId: "cust_verdant_005",
    collectionOwnerId: "owner_lena",
    collectionOwnerOptions: COLLECTION_OWNERS,
    internalContacts: VERDANT_INTERNAL,
    subscriptions: [
      { tone: "active", count: 3, label: "Active" },
      { tone: "scheduled", count: 1, label: "Renewal", detail: "Oct 2026" },
    ],
    subscriptionDetails: VERDANT_SUBSCRIPTION_DETAILS,
  },
};

function defaultProfile(customerId: string, ownerName?: string): CustomerArProfile {
  const matchedOwner =
    COLLECTION_OWNERS.find((o) => o.name === ownerName) ?? COLLECTION_OWNERS[0]!;
  return {
    customerId,
    collectionOwnerId: matchedOwner.id,
    collectionOwnerOptions: COLLECTION_OWNERS,
    internalContacts: [
      {
        id: `int_primary_${customerId}`,
        role: "primary",
        roleLabel: "Primary contact",
        name: "Arjun Mehta",
        email: "arjun.mehta@chargebee.com",
      },
      {
        id: `int_secondary_${customerId}`,
        role: "secondary",
        roleLabel: "Secondary contact",
        name: "Liam Parker",
        email: "liam.parker@chargebee.com",
      },
    ],
    subscriptions: [{ tone: "active", count: 1, label: "Active" }],
    subscriptionDetails: [
      {
        groupLabel: "Active subscriptions",
        tone: "active",
        items: [
          {
            id: `SUB-${customerId}-001`,
            name: "APEX Platform",
            plan: "Standard annual",
            statusLabel: "Active",
            tone: "active",
            meta: "Primary contract",
          },
        ],
      },
    ],
  };
}

export function getCustomerArProfile(
  customerId: string,
  fallbackOwnerName?: string,
): CustomerArProfile {
  const base = profiles[customerId];
  if (base) return base;
  return defaultProfile(customerId, fallbackOwnerName);
}
