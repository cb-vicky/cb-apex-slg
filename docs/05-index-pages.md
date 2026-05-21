# Resource Index Pages — List Table Landing

Module index pages use a consistent **list table + metric strip** pattern. Implementation: `src/pages/*Index.tsx` + primitives in `src/components/index-page/`.

## Live index modules

| Route | Page | Notes |
|---|---|---|
| `/customers` | `CustomersIndex` | |
| `/prospects` | `ProspectsIndex` | New-business queue rows (`scenario === "New Business"`) |
| `/quotes` | `QuotesIndex` | |
| `/contracts` | `ContractsIndex` | No upload CTA — ingest via Workbench Queue |
| `/invoices` | `InvoicesIndex` | |

**Workbench tabs (not separate index pages):**

- `/queue` → redirects to `/?tab=queue`
- `/approvals` → redirects to `/?tab=approvals`

> **Contract upload:** Import is on **Workbench → Queue tab** (`UploadModal`), not Contracts index. See `docs/09-contract-ingestion.md`.

## Shared page anatomy

A. **Sticky header** — `PageHeader` with module title + optional CTA; shadow on scroll (`useScrolled`)
B. **Metric strip** — 4–5 summary cards (`MetricStrip` with `default` / `warning` / `danger` variants)
C. **Filter bar** — `FilterBar` for search/filter affordances (all main indexes + Prospects)
D. **List table** — `ListTable` in a `rounded-3xl` white bordered container
E. Row click → customer workspace with correct `?tab=` + record params

Components:
- `PageHeader`, `MetricStrip`, `FilterBar`, `ListTable` / `ListRow` / `ListCell`, `useScrolled`

## Design notes

- Header: `sticky top-0 z-10`, shadow on scroll
- Tables: `text-[14px]` rows, `py-3` padding, uppercase `11px` column headers — **readable, not tight-dense**
- Container: `rounded-3xl border bg-white`
- Row click uses React Router `navigate` — no nested row buttons

---

## Customers index (`/customers`)

### Metric strip

Active customers · Renewals in 30 days · Open AR total · Quotes pending · At-risk customers

### Columns

Customer | ARR | Open AR | Contracts | Quotes | Renewal | Risk | Owner

### Click behavior

`/customers/:customerId?tab=customer&from=customers`

---

## Prospects index (`/prospects`)

New-business pipeline view sourced from queue data (`New Business` scenario).

### Click behavior

Opens **`EntityDrawer`** for ingest (`openDrawer`) rather than only full-page `/queue/:id` — primary demo path is drawer-first.

---

## Quotes index (`/quotes`)

### Metric strip

Active quotes · Pending approval · Expiring in 14 days · Pipeline TCV · Avg discount

### Click behavior

`/customers/:customerId?tab=quote&quoteId=:quoteId&from=quotes`

---

## Contracts index (`/contracts`)

Merges seed contracts + `sessionContracts` + `contractClosures` + `contractGraceExtensions` from `IngestContext`.

### Header

No upload button.

### Click behavior

`/customers/:customerId?tab=contract&contractId=:contractId&from=contracts`

---

## Invoices index (`/invoices`)

Merges seed invoices + `sessionInvoices` + `invoiceStatusOverrides`.

### Click behavior

`/customers/:customerId?tab=invoicing&invoiceId=:invoiceId&from=invoices`

---

## Workbench Queue & Approvals tabs

Operational queue and approval lists live on **`WorkbenchHome`** (`/?tab=queue`, `/?tab=approvals`), not standalone index pages.

- **Queue tab:** `QueueTabContent` — Import, Connect, row clicks → `EntityDrawer` or `UnifiedFlowShell`
- **Approvals tab:** `ApprovalsTabContent` — pending approvals; row clicks → drawer or `/approvals/invoices/:id`

See `docs/10-workbench-home.md` and `docs/09-contract-ingestion.md`.

---

## Click flow examples

### Customers → workspace

1. Sidebar → Customers → `/customers`
2. Click Lumina AI → `/customers/cust_lumina_002?tab=customer&from=customers`
3. `CustomerRevenueWorkspace` with Overview active

### Quotes → workspace with record

1. Sidebar → Quotes → click QT-2026-0041
2. `/customers/cust_pioneer_004?tab=quote&quoteId=QT-2026-0041&from=quotes`
