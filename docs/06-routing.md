# Routing & Navigation

Routes are declared in `src/App.tsx`. The principle: **every customer detail route renders through `CustomerRevenueWorkspace`** — no standalone customer detail pages.

Global overlays mounted in `App.tsx` (outside `<Routes>`):
- `<EntityDrawer />` — invoice approval drawer
- `<LinkCustomerModal />` — customer linking modal for contract ingestion

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
/queue/:queueItemId              → Redirects to /?tab=queue (ingestion now uses Customer 360 tab)
/approvals/invoices/:invoiceId   → ApprovalDetailPage (full-page 25/25/50 grid)
```

**Primary ingest path (demo):** `UploadModal` / Queue tab row / Workbench task → `openLinkCustomerModal(queueItemId)` → `LinkCustomerModal` → navigates to `/customers/:customerId?tab=ingestion`.

Approval URL sync: `useApprovalUrlDrawerSync` opens the drawer from `/approvals/invoices/:id?ingestId=` — see `docs/13-drawer-and-flows.md`.

## Stage / tab type

```typescript
type Stage =
  | "customer"   // Overview tab label
  | "tasks"
  | "threads"
  | "quote"
  | "contract"
  | "ingestion"  // Conditional — only visible with active session
  | "invoicing"
  | "payment"    // Collections tab label
  | "revrec"
```

## Tab resolution (inside workspace)

1. Read `?tab` from URL (default `"customer"` for `/customers/:customerId`)
2. Read `?quoteId`, `?contractId`, `?invoiceId`
3. For ingestion tab: read `?frame` and `?sub` params
4. Pass `initialStage` + `selectedRecordId` to `CustomerRevenueWorkspace`
5. Tab clicks update URL search params

## Ingestion tab URL params

```
/customers/:id?tab=ingestion&frame=1&sub=summary     # Frame 1, Summary section
/customers/:id?tab=ingestion&frame=1&sub=items       # Frame 1, Items section
/customers/:id?tab=ingestion&frame=1&sub=pdf-doc1    # Frame 1, PDF preview
/customers/:id?tab=ingestion&frame=2&sub=contract-preview  # Frame 2, Contract preview
/customers/:id?tab=ingestion&frame=2&sub=invoice-preview   # Frame 2, Invoice preview
```

## Deep-linking examples

```
From Customers index:
  /customers/cust_echo_001?tab=customer&from=customers

From Quotes index:
  /customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042&from=quotes

From Workbench task row (queue ingest):
  openLinkCustomerModal("QI-2026-0002")
    → LinkCustomerModal → /customers/:customerId?tab=ingestion

From Workbench task row (approval):
  /approvals/invoices/INV-INGEST-002?ingestId=QI-2026-0002
```

## Full navigation chain (ingest → approval)

See `docs/09-contract-ingestion.md`. Summary:

```
/?tab=queue → Import → sample2 → LinkCustomerModal
  → Link customer (match or create)
  → /customers/:customerId?tab=ingestion&frame=1&sub=summary
  → Review all sections (Summary, Items, Billing, Addresses, Additional)
  → Preview enables → Frame 2 → Send for approval
       • setInvoiceStatusOverride(invoice, "Pending Approval")
       • completeIngestion (Ingestion tab disappears)
  → /customers/:customerId?tab=invoicing&invoiceId=INV-…
       (workspace's URL → activeTab sync effect opens the new invoice automatically)
  → Invoice details "Pending Approval": [Preview · View in Approvals · …]
  → Approver: View in Approvals → InvoiceApprovalDrawer → Approve
       • setInvoiceStatusOverride(invoice, "Approved")
  → (First-cycle only) ApprovalSettingsModal → success panel
```

Early Renewal (`sample3`) and Late Renewal (`sample4`) require additional closure handoff integration.

## Sidebar navigation

`Sidebar.tsx` points to **index routes** and Workbench — not hardcoded record IDs. Queue and Approvals are **not** sidebar entries; use Workbench tabs.

`usePendingWorkbenchCounts` exists for pending approval / in-flight closure counts but is **not currently wired** to sidebar notification dots.
