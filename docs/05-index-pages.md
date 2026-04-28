# Resource Index Pages — Grouped Priority Landing

Every resource module in the sidebar has an index/landing page. The default landing experience is a **grouped priority page, not a flat table**.

Modules: Customers (`/customers`), Quotes (`/quotes`), Contracts (`/contracts`), Invoices (`/invoices`), Approvals (`/approvals`), Queue (`/queue`).

Implementation: `src/pages/*Index.tsx` + primitives in `src/components/index-page/`.

> **Note on Contracts vs Queue:** Uploading a signed contract is exclusively a **Queue** action (Import button on `/queue`). The Contracts index has no Upload button anymore. See `docs/09-contract-ingestion.md` for the Queue → ingest → first-invoice approval pipeline.

## Shared page anatomy (all modules)

A. **Top metric strip** — 4–5 compact summary cards in a row (`MetricStrip`)
B. **Grouped priority sections** — each group is a named operational bucket (`GroupedSection`)
C. Each group shows top 5 line items sorted by urgency/priority (`GroupedRow`)
D. Each group has a "View all" link
E. Clicking "View all" opens a filtered list view for that module with the group filter applied
F. Clicking any line item navigates to the shared customer details shell with the correct tab and record active

## Grouped → filtered list transition

- "View all" appends a query param: `/quotes?group=pending-approval`
- The same page component checks for a group param and renders either:
  - **Grouped landing** (no group param)
  - **Filtered list with columns** (group param present) — uses `ListTable`
- Clear breadcrumb or back link to return to grouped view

## Sort logic for grouped sections

- **Primary:** urgency (overdue > pending > upcoming)
- **Secondary:** value (higher exposure first)
- **Tertiary:** date (nearest date first)

---

## Customers index (`/customers`)

### Top metric strip

1. Total active customers — count
2. Renewals in 30 days — count
3. Open AR total — currency
4. Quotes pending approval — count
5. At-risk customers — count

### Groups (in priority order)

1. **"Renewals coming up in 30 days"** — customers whose contract renewal date is within 30 days
2. **"Quotes pending approval"** — customers with at least one quote in pending approval status
3. **"Prepaid credit burn-down risk"** — customers where credit balance / total < 30%
4. **"Overdue invoices"** — customers with at least one overdue invoice
5. **"Contract enforcement mismatches"** — customers with enforcement issues in any contract
6. **"Support escalations impacting billing"** — customers with open high-priority support tickets
7. **"Expansion / amendment opportunity"** — customers with active amendment quotes or seat growth signals

### Contextual click targets

Each group maps to a specific tab in the shared customer shell:

| Group | Target tab | Notes |
|---|---|---|
| Renewals | Contract | relevant contract selected |
| Quotes pending approval | Quote | relevant quote selected |
| Burn-down risk | Customer | credit section emphasized |
| Overdue invoices | Invoicing | relevant invoice selected |
| Enforcement mismatches | Contract | enforcement section visible |
| Support escalations | Customer | support section visible |
| Expansion opportunity | Quote | relevant amendment quote selected |

### Columns

**Grouped row:** Customer | Priority reason | Related record | Value / exposure | Owner | Due date | Status

**Filtered list:** Customer | ARR | Open AR | Contracts | Quotes | Renewal | Risk | Owner

---

## Quotes index (`/quotes`)

### Top metric strip

1. Active quotes — count
2. Pending approval — count
3. Expiring in 14 days — count
4. Total pipeline TCV — currency
5. Avg discount % — percentage

### Groups

1. **"Pending approval"** — quotes with `approval.status === "pending"`
2. **"Expiring soon"** — quotes expiring within 14 days
3. **"Accepted, contract not ingested"** — quotes accepted but no linked active contract
4. **"Amendment quotes in progress"** — quotes linked to existing contracts as amendments
5. **"CRM sync mismatch"** — quotes where amount differs from CRM synced amount
6. **"Non-standard terms"** — quotes with triggered policy rules

### Click behavior

Row click → `/customers/:customerId?tab=quote&quoteId=:quoteId`

### Columns

**Grouped row:** Quote ID | Customer | TCV | Discount | Status | Expiry | Owner

**Filtered list:** Quote ID | Customer | Version | Source | TCV | ARR | Discount | Approval | Expiry | Owner

---

## Contracts index (`/contracts`)

### Top metric strip

1. Active contracts — count
2. Pending enforcement — count
3. Renewals in 60 days — count
4. Total active TCV — currency
5. Amendments in progress — count

### Groups

1. **"Pending enforcement"** — contracts with `enforcementStatus !== "Enforced"`
2. **"Invoice review pending"** — active contracts with Pending Review invoices in billing schedule
3. **"Approaching renewal"** — contracts with renewalDate within 60 days
4. **"Entitlement / provisioning issues"** — contracts with non-empty blockingIssues or productMappingIssues
5. **"Quote-to-contract mismatch"** — contracts with comparisonToQuote differences
6. **"Min-commit exhaustion risk"** — contracts where prepaidCreditBalance / prepaidCreditTotal < 30%
7. **"Amendments in progress"** — contracts with amendments in non-Applied status

### Click behavior

Row click → `/customers/:customerId?tab=contract&contractId=:contractId`

### Columns

**Grouped row:** Contract ID | Customer | TCV | Term | Status | Renewal | Owner

**Filtered list:** Contract ID | Customer | Source Quote | TCV | Min Commit | Effective | Renewal | Enforcement | Amendments | Owner

### Contracts index header

No upload button — uploading signed contracts is now a **Queue** action. See `docs/09-contract-ingestion.md` for the Queue → ingest pipeline.

---

## Invoices index (`/invoices`)

### Top metric strip

1. Total invoices — count
2. Pending review — count
3. Overdue — count
4. Open AR — currency
5. Blocked invoices — count

### Groups

1. **"Pending invoice review"** — invoices with status "Pending Review"
2. **"Overdue invoices"** — invoices with status "Overdue"
3. **"Promise-to-pay upcoming"** — invoices with a promise-to-pay date in the next 14 days
4. **"Invoice disputes"** — invoices flagged with dispute reason
5. **"Failed generation"** — invoices with generation errors
6. **"Blocked by missing PO / tax / billing details"** — invoices with holdReason set
7. **"Unapplied cash / reconciliation needed"** — invoices with partial or mismatched payments

### Click behavior

Row click → `/customers/:customerId?tab=invoicing&invoiceId=:invoiceId`

### Columns

**Grouped row:** Invoice ID | Customer | Amount | Due date | Status | Blocker

**Filtered list:** Invoice ID | Customer | Contract | Amount | Date | Due date | Status | Hold reason | Owner

---

## Approvals index (`/approvals`)

Same template as other modules. Only invoice approvals in this pass. See `docs/09-contract-ingestion.md` for approval flow.

### Metric strip

- Total pending
- Invoices pending
- Total amount pending
- Overdue approvals

### Columns

Approval ID | Invoice | Customer | Amount | Submitted By | Submitted On | Status

### Click behavior

Row click → `/approvals/invoices/:invoiceId`

---

## Queue index (`/queue`)

The operational landing for every signed contract pending ingestion. See `docs/09-contract-ingestion.md` for the full Queue → ingest → first-invoice approval pipeline.

### Header

- **Connect** (secondary, outlined) — opens `QueueIntegrationsModal` listing source integrations (Salesforce, DocuSign, Ironclad, NetSuite, Workday, HubSpot, PandaDoc).
- **Import** (primary, blue) — opens `UploadModal` (drag-and-drop area + sample document picker).

### Metric strip

1. Pending review (count)
2. In progress (count)
3. TCV in queue (currency)
4. Recently ingested (count)
5. Failed / Rejected (count)

### Groups

1. **Pending review**
2. **In progress**
3. **Recently ingested**
4. **Failed / Rejected**

### Columns

**Grouped row / Filtered list:** Queue ID | Document (name + source detail subtitle) | Scenario | Customer | TCV | Source badge (PDF / via API / via CPQ / Email) | Uploaded | Status

### Click behavior

- **Pending Review (sample-backed)** → `/queue/:queueItemId` (full ingest flow on Echo Corp + Zenith samples)
- **Pending Review (placeholder)** → `/queue/:queueItemId` placeholder panel
- **In Progress** → `/queue/:queueItemId` placeholder
- **Ingested** → `/contracts/:contractId?from=queue`
- **Failed / Rejected** → `/queue/:queueItemId` showing failure reason

---

## Click flow examples

### Flow A: Customers

1. User clicks "Customers" in sidebar
2. App renders `/customers` — grouped landing
3. Group "Renewals in 30 days" shows top 5 customers
4. User clicks "View all" → `/customers?group=renewals-30d` → filtered list view
5. User clicks row for Lumina AI → `/customers/cust_lumina_002?tab=contract&contractId=CON-2024-0201`
6. App renders `CustomerRevenueWorkspace` with Contract tab active, `CON-2024-0201` selected

### Flow B: Quotes

1. User clicks "Quotes" in sidebar
2. Grouped landing
3. Group "Pending approval" → user clicks QT-2026-0041 (Pioneer Systems)
4. Navigates to `/customers/cust_pioneer_004?tab=quote&quoteId=QT-2026-0041`

### Flow C: Contracts

1. User clicks "Contracts" → grouped landing
2. Group "Approaching renewal" → user clicks CON-2024-0201 (Lumina AI)
3. Navigates to `/customers/cust_lumina_002?tab=contract&contractId=CON-2024-0201`

### Flow D: Invoices

1. User clicks "Invoices" → grouped landing
2. Group "Overdue invoices" → user clicks INV-2026-0040 (Northlane Labs)
3. Navigates to `/customers/cust_northlane_003?tab=invoicing&invoiceId=INV-2026-0040`

### Flow E: Support escalation (special)

1. On `/customers` grouped landing
2. Group "Support escalations impacting billing" shows Northlane Labs
3. User clicks Northlane Labs → `/customers/cust_northlane_003?tab=customer`
4. Workspace opens on Customer (Account 360) tab with Support & Communications section visible
