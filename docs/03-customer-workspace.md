# Customer Revenue Workspace — Shell Anatomy

The shared page component used by all detail routes. Located at `src/components/revenue-workspace/CustomerRevenueWorkspace.tsx`.

Used by: `/customers/:customerId`, `/quotes/:quoteId` (alias), `/contracts/:contractId` (alias), `/invoices/:invoiceId` (alias).

Regardless of entry route, the workspace resolves the customer, determines the active tab, and shows the matching stage content. See `docs/06-routing.md` for route + param details.

## Live shell structure

The workspace is **not** the older four-layer model (metric header + journey rail + record ID bar + insight rail). The live UI uses:

### 1. CustomerContextBar (sticky chrome)

Component: `CustomerContextBar`

**Header region (two rows):**

*Row 1 — Breadcrumb row:*
- Breadcrumb back to index (left) — `from` query param → Customers / Quotes / etc.
- Team metadata (right) — AE, CSM, Billing owner

*Row 2 — Customer name row:*
- Customer name as primary title (left) — **collapses on scroll** (threshold ~40px)
- Priority chips/tags (right, center-aligned with name) — e.g., "Overdue 2", "Renewal 30d"

**Tab region — file-folder trapezoidal tabs:**
- **Center-aligned** tabs (extra space accumulates on sides)
- Stages in order: **Overview → Tasks → Threads → Quotes → Contracts → Ingestion → Invoicing → Collections → RevRec**
- **Ingestion tab** appears only when the customer has an active ingestion session (conditionally visible)
- List-detail stages (Quote, Contract, Invoicing) support **grouped child tabs**: open records appear as closable sub-tabs under the parent tab
- Tab title character limits: **11 chars** for parent tabs, **8 chars** for record tabs (truncate with ellipsis)
- Tab height: **62px** expanded, **30px** collapsed; corner radius **10px**
- Tabs do **not** stretch to fill width — tightly spaced
- Overflow → **"More"** dropdown when tabs exceed container width

**Context pills (below tab line):**

Two inverted trapezoidal pills (wider at top, narrower at bottom) hang 1px below the horizontal separator line:

*Left info pill — contextual data based on active tab:*
- Overview: ARR + Next Renewal date
- Tasks: Critical task count
- Threads: Unread count (or total thread count)
- Quotes (parent): Quote count
- Quote (record): Quote ID | TCV
- Contracts (parent): Contract count
- Contract (record): Contract ID | TCV
- Ingestion (Frame 1): Sub-tab pills for Summary, Items, Billing, Addresses, Additional, PDFs (each with a status dot)
- Ingestion (Frame 2): `← Back to ingestion` link + sub-tab pills for Contract Preview, Invoice Preview
- Invoicing (parent): Invoice count (or sub-tab pills for Invoices/Credit Notes)
- Invoice (record): Invoice ID | Amount
- Collections: Open AR
- RevRec: Arrangements count

*Right actions pill — record actions:*
- Only shown when viewing a specific record (not list view)
- Contains flat text CTAs with pipe dividers + overflow menu (…)
- Uses same inverted trapezoidal shape as left pill

### 2. Main content column

- Wrapper: `[data-workspace-content]`, centered, `px-6 pt-2 pb-12`
- Width: `max-w-[1020px]` in list mode, `max-w-[860px]` in detail mode
- Background: `bg-gray-100` (via workspace root + `WorkspaceShellContext`)

Stage content components render inside this column. NBA / AI insights / section cards live **in tab content**, not a global right rail.

#### URL → activeTab sync

`CustomerRevenueWorkspace` keeps internal `activeTab` (and `openRecordTabs`, `activeInvoice`, `activeContract`, `activeQuote`) in sync with the URL-driven props `initialStage` + `activeRecordId` via a `useRef`-guarded effect. Whenever those props change (e.g. after `navigate('/customers/:id?tab=invoicing&invoiceId=...')` from Send-for-approval), the effect:

1. Detects the genuine change (refs filter out re-renders without prop diffs)
2. Adds the record to `openRecordTabs` if it's a list-detail stage
3. Sets `activeTab` to the new `{ kind: "record", stage, recordId }` (or `{ kind: "parent", stage }`)
4. Hydrates the matching active record from the merged collections (`invoicesForListView`, `contractsForListView`, `customerQuotes`)

This makes URL-driven navigation the source of truth — no flicker back to Overview, no stale `activeTab`.

### 3. RecordHeader (actions in right pill)

Component: `RecordHeader` (portaled via `RecordSlotContext` into the right context pill)

Shown on Quote / Contract / Invoicing / **Ingestion** when viewing a **specific record** or stage that supports actions (not list view). Hidden on Overview, Tasks, Threads, Payment, RevRec.

**Current design — actions in inverted trapezoidal pill:**
- Actions render inside the right context pill (inverted trapezoid shape)
- Flat text actions + vertical hairline dividers + optional overflow (`…`)
- **No** separate ID pill, back link, or glass container — the shape provides the container
- All stage content (`IngestionActions`, `ContractStageContent`, `InvoicingStageContent`, …) feeds CTAs through the **same** `RecordHeader` portal — never with bespoke chips, status pills, or duplicate containers

State-aware contract actions (Transition, Resolve renewal, Close contract early, etc.) are composed in `ContractStageContent`. State-aware invoice actions (Pending Review vs Pending Approval vs Approved) are composed in `InvoicingStageContent`. See `docs/04-lifecycle-tabs.md`.

## Tab gating

Implemented in `CustomerRevenueWorkspace` (see `docs/11-workspace-cleanup-and-gating.md`):

| Tab | Rule |
|---|---|
| Overview | always enabled |
| Tasks | always enabled |
| Threads | always enabled |
| Quote | always enabled (empty state if no quotes) |
| Contract | enabled only if customer has ≥ 1 contract |
| Ingestion | **visible only** when customer has an active ingestion session |
| Invoicing | enabled only if customer has ≥ 1 contract |
| Collections (payment) | enabled only if customer has ≥ 1 invoice |
| RevRec | enabled only if customer has ≥ 1 contract |

**Note on Ingestion tab:** Unlike other tabs which are always visible (but may be disabled), the Ingestion tab is completely hidden unless `getActiveIngestionForCustomer(customerId)` returns a session. This is because ingestion is a transient workflow state, not a permanent lifecycle stage.

Disabled tabs: 40% opacity, "Not available" sub-text, `cursor-not-allowed`.

**Nuance:** Do not disable downstream tabs when an **active prior contract exists** (renewal quote pending is OK).

## List-then-detail pattern (Quote, Contract, Invoicing)

When landing on a tab without a record ID:

1. Compact table lists all records for that customer
2. Row click opens detail view and adds a **child tab** under the parent stage tab
3. Return to list: click the **parent tab** again (clears child selection) or close the child tab (×)

**Deep links:** URL with `?quoteId` / `?contractId` / `?invoiceId` opens directly in detail mode with child tab open.

### List components

- `QuoteListView` — grouped by lineage; chevron expands older versions
- `ContractListView` — flat table; pending ingestion rows from `queueItems` for Early/Late Renewal scenarios
- `InvoiceListView` — flat table sorted by date desc

Account metadata, open tasks, and external linked records are surfaced in **Overview content**, **Tasks tab** (`customer-tasks.ts`), or **Threads tab** (`email-threads.ts`).

## Cross-tab linking rules

The shell visibly reflects these relationships:

1. **Contract → Invoicing:** enforcement + amendments create/modify invoices
2. **Invoicing → Payment:** sent invoices feed AR / collections
3. **Payment → Invoicing:** disputes hand work back to billing
4. **Invoicing + Credit Notes → RevRec:** feed recognition schedule
5. **Contract amendments → RevRec:** trigger schedule reruns
6. **Payment ≠ RevRec gate:** cash does not gate recognition

Use "View in [Tab]" chip links and callout banners wherever practical.

## Ingestion tab

The Ingestion tab provides a workspace-native interface for reviewing and completing contract ingestion. See `docs/09-contract-ingestion.md` for the full ingestion flow.

### Components

- `IngestionStageContent` — main content router based on `?frame` and `?sub` URL params. Normalizes `?sub` to a valid value for the active frame (e.g. switching back from `frame=2&sub=contract-preview` to `frame=1` coerces sub → `summary`) so transitions never land on a blank canvas
- `IngestionSummarySection`, `IngestionItemsSection`, `IngestionBillingSection`, `IngestionAddressesSection`, `IngestionAdditionalInfoSection` — Frame 1 section views
- `IngestionPdfPreview` — PDF document viewer (self-contained `min-h-[78vh]`; does **not** rely on parent grid height)
- `IngestionContractPreview`, `IngestionInvoicePreview` — Frame 2 previews
- `IngestionActions` — portaled into the right context pill via `RecordHeader`. Renders flat-text `ActionButton` CTAs only (no status dropdown). Frame 1: `Preview`. Frame 2: `Send for approval` + overflow (`Restart ingestion`, `Discard contract`)

### URL params

```
?tab=ingestion&frame=1&sub=summary   # Frame 1, Summary section
?tab=ingestion&frame=1&sub=items     # Frame 1, Items section
?tab=ingestion&frame=2&sub=contract-preview  # Frame 2, Contract preview
```

### State management

Ingestion session state is managed in `IngestContext` via `IngestionSession`. Each session tracks:
- Queue item being ingested
- Customer linkage (matched or created)
- Per-section completion state (issues/review/done)
- Overall status (in_review/ready/awaiting_approval)

## Close contract overlay

`CloseContractPane` renders as a full-canvas overlay inside the workspace (not a separate route). Triggered from contract overflow menu or queue-driven `closeIntent` query params. See `docs/04-lifecycle-tabs.md` and `docs/09-contract-ingestion.md`.
