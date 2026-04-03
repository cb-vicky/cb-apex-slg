// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface PerformanceObligation {
  product: string;
  obligationType: "over-time" | "point-in-time" | "usage-based";
  allocationBasis: string;
  allocatedAmount: number;
  recognizedToDate: number;
  deferredRemaining: number;
  method: string;
}

export interface RecognitionScheduleEntry {
  period: string;
  recognized: number;
  deferred: number;
  remaining: number;
  amended: boolean;
}

export interface CloseBlocker {
  description: string;
  severity: "critical" | "warning";
  category: string;
  resolved: boolean;
}

export interface JournalExport {
  id: string;
  period: string;
  status: "posted" | "pending" | "failed" | "re-exported";
  erpReference: string;
  exportDate: string;
  failReason: string;
}

export interface RevRecAdjustment {
  id: string;
  date: string;
  type: string;
  amount: number;
  reason: string;
  status: "applied" | "pending_approval" | "rejected";
  approver: string;
}

export interface RevenueArrangement {
  id: string;
  customerId: string;
  contractId: string;
  status: string;
  policy: string;
  startDate: string;
  endDate: string;
  lastRecalculated: string;
  closeStatus: string;
  recognizedToDate: number;
  deferred: number;
  totalArrangementValue: number;
  obligations: PerformanceObligation[];
  schedule: RecognitionScheduleEntry[];
  closeBlockers: CloseBlocker[];
  journalExports: JournalExport[];
  adjustments: RevRecAdjustment[];
  amendmentImpacts: AmendmentImpact[];
  invoiceImpacts: InvoiceImpact[];
}

export interface AmendmentImpact {
  amendmentId: string;
  type: string;
  effectiveDate: string;
  description: string;
  reallocationEffect: string;
  scheduleUpdateState: string;
}

export interface InvoiceImpact {
  invoiceId: string;
  billedAmount: number;
  creditedAmount: number;
  correction: string;
  accountingEntriesUpdated: boolean;
}

// ---------------------------------------------------------------------------
// SEED DATA
// ---------------------------------------------------------------------------

export const revenueArrangements: RevenueArrangement[] = [
  {
    id: "RA-2026-0001",
    customerId: "cust_echo_001",
    contractId: "CON-2024-0189",
    status: "Active",
    policy: "ASC 606 – Ratable over contract term with usage-based variable consideration",
    startDate: "2024-07-01",
    endDate: "2026-06-30",
    lastRecalculated: "2026-03-31",
    closeStatus: "1 blocker",
    recognizedToDate: 280000,
    deferred: 76000,
    totalArrangementValue: 356000,
    obligations: [
      {
        product: "Apex Platform – Enterprise (150 seats)",
        obligationType: "over-time",
        allocationBasis: "SSP – relative standalone selling price",
        allocatedAmount: 216000,
        recognizedToDate: 189000,
        deferredRemaining: 27000,
        method: "Straight-line over 24-month term",
      },
      {
        product: "AI Agent Credits – Prepaid Block (80K)",
        obligationType: "usage-based",
        allocationBasis: "SSP – residual approach for variable consideration",
        allocatedAmount: 80000,
        recognizedToDate: 62000,
        deferredRemaining: 18000,
        method: "Recognized as credits are consumed (burn-down); unused at expiry recognized on expiry date",
      },
      {
        product: "Premium Support",
        obligationType: "over-time",
        allocationBasis: "SSP – standalone price",
        allocatedAmount: 60000,
        recognizedToDate: 29000,
        deferredRemaining: 31000,
        method: "Straight-line monthly over contract term",
      },
    ],
    schedule: [
      { period: "2024-Q3", recognized: 26500, deferred: 62500, remaining: 267000, amended: false },
      { period: "2024-Q4", recognized: 34200, deferred: 54800, remaining: 232800, amended: false },
      { period: "2025-Q1", recognized: 36800, deferred: 52200, remaining: 196000, amended: false },
      { period: "2025-Q2", recognized: 38400, deferred: 50600, remaining: 157600, amended: true },
      { period: "2025-Q3", recognized: 42100, deferred: 46900, remaining: 115500, amended: false },
      { period: "2025-Q4", recognized: 45600, deferred: 43400, remaining: 69900, amended: true },
      { period: "2026-Q1", recognized: 56400, deferred: 32600, remaining: 13500, amended: true },
    ],
    closeBlockers: [
      {
        description: "Amendment AMD-003 (seat expansion, effective Jan 2026) has not been reflected in the recognition schedule. Reallocation of transaction price required under ASC 606-10-32-40.",
        severity: "critical",
        category: "Pending reallocation",
        resolved: false,
      },
      {
        description: "Credit note CN-2026-0001 ($1,200) issued against INV-2026-0034 — journal entry pending",
        severity: "warning",
        category: "Credit impact",
        resolved: false,
      },
      {
        description: "Q4 2025 usage finalization delayed — variable consideration estimate used for Dec recognition",
        severity: "warning",
        category: "Variable consideration",
        resolved: true,
      },
    ],
    journalExports: [
      { id: "JE-2026-Q1-001", period: "2026-Q1", status: "pending", erpReference: "", exportDate: "", failReason: "Blocked by unresolved close blocker (AMD-003 reallocation)" },
      { id: "JE-2025-Q4-001", period: "2025-Q4", status: "posted", erpReference: "ERP-JE-20260115-4891", exportDate: "2026-01-15", failReason: "" },
      { id: "JE-2025-Q3-001", period: "2025-Q3", status: "posted", erpReference: "ERP-JE-20251015-4502", exportDate: "2025-10-15", failReason: "" },
      { id: "JE-2025-Q2-001", period: "2025-Q2", status: "re-exported", erpReference: "ERP-JE-20250720-4201-R1", exportDate: "2025-07-20", failReason: "" },
      { id: "JE-2025-Q1-001", period: "2025-Q1", status: "posted", erpReference: "ERP-JE-20250415-3890", exportDate: "2025-04-15", failReason: "" },
    ],
    adjustments: [
      {
        id: "ADJ-2026-001",
        date: "2026-01-10",
        type: "Manual catch-up",
        amount: 4200,
        reason: "Correct Q4 2025 usage-based recognition after late metering finalization",
        status: "applied",
        approver: "Sarah Chen, Finance Manager",
      },
      {
        id: "ADJ-2026-002",
        date: "2026-03-28",
        type: "Credit impact",
        amount: -1200,
        reason: "Reduce current-period recognition by CN-2026-0001 amount",
        status: "pending_approval",
        approver: "Sarah Chen, Finance Manager",
      },
    ],
    amendmentImpacts: [
      {
        amendmentId: "AMD-001",
        type: "Seat expansion",
        effectiveDate: "2025-04-01",
        description: "Added 20 seats (130→150) with co-term to original contract end",
        reallocationEffect: "Transaction price increased by $28,800. Reallocated across platform and support obligations using updated SSP.",
        scheduleUpdateState: "Applied",
      },
      {
        amendmentId: "AMD-002",
        type: "Credit top-up",
        effectiveDate: "2025-10-01",
        description: "Additional 20K AI credits prepaid block",
        reallocationEffect: "New obligation added. Recognized on consumption basis — no reallocation to existing obligations.",
        scheduleUpdateState: "Applied",
      },
      {
        amendmentId: "AMD-003",
        type: "Seat expansion + discount adjustment",
        effectiveDate: "2026-01-01",
        description: "Added 30 seats (150→180) with 5% loyalty discount. Payment terms changed Net 30 → Net 45.",
        reallocationEffect: "Pending – transaction price increase of $36,000 requires reallocation across all active obligations per ASC 606-10-32-40.",
        scheduleUpdateState: "Pending rerun",
      },
    ],
    invoiceImpacts: [
      { invoiceId: "INV-2026-0034", billedAmount: 5800, creditedAmount: 1200, correction: "CN-2026-0001 issued for usage recalculation", accountingEntriesUpdated: false },
      { invoiceId: "INV-2026-0012", billedAmount: 4200, creditedAmount: 0, correction: "", accountingEntriesUpdated: true },
    ],
  },
  {
    id: "RA-2026-0002",
    customerId: "cust_northlane_003",
    contractId: "CON-2025-0022",
    status: "Review Required",
    policy: "ASC 606 – Ratable with quarterly billing cadence",
    startDate: "2025-01-01",
    endDate: "2026-11-30",
    lastRecalculated: "2026-02-28",
    closeStatus: "2 blockers",
    recognizedToDate: 180000,
    deferred: 36000,
    totalArrangementValue: 216000,
    obligations: [
      {
        product: "Apex Platform – Enterprise (120 seats)",
        obligationType: "over-time",
        allocationBasis: "SSP – relative standalone selling price",
        allocatedAmount: 172800,
        recognizedToDate: 144000,
        deferredRemaining: 28800,
        method: "Straight-line over contract term (quarterly billing)",
      },
      {
        product: "AI Agent Credits – Prepaid Block (40K)",
        obligationType: "usage-based",
        allocationBasis: "SSP – residual approach",
        allocatedAmount: 43200,
        recognizedToDate: 36000,
        deferredRemaining: 7200,
        method: "Recognized as credits consumed",
      },
    ],
    schedule: [
      { period: "2025-Q1", recognized: 36000, deferred: 180000, remaining: 180000, amended: false },
      { period: "2025-Q2", recognized: 36000, deferred: 144000, remaining: 144000, amended: false },
      { period: "2025-Q3", recognized: 36000, deferred: 108000, remaining: 108000, amended: false },
      { period: "2025-Q4", recognized: 36000, deferred: 72000, remaining: 72000, amended: false },
      { period: "2026-Q1", recognized: 36000, deferred: 36000, remaining: 36000, amended: true },
    ],
    closeBlockers: [
      {
        description: "Overdue invoice INV-2026-0040 ($31,200) — usage dispute unresolved, credit note CN-2026-0002 pending approval",
        severity: "critical",
        category: "Disputed billing",
        resolved: false,
      },
      {
        description: "Term extension amendment AMD-NL-001 in progress — schedule may need extension if approved",
        severity: "warning",
        category: "Pending amendment",
        resolved: false,
      },
    ],
    journalExports: [
      { id: "JE-NL-2026-Q1", period: "2026-Q1", status: "pending", erpReference: "", exportDate: "", failReason: "Blocked by disputed invoice and pending amendment" },
      { id: "JE-NL-2025-Q4", period: "2025-Q4", status: "posted", erpReference: "ERP-JE-NL-20260115-2201", exportDate: "2026-01-15", failReason: "" },
    ],
    adjustments: [],
    amendmentImpacts: [
      {
        amendmentId: "AMD-NL-001",
        type: "Term Extension",
        effectiveDate: "2026-02-01",
        description: "Extended to Nov 2026 pending renewal negotiation",
        reallocationEffect: "If approved, remaining consideration will be spread over extended term. Reduces monthly recognition rate.",
        scheduleUpdateState: "Pending – amendment not yet finalized",
      },
    ],
    invoiceImpacts: [
      { invoiceId: "INV-2026-0040", billedAmount: 31200, creditedAmount: 3840, correction: "CN-2026-0002 pending for Q4 2025 overage", accountingEntriesUpdated: false },
    ],
  },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getRevenueArrangement(contractId: string): RevenueArrangement | undefined {
  return revenueArrangements.find((ra) => ra.contractId === contractId);
}

export function getRevenueArrangementForCustomer(customerId: string): RevenueArrangement | undefined {
  return revenueArrangements.find((ra) => ra.customerId === customerId);
}
