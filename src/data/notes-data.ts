// ---------------------------------------------------------------------------
// Notes Data Types & Mock Data
// ---------------------------------------------------------------------------

import type { Stage } from "@/components/revenue-workspace/stage";

export interface Note {
  id: string;
  customerId: string;
  customerName: string;
  /** Which workflow tab this note belongs to */
  tab: Stage;
  /** Optional sub-tab within the workflow (e.g., "summary", "items", "billing" for ingestion) */
  subTab?: string;
  /** Note content (plain text) */
  text: string;
  /** Author info */
  author: {
    name: string;
    avatar?: string;
  };
  /** ISO timestamp */
  timestamp: string;
  /** Whether this note is pinned to customer level (shows in Overview) */
  isPinned: boolean;
  /** Whether this note is resolved (hidden from active view) */
  isResolved: boolean;
  /** For mock notifications - marks notes as "new" */
  isNew?: boolean;
}

export type NoteLocation = {
  tab: Stage;
  subTab?: string;
};

// ---------------------------------------------------------------------------
// Mock Authors (team members)
// ---------------------------------------------------------------------------

export const MOCK_AUTHORS = [
  { name: "Sarah Chen", avatar: undefined },
  { name: "Marcus Rivera", avatar: undefined },
  { name: "Priya Sharma", avatar: undefined },
  { name: "David Kim", avatar: undefined },
  { name: "Jessica Wong", avatar: undefined },
] as const;

// ---------------------------------------------------------------------------
// Mock Notes Data
// ---------------------------------------------------------------------------

export const mockNotes: Note[] = [
  // Zenith Analytics INC (cust_zenith_analytics_inc) - has active ingestion flow
  {
    id: "note-001",
    customerId: "cust_zenith_analytics_inc",
    customerName: "Zenith Analytics INC",
    tab: "contract",
    text: "Confirmed with Sarah that the API Credits line item should map to our existing 'API-CRED-ENT' SKU. They negotiated a custom rate of $0.0008/call instead of standard $0.001.",
    author: MOCK_AUTHORS[0],
    timestamp: "2026-06-04T14:32:00Z",
    isPinned: true,
    isResolved: false,
    isNew: false,
  },
  {
    id: "note-002",
    customerId: "cust_zenith_analytics_inc",
    customerName: "Zenith Analytics INC",
    tab: "contract",
    text: "Need to verify the overage rate calculation with Finance before finalizing. The contract mentions tiered pricing but our system currently only supports flat rate overages.",
    author: MOCK_AUTHORS[1],
    timestamp: "2026-06-04T15:45:00Z",
    isPinned: false,
    isResolved: false,
    isNew: true,
  },
  {
    id: "note-003",
    customerId: "cust_zenith_analytics_inc",
    customerName: "Zenith Analytics INC",
    tab: "invoicing",
    text: "Customer confirmed they want the contract effective date to be June 15th, not June 1st as originally stated. Updated the extraction.",
    author: MOCK_AUTHORS[2],
    timestamp: "2026-06-03T10:20:00Z",
    isPinned: false,
    isResolved: true,
  },
  {
    id: "note-004",
    customerId: "cust_zenith_analytics_inc",
    customerName: "Zenith Analytics INC",
    tab: "invoicing",
    text: "Billing contact changed to Jennifer Wu (jennifer.wu@zenithcorp.com). Previous contact Alex Turner has left the company.",
    author: MOCK_AUTHORS[0],
    timestamp: "2026-06-04T09:15:00Z",
    isPinned: true,
    isResolved: false,
  },
  {
    id: "note-005",
    customerId: "cust_zenith_analytics_inc",
    customerName: "Zenith Analytics INC",
    tab: "customer",
    text: "High priority account - CEO is a personal contact of our VP Sales. Ensure all contract terms are reviewed by legal before activation.",
    author: MOCK_AUTHORS[3],
    timestamp: "2026-06-02T16:00:00Z",
    isPinned: true,
    isResolved: false,
  },

  // Pioneer Systems (cust_pioneer_004)
  {
    id: "note-pioneer-001",
    customerId: "cust_pioneer_004",
    customerName: "Pioneer Systems",
    tab: "contract",
    text: "Platform license should be mapped to our Enterprise tier. Customer negotiated 15% discount on list price.",
    author: MOCK_AUTHORS[0],
    timestamp: "2026-06-04T10:30:00Z",
    isPinned: true,
    isResolved: false,
    isNew: false,
  },
  {
    id: "note-pioneer-002",
    customerId: "cust_pioneer_004",
    customerName: "Pioneer Systems",
    tab: "invoicing",
    text: "Billing contact is Alex Nguyen. They prefer quarterly invoicing with NET 30 terms.",
    author: MOCK_AUTHORS[1],
    timestamp: "2026-06-04T11:15:00Z",
    isPinned: true,
    isResolved: false,
    isNew: true,
  },
  {
    id: "note-pioneer-003",
    customerId: "cust_pioneer_004",
    customerName: "Pioneer Systems",
    tab: "customer",
    text: "Strategic account - potential for expansion into their APAC offices. Keep CSM informed of all contract changes.",
    author: MOCK_AUTHORS[3],
    timestamp: "2026-06-03T14:00:00Z",
    isPinned: true,
    isResolved: false,
  },

  // Echo Corp (cust_echo_001)
  {
    id: "note-006",
    customerId: "cust_echo_001",
    customerName: "Echo Corp",
    tab: "invoicing",
    text: "Customer requested all invoices be sent to their new AP email: ap-team@echocorp.com instead of individual contacts.",
    author: MOCK_AUTHORS[4],
    timestamp: "2026-06-01T11:30:00Z",
    isPinned: true,
    isResolved: false,
  },
  {
    id: "note-007",
    customerId: "cust_echo_001",
    customerName: "Echo Corp",
    tab: "payment",
    text: "Spoke with their finance team - they have a 45-day internal approval process before payments. Adjusted our follow-up cadence accordingly.",
    author: MOCK_AUTHORS[2],
    timestamp: "2026-05-28T14:22:00Z",
    isPinned: false,
    isResolved: false,
  },
  {
    id: "note-008",
    customerId: "cust_echo_001",
    customerName: "Echo Corp",
    tab: "contract",
    text: "Renewal discussion scheduled for July 15th. They're evaluating competitor options so we need to prepare a retention offer.",
    author: MOCK_AUTHORS[1],
    timestamp: "2026-06-03T09:00:00Z",
    isPinned: true,
    isResolved: false,
    isNew: true,
  },

  // Lumina Solutions (cust_lumina_002)
  {
    id: "note-009",
    customerId: "cust_lumina_002",
    customerName: "Lumina Solutions",
    tab: "customer",
    text: "Recently closed Series B funding. Expecting significant usage growth in Q3. CSM should proactively discuss capacity planning.",
    author: MOCK_AUTHORS[0],
    timestamp: "2026-05-25T15:45:00Z",
    isPinned: true,
    isResolved: false,
  },
  {
    id: "note-010",
    customerId: "cust_lumina_002",
    customerName: "Lumina Solutions",
    tab: "revrec",
    text: "SSP exception approved for custom integration services. See JIRA-4521 for documentation.",
    author: MOCK_AUTHORS[3],
    timestamp: "2026-05-20T10:00:00Z",
    isPinned: false,
    isResolved: false,
  },

  // Northlane Tech (cust_northlane_003)
  {
    id: "note-011",
    customerId: "cust_northlane_003",
    customerName: "Northlane Tech",
    tab: "quote",
    text: "Customer requested extended payment terms for the renewal quote. VP Sales approved Net 60 as an exception.",
    author: MOCK_AUTHORS[2],
    timestamp: "2026-06-02T13:30:00Z",
    isPinned: true,
    isResolved: false,
    isNew: true,
  },
  {
    id: "note-012",
    customerId: "cust_northlane_003",
    customerName: "Northlane Tech",
    tab: "customer",
    text: "Key contact moving roles. New primary contact will be Sarah Martinez starting next month.",
    author: MOCK_AUTHORS[0],
    timestamp: "2026-06-01T09:00:00Z",
    isPinned: false,
    isResolved: false,
  },

  // Verdant Industries (cust_verdant_005)
  {
    id: "note-013",
    customerId: "cust_verdant_005",
    customerName: "Verdant Industries",
    tab: "contract",
    text: "Multi-year contract amendment under discussion. Legal review needed for the perpetual license clause.",
    author: MOCK_AUTHORS[1],
    timestamp: "2026-06-03T16:45:00Z",
    isPinned: true,
    isResolved: false,
  },
  {
    id: "note-014",
    customerId: "cust_verdant_005",
    customerName: "Verdant Industries",
    tab: "payment",
    text: "Wire transfer confirmed for Q1 invoice. Reference number: VRD-2026-0312.",
    author: MOCK_AUTHORS[4],
    timestamp: "2026-05-30T11:20:00Z",
    isPinned: false,
    isResolved: true,
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Get all notes for a specific customer */
export function getNotesForCustomer(customerId: string): Note[] {
  return mockNotes.filter((n) => n.customerId === customerId);
}

/** Get notes for a specific customer and tab */
export function getNotesForLocation(
  customerId: string,
  tab: Stage,
  subTab?: string,
): Note[] {
  return mockNotes.filter(
    (n) =>
      n.customerId === customerId &&
      n.tab === tab &&
      (subTab === undefined || n.subTab === subTab),
  );
}

/** Get active (non-resolved) notes for a location */
export function getActiveNotesForLocation(
  customerId: string,
  tab: Stage,
  subTab?: string,
): Note[] {
  return getNotesForLocation(customerId, tab, subTab).filter((n) => !n.isResolved);
}

/** Get pinned notes for a customer (for Overview tab) */
export function getPinnedNotesForCustomer(customerId: string): Note[] {
  return mockNotes.filter(
    (n) => n.customerId === customerId && n.isPinned && !n.isResolved,
  );
}

/** Get all active notes for a customer */
export function getActiveNotesForCustomer(customerId: string): Note[] {
  return mockNotes.filter((n) => n.customerId === customerId && !n.isResolved);
}

/** Get resolved notes for a customer */
export function getResolvedNotesForCustomer(customerId: string): Note[] {
  return mockNotes.filter((n) => n.customerId === customerId && n.isResolved);
}

/** Get count of new (unread) notes */
export function getNewNotesCount(): number {
  return mockNotes.filter((n) => n.isNew && !n.isResolved).length;
}

/** Get new notes for notification display */
export function getNewNotes(): Note[] {
  return mockNotes.filter((n) => n.isNew && !n.isResolved);
}

/** Sort notes - pinned first, then by timestamp descending */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/** Get human-readable tab label */
export function getTabLabel(tab: Stage, subTab?: string): string {
  const tabLabels: Record<Stage, string> = {
    customer: "Overview",
    tasks: "Tasks",
    threads: "Threads",
    quote: "Quotes",
    contract: "Contracts",
    ingestion: "Ingestion",
    invoicing: "Invoicing",
    payment: "Collections",
    revrec: "Rev Rec",
  };

  const subTabLabels: Record<string, string> = {
    summary: "Summary",
    items: "Items",
    billing: "Billing Info",
    addresses: "Addresses",
    invoice_preview: "Invoice Preview",
  };

  const main = tabLabels[tab] ?? tab;
  if (subTab && subTabLabels[subTab]) {
    return `${main} › ${subTabLabels[subTab]}`;
  }
  return main;
}

/** Generate a new note ID */
export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
