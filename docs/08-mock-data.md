# Mock Data Reference

All state lives in mock data files + React context. No backend.

## Data files

```
src/data/
  mock-data.ts          — customers, quotes, contracts, invoices, tasks (core)
  revrec-data.ts        — revenue arrangements, obligations, schedules
  support-data.ts       — support tickets, email summaries
  billing-data.ts       — payments, collection cases, credit notes
  ingest-data.ts        — ingestion samples, extracted contracts, approvals
  gettingStarted.ts     — workbench home milestones
```

## Core record types (from `mock-data.ts`)

### Customer

Required:
- id, name, commercialAccount, billingLegalEntity, merchantEntity, segment, tier
- ARR, TCV, prepaidCreditTotal, prepaidCreditBalance, openAr, nextRenewalDate
- riskBadges: string[]
- AE / CSM / billingOwner

Added fields (from Customer tab work):
- `domain` (e.g. "echocorp.ai")
- `industry` (e.g. "AI Infrastructure")
- `region` (e.g. "North America")
- `crmAccountId` (Salesforce account ID)
- `crmSyncStatus`, `crmLastSyncedAt`
- `paymentMethod` (e.g. "ACH", "Wire", "Card")
- `currency`, `taxRegion`, `poRequired`
- `activeContractCount`, `openQuoteCount`

### Quote

- quoteId, customerId, version, source, status
- amount, arr, discountPct
- approvalStatus / approval: `{ status, currentApprover, triggers, ... }`
- products, commercialTerms
- relatedContractId
- timeline events
- crmSyncStatus, crmSyncedAmount

### Contract

- contractId, customerId, sourceQuoteId, status
- signedDate, effectiveDate, term
- minCommit, prepaidCredits (total + balance), overageRate
- billingSchedule (array of scheduled invoices)
- enforcement: `{ status, blockingIssues, productMappingIssues, provisioning }`
- amendments (array)
- invoices (refs)
- revRecSummary
- comparisonToQuote (differences from linked quote)

### Invoice

- id, customerId, contractId, amount, date, dueDate, status
- holdReason, disputeReason (optional)
- Optional enrichments: `billingPeriodStart`, `billingPeriodEnd`, `currency`, `paymentTerms`, `billToContact`, `poNumber`, `taxTotal`, `balanceDue`, `detailedLineItems`, `reviewChecklist`, `deliveryHistory`

### Task

- id, customerId, type, title, assignee, dueDate, status

## Lifecycle-tab data types (from `revrec-data.ts`, `billing-data.ts`)

### InvoiceDetailLine (enriched line item)

- sku, name, type (`recurring` | `one-time` | `usage` | `credit`)
- quantity, unitPrice, discount, tax, netAmount
- `lineType`: `"platform_fee" | "prepaid_credit" | "usage_overage" | "true_up" | "minimum_commit"`

### ReviewCheck

- label, status: `"pass" | "warn" | "fail"`

### DeliveryEvent

- date, method, recipient, status

### CreditNote

- id, invoiceId, customerId, amount, reason, status, date, owner

### Payment

- id, customerId, invoiceId, amount, method, bankReference, receiptDate
- matchStatus, allocations: `{ invoiceId, amount }[]`, reversals

### CollectionCase

- id, customerId, invoiceId, outstandingAmount, daysOverdue, stage, owner
- ptpDate, nextStep
- followUpHistory: `{ date, action, note }[]`
- escalated, lastContactSummary

### RevenueArrangement

- id, customerId, contractId, status, policy
- obligations: `PerformanceObligation[]`
- schedule: `RecognitionScheduleEntry[]`
- recognizedToDate, deferred
- closeBlockers: `CloseBlocker[]`
- journalExports: `JournalExport[]`
- adjustments, lastRecalculated, closeStatus

### PerformanceObligation

- product, obligationType: `"over-time" | "point-in-time" | "usage-based"`
- allocationBasis, allocatedAmount, recognizedToDate, deferredRemaining, method

### RecognitionScheduleEntry

- period, recognized, deferred, remaining, amended

### CloseBlocker

- description, severity: `"critical" | "warning"`, category, resolved

### JournalExport

- id, period, status, erpReference, exportDate, failReason

## Support & comms types (from `support-data.ts`)

### SupportTicket

- id, customerId, subject
- priority: `"High" | "Medium" | "Low"`
- status: `"Open" | "Escalated" | "Resolved"`
- category (e.g. "Billing dispute", "Invoice question", "Credit burn-down")
- assignee, createdAt, lastUpdatedAt

### EmailSummary

- id, customerId, subject, from, date
- snippet (2–3 sentence summary)
- sentiment: `"positive" | "neutral" | "negative"`

## Ingestion types (from `ingest-data.ts`)

- `SampleDoc` — sample document definitions
- `ExtractedContract` — all fields extracted from a document
- `ExtractedProduct` — per-line product extracted
- `ExtractedTerms` — commercial terms extracted
- `IngestIssue` — blocking or warning issue on extracted contract
- `IngestResult` — created/linked object log after Finish
- `CreatedObject` — one logged object outcome (created / linked / reused)
- `ApprovalRequest` — pending invoice approval record
- `ApprovalComment` — single comment on an approval

## React context

### `src/context/IngestContext.tsx`

- `selectedSample` — which sample was chosen (`sample1` | `sample2` | `null`)
- `sessionCustomers` — customers created during the session
- `sessionProductSkus` — product SKUs created during the session
- `ingestResult` — result of the last completed ingest
- `approvalRequests` — list of all approval requests in session
- `submittedInvoiceIds` — set of invoice IDs submitted for approval
- `invoiceStatusOverrides` — map of invoiceId → overridden status string

Uses `useState` only — no localStorage / sessionStorage. Refresh resets all session state.

### `src/context/WorkbenchRoleContext.tsx`

- Controls Billing Manager (Admin) vs Billing Operator persona for Workbench Home

## Use-case matrix — what each customer showcases

Each customer showcases a distinct stage of the revenue lifecycle for prototype demo purposes.

| Customer | Quote state | Contract | Invoicing |
|---|---|---|---|
| **Echo Corp** (cust_echo_001) | Renewal pending approval (v3 of 3) + Draft amendment | Active (prior term) CON-2024-0189 | Overdue + held (2 invoices) |
| **Lumina AI** (cust_lumina_002) | Accepted (v1) QT-2026-0038 | Active CON-2024-0201 | Pending review INV-2026-0041 |
| **Northlane Labs** (cust_northlane_003) | Draft amendment (v1) QT-2026-0043 | Active w/ enforcement issues CON-2025-0022 | Overdue INV-2026-0040 |
| **Pioneer Systems** (cust_pioneer_004) | Pending approval (v2 of 3) QT-2026-0041 | **NONE** → Contract/Invoicing/Payment/RevRec DISABLED | NONE |
| **Verdant Health** (cust_verdant_005) | Sent / awaiting (v1) QT-2026-0044 (top-up) | Active CON-2025-0034 | Pending review (missing PO) |
| **Zenith Analytics** (cust_zenith_006) | **NONE** → Quote tab shows empty state | Active (ingested) CON-INGEST-002 | Pending review INV-INGEST-002 |

## Seed data map

### Customers (6 total)

1. **Echo Corp** (cust_echo_001) — AI infrastructure, healthy prior term + renewal pending
2. **Lumina AI** (cust_lumina_002) — active, renewal in 22 days, healthy
3. **Northlane Labs** (cust_northlane_003) — 1 overdue invoice, support escalation
4. **Pioneer Systems** (cust_pioneer_004) — new, quote pending approval, no contract
5. **Verdant Health** (cust_verdant_005) — prepaid credit nearly exhausted (< 20%)
6. **Zenith Analytics** (cust_zenith_006) — new customer created via ingest exception path

### Quotes

- QT-2026-0042 — Echo Corp, Pending Approval (v3)
- QT-2026-0045 — Echo Corp, amendment, CRM sync mismatch
- QT-2026-0038 — Lumina AI, Accepted, contract not yet created
- QT-2026-0041 — Pioneer Systems, Pending Approval, new deal
- QT-2026-0043 — Northlane Labs, amendment quote, In Progress
- QT-2026-0044 — Verdant Health, Expiring Soon (expires in 5 days)

### Contracts

- CON-2024-0189 — Echo Corp, Active
- CON-2024-0201 — Lumina AI, Active, renewal in 22 days
- CON-2025-0022 — Northlane Labs, Active, enforcement issues (missing product mapping)
- CON-2025-0034 — Verdant Health, Active, min-commit exhaustion risk
- CON-INGEST-002 — Zenith Analytics, Active, source "Ingested PDF", extraction confidence 91%, enforcement Partial (SKU mapping pending), provisioning Pending

### Invoices

- INV-2026-0034 — Echo Corp, Overdue (existing)
- INV-2026-0040 — Northlane Labs, Overdue
- INV-2026-0041 — Lumina AI, Pending Review
- INV-2026-0042 — Verdant Health, Blocked (missing PO)
- INV-2026-0043 — Pioneer Systems, Pending Review
- INV-2026-0044 — Echo Corp, Pending Review (from existing billing schedule)
- INV-INGEST-001 — Echo Corp, Pending Review, $261,800 (annual renewal)
- INV-INGEST-002 — Zenith Analytics, Pending Review, $155,000 (new business)

**INV-INGEST-002 line items** (previously mis-summed to $164,400 against $155,000 total, now fixed):
- Apex Analytics Pro – 200 seats × $60/seat: $144,000
- Premium Support (Annual): $11,000
- **Total: $155,000 ✓**

### Support / email seeds

- 3–4 support tickets + 3–4 email summaries for Echo Corp
- 1–2 each for Northlane Labs (the escalation customer)

## Relationship map

- All records link to `customerId`
- From any record, the customer can be resolved
- From customer, all linked quotes/contracts/invoices can be found
- Index group rows carry `customerId` + relevant `recordId` for deep-linking

## Taggable users (for approval comments)

- Jordan Kim (AE)
- Priya Mehta (CSM)
- Alex Nguyen (Billing Ops)
- Marcus Lee (AE)
- Rachel Torres (CSM)
- Lena Schulz (Billing Ops)

Default approval approver (prototype-wide): **"Sarah Chen, VP Revenue"**.
