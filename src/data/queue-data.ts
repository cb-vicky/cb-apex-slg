// ---------------------------------------------------------------------------
// QUEUE — Contracts pending ingestion (Inbox > Queue)
// ---------------------------------------------------------------------------
//
// The Queue is the operational landing for every signed commercial document
// flowing into APEX (PDF upload, API sync from CRM/CLM, native CPQ handoff).
// Ingestable rows map to `ExtractedContract` sample2 (new business) or sample3
// (early renewal). Late renewal is a queue-only ops row (opens contract workspace / drawer).
//
// Lifecycle: Pending Review → In Progress → Ingested
//                                   ↘ Failed / Rejected
// ---------------------------------------------------------------------------

export type QueueSource = "PDF Upload" | "API" | "CPQ" | "Email";

export type QueueStatus =
  | "Pending Review"
  | "In Progress"
  /** Contract + draft invoice created; operator must review invoice before approval is submitted. */
  | "Invoice review"
  /** Approver rejected; operator can change everything and re-run ingest. */
  | "Returned"
  /** Late renewal: grace period has been extended, waiting for renewal contract to become ingestable. */
  | "Grace Extended"
  | "Ingested"
  | "Failed"
  | "Rejected";

export type QueueScenario =
  | "New Business"
  | "Renewal"
  | "Amendment"
  | "Early Renewal"
  | "Late Renewal";

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
  sampleId?: "sample1" | "sample2" | "sample3" | "sample4";
  contractId?: string;
  invoiceId?: string;
  failureReason?: string;
  ingestable: boolean;
  /** For Early Renewal items: the ID of the active prior contract that must be closed first. */
  activeContractId?: string;
  /** Set when an approver rejects and the row returns to the operator. */
  returnReason?: string;
}

// ---------------------------------------------------------------------------
// SEED ITEMS
// ---------------------------------------------------------------------------

export const queueItems: QueueItem[] = [
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
  {
    id: "QI-2026-0003",
    documentName: "NorthlaneLabs_LateRenewal_Commercial_2026.pdf",
    source: "API",
    sourceDetail: "Synced from Salesforce CLM",
    scenario: "Late Renewal",
    status: "Pending Review",
    customerName: "Northlane Labs",
    customerId: "cust_northlane_003",
    tcv: 312000,
    uploadedAt: "2026-04-20T10:05:00Z",
    uploadedBy: "Salesforce CLM (auto)",
    sampleId: "sample4",
    ingestable: false,
    activeContractId: "CON-2025-0022",
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function getQueueItem(id: string): QueueItem | undefined {
  return queueItems.find((q) => q.id === id);
}

export function getQueueItemBySample(sampleId: "sample2" | "sample3" | "sample4"): QueueItem | undefined {
  return queueItems.find((q) => q.sampleId === sampleId);
}

export function isPendingStatus(s: QueueStatus): boolean {
  return (
    s === "Pending Review" ||
    s === "In Progress" ||
    s === "Invoice review" ||
    s === "Returned"
  );
}

// Group keys for the Queue index page
export const queueGroupMeta = [
  {
    key: "pending-review",
    label: "Pending review",
    slug: "pending-review",
    match: (q: QueueItem) => q.status === "Pending Review" || q.status === "Returned",
  },
  {
    key: "in-progress",
    label: "In progress",
    slug: "in-progress",
    match: (q: QueueItem) => q.status === "In Progress",
  },
  {
    key: "invoice-review",
    label: "Invoice review",
    slug: "invoice-review",
    match: (q: QueueItem) => q.status === "Invoice review",
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
