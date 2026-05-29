// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  assignee: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface EmailSummary {
  id: string;
  customerId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  sentiment: "positive" | "neutral" | "negative";
}

// ---------------------------------------------------------------------------
// SEED DATA
// ---------------------------------------------------------------------------

export const supportTickets: SupportTicket[] = [
  {
    id: "TKT-4201",
    customerId: "cust_echo_001",
    subject: "Overdue invoice INV-2026-0034 – payment dispute",
    priority: "High",
    status: "Open",
    category: "Billing dispute",
    assignee: "Alex Nguyen",
    createdAt: "2026-03-20",
    lastUpdatedAt: "2026-04-01",
  },
  {
    id: "TKT-4202",
    customerId: "cust_echo_001",
    subject: "PO number required for March invoice – procurement delay",
    priority: "Medium",
    status: "Open",
    category: "Invoice question",
    assignee: "Alex Nguyen",
    createdAt: "2026-03-05",
    lastUpdatedAt: "2026-03-28",
  },
  {
    id: "TKT-4203",
    customerId: "cust_echo_001",
    subject: "AI credit burn-down exceeding forecast – need top-up options",
    priority: "Medium",
    status: "Resolved",
    category: "Credit burn-down",
    assignee: "Priya Mehta",
    createdAt: "2026-02-15",
    lastUpdatedAt: "2026-03-01",
  },
  {
    id: "TKT-4204",
    customerId: "cust_echo_001",
    subject: "Legal entity name mismatch between contract and billing system",
    priority: "Low",
    status: "Open",
    category: "Data correction",
    assignee: "Alex Nguyen",
    createdAt: "2026-01-10",
    lastUpdatedAt: "2026-03-15",
  },
  {
    id: "TKT-4301",
    customerId: "cust_zenith_analytics_inc",
    subject: "Overdue invoice INV-2026-0050 — payment dispute",
    priority: "High",
    status: "Open",
    category: "Billing dispute",
    assignee: "Alex Nguyen",
    createdAt: "2026-03-20",
    lastUpdatedAt: "2026-04-01",
  },
  {
    id: "TKT-4302",
    customerId: "cust_zenith_analytics_inc",
    subject: "PO number required for March overage invoice",
    priority: "Medium",
    status: "Open",
    category: "Invoice question",
    assignee: "Alex Nguyen",
    createdAt: "2026-03-05",
    lastUpdatedAt: "2026-03-28",
  },
  {
    id: "TKT-4210",
    customerId: "cust_northlane_003",
    subject: "Overage billing not working – SKU mapping broken since enforcement",
    priority: "High",
    status: "Escalated",
    category: "Billing dispute",
    assignee: "Lena Schulz",
    createdAt: "2026-03-10",
    lastUpdatedAt: "2026-04-02",
  },
  {
    id: "TKT-4211",
    customerId: "cust_northlane_003",
    subject: "Overdue Q1 invoice – customer claims incorrect amount",
    priority: "High",
    status: "Escalated",
    category: "Invoice question",
    assignee: "Lena Schulz",
    createdAt: "2026-03-25",
    lastUpdatedAt: "2026-04-01",
  },
];

export const emailSummaries: EmailSummary[] = [
  {
    id: "EM-8001",
    customerId: "cust_echo_001",
    subject: "Re: Renewal proposal and AI credit expansion",
    from: "mira.patel@echocorp.ai",
    date: "2026-04-01",
    snippet: "Our team is reviewing the renewal proposal. The 18% discount on seats looks acceptable, but we need clarity on overage rates before signing. We'd like to discuss prepaid credit expiry terms.",
    sentiment: "neutral",
  },
  {
    id: "EM-8002",
    customerId: "cust_echo_001",
    subject: "Re: Outstanding invoice INV-2026-0034",
    from: "ap@echocorp.ai",
    date: "2026-03-28",
    snippet: "Payment is being processed through our new AP system. Expected to clear within 10 business days. We apologize for the delay.",
    sentiment: "positive",
  },
  {
    id: "EM-8003",
    customerId: "cust_echo_001",
    subject: "PO issuance for March overage invoice",
    from: "procurement@echocorp.ai",
    date: "2026-03-22",
    snippet: "PO-2026-3341 has been issued and is being routed for internal approval. Should be available by end of week.",
    sentiment: "positive",
  },
  {
    id: "EM-8004",
    customerId: "cust_echo_001",
    subject: "Concern about AI credit usage pace",
    from: "eng-ops@echocorp.ai",
    date: "2026-03-10",
    snippet: "Our engineering team is burning through credits faster than expected due to the new agent deployment. We need to understand overage implications and discuss a top-up before the budget cycle closes.",
    sentiment: "negative",
  },
  {
    id: "EM-8010",
    customerId: "cust_northlane_003",
    subject: "Re: Overdue invoice and billing discrepancy",
    from: "finance@northlane-labs.de",
    date: "2026-03-30",
    snippet: "We are withholding payment on INV-2026-0040 because the overage charges do not match our internal usage records. Please provide a detailed usage breakdown before we can release payment.",
    sentiment: "negative",
  },
  {
    id: "EM-8011",
    customerId: "cust_northlane_003",
    subject: "Escalation: SKU mapping issue impacting billing accuracy",
    from: "cto@northlane-labs.de",
    date: "2026-04-01",
    snippet: "This has been an open issue for 3 weeks. Overage billing is inaccurate because the SKU mapping was never completed during enforcement. We need this resolved before we discuss any expansion.",
    sentiment: "negative",
  },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getTicketsForCustomer(customerId: string): SupportTicket[] {
  return supportTickets.filter((t) => t.customerId === customerId);
}

export function getEmailsForCustomer(customerId: string): EmailSummary[] {
  return emailSummaries.filter((e) => e.customerId === customerId);
}
