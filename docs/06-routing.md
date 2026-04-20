# Routing & Navigation

Routes are declared in `src/App.tsx`. The principle: **every detail route renders through the shared `CustomerRevenueWorkspace` shell** — no standalone detail pages.

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

### Ingestion & approvals routes

```
/contracts/ingest            — IngestContractPage (standalone, not in workspace shell)
/contracts/ingest?sample=1   — happy-path sample
/contracts/ingest?sample=2   — exception-path sample
/approvals                   — ApprovalsIndex
/approvals/invoices/:invoiceId — ApprovalDetailPage
```

**Route order constraint:** `/contracts/ingest` must be declared **before** `/contracts/:contractId` in `App.tsx` to prevent "ingest" being matched as a contract ID param.

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

## Full navigation chain (contract ingestion → approval)

See `docs/09-contract-ingestion.md` for the end-to-end flow. Key route transitions:

```
/contracts                               — click Upload
  → upload modal opens
  → click sample → loading animation
/contracts/ingest?sample=1               — verification page
  → click Finish → completion state
/invoices/INV-INGEST-001                 — invoice detail in shared shell
  → click Send for Approval
/approvals                               — pending approval row appears
/approvals/invoices/INV-INGEST-001       — approval detail page
  → click Approve
/invoices/INV-INGEST-001?from=approvals  — back in invoice shell, Approved state
```

## Sidebar navigation

Sidebar items point to **index routes**, not hardcoded record IDs. The "Approvals" nav item is enabled (previously disabled/stubbed). See `src/components/layout/Sidebar.tsx`.
