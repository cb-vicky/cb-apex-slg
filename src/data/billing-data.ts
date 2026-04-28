import { invoices } from "./mock-data";

// ---------------------------------------------------------------------------
// ENRICHED INVOICE TYPES
// ---------------------------------------------------------------------------

export interface InvoiceDetailLine {
  sku: string;
  name: string;
  type: "recurring" | "one-time" | "usage" | "credit";
  lineType: "platform_fee" | "prepaid_credit" | "usage_overage" | "true_up" | "minimum_commit" | "proration" | "support";
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  netAmount: number;
}

export interface ReviewCheck {
  label: string;
  status: "pass" | "warn" | "fail";
}

export interface DeliveryEvent {
  date: string;
  method: string;
  recipient: string;
  status: string;
}

export interface InvoiceEnrichment {
  billingPeriodStart: string;
  billingPeriodEnd: string;
  currency: string;
  paymentTerms: string;
  billToContact: string;
  poNumber: string;
  taxTotal: number;
  balanceDue: number;
  detailedLineItems: InvoiceDetailLine[];
  reviewChecklist: ReviewCheck[];
  deliveryHistory: DeliveryEvent[];
}

// ---------------------------------------------------------------------------
// CREDIT NOTE
// ---------------------------------------------------------------------------

export interface CreditNote {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: string;
  date: string;
  owner: string;
  contractId?: string;
  closureRelated?: boolean;
}

// ---------------------------------------------------------------------------
// PAYMENT
// ---------------------------------------------------------------------------

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  method: string;
  bankReference: string;
  receiptDate: string;
  matchStatus: "matched" | "partial" | "unapplied" | "reversed";
  allocations: PaymentAllocation[];
  reversals: number;
}

// ---------------------------------------------------------------------------
// COLLECTION CASE
// ---------------------------------------------------------------------------

export interface FollowUpEntry {
  date: string;
  action: string;
  note: string;
}

export interface CollectionCase {
  id: string;
  customerId: string;
  invoiceId: string;
  outstandingAmount: number;
  daysOverdue: number;
  stage: string;
  owner: string;
  ptpDate: string;
  nextStep: string;
  followUpHistory: FollowUpEntry[];
  escalated: boolean;
  lastContactSummary: string;
  disputeReason?: string;
  billingOwner?: string;
  issueCategory?: string;
  expectedResolutionDate?: string;
}

// ---------------------------------------------------------------------------
// INVOICE ENRICHMENT DATA
// ---------------------------------------------------------------------------

const enrichments: Record<string, InvoiceEnrichment> = {
  "INV-2026-0034": {
    billingPeriodStart: "2026-01-01",
    billingPeriodEnd: "2026-01-31",
    currency: "USD",
    paymentTerms: "Net 45",
    billToContact: "ap@echocorp.io",
    poNumber: "PO-EC-2026-018",
    taxTotal: 420,
    balanceDue: 5800,
    detailedLineItems: [
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Jan 2026)", type: "usage", lineType: "usage_overage", quantity: 21000, unitPrice: 0.02, discount: 0, tax: 306, netAmount: 4200 },
      { sku: "APEX-SUPPORT-PRO", name: "Premium Support – Monthly", type: "recurring", lineType: "support", quantity: 1, unitPrice: 1600, discount: 0, tax: 114, netAmount: 1600 },
    ],
    reviewChecklist: [
      { label: "Matches contract terms", status: "pass" },
      { label: "Approval for non-standard pricing", status: "pass" },
      { label: "Bill-to entity valid", status: "pass" },
      { label: "PO number available", status: "pass" },
      { label: "Tax configured", status: "pass" },
      { label: "Invoice contact valid", status: "pass" },
      { label: "Usage finalized", status: "pass" },
      { label: "No blocking dispute", status: "fail" },
      { label: "No amendment conflict", status: "pass" },
    ],
    deliveryHistory: [
      { date: "2026-02-01", method: "Email", recipient: "ap@echocorp.io", status: "Delivered" },
      { date: "2026-03-05", method: "Email", recipient: "ap@echocorp.io", status: "Reminder sent" },
      { date: "2026-03-20", method: "Email", recipient: "ap@echocorp.io", status: "Overdue notice" },
    ],
  },
  "INV-2026-0044": {
    billingPeriodStart: "2026-02-01",
    billingPeriodEnd: "2026-02-28",
    currency: "USD",
    paymentTerms: "Net 45",
    billToContact: "ap@echocorp.io",
    poNumber: "",
    taxTotal: 450,
    balanceDue: 6300,
    detailedLineItems: [
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Feb 2026)", type: "usage", lineType: "usage_overage", quantity: 31500, unitPrice: 0.02, discount: 0, tax: 450, netAmount: 6300 },
    ],
    reviewChecklist: [
      { label: "Matches contract terms", status: "pass" },
      { label: "Approval for non-standard pricing", status: "pass" },
      { label: "Bill-to entity valid", status: "pass" },
      { label: "PO number available", status: "fail" },
      { label: "Tax configured", status: "pass" },
      { label: "Invoice contact valid", status: "pass" },
      { label: "Usage finalized", status: "pass" },
      { label: "No blocking dispute", status: "pass" },
      { label: "No amendment conflict", status: "pass" },
    ],
    deliveryHistory: [],
  },
  "INV-2026-0012": {
    billingPeriodStart: "2025-12-01",
    billingPeriodEnd: "2025-12-31",
    currency: "USD",
    paymentTerms: "Net 45",
    billToContact: "ap@echocorp.io",
    poNumber: "PO-EC-2025-041",
    taxTotal: 300,
    balanceDue: 0,
    detailedLineItems: [
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Dec 2025)", type: "usage", lineType: "usage_overage", quantity: 21000, unitPrice: 0.02, discount: 0, tax: 300, netAmount: 4200 },
    ],
    reviewChecklist: [
      { label: "Matches contract terms", status: "pass" },
      { label: "Approval for non-standard pricing", status: "pass" },
      { label: "Bill-to entity valid", status: "pass" },
      { label: "PO number available", status: "pass" },
      { label: "Tax configured", status: "pass" },
      { label: "Invoice contact valid", status: "pass" },
      { label: "Usage finalized", status: "pass" },
      { label: "No blocking dispute", status: "pass" },
      { label: "No amendment conflict", status: "pass" },
    ],
    deliveryHistory: [
      { date: "2026-01-01", method: "Email", recipient: "ap@echocorp.io", status: "Delivered" },
      { date: "2026-01-15", method: "Email", recipient: "ap@echocorp.io", status: "Reminder sent" },
    ],
  },
  "INV-2026-0040": {
    billingPeriodStart: "2026-01-01",
    billingPeriodEnd: "2026-03-31",
    currency: "USD",
    paymentTerms: "Net 45",
    billToContact: "billing@northlane.io",
    poNumber: "PO-NL-2026-003",
    taxTotal: 2240,
    balanceDue: 31200,
    detailedLineItems: [
      { sku: "APEX-PLATFORM", name: "Apex Platform – Enterprise (Q1 2026)", type: "recurring", lineType: "platform_fee", quantity: 120, unitPrice: 228, discount: 0, tax: 1960, netAmount: 27360 },
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Q4 2025)", type: "usage", lineType: "usage_overage", quantity: 19200, unitPrice: 0.02, discount: 0, tax: 280, netAmount: 3840 },
    ],
    reviewChecklist: [
      { label: "Matches contract terms", status: "warn" },
      { label: "Approval for non-standard pricing", status: "pass" },
      { label: "Bill-to entity valid", status: "pass" },
      { label: "PO number available", status: "pass" },
      { label: "Tax configured", status: "pass" },
      { label: "Invoice contact valid", status: "pass" },
      { label: "Usage finalized", status: "warn" },
      { label: "No blocking dispute", status: "fail" },
      { label: "No amendment conflict", status: "warn" },
    ],
    deliveryHistory: [
      { date: "2026-02-01", method: "Email", recipient: "billing@northlane.io", status: "Delivered" },
      { date: "2026-03-01", method: "Email", recipient: "billing@northlane.io", status: "Reminder sent" },
    ],
  },
  "INV-2026-0042": {
    billingPeriodStart: "2026-02-01",
    billingPeriodEnd: "2026-02-28",
    currency: "USD",
    paymentTerms: "Net 30",
    billToContact: "finance@verdanthealth.com",
    poNumber: "",
    taxTotal: 920,
    balanceDue: 12800,
    detailedLineItems: [
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Feb 2026)", type: "usage", lineType: "usage_overage", quantity: 64000, unitPrice: 0.02, discount: 0, tax: 920, netAmount: 12800 },
    ],
    reviewChecklist: [
      { label: "Matches contract terms", status: "pass" },
      { label: "Approval for non-standard pricing", status: "pass" },
      { label: "Bill-to entity valid", status: "pass" },
      { label: "PO number available", status: "fail" },
      { label: "Tax configured", status: "pass" },
      { label: "Invoice contact valid", status: "pass" },
      { label: "Usage finalized", status: "pass" },
      { label: "No blocking dispute", status: "pass" },
      { label: "No amendment conflict", status: "pass" },
    ],
    deliveryHistory: [],
  },
};

// ---------------------------------------------------------------------------
// CREDIT NOTES DATA
// ---------------------------------------------------------------------------

export const creditNotes: CreditNote[] = [
  {
    id: "CN-2026-0001",
    invoiceId: "INV-2026-0034",
    customerId: "cust_echo_001",
    amount: 1200,
    reason: "Usage recalculation – metered overage overcharged by 6,000 credits due to duplicate event ingestion",
    status: "Issued",
    date: "2026-03-15",
    owner: "Alex Nguyen",
  },
  {
    id: "CN-2026-0002",
    invoiceId: "INV-2026-0040",
    customerId: "cust_northlane_003",
    amount: 3840,
    reason: "Q4 2025 overage disputed – usage meter not finalized at invoice generation; overage SKU mapping was pending",
    status: "Pending Approval",
    date: "2026-03-28",
    owner: "Lena Schulz",
  },
  {
    id: "CN-2026-0003",
    invoiceId: "",
    customerId: "cust_lumina_002",
    amount: 52000,
    reason: "Contract early termination – unused prepaid AI credits (52,000 of 80,000 original balance) refunded per mutual agreement. Contract CON-2024-0201 closing effective May 1, 2026.",
    status: "Pending Approval",
    date: "2026-04-25",
    owner: "Alex Nguyen",
    contractId: "CON-2024-0201",
    closureRelated: true,
  },
  {
    id: "CN-2025-0018",
    invoiceId: "",
    customerId: "cust_echo_001",
    amount: 18400,
    reason: "Historical closure credit – prorated platform fees for early termination of legacy contract CON-2023-0089. Customer consolidated to new enterprise agreement.",
    status: "Issued",
    date: "2025-06-15",
    owner: "Alex Nguyen",
    contractId: "CON-2023-0089",
    closureRelated: true,
  },
];

// ---------------------------------------------------------------------------
// PAYMENTS DATA
// ---------------------------------------------------------------------------

export const payments: Payment[] = [
  {
    id: "PMT-2026-0001",
    customerId: "cust_echo_001",
    amount: 4200,
    method: "Wire Transfer",
    bankReference: "WT-ECHO-20260215-4200",
    receiptDate: "2026-02-15",
    matchStatus: "matched",
    allocations: [{ invoiceId: "INV-2026-0012", amount: 4200 }],
    reversals: 0,
  },
  {
    id: "PMT-2026-0002",
    customerId: "cust_echo_001",
    amount: 4600,
    method: "Wire Transfer",
    bankReference: "WT-ECHO-20260320-4600",
    receiptDate: "2026-03-20",
    matchStatus: "partial",
    allocations: [{ invoiceId: "INV-2026-0034", amount: 4600 }],
    reversals: 0,
  },
  {
    id: "PMT-2026-0003",
    customerId: "cust_northlane_003",
    amount: 28000,
    method: "ACH",
    bankReference: "ACH-NL-REF-8827451",
    receiptDate: "2026-03-25",
    matchStatus: "unapplied",
    allocations: [],
    reversals: 0,
  },
  {
    id: "PMT-2026-0004",
    customerId: "cust_verdant_005",
    amount: 108000,
    method: "Wire Transfer",
    bankReference: "WT-VH-20251015-108K",
    receiptDate: "2025-10-15",
    matchStatus: "matched",
    allocations: [{ invoiceId: "INV-2025-0310", amount: 108000 }],
    reversals: 0,
  },
];

// ---------------------------------------------------------------------------
// COLLECTION CASES DATA
// ---------------------------------------------------------------------------

export const collectionCases: CollectionCase[] = [
  {
    id: "COL-2026-0001",
    customerId: "cust_echo_001",
    invoiceId: "INV-2026-0034",
    outstandingAmount: 1200,
    daysOverdue: 16,
    stage: "Overdue",
    owner: "Priya Mehta",
    ptpDate: "2026-04-10",
    nextStep: "Follow up on promised payment – customer committed to wire by Apr 10",
    followUpHistory: [
      { date: "2026-03-20", action: "Overdue notice sent", note: "Automated 2-day reminder" },
      { date: "2026-03-25", action: "Email follow-up", note: "AP team acknowledged, cited internal budget freeze" },
      { date: "2026-03-28", action: "Call with AP manager", note: "Confirmed partial wire sent ($4,600). Remaining $1,200 promised by Apr 10 after credit note processing" },
      { date: "2026-04-01", action: "Partial payment received", note: "$4,600 wire received and matched to INV-2026-0034" },
    ],
    escalated: false,
    lastContactSummary: "AP manager confirmed remaining $1,200 to be paid after CN-2026-0001 is finalized. Budget was frozen in Feb; released in March.",
    disputeReason: "Usage overage disputed – customer claims duplicate event ingestion inflated metered credits by ~6,000",
    billingOwner: "Alex Nguyen",
    issueCategory: "Usage dispute",
    expectedResolutionDate: "2026-04-10",
  },
  {
    id: "COL-2026-0002",
    customerId: "cust_northlane_003",
    invoiceId: "INV-2026-0040",
    outstandingAmount: 31200,
    daysOverdue: 16,
    stage: "No Response",
    owner: "Priya Mehta",
    ptpDate: "",
    nextStep: "Escalate to CSM – third attempt with no response from AP",
    followUpHistory: [
      { date: "2026-03-20", action: "Overdue notice sent", note: "Automated reminder" },
      { date: "2026-03-28", action: "Email follow-up", note: "No response from billing@northlane.io" },
      { date: "2026-04-01", action: "Second follow-up", note: "No response. Unapplied $28K ACH wire received but bank ref does not clearly match." },
    ],
    escalated: false,
    lastContactSummary: "No response from AP after 3 attempts. $28K ACH wire received on Mar 25 with reference ACH-NL-REF-8827451 — possible partial payment but cannot confirm without customer acknowledgement.",
    disputeReason: "Q4 2025 overage disputed – usage meter incomplete at invoice time",
    billingOwner: "Lena Schulz",
    issueCategory: "Non-responsive + usage dispute",
    expectedResolutionDate: "",
  },
];

// ---------------------------------------------------------------------------
// INVOICE SCHEDULE DATA (upcoming per customer)
// ---------------------------------------------------------------------------

export interface InvoiceScheduleEntry {
  date: string;
  estimatedAmount: number;
  type: string;
  holdState: string;
  dependency: string;
}

export const invoiceSchedules: Record<string, InvoiceScheduleEntry[]> = {
  cust_echo_001: [
    { date: "2026-04-01", estimatedAmount: 7100, type: "Usage overage (Mar 2026)", holdState: "None", dependency: "Usage finalization pending" },
    { date: "2026-05-01", estimatedAmount: 6800, type: "Usage overage (Apr 2026)", holdState: "None", dependency: "None" },
    { date: "2026-07-01", estimatedAmount: 168000, type: "Annual platform renewal", holdState: "Pending contract", dependency: "Renewal quote QT-2026-0042 not yet signed" },
  ],
  cust_northlane_003: [
    { date: "2026-05-01", estimatedAmount: 45600, type: "Quarterly platform (Q2 2026)", holdState: "None", dependency: "Term extension AMD-NL-001 in progress" },
  ],
  cust_verdant_005: [
    { date: "2026-04-01", estimatedAmount: 14200, type: "Usage overage (Mar 2026)", holdState: "PO required", dependency: "PO not yet received" },
    { date: "2026-10-01", estimatedAmount: 108000, type: "Annual platform renewal", holdState: "None", dependency: "None" },
  ],
};

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getInvoiceEnrichment(invoiceId: string): InvoiceEnrichment | undefined {
  return enrichments[invoiceId];
}

export function getCreditNotesForCustomer(customerId: string): CreditNote[] {
  return creditNotes.filter((cn) => cn.customerId === customerId);
}

export function getCreditNotesForInvoice(invoiceId: string): CreditNote[] {
  return creditNotes.filter((cn) => cn.invoiceId === invoiceId);
}

export function getCreditNotesForContract(contractId: string): CreditNote[] {
  return creditNotes.filter((cn) => cn.contractId === contractId);
}

export function getClosureCreditNotesForCustomer(customerId: string): CreditNote[] {
  return creditNotes.filter((cn) => cn.customerId === customerId && cn.closureRelated === true);
}

export function getPaymentsForCustomer(customerId: string): Payment[] {
  return payments.filter((p) => p.customerId === customerId);
}

export function getCollectionCasesForCustomer(customerId: string): CollectionCase[] {
  return collectionCases.filter((c) => c.customerId === customerId);
}

export function getInvoiceSchedule(customerId: string): InvoiceScheduleEntry[] {
  return invoiceSchedules[customerId] ?? [];
}

export function getCustomerArSummary(customerId: string) {
  const customerInvoices = invoices.filter((i) => i.customerId === customerId);
  const open = customerInvoices.filter((i) => i.status !== "Paid");
  const overdue = customerInvoices.filter((i) => i.status === "Overdue");
  const pendingReview = customerInvoices.filter((i) => i.status === "Pending Review");
  const held = customerInvoices.filter((i) => i.holdReason);
  const customerPayments = getPaymentsForCustomer(customerId);
  const unapplied = customerPayments.filter((p) => p.matchStatus === "unapplied").reduce((s, p) => s + p.amount, 0);
  const totalOpen = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const disputed = customerInvoices.filter((i) => i.disputeReason).reduce((s, i) => s + i.amount, 0);
  const totalInvoiced = customerInvoices.reduce((s, i) => s + i.amount, 0);

  return {
    totalOpen,
    totalOverdue,
    overdueCount: overdue.length,
    pendingReviewCount: pendingReview.length,
    heldCount: held.length,
    disputed,
    unappliedCash: unapplied,
    totalInvoiced,
    openInvoices: open,
    overdueInvoices: overdue,
    allInvoices: customerInvoices,
    avgDaysToPay: 22,
    oldestOutstandingDays: overdue.length > 0 ? Math.max(...overdue.map((i) => Math.round((Date.now() - new Date(i.dueDate).getTime()) / 86400000))) : 0,
  };
}
