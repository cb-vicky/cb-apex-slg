import type { Invoice } from "./mock-data";
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

/** Invoice paid after the due date (Collections → Delayed payments). */
export interface DelayedPayment {
  customerId: string;
  invoiceId: string;
  amount: number;
  daysLate: number;
  paidOn: string;
}

export type PromiseToPayEntryStatus = "scheduled" | "edited" | "failed" | "paid";

export interface PromiseToPayLogEntry {
  id: string;
  status: PromiseToPayEntryStatus;
  /** Amount promised for this revision (frozen when status becomes edited). */
  amount?: number;
  promisedFor?: string;
  paidOn?: string;
  /** Note for this revision only (frozen when status becomes edited). */
  note?: string;
  loggedOn: string;
  loggedByName: string;
  loggedByInitials: string;
}

function normalizePromiseNote(note?: string): string {
  return (note ?? "").trim();
}

/** Amount shown for a log line; falls back to record total when not set on the entry. */
export function getPromiseLogAmount(
  log: PromiseToPayLogEntry,
  recordAmount: number,
): number {
  return log.amount ?? recordAmount;
}

export function getPromiseLogNote(log: PromiseToPayLogEntry): string | undefined {
  const trimmed = normalizePromiseNote(log.note);
  return trimmed || undefined;
}

/** A promise-to-pay commitment: date + amount required; invoices optional (0..n). */
export interface PromiseToPayRecord {
  id: string;
  customerId: string;
  amount: number;
  invoiceIds: string[];
  logs: PromiseToPayLogEntry[];
}

/** Demo "today" for resolving scheduled → failed/paid transitions. */
export const PROMISE_TO_PAY_AS_OF = "2026-05-26";

/** Past-due scheduled promises become failed unless already paid on that date. */
export function resolvePromiseToPayLogs(
  logs: PromiseToPayLogEntry[],
  asOf: string = PROMISE_TO_PAY_AS_OF,
): PromiseToPayLogEntry[] {
  const paidEntry = logs.find((l) => l.status === "paid");

  return logs.map((log) => {
    if (log.status !== "scheduled" || !log.promisedFor) return log;
    if (log.promisedFor >= asOf) return log;

    if (paidEntry?.paidOn && paidEntry.paidOn <= log.promisedFor) {
      return { ...log, status: "paid" as const, paidOn: paidEntry.paidOn };
    }

    if (log.promisedFor < asOf) {
      return { ...log, status: "failed" as const };
    }

    return log;
  });
}

export function isPromiseSettled(record: PromiseToPayRecord): boolean {
  return resolvePromiseToPayLogs(record.logs).some((l) => l.status === "paid");
}

/** Open = latest activity is still an active scheduled promise. */
export function isPromiseOpen(record: PromiseToPayRecord): boolean {
  const primary = getPrimaryPromiseToPayLog(record);
  return primary?.status === "scheduled";
}

/** Display order for activity under a promise. */
export function sortPromiseToPayLogs(
  logs: PromiseToPayLogEntry[],
  settled = false,
  asOf: string = PROMISE_TO_PAY_AS_OF,
): PromiseToPayLogEntry[] {
  const resolved = resolvePromiseToPayLogs(logs, asOf);
  const byDateDesc = (a: PromiseToPayLogEntry, b: PromiseToPayLogEntry) => {
    const aDate = a.paidOn ?? a.promisedFor ?? a.loggedOn;
    const bDate = b.paidOn ?? b.promisedFor ?? b.loggedOn;
    return bDate.localeCompare(aDate);
  };

  if (settled) {
    const paid = resolved.filter((l) => l.status === "paid").sort(byDateDesc);
    const edited = resolved.filter((l) => l.status === "edited").sort(byDateDesc);
    const failed = resolved.filter((l) => l.status === "failed").sort(byDateDesc);
    const scheduled = resolved.filter((l) => l.status === "scheduled").sort(byDateDesc);
    return [...paid, ...edited, ...failed, ...scheduled];
  }

  const scheduled = resolved.filter((l) => l.status === "scheduled").sort(byDateDesc);
  const edited = resolved.filter((l) => l.status === "edited").sort(byDateDesc);
  const failed = resolved.filter((l) => l.status === "failed").sort(byDateDesc);
  return [...scheduled, ...edited, ...failed];
}

/** Most relevant log for list-row display. */
export function getPrimaryPromiseToPayLog(
  record: PromiseToPayRecord,
  asOf: string = PROMISE_TO_PAY_AS_OF,
): PromiseToPayLogEntry | undefined {
  return sortPromiseToPayLogs(record.logs, isPromiseSettled(record), asOf)[0];
}

function daysUntilPromisedDate(promisedFor: string, asOf: string = PROMISE_TO_PAY_AS_OF): number {
  const start = new Date(`${asOf}T00:00:00`);
  const end = new Date(`${promisedFor}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** List order: open/failed by nearest promise date to today, then paid (newest first). */
export function sortPromiseToPayRecords(records: PromiseToPayRecord[]): PromiseToPayRecord[] {
  return [...records].sort((a, b) => {
    const aSettled = isPromiseSettled(a);
    const bSettled = isPromiseSettled(b);
    if (aSettled !== bSettled) return aSettled ? 1 : -1;

    const aPrimary = getPrimaryPromiseToPayLog(a);
    const bPrimary = getPrimaryPromiseToPayLog(b);

    if (aSettled && bSettled) {
      const aDate = aPrimary?.paidOn ?? aPrimary?.loggedOn ?? "";
      const bDate = bPrimary?.paidOn ?? bPrimary?.loggedOn ?? "";
      return bDate.localeCompare(aDate);
    }

    const aFor = aPrimary?.promisedFor ?? "";
    const bFor = bPrimary?.promisedFor ?? "";
    const aDist = aFor ? Math.abs(daysUntilPromisedDate(aFor)) : Number.MAX_SAFE_INTEGER;
    const bDist = bFor ? Math.abs(daysUntilPromisedDate(bFor)) : Number.MAX_SAFE_INTEGER;
    if (aDist !== bDist) return aDist - bDist;
    return aFor.localeCompare(bFor);
  });
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
  "INV-2025-0258": {
    billingPeriodStart: "2025-10-01",
    billingPeriodEnd: "2025-10-31",
    currency: "USD",
    paymentTerms: "Net 30",
    billToContact: "ap@echocorp.io",
    poNumber: "PO-EC-2025-041",
    taxTotal: 240,
    balanceDue: 0,
    detailedLineItems: [
      { sku: "APEX-AI-OVERAGE", name: "AI Agent Credits – Overage (Oct 2025)", type: "usage", lineType: "usage_overage", quantity: 10500, unitPrice: 0.02, discount: 0, tax: 147, netAmount: 2100 },
      { sku: "APEX-SUPPORT-PRO", name: "Premium Support – Monthly (Oct 2025)", type: "recurring", lineType: "support", quantity: 1, unitPrice: 1300, discount: 0, tax: 93, netAmount: 1300 },
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
      { date: "2025-11-01", method: "Email", recipient: "ap@echocorp.io", status: "Delivered" },
      { date: "2025-11-18", method: "Email", recipient: "ap@echocorp.io", status: "Reminder sent" },
      { date: "2025-12-05", method: "Email", recipient: "ap@echocorp.io", status: "Overdue notice" },
    ],
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
    id: "PMT-2025-0007",
    customerId: "cust_echo_001",
    amount: 3400,
    method: "Wire Transfer",
    bankReference: "WT-ECHO-20251213-3400",
    receiptDate: "2025-12-13",
    matchStatus: "matched",
    allocations: [{ invoiceId: "INV-2025-0258", amount: 3400 }],
    reversals: 0,
  },
  {
    id: "PMT-2026-0001",
    customerId: "cust_echo_001",
    amount: 4200,
    method: "Wire Transfer",
    bankReference: "WT-ECHO-20260215-4200",
    receiptDate: "2026-02-23",
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
// DELAYED PAYMENTS (paid after due date)
// ---------------------------------------------------------------------------

export const delayedPayments: DelayedPayment[] = [
  {
    customerId: "cust_echo_001",
    invoiceId: "INV-2025-0258",
    amount: 3400,
    daysLate: 12,
    paidOn: "2025-12-13",
  },
  {
    customerId: "cust_verdant_005",
    invoiceId: "INV-2025-0310",
    amount: 108000,
    daysLate: 14,
    paidOn: "2025-10-15",
  },
  {
    customerId: "cust_northlane_003",
    invoiceId: "INV-2025-0142",
    amount: 143520,
    daysLate: 21,
    paidOn: "2025-05-22",
  },
];

// ---------------------------------------------------------------------------
// PROMISE TO PAY
// ---------------------------------------------------------------------------

function ownerInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const promiseToPayRecords: PromiseToPayRecord[] = [
  {
    id: "PTP-ECHO-0044",
    customerId: "cust_echo_001",
    amount: 6300,
    invoiceIds: ["INV-2026-0044"],
    logs: [
      {
        id: "PTP-LOG-0044-1",
        status: "scheduled",
        amount: 6300,
        promisedFor: "2026-06-15",
        note: "AP confirmed wire after Q2 close; follow up May 20 if not received.",
        loggedOn: "2026-05-11",
        loggedByName: "Lena Patel",
        loggedByInitials: "LP",
      },
    ],
  },
  {
    id: "PTP-ECHO-0034",
    customerId: "cust_echo_001",
    amount: 1200,
    invoiceIds: ["INV-2026-0034"],
    logs: [
      {
        id: "PTP-LOG-0034-3",
        status: "paid",
        amount: 1200,
        paidOn: "2026-05-08",
        loggedOn: "2026-05-08",
        loggedByName: "Sarah Mitchell",
        loggedByInitials: "SM",
      },
      {
        id: "PTP-LOG-0034-1",
        status: "scheduled",
        amount: 1200,
        promisedFor: "2026-04-10",
        loggedOn: "2026-03-28",
        loggedByName: "Lena Patel",
        loggedByInitials: "LP",
      },
    ],
  },
  {
    id: "PTP-ECHO-0258",
    customerId: "cust_echo_001",
    amount: 3400,
    invoiceIds: ["INV-2025-0258"],
    logs: [
      {
        id: "PTP-LOG-0258-6",
        status: "paid",
        amount: 3400,
        paidOn: "2025-12-13",
        note: "Wire WT-ECHO-20251213-3400 received and matched to INV-2025-0258 after treasury corrected beneficiary to Echo Corp Inc.",
        loggedOn: "2025-12-13",
        loggedByName: "Sarah Mitchell",
        loggedByInitials: "SM",
      },
      {
        id: "PTP-LOG-0258-5",
        status: "failed",
        amount: 3400,
        promisedFor: "2025-12-11",
        note: "AP confirmed wire release; bank returned same day — reference field omitted PO-EC-2025-041 required by Echo treasury.",
        loggedOn: "2025-12-09",
        loggedByName: "Lena Patel",
        loggedByInitials: "LP",
      },
      {
        id: "PTP-LOG-0258-4",
        status: "failed",
        amount: 3400,
        promisedFor: "2025-12-09",
        note: "Treasury queued batch but missed 2:00 PM PT same-day cut-off; rescheduled to Dec 11.",
        loggedOn: "2025-12-06",
        loggedByName: "Priya Mehta",
        loggedByInitials: "PM",
      },
      {
        id: "PTP-LOG-0258-3",
        status: "failed",
        amount: 3400,
        promisedFor: "2025-12-05",
        note: "Primary AP approver OOO until Dec 8; backup approver could not access Coupa — no wire initiated.",
        loggedOn: "2025-12-02",
        loggedByName: "Lena Patel",
        loggedByInitials: "LP",
      },
      {
        id: "PTP-LOG-0258-2",
        status: "failed",
        amount: 3400,
        promisedFor: "2025-11-29",
        note: "Month-end wire rejected by receiving bank — beneficiary listed as EchoCorp LLC; billing entity is Echo Corp Inc.",
        loggedOn: "2025-11-25",
        loggedByName: "Sarah Mitchell",
        loggedByInitials: "SM",
      },
      {
        id: "PTP-LOG-0258-1",
        status: "failed",
        amount: 3400,
        promisedFor: "2025-11-22",
        note: "CFO Mira Patel committed payment post–Q4 budget freeze; internal approval still pending on Nov 21 collections call.",
        loggedOn: "2025-11-18",
        loggedByName: "Priya Mehta",
        loggedByInitials: "PM",
      },
    ],
  },
  {
    id: "PTP-NL-0040",
    customerId: "cust_northlane_003",
    amount: 31200,
    invoiceIds: ["INV-2026-0040"],
    logs: [
      {
        id: "PTP-LOG-0040-1",
        status: "scheduled",
        amount: 31200,
        promisedFor: "2026-05-20",
        loggedOn: "2026-05-18",
        loggedByName: "Priya Mehta",
        loggedByInitials: "PM",
      },
    ],
  },
];

const runtimePromiseToPayRecords: PromiseToPayRecord[] = [];
let runtimePromiseToPayRecordCounter = 0;
let runtimePromiseToPayLogCounter = 0;
const runtimeLogStatusOverrides: Record<string, PromiseToPayEntryStatus> = {};
const runtimeAppendedLogs: Array<{
  promiseId: string;
  log: PromiseToPayLogEntry;
}> = [];
const runtimeRecordAmountOverrides: Record<string, number> = {};
/** Frozen amount when a revision is superseded. */
const runtimeLogAmountSnapshots: Record<string, number> = {};
/** Frozen note when a revision is superseded (key present = use value, may be undefined). */
const runtimeLogNoteSnapshots: Record<string, string | undefined> = {};

function applyLogStatusOverride(log: PromiseToPayLogEntry): PromiseToPayLogEntry {
  const override = runtimeLogStatusOverrides[log.id];
  const amountSnap = runtimeLogAmountSnapshots[log.id];
  const hasNoteSnap = Object.hasOwn(runtimeLogNoteSnapshots, log.id);
  let next = log;
  if (override) next = { ...next, status: override };
  if (amountSnap !== undefined) next = { ...next, amount: amountSnap };
  if (hasNoteSnap) next = { ...next, note: runtimeLogNoteSnapshots[log.id] };
  return next;
}

function markLogAsEdited(logId: string): void {
  runtimeLogStatusOverrides[logId] = "edited";
  for (const item of runtimeAppendedLogs) {
    if (item.log.id === logId) {
      item.log = { ...item.log, status: "edited" };
    }
  }
}

function applyRuntimePromiseToPayMutations(
  records: PromiseToPayRecord[],
): PromiseToPayRecord[] {
  return records.map((record) => {
    const appended = runtimeAppendedLogs
      .filter((a) => a.promiseId === record.id)
      .map((a) => a.log);

    const logsById = new Map<string, PromiseToPayLogEntry>();
    for (const log of record.logs.map(applyLogStatusOverride)) {
      logsById.set(log.id, log);
    }
    for (const log of appended.map(applyLogStatusOverride)) {
      logsById.set(log.id, log);
    }

    return {
      ...record,
      amount: runtimeRecordAmountOverrides[record.id] ?? record.amount,
      logs: [...logsById.values()],
    };
  });
}

export interface AddPromiseToPayParams {
  customerId: string;
  promisedDate: string;
  amount: number;
  invoiceIds: string[];
  loggedByName: string;
  note?: string;
}

/** Persist a new promise-to-pay record (one row per save). */
export function addPromiseToPay(params: AddPromiseToPayParams): void {
  const loggedOn = new Date().toISOString().slice(0, 10);
  const note = normalizePromiseNote(params.note);
  const log: PromiseToPayLogEntry = {
    id: `PTP-LOG-RUNTIME-${++runtimePromiseToPayLogCounter}`,
    status: "scheduled",
    amount: params.amount,
    promisedFor: params.promisedDate,
    ...(note ? { note } : {}),
    loggedOn,
    loggedByName: params.loggedByName,
    loggedByInitials: ownerInitials(params.loggedByName),
  };

  runtimePromiseToPayRecords.push({
    id: `PTP-RUNTIME-${++runtimePromiseToPayRecordCounter}`,
    customerId: params.customerId,
    amount: params.amount,
    invoiceIds: [...params.invoiceIds],
    logs: [log],
  });
}

export interface EditPromiseToPayParams {
  customerId: string;
  promiseId: string;
  logId: string;
  promisedDate: string;
  amount: number;
  loggedByName: string;
  note?: string;
}

export function findPromiseToPayLog(
  customerId: string,
  promiseId: string,
  logId: string,
): { record: PromiseToPayRecord; log: PromiseToPayLogEntry } | null {
  const record = getPromiseToPayForCustomer(customerId).find((r) => r.id === promiseId);
  const log = record?.logs.find((entry) => entry.id === logId);
  if (!record || !log) return null;
  return { record, log };
}

/** Mark scheduled logs on this promise as edited and append a new scheduled entry. */
export function editPromiseToPayLog(params: EditPromiseToPayParams): boolean {
  const match = findPromiseToPayLog(params.customerId, params.promiseId, params.logId);
  if (!match || match.log.status !== "scheduled") return false;

  const { record, log } = match;
  const currentRecordAmount =
    runtimeRecordAmountOverrides[params.promiseId] ?? record.amount;
  const logAmount = getPromiseLogAmount(log, currentRecordAmount);
  const amountChanged = logAmount !== params.amount;
  const dateChanged = log.promisedFor !== params.promisedDate;
  const nextNote = normalizePromiseNote(params.note);
  const noteChanged = normalizePromiseNote(log.note) !== nextNote;
  if (!amountChanged && !dateChanged && !noteChanged) return true;

  for (const entry of record.logs) {
    if (entry.status === "scheduled") {
      runtimeLogAmountSnapshots[entry.id] = getPromiseLogAmount(entry, currentRecordAmount);
      runtimeLogNoteSnapshots[entry.id] = entry.note;
      markLogAsEdited(entry.id);
    }
  }

  const newLog: PromiseToPayLogEntry = {
    id: `PTP-LOG-RUNTIME-${++runtimePromiseToPayLogCounter}-edit-${params.logId}`,
    status: "scheduled",
    amount: params.amount,
    promisedFor: params.promisedDate,
    ...(nextNote ? { note: nextNote } : {}),
    loggedOn: new Date().toISOString().slice(0, 10),
    loggedByName: params.loggedByName,
    loggedByInitials: ownerInitials(params.loggedByName),
  };

  runtimeAppendedLogs.push({
    promiseId: params.promiseId,
    log: newLog,
  });

  runtimeRecordAmountOverrides[params.promiseId] = params.amount;

  const runtimeRecord = runtimePromiseToPayRecords.find((r) => r.id === params.promiseId);
  if (runtimeRecord) {
    runtimeRecord.amount = params.amount;
  }

  return true;
}

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

export function mergeCreditNoteStatuses(
  notes: CreditNote[],
  overrides: Record<string, string> | undefined,
): CreditNote[] {
  if (!overrides || Object.keys(overrides).length === 0) return notes;
  return notes.map((cn) => {
    const st = overrides[cn.id];
    return st !== undefined ? { ...cn, status: st } : cn;
  });
}

export function getCreditNotesForCustomer(
  customerId: string,
  statusOverrides?: Record<string, string>,
): CreditNote[] {
  const raw = creditNotes.filter((cn) => cn.customerId === customerId);
  return mergeCreditNoteStatuses(raw, statusOverrides);
}

export function getCreditNotesForInvoice(
  invoiceId: string,
  statusOverrides?: Record<string, string>,
): CreditNote[] {
  const raw = creditNotes.filter((cn) => cn.invoiceId === invoiceId);
  return mergeCreditNoteStatuses(raw, statusOverrides);
}

export function getCreditNotesForContract(
  contractId: string,
  statusOverrides?: Record<string, string>,
): CreditNote[] {
  const raw = creditNotes.filter((cn) => cn.contractId === contractId);
  return mergeCreditNoteStatuses(raw, statusOverrides);
}

export function getClosureCreditNotesForCustomer(
  customerId: string,
  statusOverrides?: Record<string, string>,
): CreditNote[] {
  const raw = creditNotes.filter((cn) => cn.customerId === customerId && cn.closureRelated === true);
  return mergeCreditNoteStatuses(raw, statusOverrides);
}

export function getPaymentsForCustomer(customerId: string): Payment[] {
  return payments.filter((p) => p.customerId === customerId);
}

function recordCoversInvoice(records: PromiseToPayRecord[], invoiceId: string): boolean {
  return records.some((r) => r.invoiceIds.includes(invoiceId));
}

export function getPromiseToPayForCustomer(customerId: string): PromiseToPayRecord[] {
  const seeded = promiseToPayRecords.filter((r) => r.customerId === customerId);
  const runtime = runtimePromiseToPayRecords.filter((r) => r.customerId === customerId);
  const existing = [...seeded, ...runtime];

  const fromCases: PromiseToPayRecord[] = collectionCases
    .filter((c) => c.customerId === customerId && c.ptpDate)
    .filter((c) => !recordCoversInvoice(existing, c.invoiceId))
    .map((c) => ({
      id: `PTP-CASE-${c.id}`,
      customerId: c.customerId,
      amount: c.outstandingAmount,
      invoiceIds: [c.invoiceId],
      logs: [
        {
          id: `PTP-CASE-LOG-${c.id}`,
          status: "scheduled" as const,
          promisedFor: c.ptpDate,
          loggedOn: c.followUpHistory.at(-1)?.date ?? c.ptpDate,
          loggedByName: c.owner,
          loggedByInitials: ownerInitials(c.owner),
        },
      ],
    }));

  const records = applyRuntimePromiseToPayMutations([...existing, ...fromCases]).map((record) => ({
    ...record,
    logs: resolvePromiseToPayLogs(record.logs),
  }));

  return sortPromiseToPayRecords(records);
}

export function getDelayedPaymentsForCustomer(
  customerId: string,
  customerInvoices?: Invoice[],
): DelayedPayment[] {
  const invList = customerInvoices ?? invoices.filter((i) => i.customerId === customerId);
  const invById = new Map(invList.map((i) => [i.id, i]));
  const byInvoice = new Map<string, DelayedPayment>();

  for (const row of delayedPayments) {
    if (row.customerId !== customerId) continue;
    byInvoice.set(row.invoiceId, row);
  }

  for (const payment of getPaymentsForCustomer(customerId)) {
    if (payment.matchStatus !== "matched") continue;
    for (const alloc of payment.allocations) {
      const inv = invById.get(alloc.invoiceId);
      if (!inv) continue;
      const daysLate = Math.round(
        (new Date(payment.receiptDate).getTime() - new Date(inv.dueDate).getTime()) / 86400000,
      );
      if (daysLate > 0) {
        byInvoice.set(alloc.invoiceId, {
          customerId,
          invoiceId: inv.id,
          amount: alloc.amount,
          daysLate,
          paidOn: payment.receiptDate,
        });
      }
    }
  }

  return [...byInvoice.values()].sort((a, b) => b.paidOn.localeCompare(a.paidOn));
}

export function getCollectionCasesForCustomer(customerId: string): CollectionCase[] {
  return collectionCases.filter((c) => c.customerId === customerId);
}

export function getInvoiceSchedule(customerId: string): InvoiceScheduleEntry[] {
  return invoiceSchedules[customerId] ?? [];
}

/**
 * @param customerInvoices When provided (e.g. merged with session `invoiceStatusOverrides`), AR math uses this list instead of seed `invoices`.
 */
export function getCustomerArSummary(customerId: string, customerInvoices?: Invoice[]) {
  const list = customerInvoices ?? invoices.filter((i) => i.customerId === customerId);
  const open = list.filter((i) => i.status !== "Paid");
  const overdue = list.filter((i) => i.status === "Overdue");
  const pendingReview = list.filter((i) => i.status === "Pending Review");
  const held = list.filter((i) => i.holdReason);
  const customerPayments = getPaymentsForCustomer(customerId);
  const unapplied = customerPayments.filter((p) => p.matchStatus === "unapplied").reduce((s, p) => s + p.amount, 0);
  const totalOpen = open.reduce((s, i) => s + i.amount, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.amount, 0);
  const disputed = list.filter((i) => i.disputeReason).reduce((s, i) => s + i.amount, 0);
  const totalInvoiced = list.reduce((s, i) => s + i.amount, 0);

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
    allInvoices: list,
    avgDaysToPay: 22,
    oldestOutstandingDays: overdue.length > 0 ? Math.max(...overdue.map((i) => Math.round((Date.now() - new Date(i.dueDate).getTime()) / 86400000))) : 0,
  };
}
