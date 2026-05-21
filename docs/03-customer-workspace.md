# Customer Revenue Workspace — Shell Anatomy

The shared page component used by all detail routes. Located at `src/components/revenue-workspace/CustomerRevenueWorkspace.tsx`.

Used by: `/customers/:customerId`, `/quotes/:quoteId` (alias), `/contracts/:contractId` (alias), `/invoices/:invoiceId` (alias).

Regardless of entry route, the workspace resolves the customer, determines the active tab, and shows the matching stage content. See `docs/06-routing.md` for route + param details.

## Live shell structure

The workspace is **not** the older four-layer model (metric header + journey rail + record ID bar + insight rail). The live UI uses:

### 1. CustomerContextBar (sticky chrome)

Component: `CustomerContextBar`

**Top region:**
- Breadcrumb back to index (`from` query param → Customers / Quotes / etc.)
- Customer name as primary title — **collapses on scroll** (threshold ~40px) to save vertical space
- Compact metadata when expanded: AE, CSM, billing owner (no full ARR/TCV ribbon)

**Tab region — file-folder tabs:**
- Stages in order: **Overview → Tasks → Threads → Quotes → Contracts → Invoicing → Collections → RevRec**
- List-detail stages (Quote, Contract, Invoicing) support **grouped child tabs**: open records appear as closable sub-tabs under the parent tab
- Child tab persistence via `openChildTabs` / `selectedChildPerStage` state
- Overflow → **"More"** dropdown when tabs exceed ~90% container width

**Record slot:**
- Empty `<div ref>` when a record is selected; `RecordHeader` portals actions into it

### 2. Main content column

- Wrapper: `[data-workspace-content]`, centered, `px-6 pt-2 pb-12`
- Width: `max-w-[1020px]` in list mode, `max-w-[860px]` in detail mode
- Background: `bg-gray-100` (via workspace root + `WorkspaceShellContext`)

Stage content components render inside this column. NBA / AI insights / section cards live **in tab content**, not a global right rail.

### 3. RecordHeader (optional action pill)

Component: `RecordHeader` (portaled via `RecordSlotContext`)

Shown on Quote / Contract / Invoicing when viewing a **specific record** (not list view). Hidden on Overview, Tasks, Threads, Payment, RevRec.

**Current design — action-only pill:**
- Slim `rounded-full` glass bar: `bg-white/65`, `backdrop-blur-md`, subtle shadow
- **Right side:** flat text actions + vertical hairline dividers + optional overflow (`…`)
- **No** ID pill, back link, or dropdown in the live component (older docs described a full ID bar — superseded)

State-aware contract actions (Transition, Resolve renewal, Close contract early, etc.) are composed in `ContractStageContent`. See `docs/04-lifecycle-tabs.md`.

## Tab gating

Implemented in `CustomerRevenueWorkspace` (see `docs/11-workspace-cleanup-and-gating.md`):

| Tab | Rule |
|---|---|
| Overview | always enabled |
| Tasks | always enabled |
| Threads | always enabled |
| Quote | always enabled (empty state if no quotes) |
| Contract | enabled only if customer has ≥ 1 contract |
| Invoicing | enabled only if customer has ≥ 1 contract |
| Collections (payment) | enabled only if customer has ≥ 1 invoice |
| RevRec | enabled only if customer has ≥ 1 contract |

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

## Close contract overlay

`CloseContractPane` renders as a full-canvas overlay inside the workspace (not a separate route). Triggered from contract overflow menu or queue-driven `closeIntent` query params. See `docs/04-lifecycle-tabs.md` and `docs/09-contract-ingestion.md`.
