# Contract Ingestion & Invoice Approval

Covers the upload → extract → verify → ingest → pending invoice → approval flow.

**Key files:**
- `src/components/contracts/UploadModal.tsx`
- `src/pages/IngestContractPage.tsx`
- `src/pages/ApprovalsIndex.tsx`
- `src/pages/ApprovalDetailPage.tsx`
- `src/components/approvals/InvoiceHTMLPreview.tsx`
- `src/context/IngestContext.tsx`
- `src/data/ingest-data.ts`

## Product goal

Convert a signed commercial document into an operational billing contract inside Chargebee APEX. Key steps:

1. Extract fields from the document
2. Validate extracted data against existing system records
3. Map contract to existing customer, quote, and product objects
4. Resolve any blocking mismatches (customer not found, product mismatch)
5. Create the contract and generate a pending invoice ready for review

## Contract entry paths

**A. Uploaded signed contract** (fully implemented) — this doc covers this path.

**B. Integration sync from external system** (stubbed / future-ready) — contracts could be synced from Salesforce, DocuSign, or other CLM tools. Referenced in the architecture but NOT implemented.

---

## Upload modal (from Contracts index)

Triggered from: Contracts module > **Upload** button (top-right of page header).

### State 1 — Upload entry

- Modal title: "Upload Signed Contract"
- Upload area (drag-and-drop style, non-functional in prototype)
- **"Or use a sample document"** section with two distinct links:
  - Sample Document 1 — Echo Corp renewal (happy path)
  - Sample Document 2 — Zenith Analytics new business (exception path)
- Cancel button

### State 2 — Analysis loading (after sample selection)

- Progress bar (animated, runs over ~3 seconds)
- Sequential AI extraction messages cycle as progress fills:
  - "Reading document structure..."
  - "Extracting customer name and legal entity..."
  - "Detecting contract term and pricing..."
  - "Matching quote from system..."
  - "Validating product catalog mapping..."
  - "Checking billing readiness..."
- On completion: navigate to `/contracts/ingest?sample=1` (or `sample=2`)

The actual file upload UI is non-functional. Only sample document paths drive the prototype flow.

---

## Ingest verification workspace

**Route:** `/contracts/ingest?sample=1` (or `sample=2`)
**Breadcrumb:** Contracts > Ingest Contract
**Layout:** Two-column workspace (standalone route, NOT inside the `CustomerRevenueWorkspace` shell)

### Left column (380px, collapsible)

- Document viewer header with collapse toggle button
- Rendered HTML contract document (structured like a real MSA/Order Form)
- Scrollable within its container
- When collapsed: column shrinks to 0, right panel expands to full width
- Realistic HTML representation, not an actual PDF

### Right column (flex-1, scrollable with page)

Sections in order:

1. **Document Metadata** — doc name, extraction confidence, extracted date
2. **Customer Mapping** — matched or unmatched customer
3. **Quote Match** — linked quote or no match
4. **Contract Terms** — dates, term length, billing frequency, payment terms
5. **Products / Plan Mapping** — line items with catalog match status
6. **Financial Summary** — TCV, ARR, min commit, prepaid credits, overage
7. **Validation & Readiness Checks** — pass / warn / fail per check
8. **Finish / Actions bar** at the bottom

The right panel is not just a field review — it is the **operationalisation** step where extracted data becomes a billing-ready contract object.

---

## Happy path — Sample Document 1 (Echo Corp renewal)

### Extracted data

- Company: **Echo Corp Inc.** → matched to `cust_echo_001`
- Quote match: **QT-2026-0042** (94% confidence match shown)
- Products: all SKUs match catalog
- Term: 24 months, $261,800 ARR, $523,600 TCV
- Payment: Net 45, Annual upfront
- Start date: May 1, 2026

### Validation results

All checks pass (green).

### UX flow

- "Quote Match Found" callout with QT-2026-0042 details
- User clicks **"Link to this Quote"** to confirm the association
- Once linked, the check turns green
- **"Finish"** button becomes active
- Clicking Finish shows the Post-Ingestion Completion State

### Created objects (logged on Finish)

```
Contract CON-2026-0190           — Created
Linked to Quote QT-2026-0042     — Linked
Customer Echo Corp               — Reused
Products APEX-PLATFORM, APEX-AI-CREDITS,
  APEX-AI-OVERAGE, APEX-SUPPORT  — Reused
Invoice INV-INGEST-001           — Created (Pending Review)
```

---

## Exception path — Sample Document 2 (Zenith Analytics new business)

### Extracted data

- Company: **Zenith Analytics Inc.** → **NOT FOUND** in system
- Product: **APEX-ANALYTICS-PRO** (200 seats) → **NOT** in product catalog
- Term: 12 months, $155,000 TCV
- Payment: Net 30, Annual upfront

### Blocking issues (red callouts)

1. **Customer not found:** "Zenith Analytics Inc." does not match any existing customer record. Action required before contract can be ingested.
2. **Product mismatch:** SKU "APEX-ANALYTICS-PRO" is not in the product catalog. Map to an existing product or create a new plan.

### Inline resolution UX

**Issue 1 — Create new customer:**

"Create Customer" inline expansion reveals a mini-form:
- Company name (pre-filled from extraction)
- Billing legal entity
- AE / CSM / Billing owner
- Region / industry

Clicking "Create" adds the customer to session state. The issue callout changes to green: "Customer created: Zenith Analytics".

**Issue 2 — Create product plan:**

"Create Plan" inline expansion reveals a mini-form:
- Plan name (pre-filled)
- SKU
- Unit price / billing model

Clicking "Create Plan" adds the product to session state. The issue callout changes to green: "Plan created: APEX-ANALYTICS-PRO".

Once both issues are resolved, all validation checks pass and the Finish button becomes active.

### Created objects (logged on Finish)

```
Customer Zenith Analytics (cust_zenith_006) — Created
Product Plan APEX-ANALYTICS-PRO             — Created
Contract CON-INGEST-002                     — Created
Invoice INV-INGEST-002                      — Created (Pending Review)
```

### Session persistence

Newly created objects (customer, product) are held in React context (`IngestContext`). Available for the duration of the session. **On browser refresh, the prototype resets to its original state.**

---

## Post-ingestion completion state

After clicking **Finish** on the ingest verification page, the right panel transitions into a completion state. The document viewer remains visible.

### Completion state contents

✓ Success header: **"Contract Ingested Successfully"**

Created / Linked Objects log:
```
[icon] Contract CON-2026-0190       — Created
[icon] Quote QT-2026-0042           — Linked
[icon] Customer Echo Corp           — Reused
[icon] Invoice INV-INGEST-001       — Created · Pending Review
```

Status indicators:
- Contract status: Active
- Invoice status: Pending Review — Awaiting approval before sending

Primary CTA: **"Review Invoice →"** (navigates to invoice detail)
Secondary CTA: **"Back to Contracts"** (navigates to `/contracts`)

For the exception path, the log also shows newly created objects (customer, product plan) with "Created" badges.

---

## Pending invoice review → submit for approval

### Invoice Detail page (existing)

The invoice created from ingestion lands in the existing `CustomerRevenueWorkspace` with `initialStage="invoicing"`.

### Invoice state

Status: **Pending Review**

A banner appears at the top of the invoicing stage content:

```
┌─────────────────────────────────────────────────────────────┐
│ ⏳  This invoice is pending review before it can be sent.  │
│     [Send for Approval]                        [Dismiss]   │
└─────────────────────────────────────────────────────────────┘
```

### Send for Approval flow

1. Clicking "Send for Approval" creates an `ApprovalRequest` in session state
2. Banner updates to show: "✓ Submitted for approval — View in Approvals"
3. The Approvals module now shows this invoice as pending
4. The invoice status does **not** change yet (still Pending Review) until an approver takes action

### Post-approval states

| Approver action | Invoice status | Badge |
|---|---|---|
| Approved | "Approved" | green |
| Rejected | "Cancelled" | gray |

"Send for Approval" is shown on **any** invoice with status "Pending Review" — covers both statically defined invoices and ingest-created ones.

---

## Approvals module

### Left nav

"Approvals" nav item is **enabled** (was previously disabled/stubbed). Route: `/approvals`.

### Approvals index page

**Route:** `/approvals`
**Template:** Same `ListTable` + `MetricStrip` + `GroupedSection` pattern as other modules (see `docs/05-index-pages.md`).

**Metric strip:**
- Total pending
- Invoices pending
- Total amount pending
- Overdue approvals

**List columns:**
Approval ID | Invoice | Customer | Amount | Submitted By | Submitted On | Status

Only invoice approvals in this pass. Clicking a row → `/approvals/invoices/:invoiceId`.

### Approval detail page

**Route:** `/approvals/invoices/:invoiceId`
**Breadcrumb:** Approvals > Invoices > `{invoiceId}`
**Layout:** Two-column

**LEFT column (flex-1):** Styled HTML invoice preview (`InvoiceHTMLPreview` component) — realistic invoice document
- Invoice header: provider name, address
- Bill-to section: customer name, contact
- Line items table: description, qty, unit price, amount
- Subtotal / tax / total
- Payment terms / due date
- Footer

**RIGHT column (340px):**

- **Invoice Metadata** — status, submitted by, submitted on, approver
- **Previous Invoice** — last invoice for this customer, for comparison
- **Subscription / Contract Summary** — contract ID, term, TCV, ARR
- **Related Links** — contract, quote, customer workspace
- ─────────────
- **Comments & Collaboration** — @-tagging comment thread (see below)
- ─────────────
- **Decision Actions:**
  - **[Approve Invoice]** → success state + toast + navigate to invoice
  - **[Reject / Cancel]** → inline reason input → confirm rejection

### On Approve

1. `ApprovalRequest.status` → "Approved"
2. Invoice status override → "Approved"
3. Toast: **"Email sent to the customer"**
4. After short delay, navigate to `/invoices/:invoiceId?from=approvals`

### On Reject

1. `ApprovalRequest.status` → "Rejected"
2. Invoice status override → "Cancelled"
3. Navigate back to `/approvals` (no toast, inline confirmation shown)

---

## Comments & collaboration

Comments exist on the **Approval Detail page only** (not on Invoice Detail).

### Comment input

- Textarea placeholder: "Add a comment or note... Use @ to tag someone"
- Submit button: "Add Comment"
- When user types `@`, a dropdown appears with taggable team members
- Clicking a name inserts "@Name" into the text
- `@Name` references are highlighted in rendered comments

### Comment thread

- Each comment shows: author avatar (initials), name, role, timestamp, text
- `@Name` mentions are highlighted in blue within comment text
- Comments stored in session state (part of the `ApprovalRequest` object)
- Pre-seeded with 2 existing comments in mock data for realism

### Taggable users

- Jordan Kim (AE)
- Priya Mehta (CSM)
- Alex Nguyen (Billing Ops)
- Marcus Lee (AE)
- Rachel Torres (CSM)
- Lena Schulz (Billing Ops)

---

## Full navigation chain (end-to-end)

```
 1. Contracts index → click "Upload"
 2. Upload modal opens
 3. Click "Sample Document 1" (or 2)
 4. Loading / analysis animation (~3s)
 5. Navigate to /contracts/ingest?sample=1
 6. Review extracted fields, link quote (happy) or resolve issues (exception)
 7. Click "Finish"
 8. Completion state shown on same page
 9. Click "Review Invoice" → navigate to /invoices/INV-INGEST-001
10. Invoice Detail page (CustomerRevenueWorkspace, invoicing stage)
11. "Pending Review" banner appears with "Send for Approval" CTA
12. Click "Send for Approval"
13. Banner updates to "Submitted for approval"
14. Navigate to /approvals (via left nav)
15. Approvals Index shows the pending invoice approval
16. Click approval row → /approvals/invoices/INV-INGEST-001
17. Approval Detail page: review invoice HTML, context, comments
18. Click "Approve Invoice"
19. Toast: "Email sent to the customer"
20. Navigate to /invoices/INV-INGEST-001?from=approvals
21. Invoice Detail page shows status "Approved"
```

### Reject alternative (from step 18)

```
18b. Click "Reject / Cancel"
18c. Enter rejection reason
18d. Confirm rejection
18e. Navigate to /approvals
20b. Invoice status shows "Cancelled" if user returns to it
```

---

## Scope notes / stubs

- Invoice status overrides (Approved / Cancelled) live in React context. Navigating directly to an invoice via URL (without going through the flow) will show the original static status.
- The approval approver is always hardcoded to "Sarah Chen, VP Revenue". Dynamic approval routing is out of scope.
- The Approvals module only shows **invoice** approvals in this pass. Quote approvals (which already exist as `quote.approval.status` in `QuoteApprovalInfo`) are NOT migrated into this module in this pass.
- The ingest page is a **standalone route** (`/contracts/ingest`), NOT inside the `CustomerRevenueWorkspace` shell. It has its own breadcrumb and layout.
