# Dynamic Status System — Derivation Reference

All statuses, labels, AI insights, next-best-actions, and customer health metrics in the prototype are **dynamically derived from mock data**. Nothing is hardcoded. If the underlying data changes, the UI updates automatically.

**Implementation:** `src/components/revenue-workspace/derive-stage-data.ts`

## Journey rail tab status (unused)

`deriveAllStageStatuses()` in `derive-stage-data.ts` computes per-stage status labels and colors, but **nothing in the live UI consumes them** (file-folder tabs do not show per-tab status). Summary kept for reference if status labels return:

| Stage | Source | Example label |
|---|---|---|
| Customer | `riskBadges` | "N risk flag(s)" / "Healthy" |
| Quote | `quote.approval`, `quote.status` | "Pending Approval · Sarah" |
| Contract | `closure`, `scheduledStartDate`, amendments, enforcement | "Closing in Xd" / "Active + 2 amendments" |
| Invoicing | invoice counts | "2 pending review · 1 overdue" |
| Payment | AR summary, unapplied cash | "1 overdue · $28k unapplied" |
| RevRec | `closeBlockers` | "1 blocker(s)" / "Healthy" |

Severity colors: green / amber / red / blue / gray — see table in previous docs.

**Also unused in live chrome:** `derivePriorityChips()`, `deriveContextMetrics()` — implemented but no consumer.

---

## AI insights derivation (live — tab content)

AI insights are rendered in **stage main content**, not a global rail.

### Customer / Overview — compact (`getCustomerInsights`)

Returns `{ severity, text }[]` — map of `getCustomerInsightsEnriched`.

### Customer / Overview — enriched (`getCustomerInsightsEnriched`)

Powers **AI Insights** in `CustomerNbaAiRow.tsx` after **Generate**:

- `id`, `severity`, `text`, `ctas[]` (`label` + `to`), `showAddToWorkbench`, `workbenchPreviewTitle`
- CTAs right-aligned; **Add to workbench** left of link group when shown
- Overlap check against `getTasks(customer.id)` for workbench deduping

### Quote / Contract / Invoicing / Payment / RevRec

- `getQuoteInsights`, `getContractInsights`, `getInvoicingInsights`, `getPaymentInsights`, `getRevRecInsights`
- Rendered near relevant sections (enforcement, review checklist, collections workflow, close readiness)

Closure and scheduled contract insights are included in `getContractInsights` (wind-down, credit note pending, activation date).

---

## Next-best-actions derivation (live)

### Overview — primary action (`getPrimaryCustomerAction`)

Single hero CTA on Account 360. Priority: overdue → open AR → stale CRM → renewal window → prepaid burn → escalated support → calm fallback.

Returns `PrimaryCustomerAction` with `executeTo`, `learnMoreBody`, etc. Card chrome (orange border animation) is presentation-only.

### Overview — legacy list (`getCustomerActions`)

Full prioritized array — prefer `getPrimaryCustomerAction` for Account 360 UI.

### Per-stage actions

| Function | Tab |
|---|---|
| `getQuoteActions` | Quote |
| `getContractActions` | Contract (includes closure actions) |
| `getInvoicingActions` | Invoicing |
| `getPaymentActions` | Collections |
| `getRevRecActions` | RevRec |

---

## Linked records derivation

### Customer-level external (`getCustomerExternalLinkedRecords`)

CRM account, CRM opportunities (deduped by lineage), signed contract documents. Use in stage content when needed.

### Per-stage internal (available, use in stage content when needed)

| Function | Returns |
|---|---|
| `getQuoteLinkedRecords` | Related contract, CRM opportunity |
| `getContractLinkedRecords` | Source quote, pending quotes, overdue invoices |
| `getInvoicingLinkedRecords` | Source contract, credit notes, collection cases |
| `getPaymentLinkedRecords` | Overdue/held invoices, tickets |
| `getRevRecLinkedRecords` | Source contract, amendments, blocked exports |

---

## Customer health derivation (`deriveCustomerHealth`)

Used when account health metrics are shown (e.g. enriched account details contexts):

**Risk score** = (overdue × 2) + (escalation × 2) + (high burn × 1) + (open escalations × 1)

- **NPS:** score ≥ 4 → 32; ≥ 2 → 52; else 72
- **Support tickets (30d):** count from `getTicketsForCustomer`
- **Open escalations:** tickets with `status === "Escalated"`
- **Churn risk:** High / Medium / Low from same score

---

## Workbench tasks (`src/data/workbench-tasks.ts`)

`deriveWorkbenchTasks(ctx, { persona })` merges queue, approvals, customer tasks, and closure-related items. Severity and destinations are computed here — separate from journey rail status labels.
