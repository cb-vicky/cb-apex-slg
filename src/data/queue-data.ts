// ---------------------------------------------------------------------------
// QUEUE — Contracts pending ingestion (Inbox > Queue)
// ---------------------------------------------------------------------------
//
// The Queue is the operational landing for every signed commercial document
// flowing into APEX (PDF upload, API sync from CRM/CLM, native CPQ handoff).
// Each queue item maps to an `ExtractedContract` (sample1/sample2) when it
// is fully ingestable in the prototype; otherwise it is a placeholder used
// for visual variety / future scenarios (Amendment, Early Renewal).
//
// Lifecycle: Pending Review → In Progress → Ingested
//                                   ↘ Failed / Rejected
// ---------------------------------------------------------------------------

export type QueueSource = "PDF Upload" | "API" | "CPQ" | "Email";

export type QueueStatus =
  | "Pending Review"
  | "In Progress"
  | "Ingested"
  | "Failed"
  | "Rejected";

export type QueueScenario =
  | "New Business"
  | "Renewal"
  | "Amendment"
  | "Early Renewal";

export interface QueueItem {
  id: string;
  documentName: string;
  source: QueueSource;
  sourceDetail?: string;
  scenario: QueueScenario;
  status: QueueStatus;
  customerName: string;
  customerId?: string;
  tcv: number;
  uploadedAt: string;
  uploadedBy: string;
  sampleId?: "sample1" | "sample2" | "sample3";
  contractId?: string;
  invoiceId?: string;
  failureReason?: string;
  ingestable: boolean;
  /** For Early Renewal items: the ID of the active prior contract that must be closed first. */
  activeContractId?: string;
}

// ---------------------------------------------------------------------------
// SEED ITEMS
// ---------------------------------------------------------------------------

export const queueItems: QueueItem[] = [
  // ── Pending Review (full ingestable flows) ───────────────────────────────
  {
    id: "QI-2026-0001",
    documentName: "EchoCorp_MSA_Renewal_2026_Signed.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Alex Nguyen",
    scenario: "Renewal",
    status: "Pending Review",
    customerName: "Echo Corp",
    customerId: "cust_echo_001",
    tcv: 523600,
    uploadedAt: "2026-04-17T09:12:00Z",
    uploadedBy: "Alex Nguyen",
    sampleId: "sample1",
    ingestable: true,
  },
  {
    id: "QI-2026-0002",
    documentName: "ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Jordan Kim",
    scenario: "New Business",
    status: "Pending Review",
    customerName: "Zenith Analytics Inc.",
    tcv: 155000,
    uploadedAt: "2026-04-17T09:18:00Z",
    uploadedBy: "Jordan Kim",
    sampleId: "sample2",
    ingestable: true,
  },

  // ── Pending Review (placeholders showing source variety) ─────────────────
  {
    id: "QI-2026-0003",
    documentName: "HelixPharma_RenewalMSA_2026.pdf",
    source: "API",
    sourceDetail: "Synced from Salesforce",
    scenario: "Renewal",
    status: "Pending Review",
    customerName: "Helix Pharma",
    tcv: 412000,
    uploadedAt: "2026-04-18T07:45:00Z",
    uploadedBy: "Salesforce CLM (auto)",
    ingestable: false,
  },
  {
    id: "QI-2026-0004",
    documentName: "NorthwindTrading_Expansion_OrderForm.pdf",
    source: "CPQ",
    sourceDetail: "Native CPQ → Quote QT-2026-0061",
    scenario: "New Business",
    status: "Pending Review",
    customerName: "Northwind Trading",
    tcv: 287000,
    uploadedAt: "2026-04-18T11:02:00Z",
    uploadedBy: "Marcus Lee (AE)",
    ingestable: false,
  },
  {
    id: "QI-2026-0005",
    documentName: "LuminaAI_Amendment_Q3_2026_Signed.pdf",
    source: "API",
    sourceDetail: "Synced from DocuSign",
    scenario: "Amendment",
    status: "Pending Review",
    customerName: "Lumina AI",
    customerId: "cust_lumina_002",
    tcv: 95000,
    uploadedAt: "2026-04-19T08:24:00Z",
    uploadedBy: "DocuSign CLM (auto)",
    ingestable: false,
  },
  {
    id: "QI-2026-0006",
    documentName: "VerdantHealth_EarlyRenewal_2026.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Priya Mehta",
    scenario: "Early Renewal",
    status: "Pending Review",
    customerName: "Verdant Health",
    customerId: "cust_verdant_005",
    tcv: 348000,
    uploadedAt: "2026-04-19T13:50:00Z",
    uploadedBy: "Priya Mehta",
    sampleId: "sample3",
    ingestable: true,
    activeContractId: "CON-2025-0034",
  },

  // ── In Progress ──────────────────────────────────────────────────────────
  {
    id: "QI-2026-0007",
    documentName: "AuroraRobotics_NewBusiness_OrderForm.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Lena Schulz",
    scenario: "New Business",
    status: "In Progress",
    customerName: "Aurora Robotics",
    tcv: 198000,
    uploadedAt: "2026-04-16T15:30:00Z",
    uploadedBy: "Lena Schulz",
    ingestable: false,
  },

  // ── Ingested (history) ───────────────────────────────────────────────────
  {
    id: "QI-2026-0008",
    documentName: "LuminaAI_MSA_2025_Signed.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Alex Nguyen",
    scenario: "New Business",
    status: "Ingested",
    customerName: "Lumina AI",
    customerId: "cust_lumina_002",
    tcv: 480000,
    uploadedAt: "2025-08-04T09:00:00Z",
    uploadedBy: "Alex Nguyen",
    contractId: "CON-2025-0142",
    invoiceId: "INV-2025-0220",
    ingestable: false,
  },
  {
    id: "QI-2026-0009",
    documentName: "NorthlaneLabs_Renewal_2025_Signed.pdf",
    source: "API",
    sourceDetail: "Synced from Salesforce",
    scenario: "Renewal",
    status: "Ingested",
    customerName: "Northlane Labs",
    customerId: "cust_northlane_003",
    tcv: 312000,
    uploadedAt: "2025-11-12T14:20:00Z",
    uploadedBy: "Salesforce CLM (auto)",
    contractId: "CON-2025-0211",
    invoiceId: "INV-2025-0341",
    ingestable: false,
  },
  {
    id: "QI-2026-0010",
    documentName: "VerdantHealth_NewBusiness_2024_Signed.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Marcus Lee",
    scenario: "New Business",
    status: "Ingested",
    customerName: "Verdant Health",
    customerId: "cust_verdant_005",
    tcv: 264000,
    uploadedAt: "2024-09-03T10:15:00Z",
    uploadedBy: "Marcus Lee",
    contractId: "CON-2024-0119",
    invoiceId: "INV-2024-0188",
    ingestable: false,
  },

  // ── Failed extraction ────────────────────────────────────────────────────
  {
    id: "QI-2026-0011",
    documentName: "BlackOakEnterprises_Contract_Scanned.pdf",
    source: "Email",
    sourceDetail: "Forwarded to billing@",
    scenario: "New Business",
    status: "Failed",
    customerName: "BlackOak Enterprises",
    tcv: 0,
    uploadedAt: "2026-04-15T18:42:00Z",
    uploadedBy: "billing@chargebee.com",
    failureReason: "Document is a scanned image. OCR confidence below threshold (47%). Re-upload a text-based PDF.",
    ingestable: false,
  },

  // ── Rejected (operator marked invalid) ───────────────────────────────────
  {
    id: "QI-2026-0012",
    documentName: "Untitled_Draft_NotForSigning.pdf",
    source: "PDF Upload",
    sourceDetail: "Uploaded by Jordan Kim",
    scenario: "New Business",
    status: "Rejected",
    customerName: "—",
    tcv: 0,
    uploadedAt: "2026-04-14T11:08:00Z",
    uploadedBy: "Jordan Kim",
    failureReason: "Document is an unsigned draft. Awaiting countersignature.",
    ingestable: false,
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function getQueueItem(id: string): QueueItem | undefined {
  return queueItems.find((q) => q.id === id);
}

export function getQueueItemBySample(
  sampleId: "sample1" | "sample2",
): QueueItem | undefined {
  return queueItems.find((q) => q.sampleId === sampleId);
}

export function isPendingStatus(s: QueueStatus): boolean {
  return s === "Pending Review" || s === "In Progress";
}

// Group keys for the Queue index page
export const queueGroupMeta = [
  {
    key: "pending-review",
    label: "Pending review",
    slug: "pending-review",
    match: (q: QueueItem) => q.status === "Pending Review",
  },
  {
    key: "in-progress",
    label: "In progress",
    slug: "in-progress",
    match: (q: QueueItem) => q.status === "In Progress",
  },
  {
    key: "ingested",
    label: "Recently ingested",
    slug: "ingested",
    match: (q: QueueItem) => q.status === "Ingested",
  },
  {
    key: "failed",
    label: "Failed / Rejected",
    slug: "failed",
    match: (q: QueueItem) => q.status === "Failed" || q.status === "Rejected",
  },
] as const;

export type QueueGroupKey = (typeof queueGroupMeta)[number]["key"];
