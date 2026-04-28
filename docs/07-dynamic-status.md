# Dynamic Status System — Derivation Reference

All statuses, labels, AI insights, next-best-actions, linked records, and customer health metrics in the prototype are **dynamically derived from mock data**. Nothing is hardcoded. If the underlying data changes, the UI updates automatically.

**Implementation:** `src/components/revenue-workspace/derive-stage-data.ts`

## Journey rail tab status derivation

Each tab in the lifecycle journey rail shows a dynamic status label and color beneath the tab name. Computed at render time inside `CustomerRevenueWorkspace` and passed as a `stageStatuses` prop to `RevenueJourneyRail`.

### Customer tab status

- **Source:** `customer.riskBadges`
- **Logic:**
  - If `riskBadges.length > 0` → `"N risk flag(s)"` — **red** if any badge contains "overdue", else **amber**
  - Else → `"Healthy"` — **green**

### Quote tab status

- **Source:** `quote.status`, `quote.approval.status`, `quote.approval.currentApprover`
- **Logic:**
  - `approval.status === "pending"` → `"Pending Approval · {approver first name}"` — **amber**
  - `approval.status === "rejected"` → `"Rejected"` — **red**
  - `status === "Draft"` → `"Draft"` — **blue**
  - `status === "Sent"` → `"Sent · awaiting response"` — **amber**
  - Approved / Accepted → `"Approved · {amount}"` — **green**
  - Fallback → `quote.status` — **blue**

### Contract tab status

- **Source:** `contract.status`, `contract.scheduledStartDate`, `contract.amendments`, `contract.enforcement`, `contract.billingSchedule`, `contract.closure`
- **Logic:**
  - **Scheduled state (highest priority):**
    - If `contract.scheduledStartDate` exists → `"Scheduled · activates {shortDate}"` — **blue**
  - **Closure states (second priority):**
    - If `closure` exists and `closure.effectiveDate` is in the future → `"Closing in Xd"` — **amber**
    - If `closure` exists and `closure.effectiveDate` is today or past, and `closure.reason` is `"non_payment"` → `"Terminated"` — **red**
    - If `closure` exists and `closure.effectiveDate` is today or past (other reasons) → `"Closed"` — **gray**
  - **Non-closure states:**
    - Base: `contract.status` (e.g. "Active")
    - If `amendments.length > 0` → appends `"+ N amendment(s)"`
    - **Color:**
      - **red** if `enforcement.blockingIssues.length > 0`
      - **amber** if any `billingSchedule` item is "Overdue"
      - **green** otherwise

### Invoicing tab status

- **Source:** all customer invoices (`getInvoices`)
- **Logic:**
  - Count invoices by status: overdue, pending review, held (holdReason)
  - Build string: `"N overdue · N pending review · N held"`
  - If all clear → `"All clear"`
  - **Color:** **red** if any overdue, **amber** if pending/held, **green** otherwise

### Payment tab status

- **Source:** `getCustomerArSummary`, `getPaymentsForCustomer`
- **Logic:**
  - Count overdue invoices
  - Sum unapplied cash from payments with `matchStatus === "unapplied"`
  - Build string: `"N overdue · $X unapplied"`
  - If no open AR → `"No open AR"`
  - **Color:** **red** if overdue, **amber** if open balance, **green** otherwise

### RevRec tab status

- **Source:** `getRevenueArrangement(contract.id)`
- **Logic:**
  - If no arrangement → `"No arrangement"` — **blue**
  - Count unresolved `closeBlockers`
  - If blockers > 0 → `"N blocker(s)"` — **red** if any blocker is severity "critical", else **amber**
  - Else → `"Healthy"` or `arrangement.status` — **green**

### Shared severity color tokens

| Severity | Class | Use |
|---|---|---|
| green | `text-emerald-600` | healthy, active, complete |
| amber | `text-amber-600` | pending, review, warning |
| red | `text-red-600` | overdue, blocked, critical |
| blue | `text-blue-600` | informational, draft, neutral, **Scheduled renewal** |
| gray | `text-gray-500` | historical, closed, neutral/terminal state |

---

## AI insights derivation

AI insight **strings** are generated dynamically from mock data in `derive-stage-data.ts`. They are **not** shown in the right insight rail on the Customer tab — that rail is tasks + account details + linked records only. On **Account 360**, enriched insights (with optional CTAs) power the **AI Insights** generate/expand UI in `CustomerNbaAiRow.tsx`.

### Customer insights — compact (`getCustomerInsights`)

Returns `{ severity, text }[]` for lightweight consumers. Implemented as a **map** of `getCustomerInsightsEnriched` so it stays aligned with the Account 360 UI.

- **Sources (underlying):** `customer.prepaidCreditTotal`, `.prepaidCreditBalance`, `.openAr`, `.riskBadges`, `.nextRenewalDate`, `.crmSyncStatus`; plus `getInvoices`, `getContractsForCustomer`, `getTasks` for enriched-only behavior.

### Customer insights — enriched (`getCustomerInsightsEnriched`)

Used by the Account 360 **AI Insights** list after the user clicks **Generate**.

- **Returns:** `EnrichedCustomerInsight[]` — each item has `id`, `severity`, `text`, `ctas[]` (`label` + `to` route), `showAddToWorkbench`, `workbenchPreviewTitle`.
- **CTAs:** Only attached when they make sense (e.g. open invoice, payment workspace, contract, customer tab). Omitted when there is no sensible deep link. In the **UI**, link CTAs render **left → right** in array order on the **right** side of the row; the **rightmost** link is the last entry in `ctas` (when multiple links exist, put the primary destination last). **Add to workbench** / “Added” renders **to the left** of the blue link group when present.
- **Add to workbench:** `showAddToWorkbench` is true when there is a suggested follow-up title **and** no open task for this customer already looks like the same work (substring / phrase overlap on `getTasks(customer.id)`).
- **Examples (same narrative as compact insights):**
  - warning: prepaid burn, open AR, overdue signal, entity mismatch
  - info: renewal window, CRM stale
  - success (fallback): healthy account

### Quote insights (`getQuoteInsights`)

- **Sources:** `quote.discountPct`, `.approval`, `.commercialTerms`, `.crmSyncStatus`, `.products`; `contract.paymentTerms`, `.term`
- **Examples:**
  - warning: "Discount (22%) exceeds policy threshold"
  - warning: "Payment terms (Net 30) differ from prior contract (Net 45)"
  - info: "Quote includes 80,000 prepaid credits"
  - warning: "Approval pending for 6 days with Sarah Chen, VP Revenue"
  - info: "Contract term (24mo) differs from current contract (36mo)"

### Contract insights (`getContractInsights`)

- **Sources:** `contract.comparisonToQuote`, `.enforcement`, `.amendments`, `.prepaidCreditBalance`, `.renewalDate`, `.closure`; customer invoices
- **Examples:**
  - warning: "Invoice INV-2026-0034 is 16 days overdue ($5,800)"
  - warning: "Signed contract differs from quote on 1 field: Billing cadence"
  - info: "Minimum commit will exhaust in ~41 days"
  - info: "Renewal in 73 days — start planning"
  - success: "Product mapping complete — all SKUs matched"
  - **Closure insights (when `contract.closure` exists):**
    - info/warning: "Contract closing in X days — wind-down period active" (future-dated)
    - info: "Credit note CN-xxx pending — $X" (when `settlementType === "credit_note"`)
    - warning: "Settlement requires approval" (when `approvalRequired === true`)
  - **Scheduled insights (when `contract.scheduledStartDate` exists):**
    - info: "Activates on {date} — prior contract closes first"
    - info: "Replaces contract CON-xxx" (when `replacesContractId` is set)

### Invoicing insights (`getInvoicingInsights`)

- **Sources:** invoice enrichment (paymentTerms), `invoice.holdReason`, `.disputeReason`; `enrichment.reviewChecklist`; creditNotes; `contract.amendments`, `.paymentTerms`
- **Examples:**
  - warning: "Invoice payment terms (Net 45) differ from contract (Net 30)"
  - warning: "Invoice on hold: PO number required"
  - warning: "2 validation checks failed — resolve before sending"
  - info: "1 credit note pending for this invoice"
  - success: "PO number available — ready for delivery"

### Payment insights (`getPaymentInsights`)

- **Sources:** `getCustomerArSummary`, `getPaymentsForCustomer`, `getCollectionCasesForCustomer`
- **Examples:**
  - warning: "Customer typically pays 22 days after due date"
  - info: "$28,000 unapplied cash — review bank references for match"
  - info: "Partial payment on INV-2026-0034 — $4,600 received"
  - warning: "Active dispute: Usage overage disputed"
  - warning: "$5,800 overdue across 1 invoice — may impact renewal"
  - info: "Customer committed to pay by 2026-04-10"

### RevRec insights (`getRevRecInsights`)

- **Sources:** `revenueArrangement.closeBlockers`, `.amendmentImpacts`, `.adjustments`, `.journalExports`, `.obligations`
- **Examples:**
  - warning: "1 critical blocker preventing period close"
  - warning: "Amendment AMD-003 has not updated the recognition schedule"
  - info: "1 manual adjustment awaiting approval"
  - warning: "Journal export blocked for 2026-Q1"
  - info: "1 obligation using usage-based recognition"

---

## Next-best-actions derivation

Next-best-action lists for **Quote / Contract / Invoicing / Payment / RevRec** are generated dynamically. On **Account 360**, the UI emphasizes a **single** primary action instead of a rail list.

### Customer tab — primary action (`getPrimaryCustomerAction`)

- **Purpose:** One prioritized “do this next” for the account — the **hero** CTA on the Customer tab (`CustomerNbaAiRow`). The NBA **card chrome** (white fill, light orange gradient wash, **cb-orange** CSS border, optional one-shot SVG border draw on load) is presentation-only; behavior is fully determined by this function + routes.
- **Priority order (first match wins):** overdue invoice(s) → open AR (when no overdue row in scope) → stale CRM sync → renewal within 90 days (requires a contract for deep link) → prepaid burn >70% (requires contract) → escalated support tickets → fallback “calm” action (e.g. browse quotes).
- **Returns:** `PrimaryCustomerAction` — `kind`, `label`, `description`, `learnMoreBody`, `executeTo` (path + query + optional `#support-comms-anchor`), `executeLabel`, `learnMoreLabel`.
- **Related:** `getCustomerActions(customer)` still returns the **full prioritized list** for any code that needs every candidate; the tab UI uses **one** row from the equivalent priority stack via `getPrimaryCustomerAction`.

### Customer tab — legacy list (`getCustomerActions`)

Same business rules as historically documented, but exposed as an **array** of `{ label, description }`. Prefer `getPrimaryCustomerAction` for Account 360 UX.

### Quote tab (`getQuoteActions`)

- **Sources:** `quote.approval.status`, `.status`, `.discountPct`, `.customerAcceptedAt`
- **Examples:**
  - "Follow up on approval" (if pending, with approver + date)
  - "Follow up with customer" (if sent, no response)
  - "Complete and send quote" (if draft)
  - "Review discount level" (if > 15%)

### Contract tab (`getContractActions`)

- **Sources:** customer invoices filtered by `contractId`, `contract.renewalDate`, `contract.enforcement.blockingIssues`, `contract.closure`
- **Examples:**
  - "Resolve overdue invoice" (with ID, amount)
  - "Collect PO for held invoice" (with hold reason)
  - "Start renewal planning" (if < 90 days to renewal)
  - "Resolve enforcement blockers" (with first blocking issue)
  - **Closure actions (when `contract.closure` exists):**
    - "Process credit note CN-xxx" (when `settlementType === "credit_note"`)
    - "Review termination invoice INV-xxx" (when `settlementType === "termination_charge"`)

### Invoicing tab (`getInvoicingActions`)

- **Sources:** `invoice.holdReason`, `.status`, `.dueDate`; customer credit notes
- **Examples:**
  - "Release hold on INV-2026-0044" (if held)
  - "Send overdue reminder" (with days past due)
  - "Review and approve INV-2026-0041" (if pending review)
  - "Process credit note CN-2026-0001" (if pending credit notes)

### Payment tab (`getPaymentActions`)

- **Sources:** payments (unapplied, partial), collection cases (PTP, no response), AR summary
- **Examples:**
  - "Match unapplied $28,000" (with bank reference)
  - "Resolve partial payment" (with invoice and amount)
  - "Follow up on promised payment" (with PTP date)
  - "Escalate INV-2026-0040" (if no response, with attempt count)

### RevRec tab (`getRevRecActions`)

- **Sources:** `arrangement.amendmentImpacts`, `.adjustments`, `.closeBlockers`, `.journalExports`
- **Examples:**
  - "Rerun schedule for AMD-003" (pending amendments)
  - "Approve adjustment ADJ-2026-002" (pending approvals)
  - "Resolve close blockers" (with count)
  - "Re-export failed journal entries" (with period + reason)

---

## Linked records derivation

Two derivations exist:

### Customer-level external linked records (used by the Insight Rail)

Used by the shared insight rail across all tabs. External-system references only — internal records (invoices, credit notes, tickets) are deliberately excluded so the rail stays customer-scoped and calm.

**Source:** `getCustomerExternalLinkedRecords(customer, customerQuotes, customerContracts)`

- **CRM Account** — from `customer.crmAccountId` (with `crmSyncStatus` sublabel when available)
- **CRM Opportunities** — one per deal lineage, deduped to latest version (from `quote.crmOpportunityLink`, links out to Salesforce/HubSpot)
- **Signed Contract Documents** — from `contract.signedDocumentUrl` (with extraction-confidence sublabel when available)

Each record has `kind` (`"crm-account" | "crm-opportunity" | "contract-document"`), `label`, `value`, optional `href` (opens in new tab), and optional `sublabel`.

### Per-stage internal linked records (NOT currently rendered — reserved for stage content)

These remain available in `derive-stage-data.ts` for use inside each tab's main content area when needed (e.g. showing "source contract" next to an invoice record). They are NOT rendered in the rail anymore.

| Function | Returns |
|---|---|
| `getQuoteLinkedRecords(quote)` | Related contract, CRM opportunity |
| `getContractLinkedRecords(contract, quotes, invoices)` | Source quote, pending customer quotes, overdue invoices |
| `getInvoicingLinkedRecords(invoice, customerId)` | Source contract, credit notes, collection cases |
| `getPaymentLinkedRecords(customerId)` | Overdue invoices, held invoices, credit notes, open support tickets |
| `getRevRecLinkedRecords(arrangement)` | Source contract, pending amendments, blocked journal entries |

---

## Customer health derivation

The Customer Health section in the insight rail is fully dynamic.

**Source:** `deriveCustomerHealth(customer)`

### NPS

Derived from risk score.

```
Risk score = (has overdue × 2) + (has escalation × 2) + (has high burn × 1)
             + (open support escalations > 0 × 1)

NPS: score ≥ 4 → 32
     score ≥ 2 → 52
     else      → 72
```

### Support tickets (30d)

Count of support tickets with `lastUpdatedAt` within last 30 days. Source: `getTicketsForCustomer(customer.id)`.

### Open escalations

Count of tickets with `status === "Escalated"`. Only shown if count > 0.

### Churn risk

Derived from risk score (same calculation as NPS).

- score ≥ 4 → **High** (red)
- score ≥ 2 → **Medium** (amber)
- < 2 → **Low** (green)
