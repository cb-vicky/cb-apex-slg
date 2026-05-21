# Queue, Contract Ingestion & First-Invoice Approval

Covers the full pipeline from a signed contract entering the system to the first invoice being approved and the merchant's approval policy being captured.

**Drawer orchestration:** See **`docs/13-drawer-and-flows.md`** for `EntityDrawer`, `openDrawer`, `UnifiedFlowShell`, flow steps, and entry-point matrix.

**Key files:**
- `src/pages/workbench/QueueTabContent.tsx` — **primary Queue landing** (Workbench tab)
- `src/components/common/EntityDrawer.tsx` + `src/store/drawer-store.ts` — **drawer-first** ingest/approval (75% overlay)
- `src/components/transitions/UnifiedFlowShell.tsx` — multi-step flows (ingest → invoice review → close_prior)
- `src/pages/QueueIngestPage.tsx` — full-page shell (`presentation="page"`) for `/queue/:queueItemId` deep links
- `src/context/IngestProvider.tsx`, `ingest-context-core.ts` — session state
- `src/components/transitions/IngestDrawer.tsx` — **Single implementation** for queue ingest (drawer + full page via `presentation`); body uses **25% / 35% / 40%** grid on full page (validation + comments · fields · document preview)
- `src/components/transitions/IngestFieldGroup.tsx` — **New** — reusable field group card with header chrome + optional status chip; hosts all flat section components inside the ingest drawer fields column
- `src/components/transitions/panels/*` — document preview panes (`IngestDocumentPreviewPane`, etc.)
- `src/components/transitions/DrawerSelectShell.tsx` — includes `IngestDrawerIssueCallout`, `DrawerStackedField`, `DrawerRailIndent` for form layout
- `src/components/transitions/ContractExtractDocumentBody.tsx` — monospace "extracted agreement" body in preview (customer-not-found copy when `!customerFound`)
- `src/components/transitions/sections/*.tsx` — **Flat section components** designed to live inside `IngestFieldGroup` body:
  - `CustomerMappingSection.tsx` — customer select + new customer form
  - `BillingStructureSection.tsx` — prepaid/postpaid/hybrid radio + invoice timing + logic summary
  - `PrepaidOnlyBillingSelect.tsx` — simplified prepaid-only billing select for queue ingest
  - `ContractProcessingSummarySection.tsx` — processing summary KV rows
  - `TransitionContractTermsSection.tsx` — start/end dates, billing frequency, auto-renew, activation summary; supports `allowBackdate` for Late Renewal
  - `ContractTransitionSection.tsx` — intent-branched transition controls (early renewal, amendment, late extend/resolve)
  - `FinancialPreviewSection.tsx` — financial preview KV rows (TCV, settlement, extension charges)
  - `CatalogMappingSection.tsx` — extracted product line mapping with drawer and table layouts
  - `InvoicePlanSection.tsx` — invoice plan preview rows
  - `ApprovalPolicyInlineSection.tsx` — approval policy radio group (always/if-changed/never)
- `src/components/queue/QueueIntegrationsModal.tsx` — Connect modal
- `src/components/contracts/UploadModal.tsx` — Import modal (drag-and-drop + sample picker → resolves queue row via `getQueueItemBySample`)
- `src/components/contracts/CloseContractPane.tsx` — closure UI; queue-triggered Early/Late Renewal handoff
- `src/components/contracts/ClosureSummaryCard.tsx`, `ClosureBanner.tsx`, `ScheduledBanner.tsx`
- `src/data/queue-data.ts` — **Reduced seed set** (see **Mock data** below); `QueueScenario` includes **Late Renewal**
- `src/data/ingest-data.ts` — extracted contract samples (`sample2` new business, `sample3` early renewal, `sample4` late renewal) + `ApprovalRequest` / `ApprovalComment` types
- `src/data/approval-policy.ts` — merchant policy + `PendingRenewalIngestion`
- `src/context/IngestContext.tsx` — queue overrides, approvals, **`ensureQueueIngestDiscussion`**, **`submitInvoiceForApproval`** (merges pre-ingest stub), sessions, closures, renewal toasts, **`contractGraceExtensions`**
- `src/pages/ApprovalDetailPage.tsx` — **Full-page** invoice / credit note / termination approval: same **25/25/50** grid as ingest page; `ApprovalDocumentPreviewPane` + `approval-doc-ui` helpers; `ApprovalCommentsCard`; post-closure Early Renewal auto-ingest
- `src/components/approvals/InvoiceApprovalDrawer.tsx` — drawer parity; "Open comments" navigates to full approval page (optional `?ingestId=` / `?from=approvals`)
- `src/components/approvals/approval-document-preview.tsx` — shared Invoice | Contract preview toolbar + body
- `src/components/approvals/approval-doc-ui.ts` — shared doc kind + copy strings + preview variant
- `src/components/approvals/approval-comments.tsx` — `ApprovalCommentsCard` + composer (@-mentions)
- `src/components/approvals/InvoiceHTMLPreview.tsx`, `ApprovalSettingsModal.tsx`
- `src/pages/workbench/WorkbenchHome.tsx`, `WorkbenchTaskList.tsx` — **Your tasks** tab (`docs/10-workbench-home.md`)

---

## Implementation snapshot (layout & session)

### Primary path: drawer-first

Most demo flows open ingest via **`openDrawer`** (`drawer-store.ts`):

- **Workbench Queue tab** row click
- **`UploadModal`** after sample pick (`sample2` / `sample3` / `sample4`)
- **Prospects index** new-business rows
- Contract **Transition** / late renewal **Resolve** from workspace

`EntityDrawer`: 25% backdrop + **75%** white panel, `rounded-l-[24px]`. Body uses `IngestDrawer` `presentation="default"` or `UnifiedFlowShell` for multi-step scenarios.

### Queue ingest — drawer vs full page

| Surface | Layout | Comments | Document |
|--------|--------|----------|----------|
| **Drawer** (`EntityDrawer`, `presentation="default"`) | Form rail + preview split | No left validation column in narrow drawer | `IngestDocumentPreviewPane` |
| **Full page** (`QueueIngestPage` → `presentation="page"`) | Grid **`25%` · `35%` · `40%`** | **`ValidationPanel`** + **`ApprovalCommentsCard`** in left column. Middle `#FAFAFA` fields rail | Preview column; collapsible with width preserved |

### IngestFieldGroup component

**`IngestFieldGroup`** (`src/components/transitions/IngestFieldGroup.tsx`) is a reusable card primitive for the fields column:

- **Header chrome:** Gray (`bg-gray-50`) header bar with bold title + optional status chip
- **Status chip:** Displays validation/mapping state with tone colors:
  - `valid` — emerald border/bg
  - `warning` — amber border/bg
  - `error` — red border/bg
  - `neutral` — subtle gray border/bg
- **Body:** White `px-5 py-4` padding; hosts flat section components (no nested cards)
- **forwardRef:** Supports scroll-to-section behavior via `sectionRefs` in `IngestDrawer`

The chip content mirrors `ValidationPanel` items so both surfaces use identical state labels.

### Flat section components

All `src/components/transitions/sections/*.tsx` components are designed to live **inside** an `IngestFieldGroup` body — no card chrome, no rail indent unless explicitly added with `DrawerRailIndent`:

| Section | Purpose |
|---------|---------|
| `CustomerMappingSection` | Customer select dropdown + new customer form with name/entity/domain fields |
| `BillingStructureSection` | Prepaid/Postpaid/Hybrid radio + invoice timing select + collapsible logic detail |
| `PrepaidOnlyBillingSelect` | Simplified prepaid-only select for queue ingest |
| `ContractProcessingSummarySection` | TCV + start date processing summary KV rows |
| `TransitionContractTermsSection` | Start/end date pickers, billing frequency, auto-renew, activation summary; `allowBackdate` prop for Late Renewal |
| `ContractTransitionSection` | Intent-branched controls: early renewal (execution date + checklist), amendment (ARR delta), late extend (grace days + billing mode), late resolve (renew/replace/terminate radios) |
| `FinancialPreviewSection` | Financial preview KV rows (TCV, settlement, extension charges) with optional eyebrow heading |
| `CatalogMappingSection` | Extracted product lines with `layout="drawer"` (expandable detail cards) or `layout="table"` (full table) |
| `InvoicePlanSection` | Invoice plan rows built from `buildInvoicePlanLines()` |
| `ApprovalPolicyInlineSection` | Approval policy radio (always/if-changed/never) |

### Pre–first-invoice collaboration (queue full page)

Before **Ingest contract** creates the real invoice approval, the UI still shows the full **`ApprovalCommentsCard`**. That is backed by a **stub** `ApprovalRequest` created when the full-page ingest opens:

- **`ensureQueueIngestDiscussion(queueItemId, { customerId?, customerName? })`** (`IngestContext`) — idempotent; creates row with `id: APR-INGEST-<queueItemId>`, placeholder `invoiceId: INV-PENDING-<queueItemId>`, `ingestId: <queueItemId>`, `comments: []`.
- **`IngestDrawer`** calls it from **`useLayoutEffect`** when `triColQueueIngest` is true so the thread exists before paint when possible.
- **`submitInvoiceForApproval(invoiceId, { … ingestId })`** — if a stub exists for that `ingestId`, it is **replaced** by the real `APR-<invoiceId>` row and **user comments are preserved**; if no stub, behaviour is unchanged (new row with seeded thread from `seedApprovalComments`).

The left column always binds to `approvalRequests.find((r) => r.ingestId === queueItem.id)` — one logical thread from queue work through first-invoice approval.

### Invoice approval — full page

`/approvals/invoices/:invoiceId` uses the **same 25/25/50 grid**: critical fields (flat `CriticalFieldsCard`) · **`ApprovalCommentsCard`** · **`ApprovalDocumentPreviewPane`**. Styling of primary actions matches the drawer (blue Approve, neutral Reject). **`sessionInvoices` / `sessionCustomers` / `sessionContracts`** merge like the drawer for runtime-created records.

If no `ApprovalRequest` exists yet for that invoice, the comments column shows the **dashed placeholder** (ingest page used to do the same; ingest is now aligned to the card via the stub above).

### Customer "not found" presentation

When extraction flags `customer_not_found`, **`CustomerMappingSection`** shows **`IngestDrawerIssueCallout`** (message from `ExtractedContract.issues`). Styling: **red text**, **red hairline border**, **no icon**. The extracted PDF body (`ContractExtractDocumentBody`) uses **red** "Customer not found in system" text **without** the prior warning glyph.

---

## Workbench handoff

**Workbench** (`/`, tabs **Your tasks | Queue | Approvals**) is the operator ↔ approver handoff surface. `deriveWorkbenchTasks` reads the same **`IngestContext`** — merged queue rows, `approvalRequests` (including stub `APR-INGEST-*` during open ingest), `pendingRenewalIngestions`, customer tasks.

- **Demo persona** (TopNav): Operator vs Approver filters visible tasks
- After **Ingest contract**: first-invoice approval surfaces in Approvals tab / Your tasks
- After **Proceed to close prior contract** (Early Renewal): closure approval under Verdant Health, Critical severity, `?closureFor=&queueItemId=`
- Task rows may open **`EntityDrawer`** or navigate to full-page approval URL

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

**Workbench → Queue tab** toolbar exposes:
- **Connect** (secondary) — `QueueIntegrationsModal`
- **Import** (primary) — `UploadModal` → resolves `getQueueItemBySample` → **`openDrawer`** (or navigate to `/queue/:id` for full-page)

Contracts index has no Upload button.

`/queue` redirects to `/?tab=queue`.

---

## Queue tab (`/?tab=queue`)

List table pattern aligned with other indexes (`docs/05-index-pages.md`). Row clicks prefer **`EntityDrawer`**; full-page `/queue/:queueItemId` remains for direct URLs.

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
- **Pending Review + `ingestable: true` + `sampleId`** → `/queue/:queueItemId` opens **`IngestDrawer`** full page (`QI-2026-0002` Zenith new business, `QI-2026-0006` Verdant early renewal)
- **Pending Review + not ingestable** → `/queue/:queueItemId` shows **`PlaceholderState`** (workspace handoff / "coming soon" copy)
- **Ingested** → `/contracts/:contractId?from=queue` (when wired from index)
- **Failed / Rejected** → `/queue/:queueItemId` shows failure context in placeholder shell when applicable

> **Seed note:** `src/data/queue-data.ts` currently ships a **minimal three-row** queue for focused demos (`QI-2026-0002`, `QI-2026-0006`, `QI-2026-0003`). Older docs that reference `QI-2026-0001` (Echo renewal) or a 12-row grid are **stale** unless those rows are reintroduced.

---

## Import modal (Upload)

Triggered from: Queue > **Import** button. Behaviour preserved from the previous Contracts > Upload modal:

1. **Choose** — drag-and-drop area (visual only) + two sample document buttons
2. **Loading** — animated progress bar (~3.2s) cycling through extraction messages
3. **Done** — opens **`EntityDrawer`** for ingest (primary) or navigates to `/queue/:queueItemId` (full-page alternative)

Samples: `sample2` → `QI-2026-0002`, `sample3` → `QI-2026-0006`, `sample4` → late renewal flow.

The file upload UI is non-functional — only sample buttons drive the prototype.

---

## Ingest verification workspace (`/queue/:queueItemId`)

**Route:** Standalone **outside** `CustomerRevenueWorkspace` (white canvas under app shell).

**Ingestable rows** (`QueueIngestPage` when `ingestable && sampleId`): renders **`IngestDrawer`** with `entityType="queue_item"`, `mode="ingest"`, `presentation="page"`.

**Header (in drawer):** Queue crumb → queue item id → optional document name on full page; back chevron on full page navigates **`/queue`**; primary actions depend on `intent` / queue status (Save draft, Ingest contract, Open comments, Review invoice when ingested + approver persona, etc.).

**Body — full page (`presentation="page"`):**

1. **Left column (~25%)** — **`ValidationPanel`** with status items (Customer, Billing, Contract terms, Catalog mapping) + **`ApprovalCommentsCard`** for discussion thread
2. **Fields column (~35%)** — scrollable stack of **`IngestFieldGroup`** cards: Customer, Billing & invoicing, Contract terms, Transition (when non–new-deal), Catalog mapping (when extracted). Each group shows a header chip mirroring the validation status.
3. **Document column (~40%)** — **`IngestDocumentPreviewPane`** (collapsible; column width preserved when collapsed).

**Body — drawer:** Same sections in a **narrow rail + preview** split (no left validation/comments column).

### Validation items and chips

The `ValidationPanel` items and `IngestFieldGroup` chips share the same source of truth (`validationItems` + `groupChips` in `IngestDrawer`):

| Item ID | Label | Chip shows |
|---------|-------|------------|
| `customer` | Customer | Customer name or "New customer" or "Not selected" |
| `billing` | Billing | "Prepaid" / "Postpaid" / "Hybrid" |
| `terms` | Contract terms | Start–end date range |
| `catalog` | Catalog mapping | Line item count |

### Exception path — Sample 2 (Zenith Analytics, QI-2026-0002)

- Customer not found → inline "Create New Customer" form inside `CustomerMappingSection`
- Product `APEX-ANALYTICS-PRO` not in catalog → "Mark mapped" action in `CatalogMappingSection`
- Once both resolved, validation passes → Finish enabled

Newly-created objects (customer, product) live in `IngestContext` for the session.

### Early Renewal path — Sample 3 (Verdant Health, QI-2026-0006)

- Customer matched (`cust_verdant_005`) — renewal detection fires as soon as customer is linked
- "Active contract detected — early renewal" banner appears
- Transition intent defaults to `early_renewal`
- Validation aside shows "Prior contract closure required" as a warning row
- `allBlockersResolved` is always true for this path — finish button is never blocked by SKU issues
- Button text: **"Next"** (unified flow) or **"Proceed to Close Prior Contract"**

### Late Renewal path — Sample 4 (Northlane Labs)

When `queueItem.scenario === "Late Renewal"` and the prior contract has a grace extension (`contractGraceExtensions`):

- **Late Renewal banner** shows in the fields column: "This customer has a contract in extension" with grace period details
- `TransitionContractTermsSection` receives `allowBackdate={true}` — operator can set effective date earlier than today
- Backdated start date shows amber helper text: "Backdated to {date} — invoices for elapsed days will be clubbed into the first invoice"
- **`handleLateRenewalQueueFinish`** creates a scheduled renewal contract and advances to close_prior step

### On Finish Ingestion — **Ingest contract** (standard new business path)

`IngestDrawer.handleExecuteIngest` (non–early-renewal intercept):

1. Builds session customer/contract/invoice (Zenith path uses `zenith-ingest-session` helpers).
2. **`setIngestResult`** via `buildIngestResult`.
3. **`submitInvoiceForApproval(invoiceId, { customerId, customerName, invoiceAmount, invoiceDate, ingestId: queueItem.id })`** — upgrades stub approval when present; otherwise creates approval with seeded comments.
4. **`setInvoiceStatusOverride`** to pending approval as needed.
5. **`applyQueueItemOverride`** → queue row **Ingested** + `contractId` / `invoiceId` / `customerId`.
6. **Full page:** **`navigate(`/contracts/${contractId}`)`** — user lands in customer workspace on the contract; **drawer:** `onClose()` only.

There is **no separate "completion state" page** anymore; the **queue + first-invoice** handoff is visible from Workbench / Approvals / customer shell. Operators can use **Open comments** (header) or the **left column** on full page for collaboration before and after ingest.

### On Finish Ingestion / **Proceed to close prior contract** (Early Renewal path)

`handleExecuteIngest` short-circuits when **`queueItem.sampleId === "sample3"`** (Verdant **Early Renewal**). It does **not** run the standard Zenith ingest builder.

1. **`handleEarlyRenewalQueueFinish`** → `setPendingRenewalIngestion(activeContractId, { queueItemId, sampleId: "sample3", renewalTcv, customerId, pendingContractId })`.
2. Unified flow: **`patchFlowSession({ step: "close_prior" })`**; legacy: **`navigate(\`/customers/${customerId}?tab=contract&contractId=${activeContractId}&closeIntent=early-renewal&queueItemId=${queueItemId}\`)`**.
3. **`CustomerRevenueWorkspace`** interprets `closeIntent` + `queueItemId`, forces Contract tab (list), and surfaces **`CloseContractPane`** for the prior contract.
4. Queue row stays **not Ingested** until closure approval + auto-ingest (unchanged business story below).

### On Finish Ingestion / **Late Renewal path** (`sample4`)

`handleExecuteIngest` short-circuits when **`queueItem.sampleId === "sample4"`** (Late Renewal). **`handleLateRenewalQueueFinish`**:

1. Creates a `Scheduled` renewal contract (`CON-2026-0NL1`) with operator-chosen dates and billing frequency
2. **`addSessionContract(renewalContract)`** — makes it visible in workspace
3. **`setPendingRenewalIngestion(activeContractId, { ... pendingContractId: "CON-2026-0NL1" })`**
4. Unified flow: **`patchFlowSession({ scenario: "ingest_invoice", step: "close_prior" })`**; legacy: navigate to customer workspace with `closeIntent=late-renewal`

---

## Approval Detail page (`/approvals/invoices/:invoiceId`)

Full-page invoice / credit note / termination review **matches the ingest full-page architecture**:

### Three-column body (same proportions as queue ingest full page)

1. **~25% — Fields** — Reject form (when approver + pending), approved/rejected banners, **`CriticalFieldsCard`** with `layout="flat"`, **Context** block (contract link, TCV, submitted by/on) inside `DrawerRailIndent`.
2. **~25% — Comments** — **`ApprovalCommentsCard`** (`@`-mentions, composer when an approval row exists). If there is **no** `ApprovalRequest` for this `invoiceId`, a **dashed placeholder** explains that a thread will appear once an approval exists.
3. **~50% — Document** — **`ApprovalDocumentPreviewPane`** (Invoice | Contract tabs, zoom, contract paging, collapse with width preserved).

**Header:** breadcrumb (Approvals → invoice id · customer · amount), `StatusBadge`, Reject / Approve (drawer-aligned styling: neutral reject, blue Approve).

**Data merges:** `sessionInvoices` / `sessionCustomers` / `sessionContracts` layered over seed data like **`InvoiceApprovalDrawer`**. **`approval-doc-ui`** centralises doc kind, preview variant, and copy strings (`getApprovalDocUi`, `getApprovalDocKind`, `approvalPreviewVariant`).

**Overrides:** `invoiceFieldOverrides` feed both critical fields and HTML preview.

**Closure docs:** Synthetic invoice from `ApprovalRequest` when id prefix `CN-CLOSE-` / `INV-TERM-` (see existing closure section below).

### On Approve

1. `ApprovalRequest.status` → "Approved"
2. Invoice status override → "Approved"
3. Toast copy from **`getApprovalDocUi`** (invoice vs credit note vs termination) (~2.4s)
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
- `contractGraceExtensions` — map of `contractId → GraceExtension` for late renewal grace periods

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

1. Operator reaches the customer workspace via **`closeIntent=early-renewal`** + **`queueItemId`** (set by **`IngestDrawer.handleEarlyRenewalQueueFinish`** after **Proceed to close prior contract**)
2. `CloseContractPane` auto-opens with the prior active contract; header shows **← Back to Queue** breadcrumb
3. Right pane has a third tab: **Incoming Renewal** — preview of the new contract about to be ingested, including a proration/financial impact description
4. Reason defaults to `replaced_by_new`; settlement type defaults to `credit_note` if `prepaidCreditBalance > 0`, else `no_financial_impact`
5. Button text: **"Send for approval & proceed to ingest"**
6. On confirm → navigates to `/approvals/invoices/:id?closureFor=:contractId&queueItemId=:queueItemId`

### Flow (Late Renewal — from Queue)

1. Operator reaches the ingest drawer via queue row with `scenario: "Late Renewal"`
2. Late renewal banner shows prior contract grace extension details
3. Operator confirms dates (may backdate effective date) and clicks **Next**
4. **`handleLateRenewalQueueFinish`** creates scheduled renewal contract
5. Flow advances to `close_prior` step (same as Early Renewal from here)

### Closure document display in Approval Detail

Runtime-created closure documents (IDs prefixed `CN-CLOSE-` or `INV-TERM-`) are not in the static `invoices` array. `ApprovalDetailPage` detects these via `isClosureDocument` and constructs a `syntheticInvoice` object from the `ApprovalRequest` data for display purposes.

### Post-approval auto-ingest (Early/Late Renewal)

When the closure credit note / termination invoice is approved and `closureFor` + `queueItemId` URL params are present:

1. Check `pendingRenewalIngestions[closureFor]` in `IngestContext`
2. Build a new `Contract` from template with `status: "Scheduled"`, `scheduledStartDate: closure.effectiveDate`, `replacesContractId: priorContractId`
3. `addSessionContract(newContract)` — makes it immediately visible in the workspace
4. `applyQueueItemOverride(queueItemId, { status: "Ingested", contractId })` — marks queue item done
5. `clearPendingRenewalIngestion(closureFor)` — cleans up
6. `showRenewalToast(message, customerId)` — triggers a blue toast
7. Navigate to `/customers/:customerId?tab=contract` — list view shows prior contract `Closing` and new contract `Scheduled`

---

## Roadmap: Queue — Renewal scenarios

Use this section when extending **`IngestDrawer`** / **`QueueIngestPage`** / **`queue-data.ts`** so behaviour stays aligned with the **new business** full-page pattern (grid, comments stub, document column).

### Early Renewal (`QI-2026-0006`, `sample3`)

- **Today:** Full ingest page + **stub discussion** + **Proceed to close prior contract** → customer workspace + `pendingRenewalIngestions` + closure approval chain. **`handleExecuteIngest`** does **not** create the Zenith-style session invoice when `sampleId === "sample3"` (early path only).
- **Follow-ups to consider:** Drawer parity for a **narrow comments rail** vs always linking out; validation copy for early renewal-specific blockers; ensure Workbench / `deriveWorkbenchTasks` narratives mention the **same** `ingestId` thread where applicable.

### Late Renewal (`sample4`)

- **Today:** Partial implementation — `handleLateRenewalQueueFinish` creates scheduled contract, handles backdating, advances to close_prior
- **Implemented:** `allowBackdate` in `TransitionContractTermsSection`, Late Renewal banner in ingest drawer, grace extension tracking in `IngestContext`
- **Product direction:** Late Renewal is **ops-first** (grace, extension, workspace alignment) — the ingest form captures renewal terms, then proceeds to close_prior like Early Renewal

---

## Implemented flows summary

| Flow | Status | Entry point | Notes |
|---|---|---|---|
| **Standard ingest (new business)** | ✅ Implemented | Queue row **`QI-2026-0002`** / Upload sample2 → same id | Full page grid + comments stub → **Ingest contract** → navigates to customer contract |
| **Standard ingest (renewal)** | ⚠️ Not in current queue seed | Previously Echo / `sample1` | Re-add a `QueueItem` with `sampleId: "sample1"` + `ingestable: true` if you need this demo again |
| **Contract Closing** | ✅ Implemented | Contract tab overflow | Unchanged |
| **Early Renewal** | ✅ Implemented (queue) | **`QI-2026-0006`**, `sample3` | Full page + closure handoff; **no** standard ingest completion for `sample3` |
| **Late Renewal** | ✅ Partial implementation | `sample4` | `handleLateRenewalQueueFinish` + backdating + grace banner |
| **Amendment** | 🔜 Not in seed | — | Add row when building amendment ingest |

Amendment / renewal rows should follow the same **Queue → `IngestDrawer` → `submitInvoiceForApproval`** pattern when ingestable, with scenario-specific sections and validation.

---

## Comments & collaboration

### Where the UI appears

| Surface | Component | Thread storage |
|---------|-----------|----------------|
| **Queue ingest full page** | `ValidationPanel` + `ApprovalCommentsCard` (left column) | Same `ApprovalRequest` as post-ingest (`ingestId === queueItem.id`) — **stub** row before ingest, **`APR-<invoiceId>`** after |
| **Invoice approval full page** | `ApprovalCommentsCard` | `ApprovalRequest` matched by **`invoiceId`** |
| **Invoice approval drawer** | (no middle column) | Same row as full page when opened for same invoice |

### Behaviour

- Author initials, name, role, timestamp, body; **`@Name`** highlights; composer with mention picker (`APPROVAL_TAGGABLE_USERS`).
- **`addApprovalComment(approvalId, comment)`** appends to the **`comments[]`** array on that `ApprovalRequest`.
- **New approvals** created only via `submitInvoiceForApproval` (no stub) still get **`seedApprovalComments`** for demo realism.
- **Stub → real** merge **keeps user-authored comments** from the queue phase.

Comments are **not** on Invoice Detail; invoice approval **drawer** links to full page via **Open comments** (optional `?ingestId=` for first-cycle policy modal behaviour).

---

## Full navigation chains

### Standard new business (Zenith Analytics, `QI-2026-0002`, `sample2`)

```
 1. Workbench → Queue tab                                         — /?tab=queue
 2. Open row OR Import → sample2 → EntityDrawer (or /queue/QI-2026-0002 full page)
 3. Full-page IngestDrawer: validation + comments | fields | Document preview
 4. Resolve customer-not-found path if testing exception UX; map catalog SKUs as needed
 5. Click "Ingest contract"
       → submitInvoiceForApproval (stub merge) + queue Ingested + navigate to contract shell
 6. Workbench / Approvals → open first invoice approval            — /approvals/invoices/<id>?ingestId=QI-2026-0002 (optional)
 7. Approval Detail: 25/25/50 layout — fields | same comment thread | preview
 8. Approve → toast → ApprovalSettingsModal when first cycle       — policy save → "All set" success panel
 9. View Customer / Open Invoice                                   — customer shell tabs
```

### Reject alternative (from step 8)

```
8b. Click "Reject"
8c. Enter rejection reason in inline form
8d. Click "Confirm Rejection"
8e. Navigate back to /approvals (invoice status: Cancelled)
```

### Early Renewal (Verdant Health, `QI-2026-0006`, `sample3`)

```
 1. Workbench → Queue tab
 2. Open row OR Import → sample3 → drawer / full page
 3. Full-page IngestDrawer: validation + comments | fields | Document preview
 4. Review extracted fields → early renewal callouts / validation as implemented
 5. Click "Next" or "Proceed to close prior contract"
       → setPendingRenewalIngestion(CON-2025-0034, { queueItemId: QI-2026-0006, ... })
       → navigate to                                              — /customers/cust_verdant_005?tab=contract&contractId=CON-2025-0034&closeIntent=early-renewal&queueItemId=QI-2026-0006
 6. Customer workspace: CloseContractPane for prior contract (list view)
 7. Send closure for approval →                                  — /approvals/invoices/CN-CLOSE-xxx?closureFor=CON-2025-0034&queueItemId=QI-2026-0006
 8. Approve closure → auto-ingest renewal contract + queue Ingested + toast
 9. Contract tab shows prior Closing + scheduled renewal row
```

### Late Renewal (with grace extension)

```
 1. Prior contract enters grace period via late_extend flow
 2. New renewal PDF arrives in queue (sample4)
 3. Open Late Renewal row in queue
 4. Full-page IngestDrawer shows late renewal banner + backdate option
 5. Confirm renewal terms (may backdate effective date)
 6. Click "Next" → handleLateRenewalQueueFinish creates scheduled contract
 7. Advance to close_prior step (same as Early Renewal from here)
 8. Close prior contract → approval → auto-activate renewal
```

---

## Scope notes / stubs

- File upload UI is non-functional — **sample2** / **sample3** / **sample4** map to **queue ids** via `getQueueItemBySample`.
- Queue seed is **intentionally small** (three rows); expand in `queue-data.ts` when adding scenarios (renewal, amendment, failure rows, etc.).
- Session-created objects (customer, product plan, queue overrides, approval policy, invoice field overrides, **discussion stub approvals**, **grace extensions**) live in `IngestContext` only — refresh resets.
- Stub approvals use placeholder **`INV-PENDING-<queueItemId>`** until real ingest — they should not appear in production-style invoice lists; safe for this prototype.
- The approval approver label remains **"Sarah Chen, VP Revenue"** on synthetic rows.
- The Approvals module only surfaces **invoice / closure document** approvals in this pass.
- The `ApprovalSettingsModal` policy does not yet gate computed routing for later invoices — representational.
