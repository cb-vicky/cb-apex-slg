// ---------------------------------------------------------------------------
// Email Threads — customer communications with full message bodies
// ---------------------------------------------------------------------------

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "xlsx" | "docx" | "png" | "jpg" | "csv";
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: {
    name: string;
    email: string;
    isInternal: boolean;
  };
  to: { name: string; email: string }[];
  cc?: { name: string; email: string }[];
  date: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  customerId: string;
  subject: string;
  participants: { name: string; email: string; isInternal: boolean }[];
  lastMessageDate: string;
  messageCount: number;
  unread: boolean;
  starred: boolean;
  labels: string[];
  /** Related entity for context */
  relatedTo?: {
    entityType: "quote" | "contract" | "invoice" | "ticket";
    entityId: string;
  };
  /** AI-suggested next action for compose prefill */
  suggestedAction?: {
    type: "follow-up" | "reminder" | "resolution" | "info-request";
    summary: string;
  };
}

// ---------------------------------------------------------------------------
// SEED DATA — Echo Corp Threads
// ---------------------------------------------------------------------------

export const emailThreads: EmailThread[] = [
  {
    id: "THR-001",
    customerId: "cust_echo_001",
    subject: "Re: Renewal proposal and AI credit expansion",
    participants: [
      { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
      { name: "Jordan Kim", email: "jordan.kim@chargebee.com", isInternal: true },
      { name: "Priya Mehta", email: "priya.mehta@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-05-02T14:30:00Z",
    messageCount: 6,
    unread: true,
    starred: true,
    labels: ["Renewal", "Negotiation"],
    relatedTo: { entityType: "quote", entityId: "QT-2026-0042" },
    suggestedAction: {
      type: "follow-up",
      summary: "Follow up on overage rate clarification requested by customer",
    },
  },
  {
    id: "THR-002",
    customerId: "cust_echo_001",
    subject: "Outstanding invoice INV-2026-0034 — payment status",
    participants: [
      { name: "AP Team", email: "ap@echocorp.ai", isInternal: false },
      { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-04-28T09:15:00Z",
    messageCount: 4,
    unread: false,
    starred: false,
    labels: ["Collections", "Overdue"],
    relatedTo: { entityType: "invoice", entityId: "INV-2026-0034" },
    suggestedAction: {
      type: "reminder",
      summary: "Send gentle reminder about 10-day payment timeline",
    },
  },
  {
    id: "THR-003",
    customerId: "cust_echo_001",
    subject: "PO issuance for March overage invoice",
    participants: [
      { name: "Echo Procurement", email: "procurement@echocorp.ai", isInternal: false },
      { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-04-25T11:00:00Z",
    messageCount: 3,
    unread: false,
    starred: false,
    labels: ["Invoice", "PO Required"],
    relatedTo: { entityType: "invoice", entityId: "INV-2026-0044" },
    suggestedAction: {
      type: "follow-up",
      summary: "Check if PO has been approved and request the number",
    },
  },
  {
    id: "THR-004",
    customerId: "cust_echo_001",
    subject: "Billing dispute — TKT-4201 overage charges",
    participants: [
      { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
      { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
      { name: "Support Team", email: "support@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-04-20T16:45:00Z",
    messageCount: 5,
    unread: true,
    starred: true,
    labels: ["Dispute", "Escalation"],
    relatedTo: { entityType: "ticket", entityId: "TKT-4201" },
    suggestedAction: {
      type: "resolution",
      summary: "Provide detailed usage breakdown to resolve the dispute",
    },
  },
  {
    id: "THR-005",
    customerId: "cust_echo_001",
    subject: "AI credit burn-down — top-up options discussion",
    participants: [
      { name: "Engineering Ops", email: "eng-ops@echocorp.ai", isInternal: false },
      { name: "Priya Mehta", email: "priya.mehta@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-04-15T10:20:00Z",
    messageCount: 4,
    unread: false,
    starred: false,
    labels: ["Credits", "Expansion"],
    relatedTo: { entityType: "contract", entityId: "CON-2024-0189" },
  },

  // Northlane threads
  {
    id: "THR-010",
    customerId: "cust_northlane_003",
    subject: "URGENT: SKU mapping issue impacting billing",
    participants: [
      { name: "Hans Mueller", email: "cto@northlane-labs.de", isInternal: false },
      { name: "Finance Team", email: "finance@northlane-labs.de", isInternal: false },
      { name: "Lena Schulz", email: "lena.schulz@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-05-01T08:30:00Z",
    messageCount: 8,
    unread: true,
    starred: true,
    labels: ["Escalation", "Technical"],
    relatedTo: { entityType: "ticket", entityId: "TKT-4210" },
    suggestedAction: {
      type: "resolution",
      summary: "Confirm SKU mapping fix timeline and provide interim usage data",
    },
  },
  {
    id: "THR-011",
    customerId: "cust_northlane_003",
    subject: "Re: Overdue invoice and billing discrepancy",
    participants: [
      { name: "Finance Team", email: "finance@northlane-labs.de", isInternal: false },
      { name: "Lena Schulz", email: "lena.schulz@chargebee.com", isInternal: true },
    ],
    lastMessageDate: "2026-04-30T14:00:00Z",
    messageCount: 5,
    unread: false,
    starred: false,
    labels: ["Collections", "Dispute"],
    relatedTo: { entityType: "invoice", entityId: "INV-2026-0040" },
  },
];

// ---------------------------------------------------------------------------
// EMAIL MESSAGES
// ---------------------------------------------------------------------------

export const emailMessages: EmailMessage[] = [
  // Thread THR-001 messages
  {
    id: "MSG-001-1",
    threadId: "THR-001",
    from: { name: "Jordan Kim", email: "jordan.kim@chargebee.com", isInternal: true },
    to: [{ name: "Mira Patel", email: "mira.patel@echocorp.ai" }],
    cc: [{ name: "Priya Mehta", email: "priya.mehta@chargebee.com" }],
    date: "2026-04-25T10:00:00Z",
    body: `Hi Mira,

I hope this email finds you well. As we approach your renewal date on June 15th, I wanted to share our proposal for the next contract term.

Based on our discussions, I've put together a renewal quote that includes:
- 18% discount on platform seats (400 seats at $48/seat)
- Additional 120,000 AI credits prepaid block
- Premium 24/7 support continuation
- New: Dedicated success manager

The total contract value would be $362,200 annually. I've attached the detailed quote for your review.

Please let me know if you have any questions or if you'd like to schedule a call to discuss.

Best regards,
Jordan`,
    attachments: [
      { id: "ATT-001", name: "EchoCorp_Renewal_Quote_2026.pdf", size: "245 KB", type: "pdf" },
    ],
  },
  {
    id: "MSG-001-2",
    threadId: "THR-001",
    from: { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
    to: [{ name: "Jordan Kim", email: "jordan.kim@chargebee.com" }],
    cc: [{ name: "Priya Mehta", email: "priya.mehta@chargebee.com" }],
    date: "2026-04-28T14:30:00Z",
    body: `Hi Jordan,

Thank you for sending over the renewal proposal. Our team has reviewed it and we have a few questions:

1. The 18% discount on seats looks acceptable, but can you clarify the overage rates if we exceed the prepaid credit block? Our usage has been growing faster than expected.

2. What happens to unused credits at the end of the term? We'd like to understand the expiry terms better.

3. Is there flexibility on the payment terms? We'd prefer quarterly billing instead of annual upfront.

Let me know when you're available for a call to discuss these points.

Thanks,
Mira`,
  },
  {
    id: "MSG-001-3",
    threadId: "THR-001",
    from: { name: "Jordan Kim", email: "jordan.kim@chargebee.com", isInternal: true },
    to: [{ name: "Mira Patel", email: "mira.patel@echocorp.ai" }],
    cc: [{ name: "Priya Mehta", email: "priya.mehta@chargebee.com" }],
    date: "2026-04-29T09:15:00Z",
    body: `Hi Mira,

Great questions! Let me address each:

1. **Overage rates**: Once you exceed the prepaid block, overages are billed at $0.12 per credit (vs. ~$0.10 prepaid rate). Given your growth trajectory, I'd actually recommend we discuss a larger credit block to lock in better economics.

2. **Credit expiry**: Unused credits expire at the end of the contract term. However, I can propose a 90-day grace period for renewal scenarios where you sign before the current term ends.

3. **Payment terms**: I can offer quarterly billing, but this would adjust the discount to 15% instead of 18%. Annual upfront gives us the flexibility to offer the deeper discount.

How does Thursday at 2pm PT work for a call? I can have Priya join as well to discuss your credit burn-down trends.

Best,
Jordan`,
  },
  {
    id: "MSG-001-4",
    threadId: "THR-001",
    from: { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
    to: [{ name: "Jordan Kim", email: "jordan.kim@chargebee.com" }],
    date: "2026-05-02T14:30:00Z",
    body: `Hi Jordan,

Thursday at 2pm PT works. I'll send a calendar invite.

One more thing — can you send over a detailed breakdown of our current credit usage over the past 6 months? Our engineering team wants to model out different scenarios before we finalize the credit block size.

Also looping in our CFO who will want to weigh in on the payment terms discussion.

Thanks,
Mira`,
  },

  // Thread THR-002 messages
  {
    id: "MSG-002-1",
    threadId: "THR-002",
    from: { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    to: [{ name: "AP Team", email: "ap@echocorp.ai" }],
    date: "2026-03-25T09:00:00Z",
    body: `Hi Echo Corp AP Team,

This is a friendly reminder that invoice INV-2026-0034 for $5,800 is now past due. The invoice was due on March 18th.

Invoice details:
- Invoice #: INV-2026-0034
- Amount: $5,800.00
- Due Date: March 18, 2026
- Description: AI Agent Credits overage + Premium Support

Please let us know if there are any issues preventing payment or if you need any additional documentation.

Best regards,
Alex Nguyen
Billing Operations`,
    attachments: [
      { id: "ATT-002", name: "INV-2026-0034.pdf", size: "89 KB", type: "pdf" },
    ],
  },
  {
    id: "MSG-002-2",
    threadId: "THR-002",
    from: { name: "AP Team", email: "ap@echocorp.ai", isInternal: false },
    to: [{ name: "Alex Nguyen", email: "alex.nguyen@chargebee.com" }],
    date: "2026-03-28T11:20:00Z",
    body: `Hi Alex,

Thank you for the reminder. We apologize for the delay — we recently migrated to a new AP system and some invoices were not properly imported.

Payment is being processed and should clear within 10 business days. I'll send confirmation once it's completed.

Thanks for your patience.

Best,
Echo Corp Accounts Payable`,
  },
  {
    id: "MSG-002-3",
    threadId: "THR-002",
    from: { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    to: [{ name: "AP Team", email: "ap@echocorp.ai" }],
    date: "2026-04-08T10:00:00Z",
    body: `Hi,

Following up on the payment for INV-2026-0034. It's been 10 business days since your last update. Could you please confirm the payment status?

If there are any issues, please let me know and I'm happy to help resolve them.

Thanks,
Alex`,
  },
  {
    id: "MSG-002-4",
    threadId: "THR-002",
    from: { name: "AP Team", email: "ap@echocorp.ai", isInternal: false },
    to: [{ name: "Alex Nguyen", email: "alex.nguyen@chargebee.com" }],
    date: "2026-04-28T09:15:00Z",
    body: `Hi Alex,

Apologies for the continued delay. The payment was held up in our approval queue due to the system migration issues.

Good news: it's now approved and scheduled for release this Friday (May 2nd). You should see the funds within 3-5 business days after that.

I'll send you the remittance advice once payment is released.

Thank you for your patience.

Best,
Echo Corp AP`,
  },

  // Thread THR-004 messages (billing dispute)
  {
    id: "MSG-004-1",
    threadId: "THR-004",
    from: { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
    to: [{ name: "Support Team", email: "support@chargebee.com" }],
    date: "2026-04-10T15:00:00Z",
    body: `Hi Support Team,

I'm writing to dispute the overage charges on our recent invoice INV-2026-0034. The amount seems significantly higher than what our internal tracking shows.

Our records indicate we used approximately 35,000 AI credits in January, but we were billed for 42,000. That's a 20% discrepancy.

Can you please provide a detailed usage breakdown by day/week so we can reconcile?

This is urgent as it's blocking payment approval on our end.

Thanks,
Mira Patel
VP Operations, Echo Corp`,
  },
  {
    id: "MSG-004-2",
    threadId: "THR-004",
    from: { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    to: [{ name: "Mira Patel", email: "mira.patel@echocorp.ai" }],
    cc: [{ name: "Support Team", email: "support@chargebee.com" }],
    date: "2026-04-12T10:30:00Z",
    body: `Hi Mira,

Thank you for bringing this to our attention. I'm taking over this case from our support team to ensure we resolve it quickly.

I've pulled the usage data for January 2026. Here's what I found:

- API calls from your production environment: 35,200 credits
- API calls from your staging environment: 6,800 credits
- Total: 42,000 credits

It looks like the staging environment usage might not be reflected in your internal tracking. The staging environment (api-staging.echocorp.ai) became active on January 15th.

I've attached the detailed usage report broken down by environment and date. Could you verify this with your engineering team?

Best regards,
Alex`,
    attachments: [
      { id: "ATT-004", name: "EchoCorp_Usage_Report_Jan2026.xlsx", size: "156 KB", type: "xlsx" },
    ],
  },
  {
    id: "MSG-004-3",
    threadId: "THR-004",
    from: { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
    to: [{ name: "Alex Nguyen", email: "alex.nguyen@chargebee.com" }],
    date: "2026-04-15T09:00:00Z",
    body: `Alex,

You're right — I checked with our engineering team and they confirmed the staging environment was spun up mid-January for a new feature rollout. They weren't aware it was being billed.

However, we'd like to discuss whether staging environments should be billable. We're essentially paying for test/development usage which seems unfair. Can we get a credit for the staging usage?

Also, going forward, can we set up alerts when new environments start consuming credits?

Thanks,
Mira`,
  },
  {
    id: "MSG-004-4",
    threadId: "THR-004",
    from: { name: "Alex Nguyen", email: "alex.nguyen@chargebee.com", isInternal: true },
    to: [{ name: "Mira Patel", email: "mira.patel@echocorp.ai" }],
    date: "2026-04-18T14:00:00Z",
    body: `Hi Mira,

I understand the concern about staging usage. Let me address both points:

1. **Credit request**: I've escalated this to our billing team. Given this was an oversight during environment setup, I'm requesting a one-time courtesy credit of 3,400 credits (50% of the staging usage). I should have approval within 48 hours.

2. **Usage alerts**: Great suggestion! I can help you set up:
   - Daily usage digest emails
   - Threshold alerts (e.g., when usage hits 80% of prepaid credits)
   - New environment detection notifications

Would you like me to schedule a 30-minute call to configure these alerts together?

Best,
Alex`,
  },
  {
    id: "MSG-004-5",
    threadId: "THR-004",
    from: { name: "Mira Patel", email: "mira.patel@echocorp.ai", isInternal: false },
    to: [{ name: "Alex Nguyen", email: "alex.nguyen@chargebee.com" }],
    date: "2026-04-20T16:45:00Z",
    body: `Alex,

Thank you for understanding. The courtesy credit sounds fair — please keep me posted on the approval.

Yes, let's set up those alerts. How about Thursday at 11am PT? I'll have our DevOps lead join as well.

One more thing — once we have the credit applied, can you send an updated invoice so we can process payment? Our AP team needs the final amount.

Thanks for your help resolving this quickly.

Mira`,
  },

  // Northlane escalation thread
  {
    id: "MSG-010-1",
    threadId: "THR-010",
    from: { name: "Hans Mueller", email: "cto@northlane-labs.de", isInternal: false },
    to: [{ name: "Lena Schulz", email: "lena.schulz@chargebee.com" }],
    date: "2026-04-01T08:00:00Z",
    body: `Lena,

I need to escalate a critical issue that's been open for 3 weeks now.

When you enforced our contract in March, the SKU mapping was never completed properly. As a result:
1. Our overage billing is completely inaccurate
2. Our finance team can't reconcile usage vs. invoices
3. We've had to put expansion discussions on hold

This is unacceptable for an enterprise customer. We need this resolved within this week or we'll need to involve your leadership.

Please treat this as P0.

Hans Mueller
CTO, Northlane Labs`,
  },
  {
    id: "MSG-010-2",
    threadId: "THR-010",
    from: { name: "Lena Schulz", email: "lena.schulz@chargebee.com", isInternal: true },
    to: [{ name: "Hans Mueller", email: "cto@northlane-labs.de" }],
    cc: [{ name: "Finance Team", email: "finance@northlane-labs.de" }],
    date: "2026-04-01T10:30:00Z",
    body: `Hans,

I sincerely apologize for this ongoing issue. You're absolutely right that this should have been resolved weeks ago.

I've escalated this internally and here's where we stand:

**Root cause**: During enforcement, 3 of your product SKUs were mapped to a deprecated billing code. This caused usage to be tracked but not correctly attributed.

**Immediate actions**:
1. Our engineering team is fixing the SKU mapping today (ETA: 6pm CET)
2. We'll regenerate all affected invoices once mapping is corrected
3. I'm personally reviewing every invoice before it goes out

**Timeline**:
- SKU fix: Today
- Invoice regeneration: Tomorrow (April 2nd)
- Reconciliation report: April 3rd

I'll send hourly updates until this is resolved. Again, I apologize for the disruption this has caused.

Best regards,
Lena`,
  },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getThreadsForCustomer(customerId: string): EmailThread[] {
  return emailThreads.filter((t) => t.customerId === customerId);
}

export function getMessagesForThread(threadId: string): EmailMessage[] {
  return emailMessages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getLatestMessageForThread(threadId: string): EmailMessage | undefined {
  const messages = getMessagesForThread(threadId);
  return messages[messages.length - 1];
}

export function getUnreadThreadsForCustomer(customerId: string): EmailThread[] {
  return emailThreads.filter((t) => t.customerId === customerId && t.unread);
}
