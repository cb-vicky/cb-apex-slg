// ---------------------------------------------------------------------------
// Customer Tasks — unified task list scoped to a customer
// ---------------------------------------------------------------------------

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "open" | "in_progress" | "snoozed" | "done";

export type TaskType =
  | "contract-ingestion"
  | "invoice-review"
  | "invoice-approval"
  | "collections"
  | "quote-follow-up"
  | "support-escalation"
  | "renewal-prep"
  | "data-correction"
  | "general";

export interface CustomerTask {
  id: string;
  customerId: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  createdAt: string;
  snoozedUntil?: string;
  /** Related entity for cross-linking */
  relatedTo?: {
    entityType: "quote" | "contract" | "invoice" | "ticket" | "email";
    entityId: string;
    label: string;
  };
  /** Action to open when clicking the task */
  action?: {
    /** Which tab to switch to */
    stage?: "quote" | "contract" | "invoicing" | "payment" | "threads";
    /** Open drawer with this entity */
    drawer?: {
      entityType: "contract" | "invoice" | "queue";
      entityId: string;
      mode?: "ingest" | "review" | "close";
    };
  };
}

// ---------------------------------------------------------------------------
// SEED DATA
// ---------------------------------------------------------------------------

export const customerTasks: CustomerTask[] = [
  // Echo Corp tasks
  {
    id: "TASK-001",
    customerId: "cust_echo_001",
    title: "Review renewal quote before expiry",
    description: "QT-2026-0042 expires in 5 days. Customer is waiting for final terms.",
    type: "quote-follow-up",
    priority: "critical",
    status: "open",
    assignee: "Jordan Kim",
    dueDate: "2026-05-10",
    createdAt: "2026-05-01",
    relatedTo: {
      entityType: "quote",
      entityId: "QT-2026-0042",
      label: "QT-2026-0042",
    },
    action: { stage: "quote" },
  },
  {
    id: "TASK-002",
    customerId: "cust_echo_001",
    title: "Review and send INV-2026-0044 for approval",
    description: "Invoice held due to missing PO number. Follow up with customer.",
    type: "invoice-review",
    priority: "high",
    status: "open",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-08",
    createdAt: "2026-04-28",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-2026-0044",
      label: "INV-2026-0044",
    },
    action: {
      stage: "invoicing",
      drawer: { entityType: "invoice", entityId: "INV-2026-0044", mode: "review" },
    },
  },
  {
    id: "TASK-003",
    customerId: "cust_echo_001",
    title: "Collect on overdue INV-2026-0034",
    description: "Invoice is 45+ days overdue. Customer promised payment by end of week.",
    type: "collections",
    priority: "high",
    status: "in_progress",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-05",
    createdAt: "2026-04-15",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-2026-0034",
      label: "INV-2026-0034",
    },
    action: { stage: "payment" },
  },
  {
    id: "TASK-004",
    customerId: "cust_echo_001",
    title: "Resolve billing dispute TKT-4201",
    description: "Customer claims incorrect overage charges. Need to verify usage data.",
    type: "support-escalation",
    priority: "high",
    status: "open",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-12",
    createdAt: "2026-04-20",
    relatedTo: {
      entityType: "ticket",
      entityId: "TKT-4201",
      label: "TKT-4201",
    },
    action: { stage: "threads" },
  },
  {
    id: "TASK-005",
    customerId: "cust_echo_001",
    title: "Fix legal entity name mismatch",
    description: "Contract shows 'Echo Corp Inc.' but billing system has 'EchoCorp LLC'",
    type: "data-correction",
    priority: "low",
    status: "snoozed",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-20",
    createdAt: "2026-03-15",
    snoozedUntil: "2026-05-15",
    relatedTo: {
      entityType: "contract",
      entityId: "CON-2024-0189",
      label: "CON-2024-0189",
    },
    action: { stage: "contract" },
  },
  {
    id: "TASK-006",
    customerId: "cust_echo_001",
    title: "Ingest renewal contract CON-2026-0190",
    description: "New contract uploaded to queue. Needs field mapping and first invoice review.",
    type: "contract-ingestion",
    priority: "critical",
    status: "open",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-06",
    createdAt: "2026-05-02",
    relatedTo: {
      entityType: "contract",
      entityId: "CON-2026-0190",
      label: "CON-2026-0190",
    },
    action: {
      drawer: { entityType: "queue", entityId: "QI-2026-0001", mode: "ingest" },
    },
  },

  // Northlane tasks
  {
    id: "TASK-010",
    customerId: "cust_northlane_003",
    title: "Resolve SKU mapping issue for overages",
    description: "Overage billing broken since enforcement. CTO escalated.",
    type: "support-escalation",
    priority: "critical",
    status: "open",
    assignee: "Lena Schulz",
    dueDate: "2026-05-04",
    createdAt: "2026-04-01",
    relatedTo: {
      entityType: "ticket",
      entityId: "TKT-4210",
      label: "TKT-4210",
    },
    action: { stage: "threads" },
  },
  {
    id: "TASK-011",
    customerId: "cust_northlane_003",
    title: "Collect on disputed INV-2026-0040",
    description: "Customer withholding payment pending usage breakdown.",
    type: "collections",
    priority: "high",
    status: "open",
    assignee: "Lena Schulz",
    dueDate: "2026-05-10",
    createdAt: "2026-04-05",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-2026-0040",
      label: "INV-2026-0040",
    },
    action: { stage: "payment" },
  },

  // Verdant tasks
  {
    id: "TASK-020",
    customerId: "cust_verdant_005",
    title: "Review held invoice INV-2026-0042",
    description: "Missing PO number. Need to obtain from procurement.",
    type: "invoice-review",
    priority: "medium",
    status: "open",
    assignee: "Lena Schulz",
    dueDate: "2026-05-15",
    createdAt: "2026-04-10",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-2026-0042",
      label: "INV-2026-0042",
    },
    action: { stage: "invoicing" },
  },
  {
    id: "TASK-021",
    customerId: "cust_verdant_005",
    title: "Ingest early renewal contract",
    description: "Customer signed early renewal. Needs ingestion and prior contract closure.",
    type: "contract-ingestion",
    priority: "high",
    status: "open",
    assignee: "Lena Schulz",
    dueDate: "2026-05-08",
    createdAt: "2026-04-19",
    relatedTo: {
      entityType: "contract",
      entityId: "CON-2026-VERDANT-NEW",
      label: "Early Renewal Contract",
    },
    action: {
      drawer: { entityType: "queue", entityId: "QI-2026-0006", mode: "ingest" },
    },
  },

  // Lumina tasks (healthy customer, fewer tasks)
  {
    id: "TASK-030",
    customerId: "cust_lumina_002",
    title: "Review overage invoice INV-2026-0041",
    description: "Standard monthly overage invoice ready for review.",
    type: "invoice-review",
    priority: "medium",
    status: "open",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-10",
    createdAt: "2026-04-05",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-2026-0041",
      label: "INV-2026-0041",
    },
    action: { stage: "invoicing" },
  },

  // Zenith tasks
  {
    id: "TASK-040",
    customerId: "cust_zenith_006",
    title: "Complete new business contract ingestion",
    description: "Contract uploaded and partially ingested. Finalize field mapping.",
    type: "contract-ingestion",
    priority: "high",
    status: "in_progress",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-07",
    createdAt: "2026-05-01",
    relatedTo: {
      entityType: "contract",
      entityId: "CON-2026-ZENITH",
      label: "CON-2026-ZENITH",
    },
    action: {
      drawer: { entityType: "queue", entityId: "QI-2026-0002", mode: "ingest" },
    },
  },
  {
    id: "TASK-041",
    customerId: "cust_zenith_006",
    title: "Review first invoice for new contract",
    description: "First invoice generated from ingested contract. Needs approval before send.",
    type: "invoice-approval",
    priority: "medium",
    status: "open",
    assignee: "Alex Nguyen",
    dueDate: "2026-05-12",
    createdAt: "2026-05-03",
    relatedTo: {
      entityType: "invoice",
      entityId: "INV-INGEST-001",
      label: "INV-INGEST-001",
    },
    action: {
      stage: "invoicing",
      drawer: { entityType: "invoice", entityId: "INV-INGEST-001", mode: "review" },
    },
  },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getTasksForCustomer(customerId: string): CustomerTask[] {
  return customerTasks.filter((t) => t.customerId === customerId);
}

export function getOpenTasksForCustomer(customerId: string): CustomerTask[] {
  return customerTasks.filter(
    (t) => t.customerId === customerId && (t.status === "open" || t.status === "in_progress")
  );
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  snoozed: "Snoozed",
  done: "Done",
};

export const TYPE_LABELS: Record<TaskType, string> = {
  "contract-ingestion": "Contract Ingestion",
  "invoice-review": "Invoice Review",
  "invoice-approval": "Invoice Approval",
  collections: "Collections",
  "quote-follow-up": "Quote Follow-up",
  "support-escalation": "Support Escalation",
  "renewal-prep": "Renewal Prep",
  "data-correction": "Data Correction",
  general: "General",
};
