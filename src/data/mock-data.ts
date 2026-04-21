// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  commercialAccount: string;
  billingLegalEntity: string;
  chargebeeEntity: string;
  segment: string;
  tier: string;
  ae: string;
  csm: string;
  billingOwner: string;
  arr: number;
  tcv: number;
  prepaidCreditBalance: number;
  prepaidCreditTotal: number;
  openAr: number;
  nextRenewalDate: string;
  riskBadges: string[];
  createdAt: string;
  domain: string;
  industry: string;
  region: string;
  crmAccountId: string;
  crmSyncStatus: string;
  crmLastSyncedAt: string;
  paymentMethod: string;
  currency: string;
  taxRegion: string;
  poRequired: boolean;
  activeContractCount: number;
  openQuoteCount: number;
}

export interface QuoteProduct {
  sku: string;
  name: string;
  type: "recurring" | "one-time" | "usage";
  quantity: number;
  unitPrice: number;
  discount: number;
  netAmount: number;
  billingModel: string;
  rampSchedule?: string;
  minimumCommit?: number;
  prepaidCredits?: number;
  overageRate?: number;
}

export interface QuoteCommercialTerms {
  contractTerm: string;
  billingFrequency: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  trialPeriod: string;
  coTermTarget: string;
  aiUsageDrawdown: string;
  prepaidCreditLogic: string;
}

export interface ApprovalInfo {
  status: "approved" | "pending" | "rejected" | "not_required";
  triggeredRules: string[];
  currentApprover: string;
  comments: string;
  pendingSince: string;
  /** Mock: approval is waiting on the signed-in viewer (drives “your turn” CTA). */
  pendingOnCurrentUser?: boolean;
}

export interface TimelineEvent {
  date: string;
  action: string;
  actor: string;
  detail?: string;
}

export interface QuoteComment {
  id: string;
  author: string;
  role: string;
  date: string;
  text: string;
}

export interface Quote {
  id: string;
  customerId: string;
  lineageId: string;
  version: number;
  versionSummary: string;
  rejectionReason?: string;
  source: string;
  status: string;
  quoteType: string;
  amount: number;
  arr: number;
  tcv: number;
  discountPct: number;
  expiryDate: string;
  approval: ApprovalInfo;
  products: QuoteProduct[];
  commercialTerms: QuoteCommercialTerms;
  relatedContractId: string;
  crmOpportunityLink: string;
  crmSyncStatus: string;
  lastSyncedAmount: number;
  sendHistory: { date: string; method: string; status: string }[];
  customerViewedAt: string | null;
  customerAcceptedAt: string | null;
  timeline: TimelineEvent[];
  comments: QuoteComment[];
  owner: string;
  /** Unread count in team comment thread (mock inbox). */
  teamCommentsUnread?: number;
}

export interface ContractProduct {
  sku: string;
  name: string;
  type: "recurring" | "one-time" | "usage";
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  minimumCommit: number;
  prepaidCredits: number;
  overageRate: number;
  billingCadence: string;
  rampSchedule?: string;
}

export interface ContractEnforcement {
  sourceType: string;
  linkedQuoteId: string;
  saleOrderStatus: string;
  enforcementStatus: string;
  productMappingIssues: string[];
  missingFields: string[];
  provisioningStatus: string;
  entitlementStatus: string;
  manualOverrides: string[];
  blockingIssues: string[];
}

export interface Amendment {
  id: string;
  type: string;
  effectiveDate: string;
  description: string;
  status: string;
}

export interface InvoiceScheduleItem {
  date: string;
  amount: number;
  status: string;
  invoiceId?: string;
  holdReason?: string;
}

export interface ContractDifference {
  field: string;
  quoteValue: string;
  contractValue: string;
}

export interface Contract {
  id: string;
  customerId: string;
  sourceQuoteId: string;
  status: string;
  signedDate: string;
  effectiveDate: string;
  term: string;
  endDate: string;
  tcv: number;
  minAnnualCommit: number;
  prepaidCreditBalance: number;
  prepaidCreditTotal: number;
  renewalDate: string;
  products: ContractProduct[];
  enforcement: ContractEnforcement;
  billingSchedule: InvoiceScheduleItem[];
  amendments: Amendment[];
  invoicesGenerated: number;
  creditNotes: number;
  openAr: number;
  paymentsReceived: number;
  unappliedCash: number;
  revRecSummary: { recognized: number; deferred: number; status: string };
  signedDocumentUrl: string;
  ingestionTimestamp: string;
  extractionConfidence: number;
  quoteMatchConfidence: number;
  importantClauses: string[];
  comparisonToQuote: ContractDifference[];
  timeline: TimelineEvent[];
  paymentTerms: string;
  billingFrequency: string;
  coTermBehavior: string;
  owner: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  contractId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  lineItems: { description: string; amount: number }[];
  holdReason?: string;
  promiseToPayDate?: string;
  disputeReason?: string;
  owner: string;
}

export interface Task {
  id: string;
  customerId: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
}

// ---------------------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------------------

export const customers: Customer[] = [
  {
    id: "cust_echo_001",
    name: "Echo Corp",
    commercialAccount: "Echo Corp – North America",
    billingLegalEntity: "Echo Corp Inc.",
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Enterprise",
    tier: "Tier 1",
    ae: "Jordan Kim",
    csm: "Priya Mehta",
    billingOwner: "Alex Nguyen",
    arr: 487200,
    tcv: 1261600,
    prepaidCreditBalance: 31400,
    prepaidCreditTotal: 120000,
    openAr: 24300,
    nextRenewalDate: "2026-06-15",
    riskBadges: ["High burn", "1 overdue invoice", "Renewal in 74 days", "Legal entity mismatch"],
    createdAt: "2023-09-14",
    domain: "echocorp.ai",
    industry: "AI Infrastructure",
    region: "North America",
    crmAccountId: "001Dn000008xA4Z",
    crmSyncStatus: "Synced",
    crmLastSyncedAt: "2026-04-02T08:15:00Z",
    paymentMethod: "ACH",
    currency: "USD",
    taxRegion: "US – Delaware",
    poRequired: true,
    activeContractCount: 1,
    openQuoteCount: 2,
  },
  {
    id: "cust_lumina_002",
    name: "Lumina AI",
    commercialAccount: "Lumina AI – Global",
    billingLegalEntity: "Lumina AI Ltd.",
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Enterprise",
    tier: "Tier 1",
    ae: "Marcus Lee",
    csm: "Rachel Torres",
    billingOwner: "Alex Nguyen",
    arr: 342000,
    tcv: 684000,
    prepaidCreditBalance: 52000,
    prepaidCreditTotal: 80000,
    openAr: 8400,
    nextRenewalDate: "2026-04-25",
    riskBadges: ["Renewal in 22 days"],
    createdAt: "2024-04-01",
    domain: "lumina.ai",
    industry: "Conversational AI",
    region: "North America",
    crmAccountId: "001Dn000009xB5Y",
    crmSyncStatus: "Synced",
    crmLastSyncedAt: "2026-04-01T14:30:00Z",
    paymentMethod: "Wire",
    currency: "USD",
    taxRegion: "US – California",
    poRequired: false,
    activeContractCount: 1,
    openQuoteCount: 1,
  },
  {
    id: "cust_northlane_003",
    name: "Northlane Labs",
    commercialAccount: "Northlane Labs – EMEA",
    billingLegalEntity: "Northlane Labs GmbH",
    chargebeeEntity: "Chargebee EU – Germany",
    segment: "Enterprise",
    tier: "Tier 2",
    ae: "Sophia Brandt",
    csm: "Daniel Fischer",
    billingOwner: "Lena Schulz",
    arr: 198000,
    tcv: 396000,
    prepaidCreditBalance: 12000,
    prepaidCreditTotal: 50000,
    openAr: 31200,
    nextRenewalDate: "2026-11-30",
    riskBadges: ["1 overdue invoice", "Support escalation", "Enforcement issue"],
    createdAt: "2024-01-15",
    domain: "northlane-labs.de",
    industry: "AI-Powered Drug Discovery",
    region: "EMEA",
    crmAccountId: "001Dn000010xC6X",
    crmSyncStatus: "Synced",
    crmLastSyncedAt: "2026-03-30T10:00:00Z",
    paymentMethod: "Wire",
    currency: "EUR",
    taxRegion: "EU – Germany",
    poRequired: true,
    activeContractCount: 1,
    openQuoteCount: 1,
  },
  {
    id: "cust_pioneer_004",
    name: "Pioneer Systems",
    commercialAccount: "Pioneer Systems – Americas",
    billingLegalEntity: "Pioneer Systems Corp.",
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Mid-Market",
    tier: "Tier 2",
    ae: "Jordan Kim",
    csm: "Priya Mehta",
    billingOwner: "Alex Nguyen",
    arr: 0,
    tcv: 186000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    openAr: 0,
    nextRenewalDate: "",
    riskBadges: [],
    createdAt: "2026-02-10",
    domain: "pioneersystems.com",
    industry: "AI Code Review",
    region: "North America",
    crmAccountId: "001Dn000011xD7W",
    crmSyncStatus: "Synced",
    crmLastSyncedAt: "2026-04-01T09:00:00Z",
    paymentMethod: "Card",
    currency: "USD",
    taxRegion: "US – Texas",
    poRequired: false,
    activeContractCount: 0,
    openQuoteCount: 1,
  },
  {
    id: "cust_zenith_006",
    name: "Zenith Analytics",
    commercialAccount: "Zenith Analytics – North America",
    billingLegalEntity: "Zenith Analytics Inc.",
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Mid-Market",
    tier: "Tier 2",
    ae: "Jordan Kim",
    csm: "Rachel Torres",
    billingOwner: "Alex Nguyen",
    arr: 155000,
    tcv: 155000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    openAr: 155000,
    nextRenewalDate: "2027-04-30",
    riskBadges: [],
    createdAt: "2026-04-17",
    domain: "zenithanalytics.io",
    industry: "AI Analytics",
    region: "North America",
    crmAccountId: "001Dn000013xF9U",
    crmSyncStatus: "Not synced",
    crmLastSyncedAt: "",
    paymentMethod: "Wire",
    currency: "USD",
    taxRegion: "US – New York",
    poRequired: false,
    activeContractCount: 1,
    openQuoteCount: 0,
  },
  {
    id: "cust_verdant_005",
    name: "Verdant Health",
    commercialAccount: "Verdant Health – US",
    billingLegalEntity: "Verdant Health Inc.",
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Enterprise",
    tier: "Tier 1",
    ae: "Marcus Lee",
    csm: "Rachel Torres",
    billingOwner: "Lena Schulz",
    arr: 264000,
    tcv: 528000,
    prepaidCreditBalance: 8200,
    prepaidCreditTotal: 60000,
    openAr: 12800,
    nextRenewalDate: "2026-09-30",
    riskBadges: ["Credit burn-down critical", "Missing PO"],
    createdAt: "2024-06-01",
    domain: "verdanthealth.com",
    industry: "AI Clinical Diagnostics",
    region: "North America",
    crmAccountId: "001Dn000012xE8V",
    crmSyncStatus: "Stale",
    crmLastSyncedAt: "2026-03-15T11:45:00Z",
    paymentMethod: "ACH",
    currency: "USD",
    taxRegion: "US – Massachusetts",
    poRequired: true,
    activeContractCount: 1,
    openQuoteCount: 1,
  },
];

// Backward compat: the "primary" customer
export const customer: Customer = customers[0];

// ---------------------------------------------------------------------------
// QUOTES
// ---------------------------------------------------------------------------

export const quotes: Quote[] = [
  {
    id: "QT-2026-0042",
    customerId: "cust_echo_001",
    lineageId: "lineage_echo_renewal_2026",
    version: 3,
    versionSummary: "Renewal expansion to 400 seats with AI prepaid block and non-standard Net 45 terms.",
    source: "Salesforce",
    status: "Pending Approval",
    quoteType: "Renewal",
    amount: 523600,
    arr: 261800,
    tcv: 523600,
    discountPct: 18,
    expiryDate: "2026-04-30",
    approval: {
      status: "pending",
      triggeredRules: [
        "Discount exceeds 15% threshold",
        "TCV > $500k requires VP approval",
        "Non-standard payment terms",
      ],
      currentApprover: "Sarah Chen, VP Revenue",
      comments: "Discount justified by 2-year commitment and prepaid credit purchase. Customer expanding from 150 to 400 seats.",
      pendingSince: "2026-03-28",
      pendingOnCurrentUser: true,
    },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 400, unitPrice: 45, discount: 18, netAmount: 14760, billingModel: "Per seat / month", minimumCommit: 120000 },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 120000, discount: 0, netAmount: 120000, billingModel: "Prepaid drawdown", prepaidCredits: 120000 },
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage", type: "usage", quantity: 0, unitPrice: 0.018, discount: 0, netAmount: 0, billingModel: "Per credit consumed", overageRate: 0.018 },
      { sku: "APEX-IMPL", name: "Implementation & Onboarding", type: "one-time", quantity: 1, unitPrice: 35000, discount: 0, netAmount: 35000, billingModel: "One-time" },
      { sku: "APEX-SUPPORT", name: "Premium Support – 24/7", type: "recurring", quantity: 1, unitPrice: 2500, discount: 0, netAmount: 2500, billingModel: "Flat / month" },
    ],
    commercialTerms: {
      contractTerm: "24 months",
      billingFrequency: "Annual upfront",
      paymentTerms: "Net 45",
      startDate: "2026-05-01",
      endDate: "2028-04-30",
      autoRenew: true,
      trialPeriod: "None",
      coTermTarget: "Align to existing Apex Platform contract end date",
      aiUsageDrawdown: "Credits consumed at metered rate; overage billed monthly in arrears at $0.018/credit",
      prepaidCreditLogic: "120,000 credits valid for 24 months; unused credits expire at term end; no refund",
    },
    relatedContractId: "CON-2024-0189",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000004xK3Z",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 523600,
    sendHistory: [
      { date: "2026-03-20", method: "Email", status: "Delivered" },
      { date: "2026-03-25", method: "DocuSign", status: "Viewed" },
    ],
    customerViewedAt: "2026-03-25T14:32:00Z",
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-15", action: "Quote created", actor: "Jordan Kim", detail: "Version 1 from Salesforce opportunity" },
      { date: "2026-03-17", action: "Quote edited", actor: "Jordan Kim", detail: "Added AI credit block, increased seats to 400" },
      { date: "2026-03-18", action: "Version 2 created", actor: "Jordan Kim" },
      { date: "2026-03-20", action: "Sent to customer", actor: "Jordan Kim", detail: "Via email" },
      { date: "2026-03-22", action: "Quote edited", actor: "Priya Mehta", detail: "Applied 18% discount per customer request" },
      { date: "2026-03-22", action: "Version 3 created", actor: "Priya Mehta" },
      { date: "2026-03-25", action: "Sent via DocuSign", actor: "Jordan Kim" },
      { date: "2026-03-25", action: "Customer viewed", actor: "Echo Corp", detail: "CFO Mira Patel opened document" },
      { date: "2026-03-28", action: "Submitted for approval", actor: "Jordan Kim", detail: "Routed to VP Revenue" },
    ],
    comments: [
      { id: "q-0042-c1", author: "Jordan Kim", role: "Account Executive", date: "2026-03-28", text: "Customer is willing to commit for 24 months if we keep the 18% blended discount and include premium support." },
      { id: "q-0042-c2", author: "Priya Mehta", role: "Deal Desk Manager", date: "2026-03-29", text: "Pricing is within strategic renewal guardrails. Need VP Revenue approval because TCV exceeds $500k." },
      { id: "q-0042-c3", author: "Sarah Chen", role: "VP Revenue", date: "2026-03-30", text: "Please confirm finance sign-off on Net 45 terms before final approval." },
      { id: "q-0042-c4", author: "Alex Nguyen", role: "Billing Operations", date: "2026-03-31", text: "Billing setup supports annual upfront plus monthly overage. No implementation blockers." },
    ],
    owner: "Jordan Kim",
    teamCommentsUnread: 2,
  },
  {
    id: "QT-2026-0042-v2",
    customerId: "cust_echo_001",
    lineageId: "lineage_echo_renewal_2026",
    version: 2,
    versionSummary: "Renewal with 350 seats and 15% discount; rejected due to missing AI credit block requested by customer.",
    rejectionReason: "Rejected by customer: needed explicit AI prepaid credits and clearer overage terms.",
    source: "Salesforce",
    status: "Rejected",
    quoteType: "Renewal",
    amount: 468000,
    arr: 234000,
    tcv: 468000,
    discountPct: 15,
    expiryDate: "2026-04-18",
    approval: {
      status: "rejected",
      triggeredRules: ["Customer requested AI credit structure update"],
      currentApprover: "Sarah Chen, VP Revenue",
      comments: "Superseded after customer feedback on AI credits and overage clarity.",
      pendingSince: "",
    },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 350, unitPrice: 45, discount: 15, netAmount: 13388, billingModel: "Per seat / month", minimumCommit: 105000 },
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage", type: "usage", quantity: 0, unitPrice: 0.02, discount: 0, netAmount: 0, billingModel: "Per credit consumed", overageRate: 0.02 },
      { sku: "APEX-IMPL", name: "Implementation & Onboarding", type: "one-time", quantity: 1, unitPrice: 30000, discount: 0, netAmount: 30000, billingModel: "One-time" },
    ],
    commercialTerms: {
      contractTerm: "24 months",
      billingFrequency: "Annual upfront",
      paymentTerms: "Net 30",
      startDate: "2026-05-01",
      endDate: "2028-04-30",
      autoRenew: true,
      trialPeriod: "None",
      coTermTarget: "Align to existing Apex Platform contract end date",
      aiUsageDrawdown: "Metered overage at $0.020/credit billed monthly in arrears",
      prepaidCreditLogic: "No prepaid block included in this version",
    },
    relatedContractId: "CON-2024-0189",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000004xK3Z",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 468000,
    sendHistory: [{ date: "2026-03-18", method: "Email", status: "Delivered" }],
    customerViewedAt: "2026-03-19T12:20:00Z",
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-15", action: "Quote created", actor: "Jordan Kim" },
      { date: "2026-03-18", action: "Sent to customer", actor: "Jordan Kim" },
      { date: "2026-03-21", action: "Rejected by customer", actor: "Echo Corp", detail: "Requested prepaid AI credits and revised terms" },
    ],
    comments: [
      { id: "q-0042v2-c1", author: "Mira Patel", role: "Customer CFO", date: "2026-03-21", text: "Please add prepaid AI credits and more predictable overage treatment." },
      { id: "q-0042v2-c2", author: "Jordan Kim", role: "Account Executive", date: "2026-03-21", text: "Customer requested structural changes, creating a new version." },
    ],
    owner: "Jordan Kim",
  },
  {
    id: "QT-2026-0042-v1",
    customerId: "cust_echo_001",
    lineageId: "lineage_echo_renewal_2026",
    version: 1,
    versionSummary: "Initial renewal draft at 300 seats, rejected internally due to weak expansion package.",
    rejectionReason: "Rejected by internal approver: package did not include implementation and support uplift for expansion.",
    source: "Salesforce",
    status: "Rejected",
    quoteType: "Renewal",
    amount: 398400,
    arr: 199200,
    tcv: 398400,
    discountPct: 12,
    expiryDate: "2026-04-10",
    approval: {
      status: "rejected",
      triggeredRules: ["Expansion package incomplete for customer growth plan"],
      currentApprover: "Priya Mehta, Deal Desk",
      comments: "Rejected in internal review before customer send.",
      pendingSince: "",
    },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 300, unitPrice: 45, discount: 12, netAmount: 11880, billingModel: "Per seat / month", minimumCommit: 96000 },
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage", type: "usage", quantity: 0, unitPrice: 0.022, discount: 0, netAmount: 0, billingModel: "Per credit consumed", overageRate: 0.022 },
    ],
    commercialTerms: {
      contractTerm: "24 months",
      billingFrequency: "Annual upfront",
      paymentTerms: "Net 30",
      startDate: "2026-05-01",
      endDate: "2028-04-30",
      autoRenew: true,
      trialPeriod: "None",
      coTermTarget: "Align to existing Apex Platform contract end date",
      aiUsageDrawdown: "Metered at $0.022/credit",
      prepaidCreditLogic: "No prepaid block included in this version",
    },
    relatedContractId: "CON-2024-0189",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000004xK3Z",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 398400,
    sendHistory: [],
    customerViewedAt: null,
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-15", action: "Quote created", actor: "Jordan Kim" },
      { date: "2026-03-16", action: "Rejected in internal review", actor: "Priya Mehta", detail: "Expansion package needs implementation + support uplift" },
    ],
    comments: [
      { id: "q-0042v1-c1", author: "Priya Mehta", role: "Deal Desk Manager", date: "2026-03-16", text: "Please include implementation and support components before submission." },
    ],
    owner: "Jordan Kim",
  },
  {
    id: "QT-2026-0038",
    customerId: "cust_lumina_002",
    lineageId: "lineage_lumina_renewal_2026",
    version: 1,
    versionSummary: "Signed renewal with 10% discount and prepaid AI credits; customer already accepted via DocuSign.",
    source: "In-app",
    status: "Accepted",
    quoteType: "Renewal",
    amount: 342000,
    arr: 342000,
    tcv: 684000,
    discountPct: 10,
    expiryDate: "2026-04-20",
    approval: { status: "approved", triggeredRules: ["Discount exceeds 10% threshold"], currentApprover: "Sarah Chen, VP Revenue", comments: "Approved – loyal customer, justified discount.", pendingSince: "" },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 250, unitPrice: 52, discount: 10, netAmount: 11700, billingModel: "Per seat / month" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 80000, discount: 0, netAmount: 80000, billingModel: "Prepaid drawdown", prepaidCredits: 80000 },
    ],
    commercialTerms: { contractTerm: "24 months", billingFrequency: "Annual upfront", paymentTerms: "Net 30", startDate: "2026-05-01", endDate: "2028-04-30", autoRenew: true, trialPeriod: "None", coTermTarget: "N/A", aiUsageDrawdown: "Metered, overage at $0.020/credit", prepaidCreditLogic: "80k credits, 24mo validity" },
    relatedContractId: "CON-2024-0201",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000005yL4A",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 342000,
    sendHistory: [{ date: "2026-04-01", method: "DocuSign", status: "Accepted" }],
    customerViewedAt: "2026-04-01T10:00:00Z",
    customerAcceptedAt: "2026-04-01T10:15:00Z",
    timeline: [
      { date: "2026-03-20", action: "Quote created", actor: "Marcus Lee" },
      { date: "2026-03-28", action: "Approved", actor: "Sarah Chen" },
      { date: "2026-04-01", action: "Accepted by customer", actor: "Lumina AI" },
    ],
    comments: [
      { id: "q-0038-c1", author: "Marcus Lee", role: "Account Executive", date: "2026-03-28", text: "Renewal terms accepted on call, sending for signature." },
      { id: "q-0038-c2", author: "Sarah Chen", role: "VP Revenue", date: "2026-03-28", text: "Approved. Keep implementation scope unchanged from last term." },
      { id: "q-0038-c3", author: "Nina Rao", role: "Sales Operations", date: "2026-04-01", text: "DocuSign completed and CRM marked as Closed Won." },
    ],
    owner: "Marcus Lee",
  },
  {
    id: "QT-2026-0041",
    customerId: "cust_pioneer_004",
    lineageId: "lineage_pioneer_newbiz_2026",
    version: 2,
    versionSummary: "Revised new-business quote with 22% discount to displace incumbent; pending VP Revenue approval.",
    source: "Salesforce",
    status: "Pending Approval",
    quoteType: "New Business",
    amount: 186000,
    arr: 93000,
    tcv: 186000,
    discountPct: 22,
    expiryDate: "2026-04-15",
    approval: { status: "pending", triggeredRules: ["Discount exceeds 20% threshold", "New customer – requires deal desk review"], currentApprover: "Sarah Chen, VP Revenue", comments: "Competitive displacement. 22% discount to win from incumbent.", pendingSince: "2026-04-01" },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Growth", type: "recurring", quantity: 75, unitPrice: 40, discount: 22, netAmount: 2340, billingModel: "Per seat / month" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Starter Block", type: "one-time", quantity: 1, unitPrice: 30000, discount: 0, netAmount: 30000, billingModel: "Prepaid drawdown", prepaidCredits: 30000 },
    ],
    commercialTerms: { contractTerm: "24 months", billingFrequency: "Annual upfront", paymentTerms: "Net 30", startDate: "2026-05-01", endDate: "2028-04-30", autoRenew: true, trialPeriod: "30-day implementation", coTermTarget: "N/A", aiUsageDrawdown: "Metered at $0.025/credit", prepaidCreditLogic: "30k credits, 24mo validity" },
    relatedContractId: "",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000006zM5B",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 186000,
    sendHistory: [{ date: "2026-03-28", method: "Email", status: "Delivered" }],
    customerViewedAt: "2026-03-29T09:00:00Z",
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-25", action: "Quote created", actor: "Jordan Kim" },
      { date: "2026-03-28", action: "Sent to customer", actor: "Jordan Kim" },
      { date: "2026-04-01", action: "Submitted for approval", actor: "Jordan Kim" },
    ],
    comments: [
      { id: "q-0041-c1", author: "Jordan Kim", role: "Account Executive", date: "2026-04-01", text: "Competitive displacement. 22% discount to win from incumbent." },
      { id: "q-0041-c2", author: "Priya Mehta", role: "Deal Desk Manager", date: "2026-04-01", text: "Need formal note on implementation ramp and expansion assumptions." },
      { id: "q-0041-c3", author: "Sarah Chen", role: "VP Revenue", date: "2026-04-02", text: "Awaiting final finance review because discount is above 20%." },
      { id: "q-0041-c4", author: "Alex Nguyen", role: "Billing Operations", date: "2026-04-02", text: "Billing setup supports annual upfront for platform and prepaid credits." },
    ],
    owner: "Jordan Kim",
  },
  {
    id: "QT-2026-0041-v1",
    customerId: "cust_pioneer_004",
    lineageId: "lineage_pioneer_newbiz_2026",
    version: 1,
    versionSummary: "First commercial draft rejected internally because discount support narrative was insufficient.",
    rejectionReason: "Rejected by VP Sales: discount rationale was not strong enough for approval threshold.",
    source: "Salesforce",
    status: "Rejected",
    quoteType: "New Business",
    amount: 174000,
    arr: 87000,
    tcv: 174000,
    discountPct: 20,
    expiryDate: "2026-04-05",
    approval: {
      status: "rejected",
      triggeredRules: ["Discount exceeds 20% threshold"],
      currentApprover: "Sarah Chen, VP Revenue",
      comments: "Rejected. Provide competitor displacement evidence and implementation timeline.",
      pendingSince: "",
    },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Growth", type: "recurring", quantity: 75, unitPrice: 40, discount: 20, netAmount: 2400, billingModel: "Per seat / month" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Starter Block", type: "one-time", quantity: 1, unitPrice: 25000, discount: 0, netAmount: 25000, billingModel: "Prepaid drawdown", prepaidCredits: 25000 },
    ],
    commercialTerms: { contractTerm: "24 months", billingFrequency: "Annual upfront", paymentTerms: "Net 30", startDate: "2026-05-01", endDate: "2028-04-30", autoRenew: true, trialPeriod: "30-day implementation", coTermTarget: "N/A", aiUsageDrawdown: "Metered at $0.025/credit", prepaidCreditLogic: "25k credits, 24mo validity" },
    relatedContractId: "",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000006zM5B",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 174000,
    sendHistory: [],
    customerViewedAt: null,
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-24", action: "Quote created", actor: "Jordan Kim" },
      { date: "2026-03-25", action: "Rejected in approval review", actor: "Sarah Chen", detail: "Need stronger deal justification" },
    ],
    comments: [
      { id: "q-0041v1-c1", author: "Sarah Chen", role: "VP Revenue", date: "2026-03-25", text: "Rejected this version. Please include incumbent displacement details and risk mitigation." },
      { id: "q-0041v1-c2", author: "Jordan Kim", role: "Account Executive", date: "2026-03-25", text: "Will revise with customer-specific win plan and implementation timeline." },
    ],
    owner: "Jordan Kim",
  },
  {
    id: "QT-2026-0040",
    customerId: "cust_pioneer_004",
    lineageId: "lineage_pioneer_newbiz_2026",
    version: 0,
    versionSummary: "Original customer-facing draft rejected by the customer for missing AI credit flexibility.",
    rejectionReason: "Rejected by customer: requested AI credit block and clearer onboarding commitments.",
    source: "In-app",
    status: "Rejected",
    quoteType: "New Business",
    amount: 162000,
    arr: 81000,
    tcv: 162000,
    discountPct: 18,
    expiryDate: "2026-03-30",
    approval: {
      status: "rejected",
      triggeredRules: ["Customer feedback on commercial structure"],
      currentApprover: "Priya Mehta, Deal Desk",
      comments: "Customer rejected. Build new version with AI credits and stronger implementation package.",
      pendingSince: "",
    },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Growth", type: "recurring", quantity: 75, unitPrice: 40, discount: 18, netAmount: 2460, billingModel: "Per seat / month" },
    ],
    commercialTerms: { contractTerm: "24 months", billingFrequency: "Annual upfront", paymentTerms: "Net 30", startDate: "2026-05-01", endDate: "2028-04-30", autoRenew: true, trialPeriod: "None", coTermTarget: "N/A", aiUsageDrawdown: "No prepaid credits included", prepaidCreditLogic: "N/A" },
    relatedContractId: "",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000006zM5B",
    crmSyncStatus: "Mismatch",
    lastSyncedAmount: 162000,
    sendHistory: [{ date: "2026-03-20", method: "Email", status: "Delivered" }],
    customerViewedAt: "2026-03-21T11:05:00Z",
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-03-18", action: "Quote created", actor: "Jordan Kim" },
      { date: "2026-03-20", action: "Sent to customer", actor: "Jordan Kim" },
      { date: "2026-03-21", action: "Rejected by customer", actor: "Pioneer Systems", detail: "Requested AI credit flexibility and onboarding support" },
    ],
    comments: [
      { id: "q-0040-c1", author: "Pioneer Procurement", role: "Customer", date: "2026-03-21", text: "We need prepaid AI credits and explicit onboarding scope before moving forward." },
      { id: "q-0040-c2", author: "Jordan Kim", role: "Account Executive", date: "2026-03-21", text: "Acknowledged. Creating a revised version for re-review." },
    ],
    owner: "Jordan Kim",
  },
  {
    id: "QT-2026-0043",
    customerId: "cust_northlane_003",
    lineageId: "lineage_northlane_amend_2026",
    version: 1,
    versionSummary: "Draft amendment for 50-seat expansion, co-termed to existing contract.",
    source: "In-app",
    status: "Draft",
    quoteType: "Amendment",
    amount: 48000,
    arr: 48000,
    tcv: 48000,
    discountPct: 0,
    expiryDate: "2026-05-15",
    approval: { status: "not_required", triggeredRules: [], currentApprover: "", comments: "", pendingSince: "" },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 50, unitPrice: 48, discount: 0, netAmount: 2400, billingModel: "Per seat / month (expansion)" },
    ],
    commercialTerms: { contractTerm: "Co-term", billingFrequency: "Annual upfront", paymentTerms: "Net 45", startDate: "2026-05-01", endDate: "2026-11-30", autoRenew: false, trialPeriod: "None", coTermTarget: "Align to CON-2025-0022 end date", aiUsageDrawdown: "N/A", prepaidCreditLogic: "N/A" },
    relatedContractId: "CON-2025-0022",
    crmOpportunityLink: "",
    crmSyncStatus: "Not linked",
    lastSyncedAmount: 0,
    sendHistory: [],
    customerViewedAt: null,
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-04-02", action: "Amendment quote created", actor: "Sophia Brandt", detail: "50 seat expansion for Northlane Labs" },
    ],
    comments: [
      { id: "q-0043-c1", author: "Sophia Brandt", role: "Account Manager", date: "2026-04-02", text: "Draft created for seat expansion; awaiting customer confirmation on go-live date." },
    ],
    owner: "Sophia Brandt",
  },
  {
    id: "QT-2026-0044",
    customerId: "cust_verdant_005",
    lineageId: "lineage_verdant_topup_2026",
    version: 1,
    versionSummary: "Urgent AI credit top-up quote, approved within policy and sent via DocuSign.",
    source: "Salesforce",
    status: "Sent",
    quoteType: "Credit Top-up",
    amount: 60000,
    arr: 0,
    tcv: 60000,
    discountPct: 5,
    expiryDate: "2026-04-08",
    approval: { status: "approved", triggeredRules: [], currentApprover: "", comments: "Auto-approved – credit top-up within policy.", pendingSince: "" },
    products: [
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Top-up Block", type: "one-time", quantity: 1, unitPrice: 60000, discount: 5, netAmount: 57000, billingModel: "Prepaid drawdown", prepaidCredits: 60000 },
    ],
    commercialTerms: { contractTerm: "Co-term", billingFrequency: "Immediate", paymentTerms: "Net 30", startDate: "2026-04-10", endDate: "2026-09-30", autoRenew: false, trialPeriod: "None", coTermTarget: "Align to CON-2025-0034 end date", aiUsageDrawdown: "Metered at $0.020/credit", prepaidCreditLogic: "60k credits, valid to contract end" },
    relatedContractId: "CON-2025-0034",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000007aO6C",
    crmSyncStatus: "Synced",
    lastSyncedAmount: 57000,
    sendHistory: [{ date: "2026-04-02", method: "DocuSign", status: "Delivered" }],
    customerViewedAt: null,
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-04-01", action: "Quote created", actor: "Marcus Lee", detail: "Urgent credit top-up – burn-down critical" },
      { date: "2026-04-02", action: "Sent via DocuSign", actor: "Marcus Lee" },
    ],
    comments: [
      { id: "q-0044-c1", author: "Marcus Lee", role: "Account Executive", date: "2026-04-01", text: "Customer requested immediate top-up to avoid service throttling." },
      { id: "q-0044-c2", author: "Finance Ops", role: "Finance", date: "2026-04-01", text: "Auto-approved under top-up policy threshold." },
    ],
    owner: "Marcus Lee",
  },
  {
    id: "QT-2026-0045",
    customerId: "cust_echo_001",
    lineageId: "lineage_echo_amend_2026",
    version: 1,
    versionSummary: "Draft amendment for additional 100 seats aligned to the active Echo renewal timeline.",
    source: "Salesforce",
    status: "Draft",
    quoteType: "Amendment",
    amount: 72000,
    arr: 72000,
    tcv: 72000,
    discountPct: 15,
    expiryDate: "2026-05-30",
    approval: { status: "not_required", triggeredRules: [], currentApprover: "", comments: "", pendingSince: "" },
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 100, unitPrice: 45, discount: 15, netAmount: 3825, billingModel: "Per seat / month (expansion)" },
    ],
    commercialTerms: { contractTerm: "Co-term", billingFrequency: "Annual upfront", paymentTerms: "Net 45", startDate: "2026-06-01", endDate: "2028-04-30", autoRenew: false, trialPeriod: "None", coTermTarget: "Align to renewal quote QT-2026-0042", aiUsageDrawdown: "N/A", prepaidCreditLogic: "N/A" },
    relatedContractId: "CON-2024-0189",
    crmOpportunityLink: "https://salesforce.example.com/opp/006Dn000004xK3Z",
    crmSyncStatus: "Mismatch",
    lastSyncedAmount: 65000,
    sendHistory: [],
    customerViewedAt: null,
    customerAcceptedAt: null,
    timeline: [
      { date: "2026-04-02", action: "Quote created", actor: "Jordan Kim", detail: "Seat expansion amendment" },
    ],
    comments: [
      { id: "q-0045-c1", author: "Jordan Kim", role: "Account Executive", date: "2026-04-02", text: "Expansion draft prepared; waiting on customer budget confirmation." },
    ],
    owner: "Jordan Kim",
  },
];

// Backward compat
export const quote: Quote = quotes[0];

// ---------------------------------------------------------------------------
// CONTRACTS
// ---------------------------------------------------------------------------

export const contracts: Contract[] = [
  {
    id: "CON-2024-0189",
    customerId: "cust_echo_001",
    sourceQuoteId: "QT-2024-0031",
    status: "Active",
    signedDate: "2024-06-28",
    effectiveDate: "2024-07-01",
    term: "24 months",
    endDate: "2026-06-30",
    tcv: 412800,
    minAnnualCommit: 180000,
    prepaidCreditBalance: 31400,
    prepaidCreditTotal: 80000,
    renewalDate: "2026-06-15",
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 150, unitPrice: 52, discountApplied: 12, minimumCommit: 180000, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 80000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 80000, overageRate: 0, billingCadence: "Prepaid" },
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage", type: "usage", quantity: 0, unitPrice: 0.022, discountApplied: 0, minimumCommit: 0, prepaidCredits: 0, overageRate: 0.022, billingCadence: "Monthly arrears" },
      { sku: "APEX-SUPPORT", name: "Premium Support", type: "recurring", quantity: 1, unitPrice: 2000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
    ],
    enforcement: {
      sourceType: "Linked Quote (QT-2024-0031)",
      linkedQuoteId: "QT-2024-0031",
      saleOrderStatus: "Completed",
      enforcementStatus: "Enforced",
      productMappingIssues: [],
      missingFields: ["Billing contact phone number"],
      provisioningStatus: "Active",
      entitlementStatus: "Active – 150 seats provisioned",
      manualOverrides: ["Support tier upgraded manually from Standard to Premium"],
      blockingIssues: [],
    },
    billingSchedule: [
      { date: "2024-07-01", amount: 93600, status: "Paid", invoiceId: "INV-2024-0401" },
      { date: "2024-07-01", amount: 80000, status: "Paid", invoiceId: "INV-2024-0402" },
      { date: "2025-07-01", amount: 93600, status: "Paid", invoiceId: "INV-2025-0188" },
      { date: "2025-08-01", amount: 1240, status: "Paid", invoiceId: "INV-2025-0201" },
      { date: "2025-09-01", amount: 890, status: "Paid", invoiceId: "INV-2025-0215" },
      { date: "2025-10-01", amount: 1680, status: "Paid", invoiceId: "INV-2025-0230" },
      { date: "2025-11-01", amount: 2100, status: "Paid", invoiceId: "INV-2025-0244" },
      { date: "2025-12-01", amount: 3400, status: "Paid", invoiceId: "INV-2025-0258" },
      { date: "2026-01-01", amount: 4200, status: "Paid", invoiceId: "INV-2026-0012" },
      { date: "2026-02-01", amount: 5800, status: "Overdue", invoiceId: "INV-2026-0034" },
      { date: "2026-03-01", amount: 6300, status: "Pending Review", holdReason: "PO number required" },
    ],
    amendments: [
      { id: "AMD-001", type: "Seat Expansion", effectiveDate: "2025-01-15", description: "Added 25 seats (125 → 150)", status: "Applied" },
      { id: "AMD-002", type: "Tier Upgrade", effectiveDate: "2025-06-01", description: "Support tier: Standard → Premium", status: "Applied" },
      { id: "AMD-003", type: "Credit Top-up", effectiveDate: "2025-09-01", description: "Added 20,000 AI credits at $0.020/credit", status: "Applied" },
    ],
    invoicesGenerated: 11,
    creditNotes: 1,
    openAr: 24300,
    paymentsReceived: 286910,
    unappliedCash: 0,
    revRecSummary: { recognized: 248400, deferred: 164400, status: "Healthy" },
    signedDocumentUrl: "#",
    ingestionTimestamp: "2024-06-28T16:45:00Z",
    extractionConfidence: 97,
    quoteMatchConfidence: 94,
    importantClauses: [
      "Auto-renewal at then-current rates",
      "60-day cancellation notice",
      "Minimum annual commit with true-up",
      "AI credit expiry at term end",
    ],
    comparisonToQuote: [
      { field: "Payment terms", quoteValue: "Net 30", contractValue: "Net 45" },
      { field: "Discount %", quoteValue: "15%", contractValue: "12%" },
      { field: "Effective date", quoteValue: "2024-06-15", contractValue: "2024-07-01" },
      { field: "Minimum commit", quoteValue: "$160,000", contractValue: "$180,000" },
    ],
    timeline: [
      { date: "2024-06-10", action: "Contract created from quote", actor: "System", detail: "Source: QT-2024-0031" },
      { date: "2024-06-28", action: "Contract signed", actor: "Echo Corp", detail: "Signed by CFO Mira Patel via DocuSign" },
      { date: "2024-07-01", action: "Contract enforced", actor: "System", detail: "Billing and entitlements activated" },
      { date: "2025-01-15", action: "Amendment applied", actor: "Alex Nguyen", detail: "25 seat expansion" },
      { date: "2025-06-01", action: "Amendment applied", actor: "Priya Mehta", detail: "Support tier upgrade" },
      { date: "2025-09-01", action: "Amendment applied", actor: "Alex Nguyen", detail: "AI credit top-up" },
      { date: "2026-02-01", action: "Invoice overdue", actor: "System", detail: "INV-2026-0034 past due by 30 days" },
      { date: "2026-03-01", action: "Invoice held", actor: "System", detail: "PO number required for INV-2026-0067" },
    ],
    paymentTerms: "Net 45",
    billingFrequency: "Annual upfront + monthly overage",
    coTermBehavior: "All amendments co-termed to 2026-06-30",
    owner: "Alex Nguyen",
  },
  {
    id: "CON-2024-0201",
    customerId: "cust_lumina_002",
    sourceQuoteId: "QT-2024-0028",
    status: "Active",
    signedDate: "2024-04-15",
    effectiveDate: "2024-05-01",
    term: "24 months",
    endDate: "2026-04-30",
    tcv: 684000,
    minAnnualCommit: 150000,
    prepaidCreditBalance: 52000,
    prepaidCreditTotal: 80000,
    renewalDate: "2026-04-25",
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 250, unitPrice: 52, discountApplied: 8, minimumCommit: 150000, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 80000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 80000, overageRate: 0, billingCadence: "Prepaid" },
    ],
    enforcement: {
      sourceType: "Linked Quote (QT-2024-0028)",
      linkedQuoteId: "QT-2024-0028",
      saleOrderStatus: "Completed",
      enforcementStatus: "Enforced",
      productMappingIssues: [],
      missingFields: [],
      provisioningStatus: "Active",
      entitlementStatus: "Active – 250 seats provisioned",
      manualOverrides: [],
      blockingIssues: [],
    },
    billingSchedule: [
      { date: "2024-05-01", amount: 143520, status: "Paid", invoiceId: "INV-2024-0310" },
      { date: "2024-05-01", amount: 80000, status: "Paid", invoiceId: "INV-2024-0311" },
      { date: "2025-05-01", amount: 143520, status: "Paid", invoiceId: "INV-2025-0142" },
      { date: "2026-04-01", amount: 8400, status: "Pending Review", invoiceId: "INV-2026-0041" },
    ],
    amendments: [],
    invoicesGenerated: 4,
    creditNotes: 0,
    openAr: 8400,
    paymentsReceived: 367040,
    unappliedCash: 0,
    revRecSummary: { recognized: 342000, deferred: 0, status: "Healthy" },
    signedDocumentUrl: "#",
    ingestionTimestamp: "2024-04-15T14:00:00Z",
    extractionConfidence: 99,
    quoteMatchConfidence: 98,
    importantClauses: ["Auto-renewal at then-current rates", "90-day cancellation notice"],
    comparisonToQuote: [],
    timeline: [
      { date: "2024-04-10", action: "Contract created from quote", actor: "System" },
      { date: "2024-04-15", action: "Contract signed", actor: "Lumina AI" },
      { date: "2024-05-01", action: "Contract enforced", actor: "System" },
    ],
    paymentTerms: "Net 30",
    billingFrequency: "Annual upfront",
    coTermBehavior: "N/A",
    owner: "Alex Nguyen",
  },
  {
    id: "CON-2025-0022",
    customerId: "cust_northlane_003",
    sourceQuoteId: "QT-2025-0019",
    status: "Active",
    signedDate: "2025-01-20",
    effectiveDate: "2025-02-01",
    term: "12 months",
    endDate: "2026-01-31",
    tcv: 396000,
    minAnnualCommit: 120000,
    prepaidCreditBalance: 12000,
    prepaidCreditTotal: 50000,
    renewalDate: "2026-11-30",
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 100, unitPrice: 48, discountApplied: 5, minimumCommit: 120000, prepaidCredits: 0, overageRate: 0, billingCadence: "Quarterly" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 50000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 50000, overageRate: 0, billingCadence: "Prepaid" },
    ],
    enforcement: {
      sourceType: "Linked Quote (QT-2025-0019)",
      linkedQuoteId: "QT-2025-0019",
      saleOrderStatus: "Completed",
      enforcementStatus: "Partial",
      productMappingIssues: ["AI Credits SKU mapping incomplete – overage tier not configured"],
      missingFields: ["Tax registration number", "PO number for Q2 2026"],
      provisioningStatus: "Partial",
      entitlementStatus: "Active – 100 seats, AI credits pending overage config",
      manualOverrides: [],
      blockingIssues: ["Overage billing cannot start until SKU mapping is fixed"],
    },
    billingSchedule: [
      { date: "2025-02-01", amount: 45600, status: "Paid", invoiceId: "INV-2025-0055" },
      { date: "2025-05-01", amount: 45600, status: "Paid", invoiceId: "INV-2025-0120" },
      { date: "2025-08-01", amount: 45600, status: "Paid", invoiceId: "INV-2025-0185" },
      { date: "2025-11-01", amount: 45600, status: "Paid", invoiceId: "INV-2025-0250" },
      { date: "2026-02-01", amount: 31200, status: "Overdue", invoiceId: "INV-2026-0040" },
    ],
    amendments: [
      { id: "AMD-NL-001", type: "Term Extension", effectiveDate: "2026-02-01", description: "Extended to Nov 2026 pending renewal negotiation", status: "In Progress" },
    ],
    invoicesGenerated: 5,
    creditNotes: 0,
    openAr: 31200,
    paymentsReceived: 182400,
    unappliedCash: 0,
    revRecSummary: { recognized: 180000, deferred: 36000, status: "Review Required" },
    signedDocumentUrl: "#",
    ingestionTimestamp: "2025-01-20T11:00:00Z",
    extractionConfidence: 92,
    quoteMatchConfidence: 88,
    importantClauses: ["Quarterly billing", "60-day cancellation notice"],
    comparisonToQuote: [
      { field: "Billing cadence", quoteValue: "Annual", contractValue: "Quarterly" },
    ],
    timeline: [
      { date: "2025-01-15", action: "Contract created from quote", actor: "System" },
      { date: "2025-01-20", action: "Contract signed", actor: "Northlane Labs" },
      { date: "2025-02-01", action: "Contract enforced (partial)", actor: "System", detail: "Overage SKU mapping pending" },
      { date: "2026-02-01", action: "Invoice overdue", actor: "System", detail: "INV-2026-0040 past due" },
    ],
    paymentTerms: "Net 45",
    billingFrequency: "Quarterly",
    coTermBehavior: "N/A",
    owner: "Lena Schulz",
  },
  {
    id: "CON-INGEST-002",
    customerId: "cust_zenith_006",
    sourceQuoteId: "",
    status: "Active",
    signedDate: "2026-04-10",
    effectiveDate: "2026-05-01",
    term: "12 months",
    endDate: "2027-04-30",
    tcv: 155000,
    minAnnualCommit: 144000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    renewalDate: "2027-04-17",
    products: [
      { sku: "APEX-ANALYTICS-PRO", name: "Apex Analytics Pro", type: "recurring", quantity: 200, unitPrice: 60, discountApplied: 0, minimumCommit: 144000, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
      { sku: "APEX-SUPPORT", name: "Premium Support", type: "recurring", quantity: 1, unitPrice: 11000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
    ],
    enforcement: {
      sourceType: "Ingested PDF",
      linkedQuoteId: "",
      saleOrderStatus: "Pending",
      enforcementStatus: "Partial",
      productMappingIssues: ["Analytics Pro SKU mapping pending internal review"],
      missingFields: ["Billing contact email", "Tax registration number"],
      provisioningStatus: "Pending",
      entitlementStatus: "Pending – awaiting enforcement completion",
      manualOverrides: [],
      blockingIssues: ["Provisioning blocked until SKU mapping is complete"],
    },
    billingSchedule: [
      { date: "2026-05-01", amount: 155000, status: "Pending Review", invoiceId: "INV-INGEST-002" },
    ],
    amendments: [],
    invoicesGenerated: 1,
    creditNotes: 0,
    openAr: 155000,
    paymentsReceived: 0,
    unappliedCash: 0,
    revRecSummary: { recognized: 0, deferred: 155000, status: "Not Started" },
    signedDocumentUrl: "#",
    ingestionTimestamp: "2026-04-10T09:30:00Z",
    extractionConfidence: 91,
    quoteMatchConfidence: 0,
    importantClauses: ["Annual billing upfront", "60-day cancellation notice"],
    comparisonToQuote: [],
    timeline: [
      { date: "2026-04-10", action: "Contract ingested from PDF", actor: "System", detail: "Extraction confidence: 91%" },
      { date: "2026-04-10", action: "Enforcement pending", actor: "System", detail: "Awaiting SKU mapping and provisioning review" },
    ],
    paymentTerms: "Net 30",
    billingFrequency: "Annual upfront",
    coTermBehavior: "N/A",
    owner: "Alex Nguyen",
  },
  {
    id: "CON-2025-0034",
    customerId: "cust_verdant_005",
    sourceQuoteId: "QT-2025-0030",
    status: "Active",
    signedDate: "2024-10-01",
    effectiveDate: "2024-10-01",
    term: "24 months",
    endDate: "2026-09-30",
    tcv: 528000,
    minAnnualCommit: 200000,
    prepaidCreditBalance: 8200,
    prepaidCreditTotal: 60000,
    renewalDate: "2026-09-30",
    products: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise", type: "recurring", quantity: 200, unitPrice: 50, discountApplied: 10, minimumCommit: 200000, prepaidCredits: 0, overageRate: 0, billingCadence: "Annual upfront" },
      { sku: "APEX-AI-CREDITS", name: "AI Agent Credits – Prepaid Block", type: "one-time", quantity: 1, unitPrice: 60000, discountApplied: 0, minimumCommit: 0, prepaidCredits: 60000, overageRate: 0, billingCadence: "Prepaid" },
    ],
    enforcement: {
      sourceType: "Linked Quote (QT-2025-0030)",
      linkedQuoteId: "QT-2025-0030",
      saleOrderStatus: "Completed",
      enforcementStatus: "Enforced",
      productMappingIssues: [],
      missingFields: ["PO number for Year 2 invoice"],
      provisioningStatus: "Active",
      entitlementStatus: "Active – 200 seats provisioned",
      manualOverrides: [],
      blockingIssues: [],
    },
    billingSchedule: [
      { date: "2024-10-01", amount: 108000, status: "Paid", invoiceId: "INV-2024-0510" },
      { date: "2024-10-01", amount: 60000, status: "Paid", invoiceId: "INV-2024-0511" },
      { date: "2025-10-01", amount: 108000, status: "Paid", invoiceId: "INV-2025-0310" },
      { date: "2026-03-01", amount: 12800, status: "Pending Review", invoiceId: "INV-2026-0042", holdReason: "Missing PO number" },
    ],
    amendments: [],
    invoicesGenerated: 4,
    creditNotes: 0,
    openAr: 12800,
    paymentsReceived: 276000,
    unappliedCash: 0,
    revRecSummary: { recognized: 264000, deferred: 0, status: "Healthy" },
    signedDocumentUrl: "#",
    ingestionTimestamp: "2024-10-01T09:00:00Z",
    extractionConfidence: 96,
    quoteMatchConfidence: 96,
    importantClauses: ["Annual billing", "90-day cancellation notice", "Credit expiry at term end"],
    comparisonToQuote: [],
    timeline: [
      { date: "2024-09-25", action: "Contract created from quote", actor: "System" },
      { date: "2024-10-01", action: "Contract signed", actor: "Verdant Health" },
      { date: "2024-10-01", action: "Contract enforced", actor: "System" },
    ],
    paymentTerms: "Net 30",
    billingFrequency: "Annual upfront",
    coTermBehavior: "N/A",
    owner: "Lena Schulz",
  },
];

// Backward compat
export const contract: Contract = contracts[0];

// ---------------------------------------------------------------------------
// INVOICES
// ---------------------------------------------------------------------------

export const invoices: Invoice[] = [
  {
    id: "INV-2026-0034",
    customerId: "cust_echo_001",
    contractId: "CON-2024-0189",
    date: "2026-02-01",
    dueDate: "2026-03-18",
    amount: 5800,
    status: "Overdue",
    lineItems: [
      { description: "AI Agent Credits – Overage (Jan 2026)", amount: 4200 },
      { description: "Premium Support – Monthly Prorate", amount: 1600 },
    ],
    owner: "Alex Nguyen",
  },
  {
    id: "INV-2026-0012",
    customerId: "cust_echo_001",
    contractId: "CON-2024-0189",
    date: "2026-01-01",
    dueDate: "2026-02-15",
    amount: 4200,
    status: "Paid",
    lineItems: [
      { description: "AI Agent Credits – Overage (Dec 2025)", amount: 4200 },
    ],
    owner: "Alex Nguyen",
  },
  {
    id: "INV-2026-0040",
    customerId: "cust_northlane_003",
    contractId: "CON-2025-0022",
    date: "2026-02-01",
    dueDate: "2026-03-18",
    amount: 31200,
    status: "Overdue",
    lineItems: [
      { description: "Apex Platform – Enterprise (Q1 2026)", amount: 27360 },
      { description: "AI Agent Credits – Overage (Q4 2025)", amount: 3840 },
    ],
    owner: "Lena Schulz",
  },
  {
    id: "INV-2026-0041",
    customerId: "cust_lumina_002",
    contractId: "CON-2024-0201",
    date: "2026-04-01",
    dueDate: "2026-05-01",
    amount: 8400,
    status: "Pending Review",
    lineItems: [
      { description: "AI Agent Credits – Overage (Mar 2026)", amount: 8400 },
    ],
    owner: "Alex Nguyen",
  },
  {
    id: "INV-2026-0042",
    customerId: "cust_verdant_005",
    contractId: "CON-2025-0034",
    date: "2026-03-01",
    dueDate: "2026-03-31",
    amount: 12800,
    status: "Pending Review",
    holdReason: "Missing PO number",
    lineItems: [
      { description: "AI Agent Credits – Overage (Feb 2026)", amount: 12800 },
    ],
    owner: "Lena Schulz",
  },
  {
    id: "INV-2026-0043",
    customerId: "cust_pioneer_004",
    contractId: "",
    date: "2026-03-28",
    dueDate: "2026-04-28",
    amount: 2340,
    status: "Pending Review",
    lineItems: [
      { description: "Apex Platform – Growth (pro-rated setup)", amount: 2340 },
    ],
    owner: "Alex Nguyen",
  },
  {
    id: "INV-2026-0044",
    customerId: "cust_echo_001",
    contractId: "CON-2024-0189",
    date: "2026-03-01",
    dueDate: "2026-04-15",
    amount: 6300,
    status: "Pending Review",
    holdReason: "PO number required",
    lineItems: [
      { description: "AI Agent Credits – Overage (Feb 2026)", amount: 6300 },
    ],
    owner: "Alex Nguyen",
  },
  // Ingest-created invoices (generated by the Contract Ingestion flow)
  {
    id: "INV-INGEST-001",
    customerId: "cust_echo_001",
    contractId: "CON-2026-0190",
    date: "2026-05-01",
    dueDate: "2026-06-15",
    amount: 261800,
    status: "Pending Review",
    lineItems: [
      { description: "Apex Platform – Enterprise (400 seats, Year 1)", amount: 177120 },
      { description: "AI Agent Credits – Prepaid Block", amount: 120000 },
      { description: "Premium Support – 24/7 (Annual)", amount: 30000 },
      { description: "Implementation & Onboarding", amount: 35000 },
    ],
    owner: "Alex Nguyen",
  },
  {
    id: "INV-INGEST-002",
    customerId: "cust_zenith_006",
    contractId: "CON-INGEST-002",
    date: "2026-05-01",
    dueDate: "2026-06-01",
    amount: 155000,
    status: "Pending Review",
    lineItems: [
      { description: "Apex Analytics Pro – 200 seats × $60/seat (Annual)", amount: 144000 },
      { description: "Premium Support (Annual)", amount: 11000 },
    ],
    owner: "Alex Nguyen",
  },
];

// ---------------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------------

export const tasks: Task[] = [
  { id: "TSK-001", customerId: "cust_echo_001", title: "Resolve overdue invoice INV-2026-0034", type: "Billing", priority: "High", status: "Open", dueDate: "2026-04-05", assignee: "Alex Nguyen" },
  { id: "TSK-002", customerId: "cust_echo_001", title: "Collect PO number for March invoice", type: "Billing", priority: "Medium", status: "Open", dueDate: "2026-04-10", assignee: "Alex Nguyen" },
  { id: "TSK-003", customerId: "cust_echo_001", title: "Prepare renewal proposal for June 2026", type: "Renewal", priority: "High", status: "Open", dueDate: "2026-04-15", assignee: "Jordan Kim" },
  { id: "TSK-004", customerId: "cust_echo_001", title: "Review prepaid credit burn-down with CSM", type: "Usage", priority: "Medium", status: "Open", dueDate: "2026-04-08", assignee: "Priya Mehta" },
  { id: "TSK-005", customerId: "cust_lumina_002", title: "Finalize renewal contract from accepted quote", type: "Renewal", priority: "High", status: "Open", dueDate: "2026-04-20", assignee: "Marcus Lee" },
  { id: "TSK-006", customerId: "cust_northlane_003", title: "Fix overage SKU mapping for CON-2025-0022", type: "Enforcement", priority: "High", status: "Open", dueDate: "2026-04-08", assignee: "Lena Schulz" },
  { id: "TSK-007", customerId: "cust_northlane_003", title: "Resolve overdue invoice INV-2026-0040", type: "Billing", priority: "High", status: "Open", dueDate: "2026-04-05", assignee: "Lena Schulz" },
  { id: "TSK-008", customerId: "cust_verdant_005", title: "Obtain PO number for INV-2026-0042", type: "Billing", priority: "Medium", status: "Open", dueDate: "2026-04-10", assignee: "Lena Schulz" },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getCustomer(id?: string): Customer {
  if (!id) return customers[0];
  return customers.find((c) => c.id === id) ?? customers[0];
}

export function getCustomerForQuote(quoteId: string): Customer {
  const q = quotes.find((qt) => qt.id === quoteId);
  return q ? getCustomer(q.customerId) : customers[0];
}

export function getCustomerForContract(contractId: string): Customer {
  const c = contracts.find((ct) => ct.id === contractId);
  return c ? getCustomer(c.customerId) : customers[0];
}

export function getCustomerForInvoice(invoiceId: string): Customer {
  const inv = invoices.find((i) => i.id === invoiceId);
  return inv ? getCustomer(inv.customerId) : customers[0];
}

export function getQuote(id?: string): Quote {
  if (!id) return quotes[0];
  return quotes.find((q) => q.id === id) ?? quotes[0];
}

export function getQuotesForCustomer(customerId: string): Quote[] {
  return quotes.filter((q) => q.customerId === customerId);
}

export function getQuoteLineage(lineageId: string): Quote[] {
  return quotes
    .filter((q) => q.lineageId === lineageId)
    .sort((a, b) => b.version - a.version);
}

export function getContract(id?: string): Contract {
  if (!id) return contracts[0];
  return contracts.find((c) => c.id === id) ?? contracts[0];
}

export function getContractsForCustomer(customerId: string): Contract[] {
  return contracts.filter((c) => c.customerId === customerId);
}

export function getInvoice(id: string): Invoice | undefined {
  return invoices.find((i) => i.id === id);
}

export function getInvoices(customerId?: string): Invoice[] {
  if (!customerId) return invoices;
  return invoices.filter((i) => i.customerId === customerId);
}

export function getTasks(customerId?: string): Task[] {
  if (!customerId) return tasks;
  return tasks.filter((t) => t.customerId === customerId);
}
