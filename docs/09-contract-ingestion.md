# Queue, Contract Ingestion & First-Invoice Approval

Covers the full pipeline from a signed contract entering the system to the first invoice being approved and the merchant's approval policy being captured.

**Key files:**
- `src/components/layout/Sidebar.tsx` — Desk > **Queue** entry
- `src/pages/QueueIndex.tsx` — Queue landing (grouped + filtered)
- `src/pages/QueueIngestPage.tsx` — extraction / verification workspace (also handles Early Renewal detection + finish gate)
- `src/components/queue/QueueIntegrationsModal.tsx` — Connect modal
- `src/components/contracts/UploadModal.tsx` — Import modal (drag-and-drop + sample picker)
- `src/components/contracts/CloseContractPane.tsx` — left/right closure UI (replaces the old 2-step modal); used for both overflow-menu and queue-triggered closure
- `src/components/contracts/ClosureSummaryCard.tsx` — closure details card (Contract tab)
- `src/components/contracts/ClosureBanner.tsx` — wind-down banner (Contract tab)
- `src/components/contracts/ScheduledBanner.tsx` — blue activation banner for Scheduled renewal contracts
- `src/data/queue-data.ts` — queue mock items, sources, statuses
- `src/data/ingest-data.ts` — extracted contract samples (`sample1`, `sample2`, `sample3`) + ingest results
- `src/data/approval-policy.ts` — merchant policy types + non-standard conditions + `PendingRenewalIngestion`
- `src/context/IngestContext.tsx` — session state for queue overrides, approval policy, invoice field overrides, first-approval flag, **contract closures**, **pendingRenewalIngestions**, **sessionContracts**, **renewalToast**
- `src/pages/ApprovalsIndex.tsx`
- `src/pages/ApprovalDetailPage.tsx` — editable critical fields, Invoice|Contract tabs, success state; handles post-closure auto-ingest for Early Renewal
- `src/components/approvals/InvoiceHTMLPreview.tsx`
- `src/components/approvals/ApprovalSettingsModal.tsx`

---

## Product goal

Convert a signed commercial document into an operational billing contract inside Chargebee APEX, generate the first invoice, route it through approval, and capture the merchant's invoice approval policy in one continuous flow.

---

## Where contracts come from (Queue sources)

Every signed document lands in the **Queue**. Sources surfaced in mock data:

| Source       | Detail                                       | Behaviour |
|--------------|----------------------------------------------|-----------|
| **PDF Upload** | Drag-and-drop in the Import modal           | Drives the active prototype flow on the two sample documents |
| **API**        | Salesforce CPQ, DocuSign CLM, etc.         | Visual indication only — labelled "via API" |
| **CPQ**        | Native Quote → Contract handoff             | Visual indication only — labelled "via CPQ" |
| **Email**      | Forwarded to a billing inbox                 | Visual indication only |

The header on `/queue` exposes:
- **Connect** (secondary) — opens `QueueIntegrationsModal` listing Salesforce, DocuSign, Ironclad, HubSpot, NetSuite, Workday, PandaDoc with Connected / Available status.
- **Import** (primary, blue) — opens `UploadModal` (the drag-and-drop + sample picker, moved here from the Contracts index).

The Contracts index no longer has an Upload button — uploading contracts is exclusively a Queue action.

---

## Queue index page (`/queue`)

Same pattern as other module index pages (`docs/05-index-pages.md`). Default landing is the grouped view; URL params toggle list / group-filter modes.

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
Queue ID · Document (with name + source detail subtitle) · Scenario · Customer · TCV · Source badge (PDF / via API / via CPQ / Email) · Uploaded · Status

### Row click behaviour
- **Pending Review (sample-backed)** → `/queue/:queueItemId` for full ingest flow (Echo Corp QI-2026-0001 = happy path, Zenith Analytics QI-2026-0002 = exception path)
- **Pending Review (placeholder)** → `/queue/:queueItemId` shows a placeholder panel
- **In Progress** → `/queue/:queueItemId` placeholder
- **Ingested** → `/contracts/:contractId?from=queue`
- **Failed / Rejected** → `/queue/:queueItemId` shows the failure reason

---

## Import modal (Upload)

Triggered from: Queue > **Import** button. Behaviour preserved from the previous Contracts > Upload modal:

1. **Choose** — drag-and-drop area (visual only) + two sample document buttons
2. **Loading** — animated progress bar (~3.2s) cycling through extraction messages
3. **Done** — auto-navigates to `/queue/:queueItemId` (resolved via `getQueueItemBySample`)

The file upload UI is non-functional — only the three sample documents drive the prototype flow.

---

## Ingest verification workspace (`/queue/:queueItemId`)

**Breadcrumb:** Queue > Ingest Contract > {document name}
**Layout:** Two-column workspace (standalone route, NOT inside `CustomerRevenueWorkspace`)

### LEFT column (extracted fields, scrollable)
1. Document Metadata — doc name, extracted date
2. Customer Mapping — matched or unmatched (with inline create-customer form on exception path)
3. Quote Match — linked quote or none (happy path only)
4. Contract Terms — dates, term length, billing frequency, payment terms
5. Financial Summary — TCV, ARR, min commit, prepaid credits
6. Products / Plan Mapping — line items with catalog match status (with inline create-plan on exception path)

### RIGHT validation aside (sticky, 260px)
Pass / warn / fail rows that scroll-link back to the corresponding section.

### RIGHT-most PDF viewer (collapsible, 460px)
Grey canvas, paged, zoomable, with the rendered HTML contract document.

### Happy path — Sample 1 (Echo Corp renewal, QI-2026-0001)

- Customer matched (`cust_echo_001`)
- Quote `QT-2026-0042` confidence 94% — user clicks "Link to this Quote"
- All products match catalog
- All validation passes → "Finish Ingestion" enabled

### Exception path — Sample 2 (Zenith Analytics, QI-2026-0002)

- Customer not found → inline "Create New Customer" form
- Product `APEX-ANALYTICS-PRO` not in catalog → inline "Create New Plan" form
- Once both resolved, validation passes → Finish enabled

Newly-created objects (customer, product) live in `IngestContext` for the session.

### Early Renewal path — Sample 3 (Verdant Health, QI-2026-0006)

- Customer matched (`cust_verdant_005`) — renewal detection fires as soon as customer is linked
- "Active contract detected — early renewal" `AlertTriangle` callout appears in the Customer Mapping section
- Quote Match section hidden (not applicable for early renewals)
- "Product SKU not in catalog" issue hidden (SKU matches existing catalog)
- Validation aside shows "Prior contract closure required" as a warning row
- `allBlockersResolved` is always true for this path — finish button is never blocked by SKU issues
- Button text: **"Proceed to Close Prior Contract"**

### On Finish Ingestion (standard path)

The page automatically:

1. Builds and stores the `IngestResult`
2. **Auto-submits the first invoice for approval** via `submitInvoiceForApproval`
3. Marks the queue item as **Ingested** via `applyQueueItemOverride`
4. Renders the **Completion State** with two CTAs:
   - **Review First Invoice →** (primary, dark) — navigates to `/approvals/invoices/:invoiceId?ingestId=:queueItemId`
   - **Open Contract** (secondary) — navigates to `/contracts/:contractId?from=queue`
   - **Back to Queue** (tertiary)

The completion log shows: Contract (created), Quote (linked, happy path), Customer (reused or created), Products, Invoice (created — with the same ID auto-submitted for approval).

### On Finish Ingestion (Early Renewal path)

When `isEarlyRenewal` is true:

1. Calls `setPendingRenewalIngestion(activeContractId, { queueItemId, sampleId, renewalTcv, customerId, pendingContractId })` — stores the renewal waiting on the prior contract's closure
2. Navigates to the customer workspace: `/customers/:customerId?closeIntent=:contractId&queueItemId=:queueItemId`
3. `CustomerRevenueWorkspace` detects `closeIntent`, forces the Contract tab in **list view**, and auto-opens `CloseContractPane` for the prior active contract
4. Queue item is **NOT** yet marked Ingested — it remains In Progress until the closure approval auto-ingests the renewal

---

## Approval Detail page (`/approvals/invoices/:invoiceId`)

Restructured to reflect the full invoice review experience.

### LEFT column (flex-1, scrollable)

- Inline status banners (reject form, approved/rejected callouts)
- **Critical fields card** — editable inputs that operators can adjust before sending:
  - Invoice amount
  - Tax rate (%)
  - Invoice date (with `Backdated — will trigger non-standard approval` hint when date < today)
  - Due date
  - Payment terms (Net 0/15/30/45/60/90 dropdown)
  - PO number
  - Billing period — start / end
  - Memo to customer
- **Approval & Context card** — submitted by, submitted on, approver, contract, TCV
- Field changes are persisted into `invoiceFieldOverrides` keyed by invoice ID. The right-pane Invoice preview reflects these overrides immediately.

### RIGHT comments rail (sticky, 300px)
Unchanged — `@`-tagged comments and post box. Tag list: Jordan Kim, Priya Mehta, Alex Nguyen, Marcus Lee, Rachel Torres, Lena Schulz, Sarah Chen.

### RIGHT-most preview panel (collapsible, 480px)
A single panel with **Invoice | Contract** tab toggle in the toolbar:
- **Invoice tab** — `InvoiceHTMLPreview` rendered with the field overrides applied
- **Contract tab** — paged contract source body with zoom + page controls (3-page mock)

The toolbar adapts: zoom + collapse always present, page controls only when on the Contract tab.

### Sticky header CTAs
StatusBadge · Reject · Approve.

### On Approve

1. `ApprovalRequest.status` → "Approved"
2. Invoice status override → "Approved"
3. Toast: **"Invoice sent to the customer"** (~2.4s)
4. After toast:
   - If the URL has `?ingestId=…` AND `firstApprovalCompletedFor[ingestId]` is false → mark it true and **open `ApprovalSettingsModal`**
   - Else if no policy is set yet for the session → also open the modal (one-time merchant setup)
   - Else → navigate to `/invoices/:invoiceId?from=approvals`

### On Reject

1. `ApprovalRequest.status` → "Rejected"
2. Invoice status override → "Cancelled"
3. Inline confirmation, then navigate back to `/approvals` (no toast, no policy modal)

---

## Approval Settings modal (one-time merchant policy)

Opened after the first approve-toast in an ingest cycle. Three options:

1. **Auto-approve, always** — every invoice skips review.
2. **Send for approval, always** — every invoice routes through approval (badge: *Recommended for high-TCV*).
3. **Send for approval, only if non-standard** — expands a checkbox list of conditions. Each enabled condition makes that scenario non-standard:
   - **High TCV** with editable threshold (default $250,000)
   - **Discount above threshold** with editable percentage (default 25%)
   - **Custom payment terms** (anything other than Net 30)
   - **Backdated invoice** (invoice date earlier than today — common for late renewals; enabled by default)
   - **Manual line items added**

Saved into `IngestContext.approvalPolicy`. There's a "Skip for now" option that closes the modal without persisting a policy.

---

## Final success state

After the modal saves (or skips), the Approval Detail page replaces its content with a **Setup complete** panel:

- "All set" header with green check
- Summary card: invoice ID + amount, customer, contract, chosen approval policy label
- Primary CTA: **View Customer →** → `/customers/:customerId?tab=customer`
- Secondary CTA: **Open Invoice** → `/invoices/:invoiceId?from=approvals`
- Tertiary: **Back to Queue**

The customer detail shell now reflects the new contract in the Contract tab and the new invoice in the Invoicing tab (driven by existing customer-record state + the `invoiceStatusOverrides` from `IngestContext`).

---

## Contract closure approval integration

Contract closure-generated financial documents (termination invoices and credit notes) integrate with the same approval infrastructure.

### How closure trips approval

When `IngestContext.approvalPolicy.mode` is `"always-approve"` OR `"non-standard"`, closure-generated documents always route through approval with a `non-standard` flag:

| Settlement type | Non-standard reason |
|----------------|---------------------|
| Termination charge | "Termination-generated invoice" |
| Credit note | "Closure credit note" |

### Runtime state for closures

`IngestContext` provides:
- `contractClosures` — map of `contractId → ContractClosure` for runtime closure state
- `applyContractClosure(contractId, closure)` — writes closure + submits invoice for approval if termination charge
- `creditNoteStatusOverrides` — for tracking closure credit note statuses
- `closureToast` — feedback toast shown after closure confirmation

### Flow (standard — overflow menu)

1. User triggers "Close contract early" from Contract tab overflow menu
2. `CloseContractPane` opens as an inline full-canvas overlay within the customer workspace
3. Left pane captures effective date, reason (defaults), settlement type, calculated/override amount, approval-policy badge
4. Right pane shows **Contract** and **Last Invoice** context tabs
5. On "Send for approval":
   - If `settlementType === "termination_charge"` → new invoice ID generated → `submitInvoiceForApproval()` called with meta (`{ type: "termination" }`)
   - If `settlementType === "credit_note"` → new credit note ID generated
6. `closureToast` confirms; standard navigation to `/approvals/invoices/:id`
7. Workspace re-renders: Contract tab shows `ClosureSummaryCard`, status badge updates to `Closing`/`Terminated`/`Closed`

### Flow (Early Renewal — from Queue)

1. Operator reaches the customer workspace via `?closeIntent=:contractId&queueItemId=:queueItemId` (set by `QueueIngestPage.handleEarlyRenewalFinish`)
2. `CloseContractPane` auto-opens with the prior active contract; header shows **← Back to Queue** breadcrumb
3. Right pane has a third tab: **Incoming Renewal** — preview of the new contract about to be ingested, including a proration/financial impact description
4. Reason defaults to `replaced_by_new`; settlement type defaults to `credit_note` if `prepaidCreditBalance > 0`, else `no_financial_impact`
5. Button text: **"Send for approval & proceed to ingest"**
6. On confirm → navigates to `/approvals/invoices/:id?closureFor=:contractId&queueItemId=:queueItemId`

### Closure document display in Approval Detail

Runtime-created closure documents (IDs prefixed `CN-CLOSE-` or `INV-TERM-`) are not in the static `invoices` array. `ApprovalDetailPage` detects these via `isClosureDocument` and constructs a `syntheticInvoice` object from the `ApprovalRequest` data for display purposes.

### Post-approval auto-ingest (Early Renewal only)

When the closure credit note / termination invoice is approved and `closureFor` + `queueItemId` URL params are present:

1. Check `pendingRenewalIngestions[closureFor]` in `IngestContext`
2. Build a new `Contract` from `verdantRenewalContractTemplate` with `status: "Scheduled"`, `scheduledStartDate: closure.effectiveDate`, `replacesContractId: priorContractId`
3. `addSessionContract(newContract)` — makes it immediately visible in the workspace
4. `applyQueueItemOverride(queueItemId, { status: "Ingested", contractId })` — marks queue item done
5. `clearPendingRenewalIngestion(closureFor)` — cleans up
6. `showRenewalToast(message, customerId)` — triggers a blue toast
7. Navigate to `/customers/:customerId?tab=contract` — list view shows prior contract `Closing` and new contract `Scheduled`

---

## Implemented flows summary

| Flow | Status | Entry point | Demo customer |
|---|---|---|---|
| **Standard ingest (new business)** | ✅ Implemented | Upload → sample2 | Zenith Analytics |
| **Standard ingest (renewal)** | ✅ Implemented | Upload → sample1 | Echo Corp |
| **Contract Closing** | ✅ Implemented | Contract tab overflow menu | Lumina AI |
| **Early Renewal** | ✅ Implemented | Upload → sample3 → `QI-2026-0006` | Verdant Health |
| **Amendment** | 🔜 Placeholder | `QI-2026-0005` (Lumina AI, via DocuSign) | Lumina AI |

The Amendment flow will follow the same Queue → ingest → first-invoice approval pattern, with its own field-override semantics for proration adjustments.

---

## Comments & collaboration

Comments are scoped to the **Approval Detail page only** (not on Invoice Detail).

### Comment thread
- Author avatar (initials), name, role, timestamp, text
- `@Name` mentions highlighted in blue
- Comments stored in session state (part of the `ApprovalRequest` object)
- Pre-seeded with two existing comments for realism

### Tagging
- Type `@` to open the dropdown of taggable users (see list above)
- Click a name to insert `@Name` into the textarea

---

## Full navigation chains

### Standard renewal (Echo Corp, sample1)

```
 1. Sidebar > Desk > Queue                                        — /queue
 2. Queue index, default grouped landing
 3. Click Import → UploadModal opens
 4. Click "Echo Corp — Renewal" sample
 5. Loading animation (~3s)                                       — /queue (modal)
 6. Auto-navigate to                                              — /queue/QI-2026-0001
 7. Review extracted fields, click "Link to this Quote"
 8. Click "Finish Ingestion"
       → first invoice auto-submitted for approval
       → queue item marked Ingested
 9. Completion state shown with two CTAs
10. Click "Review First Invoice →"                                — /approvals/invoices/INV-INGEST-001?ingestId=QI-2026-0001
11. Approval Detail loaded with critical fields editable on LEFT
       and Invoice | Contract tabs on RIGHT
12. (Optional) tweak amount / due date / terms / memo / PO
13. Click "Approve"
14. Toast: "Invoice sent to the customer"                         (~2.4s)
15. ApprovalSettingsModal opens automatically (first approval per ingest)
16. Choose policy mode (and conditions for non-standard)
17. Click "Save policy"
18. Success state: "All set" panel replaces the page content
19. Click "View Customer →"                                       — /customers/cust_echo_001?tab=customer
20. Customer shell shows the new contract + new invoice across tabs
```

### Reject alternative (from step 13)

```
13b. Click "Reject"
13c. Enter rejection reason in inline form
13d. Click "Confirm Rejection"
13e. Navigate back to /approvals (invoice status: Cancelled)
```

### Early Renewal (Verdant Health, sample3)

```
 1. Sidebar > Desk > Queue                                        — /queue
 2. Click Import → UploadModal opens
 3. Click "Verdant Health — Early Renewal" sample
 4. Loading animation (~3s)                                       — /queue (modal)
 5. Auto-navigate to                                              — /queue/QI-2026-0006
 6. Review extracted fields
       → "Active contract detected — early renewal" callout appears on customer link
       → Quote Match section hidden; validation shows "Prior contract closure required"
 7. Click "Proceed to Close Prior Contract"
       → setPendingRenewalIngestion("CON-2025-0034", { ... })
       → navigate to                                              — /customers/cust_verdant_005?closeIntent=CON-2025-0034&queueItemId=QI-2026-0006
 8. Customer workspace opens on Contract tab (list view)
       → CloseContractPane auto-opens for CON-2025-0034
       → Header shows "← Back to Queue"
       → Right pane: Contract | Last Invoice | Incoming Renewal tabs
       → Defaults: reason=replaced_by_new, settlement=credit_note
 9. Review / adjust effective date, settlement amount
10. Click "Send for approval & proceed to ingest"
       → closure applied to CON-2025-0034
       → navigate to                                              — /approvals/invoices/CN-CLOSE-xxx?closureFor=CON-2025-0034&queueItemId=QI-2026-0006
11. Approval Detail: synthetic credit note displayed, standard edit controls
12. Click "Approve"
       → auto-creates CON-2026-0VH1 (Scheduled, activates on closure date)
       → queue item QI-2026-0006 → Ingested
       → navigate to                                              — /customers/cust_verdant_005?tab=contract
13. Blue renewal toast: "Renewal scheduled to take effect on {date}"
14. Contract tab list: CON-2025-0034 (Closing) + CON-2026-0VH1 (Scheduled) with lineage annotations
```

---

## Scope notes / stubs

- File upload UI is non-functional — only the two sample documents drive the active prototype flow.
- Other queue items (Helix Pharma, Northwind Trading, Lumina AI Amendment, Verdant Health Early Renewal, Aurora Robotics, BlackOak Enterprises) are placeholders for visual variety only.
- Session-created objects (customer, product plan, queue overrides, approval policy, invoice field overrides) live in `IngestContext` only — refresh resets.
- The approval approver is always hardcoded to "Sarah Chen, VP Revenue".
- The Approvals module only shows **invoice** approvals in this pass (quote approvals are not migrated).
- The `ApprovalSettingsModal` writes its policy to context but doesn't currently gate subsequent invoices in any computed way — it's representational. Wiring that into a real per-invoice routing decision is a follow-up.
