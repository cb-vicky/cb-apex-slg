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
- `src/data/ingest-data.ts` — extracted contract samples (`sample2` Zenith new business, `sample3` early renewal, `sample4` late renewal, **`sample5` Pioneer match-first**) + types
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

### Match-first customer link (`linkWorkflow: "match_first"`)

**Demo queue row:** `QI-2026-0007` (`sample5`, Pioneer Systems) with `suggestedCustomerId: "cust_pioneer_004"`.

**Variant resolution:** `getCustomerLinkWorkflowVariant()` in `src/lib/new-deal-customer-link-workflow.ts` — `queueItem.linkWorkflow` or `sample5` → match-first; otherwise standard.

**UI:** `NewDealCustomerLinkMatchFirstPanel` (right column when variant is match-first) instead of the flat link/create layout only.

| Step | Behavior |
|------|----------|
| **Initial** | Extracted customer card + **Closest match found** banner (grey table header, outline **Approve** / **Reject**, **View similar matches** outline button) |
| **Approve** | Extracted card → green **Ready** pill + green strip; banner animates closed (`customer-link-*` keyframes in `index.css`); selection retained; **View similar matches** remains below card |
| **Reject** | Browse **View all customers** — matches pinned on top; closest row keeps outline **Closest match** pill, **no** emerald row highlight (`closestMatchRejected`) |
| **View similar matches** (from banner or post-approve) | Similar-only list; search strip: `N similar customers` \| **View all customers** |
| **View all customers** | Full catalog with similar rows first, then remainder; count only in search strip (no back-link) |
| **Selection** | Table rows **toggle** — click selected row again to clear; with selection: `{name} selected` · **Clear** \| **View all customers** (similar scope only) |
| **Section chrome** | Only **Ready** pill beside “Extracted customer details” (no Completed / amber catalog pills in match-first panel) |
| **Modes** | **Link to existing** \| **Create new customer** tabs persist in browse; create clears approved-ready state |

**Key components (workbench):**

- `CustomerClosestMatchPanel.tsx` — match banner + inline catalog table (Items-tab match-found table pattern)
- `NewDealCustomerLinkMatchFirstPanel.tsx` — orchestrates phases, scope, approve/reject state
- `CustomerLinkSearchResults.tsx` — `CustomerLinkSearchBar` browse meta, `CustomerLinkCustomerTable` pills/highlights
- `ExtractedCustomerDetailsCard.tsx` — `ready` prop (green surface + strip)

**Standard variant** (`sample2` / Zenith, etc.): unchanged — `NewDealCustomerLinkModal` right panel uses link/create + `CustomerLinkCustomerTable` without closest-match banner.

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

Samples: `sample2` → `QI-2026-0002`, `sample3` → `QI-2026-0006`, `sample4` → late renewal flow, **`sample5` → `QI-2026-0007`** (match-first customer link — not in Upload modal buttons by default; use Workbench queue row).

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
- **Billing-rule suggestions** — rows below contract lines (dashed borders) for catalog items required by billing rules but absent from the uploaded contract. **Mock seed:** `ExtractedContract.billingRuleGapItems` on `extractedSample2` / `extractedSample5` in `ingest-data.ts` (not hardcoded in UI). Each shows **Add** or **Ignore**. Items tab cannot complete until every suggestion is resolved.
- Bottom drawer (`ZenithLineItemBottomDrawer`) for item mapping:
  - **Map to existing** panel — catalog item search with condensed results
  - **Create new** panel — inline form to create catalog item
- Tab completes when all contract items are mapped and all billing-rule suggestions are included or ignored

**Billing-rule suggestion rows (additive detail):**

- Rendered in the **same table** as contract lines, below solid rows, with **dashed** cell borders (not a separate card).
- Muted copy; **Add** / **Ignore** on row hover; ignored rows keep strikethrough + **Restore**.
- Info tooltips use `inclusionReason` (two-line layout); last row tooltip portals to avoid table `overflow` clip.
- **Add** moves item into contract list with amber icon until linked; drawer opens **Map to existing**, not Match found.
- **Ignore** counts as resolved for tab completion and triggers green **All items resolved.** when nothing else is pending.

**Line item bottom drawer (`ZenithLineItemBottomDrawer`) — additive:**

- Default height ~80vh; **~20vh compact** after row is linked (`lineItemResolution` set).
- Header title **snapshots on open** — does not change when catalog name updates during mapping.
- Pinned strip (`LineItemPinnedStrip`): amber left accent for `needs_mapping` and `billing_rule_match` until resolved; green accent after link.

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
| **Match-first customer link (Pioneer)** | ✅ Implemented | `QI-2026-0007` / `sample5` → `NewDealCustomerLinkMatchFirstPanel` | Approve/reject closest match; similar + full catalog browse; then continue to ingest |
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

### Match-first new business (Pioneer Systems, `sample5` / `QI-2026-0007`)

```
1. Workbench → Queue tab (or Your tasks)                    — /?tab=queue
2. Open row QI-2026-0007 (Pioneer Systems, Pending Review)
3. NewDealCustomerLinkModal → NewDealCustomerLinkMatchFirstPanel
   - Extracted customer details + Closest match found banner
   - Approve → Ready pill + green card; banner dismisses (index.css keyframes)
   - Reject → View all customers (matches on top; closest outline pill, no green row)
   - View similar matches → similar list; search strip links to View all customers
4. Optional: pick different row (toggle selection) or Create new customer
5. Continue to ingest → same session/queue override as standard path
   → /customers/:customerId?tab=ingestion&queueItemId=...
6. (Post-link ingest UI for sample5 — TBD vs Zenith chrome; queue marks In Progress)
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

- File upload UI is non-functional — **sample2** / **sample3** / **sample4** / **sample5** map to **queue ids** via `getQueueItemBySample` (sample5 is seeded on `QI-2026-0007`; primary demo path is the queue row, not Upload buttons).
- Queue seed is intentionally small; expand in `queue-data.ts` when adding scenarios.
- Session-created objects live in `IngestContext` only — refresh resets.
- The Approvals module surfaces **invoice / closure document** approvals.
