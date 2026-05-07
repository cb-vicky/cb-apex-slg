# Resource Index Pages — List Table Landing

Every resource module in the sidebar has an index/landing page. The default landing is a **list table** with a top metric strip.

Modules: Customers (`/customers`), Quotes (`/quotes`), Contracts (`/contracts`), Invoices (`/invoices`), Approvals (`/approvals`), Queue (`/queue`).

Implementation: `src/pages/*Index.tsx` + primitives in `src/components/index-page/`.

> **Note on Contracts vs Queue:** Uploading a signed contract is exclusively a **Queue** action (Import button on `/queue`). The Contracts index has no Upload button anymore. See `docs/09-contract-ingestion.md` for the Queue → ingest → first-invoice approval pipeline.

## Shared page anatomy (all modules)

A. **Sticky header** — module title + optional Create button; shadow appears on scroll
B. **Top metric strip** — 4–5 compact summary cards in a row (`MetricStrip`)
C. **List table** — full record listing with sortable columns (`ListTable` + `ListRow` + `ListCell`)
D. Clicking any row navigates to the shared customer details shell with the correct tab and record active

Components:
- `PageHeader` — title + primary CTA
- `MetricStrip` — horizontal metric cards with variant coloring (default, warning, danger)
- `ListTable`, `ListRow`, `ListCell` — table primitives with column definitions
- `useScrolled` hook — detects scroll for sticky header shadow

## Design notes

- Header sticks to top with `sticky top-0 z-10`, gets shadow on scroll
- MetricStrip cards use `variant` prop: `"default"` (gray), `"warning"` (amber), `"danger"` (red)
- Tables are compact with dense rows, status badges inline, no extra padding
- Row click navigates via React Router — no nested buttons

---

## Customers index (`/customers`)

### Top metric strip

1. Active customers — count
2. Renewals in 30 days — count (warning when > 0)
3. Open AR total — currency (danger)
4. Quotes pending — count (warning when > 0)
5. At-risk customers — count (danger)

### Columns

Customer | ARR | Open AR | Contracts | Quotes | Renewal | Risk | Owner

- **Customer:** Name, bold
- **ARR:** Currency formatted
- **Open AR:** Currency formatted; red text when > 0
- **Contracts:** Active contract count
- **Quotes:** Open quote count
- **Renewal:** Next renewal date or "—"
- **Risk:** StatusBadge showing flag count, or green "Healthy" text
- **Owner:** Billing owner name

### Click behavior

Row click → `/customers/:customerId?tab=customer&from=customers`

---

## Quotes index (`/quotes`)

### Top metric strip

1. Active quotes — count
2. Pending approval — count (warning when > 0)
3. Expiring in 14 days — count (danger when > 0)
4. Pipeline TCV — currency
5. Avg discount — percentage

### Columns

Quote ID | Customer | Type | Source | TCV | Discount | Approval | Expiry | Owner

- **Quote ID:** Blue link text
- **Customer:** Customer name
- **Type:** Quote type (New Business, Renewal, Amendment)
- **Source:** Source system (Salesforce, In-app, etc.)
- **TCV:** Currency formatted, right-aligned
- **Discount:** Percentage
- **Approval:** StatusBadge for status
- **Expiry:** Date formatted
- **Owner:** Quote owner name

### Click behavior

Row click → `/customers/:customerId?tab=quote&quoteId=:quoteId&from=quotes`

---

## Contracts index (`/contracts`)

### Top metric strip

1. Operational contracts — count (Active, Extended, Closing, Scheduled)
2. Pending enforcement — count (warning when > 0)
3. Renewals in 60 days — count (warning when > 0)
4. Active TCV — currency
5. Amendments in progress — count

### Columns

Contract ID | Customer | TCV | Term | Renewal | Enforcement | Status | Owner

- **Contract ID:** Blue link text
- **Customer:** Customer name (merged with session customers)
- **TCV:** Currency formatted, right-aligned
- **Term:** Contract term (e.g. "12 months")
- **Renewal:** Renewal date or "—"
- **Enforcement:** StatusBadge for enforcement status
- **Status:** StatusBadge for contract status
- **Owner:** Contract owner name

### Click behavior

Row click → `/customers/:customerId?tab=contract&contractId=:contractId&from=contracts`

### Data merging

Contracts index merges:
- `sessionContracts` from IngestContext (runtime-created contracts)
- `contractClosures` (runtime closure state)
- `contractGraceExtensions` (grace period state)

### Contracts index header

No upload or create button — uploading signed contracts is a **Queue** action. See `docs/09-contract-ingestion.md` for the Queue → ingest pipeline.

---

## Invoices index (`/invoices`)

### Top metric strip

1. Total invoices — count
2. Pending review — count (warning when > 0; includes "Pending Approval")
3. Overdue — count (danger when > 0)
4. Open AR — currency (danger)
5. Blocked — count (warning when > 0)

### Columns

Invoice ID | Customer | Contract | Amount | Due date | Status | Owner | Blocker

- **Invoice ID:** Blue link text
- **Customer:** Customer name (merged with session customers)
- **Contract:** Contract ID or "—"
- **Amount:** Currency formatted, right-aligned
- **Due date:** Date formatted
- **Status:** StatusBadge for invoice status
- **Owner:** Invoice owner name
- **Blocker:** Hold reason or "—" (muted text)

### Click behavior

Row click → `/customers/:customerId?tab=invoicing&invoiceId=:invoiceId&from=invoices`

### Data merging

Invoices index merges:
- `sessionInvoices` from IngestContext (runtime-created invoices)
- `invoiceStatusOverrides` (approval status changes)

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
2. App renders `/customers` — list table
3. User clicks row for Lumina AI
4. Navigates to `/customers/cust_lumina_002?tab=customer&from=customers`
5. App renders `CustomerRevenueWorkspace` with Customer (Account 360) tab active

### Flow B: Quotes

1. User clicks "Quotes" in sidebar
2. List table shows all quotes
3. User clicks QT-2026-0041 (Pioneer Systems)
4. Navigates to `/customers/cust_pioneer_004?tab=quote&quoteId=QT-2026-0041&from=quotes`

### Flow C: Contracts

1. User clicks "Contracts" → list table
2. User clicks CON-2024-0201 (Lumina AI)
3. Navigates to `/customers/cust_lumina_002?tab=contract&contractId=CON-2024-0201&from=contracts`

### Flow D: Invoices

1. User clicks "Invoices" → list table
2. User clicks INV-2026-0040 (Northlane Labs)
3. Navigates to `/customers/cust_northlane_003?tab=invoicing&invoiceId=INV-2026-0040&from=invoices`
