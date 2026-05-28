# Queue, Contract Ingestion & First-Invoice Approval

Covers the full pipeline from a signed contract entering the system to the first invoice being approved and the merchant's approval policy being captured.

**Key architecture change (May 2026):** Ingestion has moved from a drawer/full-page flow (`IngestDrawer`, `UnifiedFlowShell`, `QueueIngestPage`) to a **Customer 360 Ingestion tab** inside `CustomerRevenueWorkspace`. The operator now links a queue item to a customer via a modal, then reviews extracted data in the customer's workspace.

**Key files:**
- `src/pages/workbench/QueueTabContent.tsx` — **primary Queue landing** (Workbench tab)
- `src/components/ingestion/LinkCustomerModal.tsx` — modal for linking queue items to customers (new/matched)
- `src/store/link-customer-modal-store.ts` — module-level store for modal state
- `src/components/revenue-workspace/ingestion/*` — Ingestion tab components (section views, previews, actions)
- `src/context/IngestProvider.tsx`, `ingest-context-core.ts` — session state including `IngestionSession`
- `src/components/common/EntityDrawer.tsx` + `src/store/drawer-store.ts` — **simplified** to only handle invoice approval
- `src/data/ingest-data.ts` — extracted contract samples (`sample2` new business, `sample3` early renewal, `sample4` late renewal) + types
- `src/data/ingestion-session.ts` — helpers for building Contract and Invoice from ingestion data
- `src/data/approval-policy.ts` — merchant policy
- `src/context/IngestContext.tsx` — queue overrides, approvals, sessions, closures
- `src/components/approvals/InvoiceApprovalDrawer.tsx` — drawer for invoice approval
- `src/components/contracts/UploadModal.tsx` — Import modal (drag-and-drop + sample picker → opens `LinkCustomerModal`)
- `src/data/queue-data.ts` — queue seed set; `QueueScenario` includes Late Renewal

---

## Implementation snapshot

### Primary path: Customer 360 Ingestion tab

All demo flows now route through:

1. **`LinkCustomerModal`** — opened from Queue tab, Upload modal, or Workbench task
2. **`CustomerRevenueWorkspace`** with **Ingestion tab** active — operator reviews extracted data
3. **Send for approval** — creates contract + invoice, navigates to Invoicing tab

### LinkCustomerModal (720px centered)

Opened via `openLinkCustomerModal(queueItemId)` from:
- **Queue tab** row click (Pending Review, In Progress, Returned)
- **Upload modal** after sample selection
- **Workbench task list** for queue-sourced ingest tasks

Modal content:
1. **Header:** Document name, extraction confidence badge, queue ID
2. **Customer linking section:**
   - Search for existing customer (typeahead)
   - OR "Create new customer" expandable form (name, legal entity, domain)
3. **Primary CTA:** "Open in workspace" — starts ingestion session, navigates to customer workspace

On submit:
```
startIngestionSession(queueItemId, customerId, sampleId, customerLink)
navigate(`/customers/${customerId}?tab=ingestion`)
```

### Ingestion tab in CustomerRevenueWorkspace

The **Ingestion** tab appears in the workspace tab bar **only when** the customer has an active ingestion session (`getActiveIngestionForCustomer(customerId)`).

**Frame 1 (Review):** Sub-tabs controlled via `ContextInfoPill`:
- Summary — contract terms overview
- Items — line items with catalog mapping
- Billing — billing frequency, payment terms
- Addresses — billing/shipping addresses
- Additional Info — notes, clauses
- PDFs — uploaded documents

Each section shows a status indicator (issues/review/done) and a "Mark as done" CTA.

**Frame 2 (Preview):** After all sections are reviewed:
- Contract Preview — how the contract will appear in Chargebee
- Invoice Preview — how the first invoice will appear

The `ContextInfoPill` swaps to a Frame-2 layout while in preview mode: `← Back to ingestion | Contract Preview | Invoice Preview`. Clicking **Back to ingestion** returns to Frame 1 (`?frame=1&sub=summary`).

**Actions** (portaled into the right context pill via `RecordHeader`):
- Frame 1: **Preview** (flat blue text CTA, enabled when `overallStatus === "ready"` OR every section is `done`)
- Frame 2: **Send for approval** (primary CTA) + `…` overflow (Restart ingestion · Discard contract)

The actions slot is a thin trapezoid pill that only houses CTAs — there is **no status dropdown / status chip**. Per-section state still drives the Frame 1 sub-tab dots (red `issues` / amber `review` / green `done`) and the Preview-enabled gate.

### URL structure

```
/customers/:customerId?tab=ingestion&frame=1&sub=summary
/customers/:customerId?tab=ingestion&frame=1&sub=items
/customers/:customerId?tab=ingestion&frame=2&sub=contract-preview
/customers/:customerId?tab=ingestion&frame=2&sub=invoice-preview
```

### IngestionSession state

`IngestContext` manages `ingestionSessions: Record<string, IngestionSession>`:

```typescript
interface IngestionSession {
  queueItemId: string;
  customerId: string;
  sampleId: "sample2" | "sample3" | "sample4";
  customerLink: "matched" | "created";
  overallStatus: "in_review" | "ready" | "awaiting_approval";
  sections: Record<IngestionSectionId, IngestionSectionState>;
  startedAt: string;
}
```

Actions:
- `startIngestionSession(queueItemId, customerId, sampleId, customerLink)`
- `setIngestionSectionState(queueItemId, section, state)`
- `setIngestionOverallStatus(queueItemId, status)` — flipped to `"awaiting_approval"` immediately before `completeIngestion`
- `discardIngestion(queueItemId)` — marks queue item Rejected and removes the session
- `restartIngestion(queueItemId)` — resets sections to initial state
- `completeIngestion(queueItemId)` — **removes the session** after Send-for-approval; the Ingestion tab disappears from the workspace and the customer lands on the new invoice's details page
- `getActiveIngestionForCustomer(customerId)` — returns active session if any (drives Ingestion tab visibility)

---

## Product goal

Convert a signed commercial document into an operational billing contract inside Chargebee APEX, generate the first invoice, route it through approval, and capture the merchant's invoice approval policy — all within the customer's 360 workspace.

---

## Where contracts come from (Queue sources)

Every signed document lands in the **Queue**. Sources surfaced in mock data:

| Source       | Detail                                       | Behaviour |
|--------------|----------------------------------------------|-----------|
| **PDF Upload** | Drag-and-drop in the Import modal           | Drives the active prototype flow |
| **API**        | Salesforce CPQ, DocuSign CLM, etc.         | Visual indication only |
| **CPQ**        | Native Quote → Contract handoff             | Visual indication only |
| **Email**      | Forwarded to a billing inbox                 | Visual indication only |

**Workbench → Queue tab** toolbar exposes:
- **Connect** (secondary) — `QueueIntegrationsModal`
- **Import** (primary) — `UploadModal` → resolves `getQueueItemBySample` → **`openLinkCustomerModal`**

`/queue` and `/queue/:queueItemId` redirect to `/?tab=queue`.

---

## Queue tab (`/?tab=queue`)

List table pattern aligned with other indexes (`docs/05-index-pages.md`).

### Metric strip
- Pending review (count, warning when > 0)
- In progress (count)
- TCV in queue (sum of pending TCV)
- Recently ingested (count)
- Failed / Rejected (count, danger when > 0)

### Groups (in order)
- **Pending review** — `status === "Pending Review"`
- **In progress** — `status === "In Progress"`
- **Recently ingested** — `status === "Ingested"`
- **Failed / Rejected** — `status === "Failed" | "Rejected"`

### List columns
Queue ID · Document (with name + source detail subtitle) · Scenario · Customer · TCV · Source badge · Uploaded · Status

### Row click behaviour
- **Pending Review / In Progress / Returned** + `ingestable: true` + `sampleId` → **`openLinkCustomerModal(queueItemId)`**
- **Ingested** → `/contracts/:contractId?from=queue` (when wired from index)
- **Failed / Rejected** → shows in list only (no modal)

---

## Import modal (Upload)

Triggered from: Queue > **Import** button.

1. **Choose** — drag-and-drop area (visual only) + sample document buttons
2. **Loading** — animated progress bar (~3.2s) cycling through extraction messages
3. **Done** — opens **`LinkCustomerModal`** for customer linking

Samples: `sample2` → `QI-2026-0002`, `sample3` → `QI-2026-0006`, `sample4` → late renewal flow.

---

## Ingestion tab content

### Summary section
- Contract terms: term, start/end dates, billing frequency, payment terms
- Financial summary: TCV, ARR, minimum commit, prepaid credits
- Auto-renewal status

### Items section
- Extracted line items table with:
  - Product name, SKU, quantity, unit price, discount, net amount
  - Billing model indicator
  - Catalog match status (Matched / Unmapped)
- "Map to catalog" action for unmapped items
- Search/filter for catalog products

### Billing section
- Contract term visualization
- Billing frequency
- Payment terms
- Financial summary table

### Addresses section
- Billing address form
- Shipping address form (with "Same as billing" checkbox)

### Additional Info section
- Notes text area
- Contract clauses (expandable list)

### PDF Preview
- Document viewer with zoom controls
- Page navigation (when multi-page)
- Mock "dashed paper" aesthetic

---

## Contract and Invoice Preview (Frame 2)

### Contract Preview
Shows a mock of how the contract will appear in Chargebee:
- Contract ID, customer name, status
- Terms and dates
- Products table
- Important clauses

### Invoice Preview
Shows a mock of the first invoice:
- Invoice number, date, due date
- From/To addresses
- Line items
- Subtotal, tax, total

Both previews have navigation to switch between them.

---

## Send for approval flow

When operator clicks "Send for approval" in Frame 2:

1. `buildSessionContractFromIngestion(extracted, customerId)` — creates Contract (status `Scheduled`, `billingSchedule[0].invoiceId = undefined` so contract activation is left to the approver flow)
2. `buildSessionInvoiceFromIngestion(extracted, customerId, contractId)` — creates Invoice
3. `addSessionContract(contract)` and `addSessionInvoice(invoice)`
4. `submitInvoiceForApproval(invoiceId, { customerId, customerName, invoiceAmount, invoiceDate, ingestId })`
5. `setInvoiceStatusOverride(invoiceId, "Pending Approval")` — flips the invoice status everywhere `mergeInvoiceStatuses` reads (lists, badges, customer 360, Workbench Approvals)
6. `applyQueueItemOverride(queueItemId, { status: "Ingested", contractId, invoiceId, customerId })`
7. `setIngestionOverallStatus(queueItemId, "awaiting_approval")` then `completeIngestion(queueItemId)` — clears the ingestion session so the Ingestion tab is no longer visible
8. `navigate('/customers/${customerId}?tab=invoicing&invoiceId=${invoiceId}')`

`CustomerRevenueWorkspace` syncs internal `activeTab` from URL-driven props (`initialStage` / `activeRecordId`) whenever they change, so the new `invoicing` record sub-tab opens directly with the new invoice selected — no extra click required.

### Post Send-for-approval state

On the invoice details page (status `Pending Approval`), `InvoicingStageContent` shows:
- **Preview** + **View in Approvals** flat CTAs, with `…` overflow `Regenerate`
- **View in Approvals** opens the existing `InvoiceApprovalDrawer` (same path used by Workbench Approvals)
- The same approval also appears in `Workbench → Approvals`

When the **Approver** persona approves:
- `InvoiceApprovalDrawer.handleApprove` first tries `activateScheduledContractAfterInvoiceApproval` (matches a `Scheduled` session contract whose `billingSchedule[].invoiceId === invoiceId`). Because `buildSessionContractFromIngestion` deliberately leaves `billingSchedule[0].invoiceId = undefined`, this match fails and the helper returns `false`
- The fall-through path then calls `setInvoiceStatusOverride(invoiceId, "Approved")`
- The invoice details page now renders the default Approved branch (Preview · Regenerate)

---

## Invoice approval

**EntityDrawer** is now simplified to only handle invoice approval mode:
- Opens when `mode === "invoice_approval" && entityType === "invoice"`
- Renders `InvoiceApprovalDrawer` with invoice context
- Other drawer modes (ingest, transitions) have been removed

**Full-page approval** remains at `/approvals/invoices/:invoiceId` via `ApprovalDetailPage`.

---

## Workbench handoff

**Workbench** (`/`, tabs **Your tasks | Queue | Approvals**) is the operator ↔ approver handoff surface.

- **Demo persona** (TopNav): Operator vs Approver filters visible tasks
- After **Send for approval**: first-invoice approval surfaces in Approvals tab / Your tasks
- Task rows may open **`LinkCustomerModal`** (for queue tasks) or navigate to approval page

---

## Implemented flows summary

| Flow | Status | Entry point | Notes |
|---|---|---|---|
| **Standard ingest (new business)** | ✅ Implemented | Queue row / Upload sample2 → LinkCustomerModal → Ingestion tab | Customer 360 workspace flow |
| **Early Renewal** | ⚠️ Partial | `sample3` | Needs closure handoff integration |
| **Late Renewal** | ⚠️ Partial | `sample4` | Needs grace extension + backdating in new architecture |
| **Contract Closing** | ✅ Implemented | Contract tab overflow | Unchanged from previous implementation |

---

## Navigation chains

### Standard new business (Zenith Analytics, `sample2`)

```
1. Workbench → Queue tab                                  — /?tab=queue
2. Click row OR Import → sample2 → LinkCustomerModal
3. Link to existing customer or create new
4. Click "Open in workspace"                              — /customers/:customerId?tab=ingestion
5. Review Summary, Items, Billing, Addresses, Additional
6. Mark all sections done → Preview CTA enables
7. Click "Preview" to enter Frame 2                       — ?frame=2&sub=contract-preview
8. Review Contract Preview and Invoice Preview
9. Click "Send for approval"
     → creates session contract + invoice
     → sets invoice override status = "Pending Approval"
     → marks queue item Ingested
     → completes ingestion session (Ingestion tab hidden)
     → navigates to                                        — /customers/:customerId?tab=invoicing&invoiceId=<id>
10. Invoice details show "Pending Approval" with [Preview · View in Approvals · …]
11. Switch persona to Approver → click "View in Approvals" (or Workbench → Approvals)
12. InvoiceApprovalDrawer → Approve
     → invoice override status = "Approved"
13. (First-cycle only) ApprovalSettingsModal captures merchant policy
```

---

## Deleted components

The following components were removed as part of the Customer 360 ingestion migration:

- `src/components/transitions/IngestDrawer.tsx`
- `src/components/transitions/UnifiedFlowShell.tsx`
- `src/components/transitions/ValidationPanel.tsx`
- `src/components/transitions/IngestDocumentPreviewPane.tsx`
- `src/components/transitions/sections/*` — all section components
- `src/components/transitions/panels/*` — all panel components
- `src/pages/QueueIngestPage.tsx`

The `src/components/transitions/` directory no longer exists.

---

## Scope notes

- File upload UI is non-functional — **sample2** / **sample3** / **sample4** map to **queue ids** via `getQueueItemBySample`.
- Queue seed is intentionally small; expand in `queue-data.ts` when adding scenarios.
- Session-created objects live in `IngestContext` only — refresh resets.
- The Approvals module surfaces **invoice / closure document** approvals.
