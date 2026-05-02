# Routing & Navigation

Routes are declared in `src/App.tsx`. The principle: **every detail route renders through the shared `CustomerRevenueWorkspace` shell** — no standalone detail pages.

## Workbench (`/` and `/workbench`)

Both **`/`** and **`/workbench`** render **`WorkbenchHome`**.

- **My Tasks** (default tab) — operational task list + summary stats; destinations are existing routes (`/queue/:id`, `/approvals/invoices/:id` with optional query params, `/customers/:customerId?tab=…`). See `docs/10-workbench-home.md`.
- **Getting Started** — role-aware onboarding content (milestones, rails, footer); unchanged component composition from before My Tasks existed.

The in-page role switcher (Billing Manager / Billing Operator) applies to both tabs.

## Canonical route model

### Index routes (grouped landing + filtered list)

```
/customers
/customers?group=renewals-30d
/quotes
/quotes?group=pending-approval
/contracts
/contracts?group=pending-enforcement
/invoices
/invoices?group=pending-review
/approvals
/queue
/queue?group=pending-review
/queue?group=ingested
```

Same component toggles between grouped and list mode based on the `?group` query param.

### Canonical detail shell

```
/customers/:customerId                                 — default to Customer (Account 360) tab
/customers/:customerId?tab=customer                    — Account 360 tab
/customers/:customerId?tab=quote&quoteId=QT-…          — Quote tab with record selected
/customers/:customerId?tab=contract&contractId=CON-…   — Contract tab with record selected
/customers/:customerId?tab=invoicing&invoiceId=INV-…   — Invoicing tab with record selected
/customers/:customerId?tab=payment                     — Payment tab
/customers/:customerId?tab=revrec                      — RevRec tab
```

Optional **hash** on the same shell (e.g. `/customers/cust_…?tab=customer#support-comms-anchor`) scrolls to in-tab anchors — used by Account 360 deep links such as “View tickets” when escalations are the primary action.

### Resource alias routes (backward compatibility)

These render through the same shell, **not** redirect. They resolve the customer from the resource record and pass the correct initial tab + selected record.

```
/quotes/:quoteId        — resolves quoteId → customerId, renders shell with tab=quote&quoteId
/contracts/:contractId  — resolves contractId → customerId, renders shell with tab=contract&contractId
/invoices/:invoiceId    — resolves invoiceId → customerId, renders shell with tab=invoicing&invoiceId
```

### Queue & approvals routes

```
/queue                                    — QueueIndex (Inbox > Queue, replaces /contracts/ingest entry point)
/queue?group=pending-review               — pending review group filter
/queue/:queueItemId                       — QueueIngestPage (standalone, not in workspace shell)
                                            • Ingestable (`ingestable` + `sampleId`): renders `IngestDrawer` `presentation="page"` (25% fields · 25% comments · 50% document)
                                            • Zenith new business → **QI-2026-0002** (`sample2`)
                                            • Verdant early renewal → **QI-2026-0006** (`sample3`)
                                            • Northlane late renewal → **QI-2026-0003** (placeholder shell today)
                                            • Unknown id → not-found state
/approvals                                — ApprovalsIndex
/approvals/invoices/:invoiceId            — ApprovalDetailPage
/approvals/invoices/:invoiceId?ingestId=… — Approval Detail (full page) entered from a fresh ingest cycle.
                                            Optional `?from=approvals` when opened from drawer **Open comments**.
                                            The `ingestId` triggers the merchant **Approval Settings** modal after the first-invoice approve toast when `firstApprovalCompletedFor[ingestId]` is still false; saving/skipping leads to the **Setup complete** success panel.
```

The `/queue/:queueItemId` route replaces the legacy `/contracts/ingest?sample=N` URL. Ingest UI breadcrumb (inside **`IngestDrawer`**) reads **Queue > {id}** and may append **> {documentName}** on full page. There is no route-order constraint with `/contracts/:contractId`.

## Stage / tab type

```typescript
type Stage = "customer" | "quote" | "contract" | "invoicing" | "payment" | "revrec"
```

## Tab resolution logic (inside workspace)

1. Read `?tab` param from URL search params (default: `"customer"` for `/customers/:customerId`)
2. Read record ID param (`?quoteId`, `?contractId`, `?invoiceId`)
3. Pass `initialStage` and `selectedRecordId` to `CustomerRevenueWorkspace`
4. Journey rail clicking updates the tab param in URL (or local state for prototype)

## Alias route resolution

For `/quotes/:quoteId` (and friends): the page component (`QuoteDetailPage`, `ContractDetailPage`, `InvoiceDetailPage`) resolves the customer from the record and renders `CustomerRevenueWorkspace` with the correct `initialStage` and `selectedRecordId`.

Known past bug (fixed): Pioneer Systems and Zenith Analytics previously inherited Echo Corp's data as a fallback due to a missing null guard in `CustomerDetailPage`. Both now correctly pass `null` quote/contract when no data exists, triggering the appropriate empty/disabled states.

## Deep-linking examples

```
From Customers index "Renewals in 30 days":
  navigate("/customers/cust_echo_001?tab=contract&contractId=CON-2024-0189")

From Customers index "Quotes pending approval":
  navigate("/customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042")

From Quotes index (any row):
  navigate("/customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042")

From Invoices index (any row):
  navigate("/customers/cust_echo_001?tab=invoicing&invoiceId=INV-2026-0034")
```

## Full navigation chain (Queue → ingest → first-invoice approval)

See `docs/09-contract-ingestion.md` for the end-to-end flow. Key route transitions:

```
/queue                                                  — click Import
  → upload modal opens
  → click sample → loading animation
/queue/QI-2026-0002                                     — full-page ingest (Zenith)
  → Ingest contract → session contract + invoice + navigate to `/contracts/CON-…`
/approvals/invoices/<sessionInvoiceId>?ingestId=QI-2026-0002 — approval detail (25/25/50)
  → Approve → toast → ApprovalSettingsModal when first cycle
  → save / skip policy → "All set" success panel
/customers/<customerId>?tab=…                         — customer shell (contract / invoicing tabs)
```

For non-ingest approvals (where there is no `ingestId` query param), the toast is followed by a direct navigation to `/invoices/:invoiceId?from=approvals` and no settings modal appears.

## Sidebar navigation

Sidebar items point to **index routes**, not hardcoded record IDs. The Desk section currently lists:

- **My Workbench** → `/`
- **Queue** → `/queue` (replaces the previous disabled "Inbox" entry; this is the operational landing for every contract pending ingestion)
- **Approvals** → `/approvals`

**Notification dots** (small orange circles on the trailing edge of the row): **My Workbench** shows when there are pending invoice approvals in session **or** an Early Renewal closure is in flight (`pendingRenewalIngestions`). **Approvals** shows when any approval request is **Pending Approval**. See `docs/10-workbench-home.md`.

Other groups (Records, Catalog, Insights) are unchanged. See `src/components/layout/Sidebar.tsx`.
