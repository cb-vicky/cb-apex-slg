# Queue, Contract Ingestion & First-Invoice Approval

Covers the full pipeline from a signed contract entering the system to the first invoice being approved and the merchant's approval policy being captured.

**Key architecture change (June 2026):** The NEW DEAL ingestion flow now uses:
1. **`NewDealCustomerLinkModal`** — full-screen modal for customer linking (replaces `LinkCustomerModal`)
2. **Zenith Contract Review** — tabbed review UI inside Customer 360 (`contract/zenith/` components)

The operator links a queue item to a customer via the modal, then reviews extracted data in a structured tab-based interface before sending for approval.

**Key files:**
- `src/pages/workbench/QueueTabContent.tsx` — **primary Queue landing** (Workbench tab)
- `src/components/workbench/NewDealCustomerLinkModal.tsx` — full-screen modal for linking queue items to customers
- `src/components/workbench/CreateCustomerForm.tsx` — inline customer creation form
- `src/components/workbench/CustomerLinkSearchResults.tsx` — customer search table
- `src/store/new-deal-customer-link-store.ts` — module-level store for modal state
- `src/components/revenue-workspace/contract/zenith/*` — Zenith contract review UI (tab strip, panels, line item drawer)
- `src/components/revenue-workspace/ingestion/*` — Legacy ingestion tab components (used for non-Zenith flows)
- `src/context/IngestProvider.tsx`, `ingest-context-core.ts` — session state including `IngestionSession`
- `src/components/common/EntityDrawer.tsx` + `src/store/drawer-store.ts` — **simplified** to only handle invoice approval
- `src/data/ingest-data.ts` — extracted contract samples (`sample2` new business, `sample3` early renewal, `sample4` late renewal) + types
- `src/data/zenith-*.ts` — Zenith-specific seed data (catalog items, contract summary, comments, preview)
- `src/data/customer-link-search-seed.ts` — customer search seed data
- `src/data/approval-policy.ts` — merchant policy
- `src/components/approvals/InvoiceApprovalDrawer.tsx` — drawer for invoice approval
- `src/components/contracts/UploadModal.tsx` — Import modal (drag-and-drop + sample picker → opens `NewDealCustomerLinkModal`)
- `src/data/queue-data.ts` — queue seed set; `QueueScenario` includes Late Renewal
- `src/lib/new-deal-customer-link.ts` — helper functions for customer linking flow
- `src/hooks/useNewDealCustomerLinkGate.tsx` — hook for modal gate logic

---

## Implementation snapshot

### Primary path: NEW DEAL Ingestion (Zenith flow)

All NEW DEAL demo flows now route through:

1. **`NewDealCustomerLinkModal`** — full-screen modal opened from Queue tab or Upload modal
2. **Zenith Contract Review** — tabbed UI inside Customer 360 Ingestion tab
3. **Send for approval** — creates contract + invoice, navigates to Invoicing tab

### NewDealCustomerLinkModal (full-screen)

Opened via `openNewDealCustomerLinkModal(queueItemId)` from:
- **Queue tab** row click (Pending Review, In Progress, Returned)
- **Upload modal** after sample selection
- **Workbench task list** for queue-sourced ingest tasks

**Layout:** Full-screen modal with two-column grid:
- **Left (40%):** Contract PDF preview with zoom controls, page navigation
- **Right (60%):** Customer linking interface

**Right panel content:**
1. **Extracted customer details card** — shows company, legal entity, domain, contact from PDF extraction
2. **Mode toggle:** "Link to existing" | "Create new customer"
3. **Link mode:** Customer search bar + scrollable customer table
4. **Create mode:** Inline form (company, legal entity, domain, contact name, email)
4. **Footer:** Cancel + "Continue to ingest" CTA

**State management:**
- `src/store/new-deal-customer-link-store.ts` — simple store with `openNewDealCustomerLinkModal` / `closeNewDealCustomerLinkModal`
- `src/hooks/useNewDealCustomerLinkGate.tsx` — hook to resolve pending queue item

On submit:
```typescript
startIngestionSession(queueItemId, customerId, sampleId, "matched" | "created")
applyQueueItemOverride(queueItemId, { status: "In Progress", customerId })
openQueueIngestionTab(customerId, queueItemId, navigate)
// navigates to /customers/:customerId?tab=ingestion&queueItemId=...
```

### Zenith Contract Review (Ingestion tab)

The **Ingestion** tab uses the Zenith contract review UI when an active ingestion session exists.

**Key components** (`src/components/revenue-workspace/contract/zenith/`):
- `ZenithContractChromeContext` — shared state provider (active tab, line items, comments, scroll collapse)
- `ZenithContractTabStrip` — horizontal tab bar with status icons
- `ZenithContractTabPanel` — content area switching based on active tab
- `ZenithContractSummaryTab` — contract terms overview
- `ZenithContractItemsTab` — line items with catalog mapping
- `ZenithContractBillingInfoTab` — billing frequency, payment terms
- `ZenithContractAddressesTab` — billing/shipping addresses
- `ZenithContractInvoicePreviewTab` — PDF-style invoice preview + Send for approval CTA
- `ZenithLineItemBottomDrawer` — slide-up drawer for item mapping (Map to existing / Create new)
- `ZenithContractCommentsPanel` — slide-out comments panel
- `ZenithMarkTabDoneBar` — "Mark as done" sticky CTA for manual completion tabs

**Tab structure:**
| Tab | Purpose | Completion |
|-----|---------|------------|
| Summary | Contract terms overview, scroll to source | Auto-complete |
| Items | Line item table, catalog mapping | Complete when all items mapped |
| Billing info | Term, billing cycle, payment terms | Manual "Mark as done" |
| Addresses | Billing/shipping addresses | Manual "Mark as done" |
| Invoice Preview | PDF invoice preview + Send for approval | N/A (final action) |

**Tab status icons:**
- Gray circle — incomplete
- Green checkmark — complete
- Invoice Preview unlocks when all other tabs are complete

**URL structure:**
```
/customers/:customerId?tab=ingestion&queueItemId=...&zenithTab=Summary
/customers/:customerId?tab=ingestion&queueItemId=...&zenithTab=Items
/customers/:customerId?tab=ingestion&queueItemId=...&zenithTab=Invoice+Preview
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

## Zenith tab content

### Summary tab (`ZenithContractSummaryTab`)
- Section cards with extracted contract data:
  - Line items summary with scroll-to-source snippets
  - Billing information (term, cycle, start date, payment terms)
  - Addresses (billing, shipping)
- Each section shows extracted values with "View source" links that scroll to the source snippet
- Auto-completes when user has viewed the tab

### Items tab (`ZenithContractItemsTab`)
- Line items table with columns: Item, Frequency, Qty, Unit price, Amount
- Each row shows mapping status:
  - **Mapped** — green checkmark, linked catalog item shown
  - **Needs mapping** — amber warning, "Map item" action
- Bottom drawer (`ZenithLineItemBottomDrawer`) for item mapping:
  - **Map to existing** panel — catalog item search with condensed results
  - **Create new** panel — inline form to create catalog item
- Tab completes when all items are mapped

### Billing info tab (`ZenithContractBillingInfoTab`)
- Editable form fields:
  - Term length (read-only)
  - Billing cycle (read-only)
  - Start date (date picker)
  - Auto collection (dropdown: Use customer's settings / On / Off)
  - PO number (text input)
  - Payment terms (dropdown: Net 15/30/45/60, Due on receipt)
- **Mark as done** CTA to manually complete

### Addresses tab (`ZenithContractAddressesTab`)
- Two address cards: Billing and Shipping
- Editable fields: Line 1, Line 2, City, State, Postal code, Country
- "Shipping same as billing" checkbox
- **Mark as done** CTA to manually complete

### Invoice Preview tab (`ZenithContractInvoicePreviewTab`)
- **Gated** — only accessible when all other tabs are complete
- PDF-style invoice document preview:
  - Header with APEX branding, invoice number, dates, status
  - Bill To section with customer details
  - Reference section (contract, terms, billing period)
  - Line items table (from mapped items)
  - Totals: Subtotal, Tax (8.75%), Total Due
  - Payment instructions footer
- Zoom controls toolbar (+/-, download)
- **Ready for approval banner** with **Send for approval** CTA
- Approver view shows **Approve** CTA when persona is "approver"

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
2. Click row OR Import → sample2
3. NewDealCustomerLinkModal opens (full-screen)
   - Left: Contract PDF preview
   - Right: Customer linking (search or create)
4. Link to existing OR fill Create new form
5. Click "Continue to ingest"
   → startIngestionSession(queueItemId, customerId, sampleId, "matched"|"created")
   → applyQueueItemOverride(queueItemId, { status: "In Progress" })
   → navigates to                                         — /customers/:customerId?tab=ingestion&queueItemId=...
6. Zenith Contract Review tabs:
   - Summary: review extracted data                       — &zenithTab=Summary
   - Items: map line items to catalog                     — &zenithTab=Items
   - Billing info: confirm terms, mark done               — &zenithTab=Billing+info
   - Addresses: confirm addresses, mark done              — &zenithTab=Addresses
7. All tabs complete → Invoice Preview unlocks            — &zenithTab=Invoice+Preview
8. Review PDF-style invoice preview
9. Click "Send for approval"
   → creates session contract + invoice
   → sets invoice override status = "Pending Approval"
   → marks queue item Ingested
   → completes ingestion session (Ingestion tab hidden)
   → navigates to                                         — /customers/:customerId?tab=invoicing&invoiceId=<id>
10. Invoice details show "Pending Approval" with [Preview · View in Approvals · …]
11. Switch persona to Approver → click "View in Approvals" (or Workbench → Approvals)
12. InvoiceApprovalDrawer → Approve
    → invoice override status = "Approved" or "Posted"
13. (First-cycle only) ApprovalSettingsModal captures merchant policy
```

---

## Deleted components

The following components were removed as part of the NEW DEAL ingestion refactor:

- `src/components/ingestion/LinkCustomerModal.tsx` — replaced by `NewDealCustomerLinkModal`
- `src/store/link-customer-modal-store.ts` — replaced by `new-deal-customer-link-store.ts`
- `src/store/useLinkCustomerModalStore.ts` — no longer needed
- `src/components/transitions/IngestDrawer.tsx`
- `src/components/transitions/UnifiedFlowShell.tsx`
- `src/components/transitions/ValidationPanel.tsx`
- `src/components/transitions/IngestDocumentPreviewPane.tsx`
- `src/components/transitions/sections/*` — all section components
- `src/components/transitions/panels/*` — all panel components
- `src/pages/QueueIngestPage.tsx`

The `src/components/transitions/` and `src/components/ingestion/` directories no longer exist.

---

## Scope notes

- File upload UI is non-functional — **sample2** / **sample3** / **sample4** map to **queue ids** via `getQueueItemBySample`.
- Queue seed is intentionally small; expand in `queue-data.ts` when adding scenarios.
- Session-created objects live in `IngestContext` only — refresh resets.
- The Approvals module surfaces **invoice / closure document** approvals.
