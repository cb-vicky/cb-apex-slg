# Routing & Navigation

Routes are declared in `src/App.tsx`. The principle: **every customer detail route renders through `CustomerRevenueWorkspace`** — no standalone customer detail pages.

Global overlay: `<EntityDrawer />` is mounted once in `App.tsx` (outside `<Routes>`) for drawer-first ingest, approval, and transition flows.

## Provider tree

```
RootErrorBoundary
  IngestProvider          ← ingest-context-core + state
    DemoPersonaProvider   ← Operator / Approver (TopNav)
      WorkspaceShellProvider  ← customer workspace bg toggle
        AppShell
          Routes + EntityDrawer
```

## Workbench

| Route | Component |
|---|---|
| `/` | `WorkbenchHome` |
| `/workbench` | `WorkbenchHome` (same) |

**Tabs** via `?tab=` query param:

| `?tab=` | Default | Content |
|---|---|---|
| *(none)* | ✓ | Your tasks (`WorkbenchTaskList`) |
| `queue` | | `QueueTabContent` |
| `approvals` | | `ApprovalsTabContent` |

Redirects:
- `/queue` → `/?tab=queue`
- `/approvals` → `/?tab=approvals`

## Index routes

```
/customers       → CustomersIndex
/prospects       → ProspectsIndex
/quotes          → QuotesIndex
/contracts       → ContractsIndex
/invoices        → InvoicesIndex
/collections     → ModuleStubPage
/revrec          → ModuleStubPage
/communications  → ModuleStubPage
```

## Canonical customer detail shell

```
/customers/:customerId
/customers/:customerId?tab=customer|tasks|threads|quote|contract|invoicing|payment|revrec
/customers/:customerId?tab=quote&quoteId=QT-…
/customers/:customerId?tab=contract&contractId=CON-…
/customers/:customerId?tab=invoicing&invoiceId=INV-…
```

Optional hash anchors (e.g. `#support-comms-anchor` on Overview).

Closure / renewal handoff query params:
- `closeIntent=early-renewal|late-renewal`
- `queueItemId=QI-…`
- `closureFor=CON-…` (on approval URLs)

## Resource alias routes

Render through the same shell (no redirect). Page components resolve `customerId` from the record:

```
/quotes/:quoteId        → QuoteDetailPage → CustomerRevenueWorkspace (tab=quote)
/contracts/:contractId  → ContractDetailPage → tab=contract
/invoices/:invoiceId     → InvoiceDetailPage → tab=invoicing
```

## Queue & approvals detail routes

```
/queue/:queueItemId              → QueueIngestPage (full-page IngestDrawer, presentation="page")
/approvals/invoices/:invoiceId   → ApprovalDetailPage (full-page 25/25/50 grid)
```

**Primary ingest path (demo):** `UploadModal` / Queue tab row → `openDrawer({ entityType: "queue_item", mode: "ingest", … })` via `drawer-store.ts`. Full-page URL remains valid for deep links and bookmarking.

Approval URL sync: `useApprovalUrlDrawerSync` opens the drawer from `/approvals/invoices/:id?ingestId=&step=` — see `docs/13-drawer-and-flows.md`.

## Stage / tab type

```typescript
type Stage =
  | "customer"   // Overview tab label
  | "tasks"
  | "threads"
  | "quote"
  | "contract"
  | "invoicing"
  | "payment"    // Collections tab label
  | "revrec"
```

## Tab resolution (inside workspace)

1. Read `?tab` from URL (default `"customer"` for `/customers/:customerId`)
2. Read `?quoteId`, `?contractId`, `?invoiceId`
3. Pass `initialStage` + `selectedRecordId` to `CustomerRevenueWorkspace`
4. Tab clicks update URL search params

## Deep-linking examples

```
From Customers index:
  /customers/cust_echo_001?tab=customer&from=customers

From Quotes index:
  /customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042&from=quotes

From Workbench task row (drawer):
  openDrawer({ entityType: "queue_item", entityId: "QI-2026-0002", mode: "ingest" })

From Workbench task row (navigate):
  /approvals/invoices/INV-INGEST-002?ingestId=QI-2026-0002
```

## Full navigation chain (ingest → approval)

See `docs/09-contract-ingestion.md`. Summary:

```
/?tab=queue → Import → sample2 → EntityDrawer (or /queue/QI-2026-0002 full page)
  → Ingest contract → customer contract tab / session invoice
  → /approvals/invoices/:id?ingestId=… → Approve → ApprovalSettingsModal → success panel
```

Early Renewal (`sample3`) short-circuits to `closeIntent` + `CloseContractPane` instead of standard ingest finish.

## Sidebar navigation

`Sidebar.tsx` points to **index routes** and Workbench — not hardcoded record IDs. Queue and Approvals are **not** sidebar entries; use Workbench tabs.

`usePendingWorkbenchCounts` exists for pending approval / in-flight closure counts but is **not currently wired** to sidebar notification dots.
