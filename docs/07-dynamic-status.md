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

- **Source:** `contract.status`, `contract.amendments`, `contract.enforcement`, `contract.billingSchedule`
- **Logic:**
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
| blue | `text-blue-600` | informational, draft, neutral |

---

## AI insights derivation

All AI insights shown in the right insight rail are dynamically generated from mock data. Each stage has a dedicated derivation function in `derive-stage-data.ts`.

### Customer insights (`getCustomerInsights`)

- **Sources:** `customer.prepaidCreditTotal`, `.prepaidCreditBalance`, `.openAr`, `.riskBadges`, `.nextRenewalDate`, `.crmSyncStatus`
- **Examples:**
  - warning: "Prepaid credit 74% consumed — $31,400 remaining"
  - warning: "$24,300 in open accounts receivable"
  - info: "Contract renewal in 73 days — start planning"
  - info: "CRM sync is stale"
  - success (fallback): "Account in healthy state"

### Quote insights (`getQuoteInsights`)

- **Sources:** `quote.discountPct`, `.approval`, `.commercialTerms`, `.crmSyncStatus`, `.products`; `contract.paymentTerms`, `.term`
- **Examples:**
  - warning: "Discount (22%) exceeds policy threshold"
  - warning: "Payment terms (Net 30) differ from prior contract (Net 45)"
  - info: "Quote includes 80,000 prepaid credits"
  - warning: "Approval pending for 6 days with Sarah Chen, VP Revenue"
  - info: "Contract term (24mo) differs from current contract (36mo)"

### Contract insights (`getContractInsights`)

- **Sources:** `contract.comparisonToQuote`, `.enforcement`, `.amendments`, `.prepaidCreditBalance`, `.renewalDate`; customer invoices
- **Examples:**
  - warning: "Invoice INV-2026-0034 is 16 days overdue ($5,800)"
  - warning: "Signed contract differs from quote on 1 field: Billing cadence"
  - info: "Minimum commit will exhaust in ~41 days"
  - info: "Renewal in 73 days — start planning"
  - success: "Product mapping complete — all SKUs matched"

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

Next best actions in the right rail are generated dynamically.

### Customer tab

No actions (customer tab is informational).

### Quote tab (`getQuoteActions`)

- **Sources:** `quote.approval.status`, `.status`, `.discountPct`, `.customerAcceptedAt`
- **Examples:**
  - "Follow up on approval" (if pending, with approver + date)
  - "Follow up with customer" (if sent, no response)
  - "Complete and send quote" (if draft)
  - "Review discount level" (if > 15%)

### Contract tab (`getContractActions`)

- **Sources:** customer invoices filtered by `contractId`, `contract.renewalDate`, `contract.enforcement.blockingIssues`
- **Examples:**
  - "Resolve overdue invoice" (with ID, amount)
  - "Collect PO for held invoice" (with hold reason)
  - "Start renewal planning" (if < 90 days to renewal)
  - "Resolve enforcement blockers" (with first blocking issue)

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

Linked records are derived from actual data relationships.

| Tab | Linked records |
|---|---|
| Quote | Related contract (`relatedContractId`), CRM opportunity (parsed from URL) |
| Contract | Source quote, pending customer quotes for this contract, overdue invoices |
| Invoicing | Source contract, credit notes for this invoice, collection cases |
| Payment | Overdue invoices, held invoices, credit notes, open support tickets |
| RevRec | Source contract, pending amendments, blocked journal entries |

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

### Product adoption

Derived from prepaid credit consumption percentage.

- > 50% consumed → **High** (green)
- > 20% consumed → **Medium** (amber)
- ≤ 20% consumed → **Low** (red)

### Churn risk

Derived from risk score (same calculation as NPS).

- score ≥ 4 → **High** (red)
- score ≥ 2 → **Medium** (amber)
- < 2 → **Low** (green)
