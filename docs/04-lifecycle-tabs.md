# Lifecycle Tabs — Per-Tab Specifications

Detail specs for each tab inside the `CustomerRevenueWorkspace`. Read alongside `docs/03-customer-workspace.md` (shell anatomy) and `docs/07-dynamic-status.md` (insight/NBA derivation).

Tab order: **Overview → Tasks → Threads → Quotes → Contracts → Ingestion (conditional) → Invoicing → Collections → RevRec**.

> **Shell note:** The live UI uses **`CustomerContextBar`** file-folder tabs. Intelligence lives in **tab content** and dedicated **Tasks** / **Threads** tabs.
>
> **Next Best Actions** and **AI Insights** appear in **main stage content**. On **Overview (Account 360)**, they are the **lead anchor** (`CustomerNbaAiRow.tsx`). On Quote / Contract / Invoicing / etc., they sit next to the record they refer to. Derivation: `derive-stage-data.ts`.

---

## Overview tab (Account 360)

**Purpose:** Account-level operating view for Billing, Finance Ops, and RevOps — prioritized actions first, then snapshot, support/comms, lifecycle strips, and activity. Not a generic CRM profile.

**Record actions:** Hidden (customer is the record).

Component: `CustomerStageContent` composes the sections below.

### 1. Next best action + AI Insights (`CustomerNbaAiRow`)

This is the **primary anchor** of the tab.

**Next best action (single action, not a list)**  
- One prioritized action from `getPrimaryCustomerAction(customer)` — same business priority as the legacy multi-list `getCustomerActions` (overdue invoices → open AR → stale CRM → renewal window → prepaid burn → escalated support → calm fallback).  
- **Card:** white surface, **no** orange drop shadow. While the intro runs, the card uses **`border-transparent`** (layout still reserves 1px); a **1px** SVG stroke (same thickness as the final `border`) draws the outline once (**~2.2s**, ease-out, `stroke-dashoffset` perim → 0). When the draw finishes, the SVG **unmounts** and the visible **`border-cb-orange`** appears (the animation “reveals” where the border will be). A **light orange wash** sits under the content (radial from **bottom-right** + diagonal fade toward **upper-center** using `--color-cb-orange-light`). **`prefers-reduced-motion: reduce`** skips the draw and shows the orange border immediately.  
- **Content:** title, description, secondary control to expand **long-form “learn more”** copy (`learnMoreBody`), and a **high-attention primary CTA** (`Link` to `executeTo` — e.g. invoicing + `invoiceId`, payment tab, contract tab, customer tab + `#support-comms-anchor`, or quotes).  
- Intended for “land here → execute → done.”

**AI Insights (separate card)**  
- **Collapsed by default:** plain white card with border; **Generate** is a **subtle** outline-style control (neutral border/text, not a solid dark fill) so it does not compete with the NBA orange CTA. **Generate** runs a short loading state: a **warm horizontal gradient band** sweeps **left → right** **three times** (`ai-insights-sheen-sweep` + `ai-insights-loading-sheen` in `index.css`; total ~2.6s, synced with `AI_INSIGHTS_LOADING_MS`), then **expands** into the list. Expanded chrome is unchanged.
- **Expanded list** — rows from `getCustomerInsightsEnriched(customer)`: severity dot (grey, color on row hover) + **insight text left-aligned**; **CTAs right-aligned** — **primary** blue link CTAs (`ctas[]`) with the **last** link at the **far right** when multiple; **secondary** “Add to workbench” / “Added to workbench” sits **to the left** of those links when shown. Deep links use `label` + `to`. **Add to workbench** appears when a suggested follow-up is not already covered by an open task (phrase overlap on `getTasks(customer.id)`). Success-only rows may have no CTAs.  
- Header row: **AI Insights** title + **Regenerate** + **Collapse** (unchanged).  
- **Collapse** / **Regenerate** replay the flow without leaving the tab.

Compact string-only insights for other uses still come from `getCustomerInsights(customer)` (mapped from the enriched list).

### 2. Commercial snapshot (`CustomerMetricsSection`)

Single **Commercial snapshot** card: key/value rows for ARR, TCV, Open AR, prepaid credits, next renewal, currency, tax region, payment method, PO required, active contracts, open quotes — **only when the value is non-zero / present** (no empty placeholder rows for “create X” until that flow exists).

### 3. Support & Communications (`SupportCommsSection`)

- **Support tickets** and **email communications** as separate `SectionCard`s.  
- List rows use **dividers** (not per-row cards); **gray priority/sentiment dot** with true color on **row hover** (same interaction model as Open Tasks in the rail). No message/mail icons in the row chrome.  
- Email rows exclude body/snippet text; subject + meta + sentiment label only.  
- Wrapper `id="support-comms-anchor"` for deep links (e.g. primary action “View tickets”).

### 4. Lifecycle — Quotes, Contracts, Invoices (`LifecycleSummarySection`)

Three **stacked** sections (full width, not a 3-column grid). No table headers; each line uses compact inline labels (e.g. quote id, `TCV: …`, `STATUS:` + badge; contracts: `RENEWAL: …`, `STATUS:` + badge; invoices: `CONTRACT: …`, `AMOUNT: …`, `DUE: …`, `STATUS:` + badge). **Invoices** lists **actual** customer invoices that are **Pending Review** or **Overdue** (from `getInvoices(customerId)`), not aggregate counts only. Empty copy when none.

### 5. Recent Activity (`CustomerTimelineSection`)

- No outer card — heading **Recent Activity** + timeline list.  
- First **N** events, then **View more** to expand.  
- Extra top margin separates this block from the cards above.

### Context & insights (summary)

| Concern | Derivation |
|--------|------------|
| Single next action | `getPrimaryCustomerAction(customer)` |
| AI insight lines + CTAs + workbench hint | `getCustomerInsightsEnriched(customer)` |
| Legacy multi-action list (if needed elsewhere) | `getCustomerActions(customer)` |
| Compact insight strings | `getCustomerInsights(customer)` |

Cross-customer tasks and comms also have dedicated tabs (see below). External linked records can be surfaced in stage content via `getCustomerExternalLinkedRecords` when needed.

---

## Tasks tab

**Purpose:** Customer-scoped operational task list — work items that span billing, collections, and lifecycle stages.

**Record actions:** Hidden.

Component: `TasksStageContent` (`src/components/revenue-workspace/tasks/`).

**Data:** `src/data/customer-tasks.ts` — per-customer tasks with priority, assignee, due date, status, and deep-link destinations.

**Design:** Section cards or divider-based rows consistent with Account 360 list patterns (gray priority dot, color on hover). Tasks may overlap with Workbench `deriveWorkbenchTasks` sources but are **customer-filtered** here.

---

## Threads tab

**Purpose:** Email and communication thread history for the customer — operational context for billing disputes and renewals.

**Record actions:** Hidden.

Component: `ThreadsStageContent` (`src/components/revenue-workspace/threads/`).

**Data:** `src/data/email-threads.ts`.

**Design:** Divider-based rows; subject + meta; no full message body in list chrome (prototype summaries only).

---

## Quote tab

**Purpose:** Pre-signature commercial workspace. User should understand: what is being proposed, whether it is within policy, whether it is approved, whether it is customer-ready, what contract it will likely become.

**Record context bar fields:** Quote ID, version, status, source system (Salesforce / HubSpot / In-app), quote amount / TCV, discount %, expiry date, approval status.

**Actions:** Edit quote · Submit for approval · Send quote · Compare with current contract.

Component: `QuoteStageContent`.

### Sections

**1. Quote Overview** (`QuoteOverviewSection`)
Summary cards: Quote status, Quote amount / TCV, ARR, Discount %, Expiry date, Approval status.

**2. Products and Pricing** (`QuotePricingSection`)
Structured table / dense list: products / SKUs / plans, quantity / seats, unit price, recurring vs one-time, minimum commit, prepaid credit block sold, overage rate, discount, net amount, ramp schedule if any.

**3. Commercial Terms** (`QuoteTermsSection`)
Contract term, billing frequency, payment terms, start / end date, auto-renew setting, trial / implementation period, co-term target, AI usage drawdown rules, prepaid credit logic.

**4. Approvals and Policy Checks** (`QuoteApprovalsSection`) — *visually prominent near the top*
Approval state, triggered rule, discount threshold breach, TCV threshold breach, non-standard terms, current approver, comments, SLA / pending since.

**5. CRM and Collaboration** (`QuoteCrmSection`)
Source CRM, opportunity link, sync status, last synced amount, internal comments, send history, customer viewed / accepted state.

**6. Related Records** (`QuoteRelatedSection`)
Current active contract, related amendment quotes, expected contract to be created, invoice plan preview, key changes versus existing contract.

**7. Activity / Audit Timeline** (`QuoteTimelineSection`)
Created, edited, approval submitted, approved/rejected, sent, viewed, accepted, matched to contract.

### Context & insights (main content)

Render contextually inside the stage content — typically near the Approvals and Policy Checks section or alongside the Overview summary.

- **Next best action** — e.g. "Follow up on approval" (with approver + date), "Complete and send quote", "Review discount level". Derivation: `getQuoteActions(quote)`.
- **AI insights** — e.g. "Discount exceeds policy by 8%", "Payment terms differ from prior contract", "Prepaid credits suggest customer may need higher commitment", "Approval pending for 6 days with Sarah Chen", "Contract term differs from CRM opportunity". Derivation: `getQuoteInsights(quote, contract)`.

Linked records appear in related-record sections when relevant — no global rail.

---

## Contract tab

**Purpose:** Post-signature operational truth workspace. User should understand: what terms are actually in force, whether the contract was enforced correctly, what downstream billing it will generate, how it differs from the quote, what amendments / renewals matter next.

**Record context bar fields:** Contract ID, version / amendment number, status, signed / effective date, term, minimum commit, co-term / renewal, enforcement status.

**Actions:** Review enforcement · Create amendment quote · View invoice schedule · Open signed document · **Close contract early** (overflow menu).

Component: `ContractStageContent`.

### Contract tab state-aware actions

The `RecordHeader` actions and overflow menu vary based on contract state. The logic lives in `ContractStageContent` and considers: `isTerminal`, `isClosing`, `isScheduled`, `isExtended`, `isActive`, `inGrace`, `enforcementNeedsAttention`, and `canClose`.

| Contract state | Primary actions | Overflow items |
|---|---|---|
| **Terminal** (Closed, Terminated) | Contract PDF | — |
| **Closing** (status = "Closing") | Contract PDF | — |
| **Scheduled** (pending activation) | Transition, Contract PDF | — |
| **Extended** (or in grace) | Resolve renewal, Transition | Contract PDF, Review enforcement (if issues), — |
| **Active** | Transition, Create amendment | Contract PDF, Review enforcement (if issues), Extend grace period (if not already), Close contract early (destructive) |
| **Other** | Transition, Create amendment | Contract PDF |

**Transition** opens `EntityDrawer` with `mode="transition"` for the contract.
**Resolve renewal** opens the late renewal drawer flow.
**Extend grace period** opens the grace extension drawer.
**Close contract early** opens `CloseContractPane` (only for Active contracts without existing closure).

### Contract Closure UI

The Contract tab supports early termination via a full left/right pane layout (`CloseContractPane`). Access via the overflow menu (⋯) on the `RecordHeader` — only available for Active contracts. The same pane is also triggered automatically during the **Early Renewal** queue flow (see `docs/09-contract-ingestion.md`).

**`CloseContractPane`** — full-canvas overlay inside `CustomerRevenueWorkspace` (not a standalone route):

*Left pane (~520px, scrollable + sticky footer):*
- Effective termination date (date picker, supports backdated/future-dated)
- Reason dropdown (Customer non-renewal, M&A consolidation, Mutual agreement, Non-payment/Collections, **Replaced by new contract** — default for Early Renewal, Other)
- Settlement type radio group (Termination charge, Credit note — default when `prepaidCreditBalance > 0`, No financial impact)
- Calculated impact preview (min-commit shortfall or unused prepaid credits), with operator override field
- Inline approval-policy badge ("This will require approval — non-standard invoice")
- Sticky footer: **Cancel** + **Send for approval** (or "Send for approval & proceed to ingest" when from queue)

*Right pane (~flex-1, tabbed):*
- **Contract** tab (default) — details of the contract being closed: term, min-commit, prepaid balance, billing schedule
- **Last Invoice** tab — most recent invoice for context
- **Incoming Renewal** tab — visible only when triggered from Queue; shows new contract preview + proration / financial impact description

*Header:*
- Discard button (✕) with inline in-pane confirmation prompt
- **← Back to Queue** breadcrumb (visible when `fromQueueItemId` is set)

**`ClosureBanner`** — prominent wind-down banner (renders above Overview when `closure.effectiveDate > today`):
- "Contract closing on {date}" with countdown
- Reason, settlement summary, closed-by user

**`ClosureSummaryCard`** — displays after Overview when closure exists:
- Effective date, reason, settlement type + amount
- Closed-by user, timestamp
- Links to generated credit note or termination invoice
- Approval status badge when pending

**`ScheduledBanner`** — blue activation banner rendered when a `Scheduled` renewal contract is selected:
- "Contract scheduled — activates {date}"
- Mentions the prior contract ID being replaced and the activation conditions

**Status badges:** `Closing` (amber) for wind-down, `Terminated` (red) for non-payment closures, `Closed` (gray) for neutral closures, `Scheduled` (blue) for renewal contracts pending activation — all derived from contract data.

### Contract list lineage annotations

When the Contract tab is in list view and a prior/renewal contract pair exists:

- **Closing/Closed contract** row: `→ Renewed by CON-XXXX (Scheduled)` annotation with a `Scheduled` status badge
- **Scheduled contract** row: `← Replaces CON-XXXX (Closing)` annotation with a `Closing` status badge + "Activates {date}" sublabel

Lineage is read from `contract.replacedByContractId` and `contract.replacesContractId`. List ordering: Active/Closing first, then Scheduled, then Closed/Terminated (descending by effective date).

### Contract tab — Closure state behavior

During closure state (prior contract `Closing` + new contract `Scheduled`):
- **Always land in list view** — never auto-select a contract until it is explicitly Active
- `closeIntent` query param forces list view and auto-opens `CloseContractPane` on arrival (used by the Early/Late Renewal queue flows)

### Late Renewal — Grace extension awareness

When a contract is in grace extension (`contractGraceExtensions[contractId]`):
- **Late Renewal banner** appears in the ingest drawer: "This customer has a contract in extension" with grace period details (end date, billing mode)
- `TransitionContractTermsSection` allows backdating the effective date (`allowBackdate={true}`)
- Closing the prior contract via the renewal flow **resolves the grace extension** automatically
- Backdated start dates show amber helper: "Invoices for elapsed days will be clubbed into the first invoice"

### Grace extension banner (Contract detail)

When viewing a contract with an active (unresolved) grace extension in `ContractStageContent`:
- Red-tinted banner (`border-red-200 bg-red-50/90 text-red-900`)
- Shows: "**Grace extension** active through {date}. Billing during grace: {mode}."
- "Resolve in drawer" button opens the late renewal resolve flow

### Sections

**1. Contract Overview** (`ContractOverviewSection`)
Summary cards: Contract status, Effective date, Signed date, Term, TCV, Minimum annual commit, Prepaid credit balance, Renewal date.

**2. Signed Commercial Terms** (`ContractTermsSection`)
Products and plans in force, quantities / seats, discounts actually enforced, minimum commitments, prepaid credits, usage drawdown rules, overage rates, ramp schedule, billing cadence, payment terms.

**3. Enforcement and Activation** (`ContractEnforcementSection`) — *most important section after overview*
Source of contract (linked quote / CLM / manual upload), sale order status, enforcement status, product mapping issues, missing fields, provisioning signal status, entitlement activation status, manual overrides, blocking issues.

**4. Billing and Invoice Schedule** (`ContractBillingSection`)
Immediate invoice vs scheduled invoice, invoice dates, pending invoice review state, invoice hold reason, PO / tax / billing contact readiness, generated invoice references.

**5. Amendments and Lifecycle** (`ContractAmendmentsSection`) — *must be first-class, not hidden*
Base contract, amendment lineage, seat expansions, tier upgrades, co-termination behavior, next renewal task, upcoming lifecycle milestones.

**6. Downstream Finance Impact** (`ContractFinanceSection`)
Invoices generated, credit notes, open AR, payments received, unapplied cash, rev rec summary, deferred revenue.

**7. Documents and Audit** (`ContractDocumentsSection`)
Signed contract document, ingestion timestamp, extraction confidence, quote match confidence, important clause flags, audit trail.

**8. Quote vs Contract Differences** (`ContractDifferencesSection`)
Compact comparison callout: payment terms changed, discount changed, effective date changed, minimum commit changed, billing schedule changed.

Timeline: `ContractTimelineSection`.

### Context & insights (main content)

Render contextually inside the stage content — near the Enforcement section (blockers) and Overview (posture).

- **Next best actions** — e.g. "Resolve overdue invoice" (with ID, amount), "Collect PO for held invoice", "Start renewal planning" (<90 days), "Resolve enforcement blockers", **"Process credit note CN-xxx"** (closure), **"Review termination invoice INV-xxx"** (closure). Derivation: `getContractActions(contract, customerInvoices)`.
- **AI insights** — e.g. "Signed contract differs from approved quote on payment terms", "Invoice should have been generated already", "Product mapping incomplete for one SKU", "Minimum commit will exhaust in 41 days at current burn", "Renewal in 73 days — start planning", **"Contract closing in X days — wind-down period active"**, **"Credit note CN-xxx pending — $X"**, **"Settlement requires approval"**. Derivation: `getContractInsights(contract, customerInvoices)`.

Related records appear in stage sections (source quote, invoices, etc.).

---

## Ingestion tab (conditional)

**Purpose:** Contract ingestion workspace for reviewing extracted contract data and creating the corresponding Chargebee contract and first invoice. This tab is **conditionally visible** — it only appears when the customer has an active ingestion session.

**Record actions** (rendered via `RecordHeader` portal into the right context pill — flat CTAs only, no status dropdown):
- Frame 1: **Preview** (enabled when `overallStatus === "ready"` OR every section is `done`)
- Frame 2: **Send for approval** + overflow (`Restart ingestion`, `Discard contract`)

Component: `IngestionStageContent` (`src/components/revenue-workspace/ingestion/`).

### Visibility

The Ingestion tab only appears in the workspace when `getActiveIngestionForCustomer(customerId)` returns an active `IngestionSession`. This is unlike other tabs which are always visible (but may be disabled).

### Two-frame architecture

**Frame 1 (Review):** Sub-tab navigation via `ContextInfoPill`:
- Summary — contract terms overview
- Items — line items with catalog mapping
- Billing — billing frequency, payment terms
- Addresses — billing/shipping addresses
- Additional Info — notes, clauses
- PDFs — uploaded document preview

Each section displays a status indicator (issues/review/done) with a "Mark as done" CTA.

**Frame 2 (Preview):** Accessed after review is complete:
- Contract Preview — mock of how the contract will appear
- Invoice Preview — mock of the first invoice

### URL structure

```
/customers/:id?tab=ingestion&frame=1&sub=summary
/customers/:id?tab=ingestion&frame=1&sub=items
/customers/:id?tab=ingestion&frame=2&sub=contract-preview
```

### Sections (Frame 1)

**1. Summary** (`IngestionSummarySection`)
Contract terms overview: term, dates, billing frequency, payment terms, TCV, ARR, minimum commit, prepaid credits.

**2. Items** (`IngestionItemsSection`)
Extracted line items with catalog matching status. Unmapped items show "Map to catalog" action with product search.

**3. Billing** (`IngestionBillingSection`)
Contract term visualization, billing frequency, payment terms, financial summary.

**4. Addresses** (`IngestionAddressesSection`)
Billing and shipping address forms with "Same as billing" option.

**5. Additional Info** (`IngestionAdditionalInfoSection`)
Notes field and expandable contract clauses list.

**6. PDFs** (`IngestionPdfPreview`)
Document viewer with zoom and page navigation.

### Previews (Frame 2)

**Contract Preview** (`IngestionContractPreview`)
Mock contract display showing: contract ID, customer, status, terms, products, clauses.

**Invoice Preview** (`IngestionInvoicePreview`)
Mock invoice display showing: invoice number, dates, addresses, line items, totals.

### State management

Session state is managed in `IngestContext` via `IngestionSession`:
- `queueItemId` — source queue item
- `customerId` — linked customer
- `sampleId` — which extracted data set to use
- `customerLink` — "matched" or "created"
- `overallStatus` — "in_review" | "ready" | "awaiting_approval"
- `sections` — per-section completion state

### Send for approval flow

1. Build `Contract` from extracted data (`buildSessionContractFromIngestion`)
2. Build `Invoice` for first billing period (`buildSessionInvoiceFromIngestion`)
3. Add to session contracts/invoices
4. Submit invoice for approval (`submitInvoiceForApproval`)
5. Override invoice status to `"Pending Approval"` (`setInvoiceStatusOverride`) so the status reflects everywhere `mergeInvoiceStatuses` reads (lists, badges, customer 360, Workbench Approvals)
6. Mark queue item `"Ingested"` (`applyQueueItemOverride`) and `completeIngestion` to remove the session — Ingestion tab becomes hidden
7. Navigate to `/customers/:id?tab=invoicing&invoiceId=<new>` — workspace's URL-sync effect opens the new invoice's detail tab automatically

The approver flow then continues from the invoice's details page (see Invoicing tab "Pending Approval" actions below).

See `docs/09-contract-ingestion.md` for the full ingestion pipeline.

---

## Invoicing tab

**Purpose:** Billing execution workspace answering: What should be invoiced? What is pending? What is blocked? Does the invoice match the contract?

**Selected object:** an invoice or invoice schedule item.

**Record context bar fields:** Invoice ID, status, amount, billing period, due date, linked contract, invoice type, PO state if relevant.

**Actions:** State-aware via `RecordHeader` (composed in `InvoicingStageContent`). Reads `effectiveStatus = invoiceStatusOverrides[id] ?? invoice.status` and short-circuits on `holdReason` / `disputeReason`.

| Invoice state | Primary actions | Overflow (`…`) |
|---|---|---|
| Held (`holdReason` set) | Preview · Clear hold | Regenerate · Issue credit note |
| Disputed (`disputeReason` set) | Preview · Review dispute | Issue credit note · Regenerate |
| Cancelled | Preview | — |
| **Pending Approval** (post Send-for-approval) | Preview · **View in Approvals** | Regenerate |
| Pending Review — submitted (in `submittedInvoiceIds`) | Preview · View in Approvals | Regenerate |
| Pending Review — not yet submitted | Preview · **Send for approval** | Regenerate |
| Overdue | Preview · Record payment | Send reminder · Issue credit note |
| Paid | Preview · Issue credit note | — |
| Other (Approved / default) | Preview · Regenerate | Issue credit note |

**View in Approvals** opens `InvoiceApprovalDrawer` via `EntityDrawer` (mode `invoice_approval`) — same path used by `Workbench → Approvals`. **Send for approval** runs `submitInvoiceForApproval` for invoices that originate outside the ingestion flow (existing draft Pending Review invoices).

Component: `InvoicingStageContent`.

### Summary cards (customer-level invoice posture)

- Pending review count
- Total invoiced (YTD)
- Amount due
- Next scheduled invoice date + amount
- Held invoices
- Disputed amount

### Sections

**C. Invoice Overview** (`InvoicingOverviewSection`)
Invoice ID, status, date, due date, billing period, currency, total, balance due, payment terms, bill-to contact, PO number state, tax summary.

**D. Invoice Composition / Line Items** (enriched) — `InvoiceCompositionSection`
Each line distinguishes:
- Committed platform fee
- Prepaid credit purchase
- Usage / overage charge
- True-up vs scheduled recurring bill
- Minimum commit line
- Discount and tax per line

**E. Billing Basis & Traceability** (`BillingBasisSection`)
Source contract and line mapping, amendment impact on this invoice, usage period summary, burn-down / drawdown evidence, minimum commit application, overage calculation basis, co-term handling logic.

**F. Review Checklist / Validation** — explicit binary checks
- Matches contract ✓/✗
- Approval exists for non-standard pricing
- Bill-to entity valid
- PO available
- Tax configured
- Invoice contact valid
- Usage finalized
- No blocking dispute
- No amendment conflict

**G. Delivery & Customer Communication** (`InvoiceDeliverySection`)
Recipients, send history, delivery state, resend, customer-facing notes.

**H. Corrections / Credits / Disputes**
Credit notes, regenerated invoice history, dispute reason and owner, corrected invoice references.

**I. Invoice Schedule** (`InvoicingScheduleSection`)
Upcoming invoices for this customer, estimated amounts, type, hold state, dependency on amendment / PO / usage finalization.

**J. Activity / Audit Trail**
Timeline: generated, reviewed, held, sent, disputed, credited, regenerated, linked to payment.

### Context & insights (main content)

Render contextually inside the stage content — typically near the Review Checklist or in a callout above Invoice Composition.

- **Next best actions** — e.g. "Release hold on INV-2026-0044", "Send overdue reminder" (with days past due), "Review and approve INV-2026-0041", "Process credit note CN-2026-0001". Derivation: `getInvoicingActions(invoice)`.
- **AI insights** — e.g. "Invoice payment terms differ from contract (Net 45 vs Net 30)", "Invoice on hold: PO number required", "2 validation checks failed — resolve before sending", "1 credit note pending", "PO number available — ready for delivery". Derivation: `getInvoicingInsights(invoice, contract)`.

### SLG edge cases to represent

- Annual upfront + monthly overage
- Prepaid credits with usage statement
- Minimum commit true-up
- Invoice hold due to missing PO
- Disputed usage mapping
- Backdated amendment affecting current invoice

---

## Collections tab (Payment stage)

**Purpose:** Collections + Cash Application + AR Handoff workspace answering: What is outstanding? Which invoices are overdue, promised, or disputed? What is the next collection action? Has cash been matched?

**Selected object:** receivable case, invoice balance, or payment record.

**Record context bar fields:** AR case or invoice ref, outstanding amount, days overdue, promise-to-pay date, owner, collection stage.

**Actions:** Record payment · Match payment · Mark promised-to-pay · Assign to billing · Resend invoice · Apply credit note · Request write-off.

Component: `PaymentStageContent`.

### Summary cards

- Total open balance
- Overdue amount
- Promised-to-pay total
- Unapplied cash
- Average days to pay
- Oldest outstanding invoice age

### Sections

**C. AR Overview** (`ArOverviewSection`)
Total outstanding, due now, overdue aging buckets (30/60/90+), oldest invoice, payment behavior, risk level, collection owner, current stage.

**D. Open Receivables Ledger** (`OpenReceivablesSection`)
Table: invoice ID, date, due date, amount, balance outstanding, age bucket, dispute status, PTP date, AR owner, collection stage.

**E. Collections Workflow** (`CollectionsWorkflowSection`)
Owner, next step, follow-up cadence, promised-to-pay, escalation state, reminder history, customer response state, internal notes.
Statuses: Due soon · Overdue · Promised to pay · No response · Disputed · Billing action required · Escalated · Resolved · Written off.

**F. Customer Commitments & Communications**
Last email / call summary, commitment, reason for delay, promised action, renewal sensitivity.

**G. Billing Handoff / Dispute Resolution**
Dispute reason, billing owner, issue category, expected resolution, replacement invoice needed?, PO / tax / contract mismatch, linked support ticket.

**H. Cash Application & Reconciliation** (`CashApplicationSection`)
Received payments, method, bank ref, receipt date, matched invoices, partial allocation, unapplied balance, pending match suggestions, reversal history.

**I. Credits / Write-offs / Offsets**
Applied credit notes, short pays, settlement adjustments, write-off requests, approval state, balance impact.

**J. Collections Timeline**
Events: invoice due, reminder sent, customer replied, promised to pay, follow-up missed, billing ticket created, payment received, applied.

### Context & insights (main content)

Render contextually inside the stage content — near the Collections Workflow section.

- **Next best actions** — e.g. "Match unapplied $28,000" (with bank ref), "Resolve partial payment" (with invoice + amount), "Follow up on promised payment" (with PTP date), "Escalate INV-2026-0040" (if no response). Derivation: `getPaymentActions(customer.id)`.
- **AI insights** — e.g. "Customer typically pays 22 days after due date", "$28,000 unapplied cash — review bank references", "Partial payment on INV-2026-0034 — $4,600 received", "Active dispute: Usage overage disputed", "$5,800 overdue may impact renewal", "Customer committed to pay by 2026-04-10". Derivation: `getPaymentInsights(customer.id)`.

### SLG edge cases

- One payment covering multiple invoices
- Partial wire / short pay due to dispute
- Unapplied cash with weak reference data
- Invoice bounced between AR and Billing
- Write-off with manager approval

---

## RevRec / Close tab

**Purpose:** Revenue Recognition + Close Readiness + Audit Traceability workspace answering: How is revenue recognized? What is recognized vs deferred? What changed due to amendments or credits? Is this customer blocking close?

**IMPORTANT:** Revenue recognition follows contract / billing / usage / credits / amendments / policy. Payment affects AR / cash application. The UI shows RevRec after Payment in the journey, but the logic must **NOT** depend on cash receipt.

**Selected object:** revenue arrangement, recognition schedule, or contract-linked revenue package.

**Record context bar fields:** arrangement reference, linked contract, recognized YTD, deferred balance, current period, blocker count.

**Actions:** Review schedule · View journal impact · Resolve blocker · Rerun schedule · Create adjustment · Download audit trail.

Component: `RevRecStageContent`.

### Summary cards

- Revenue recognized this month
- Recognized to date
- Deferred revenue
- Remaining unrecognized
- Close blockers
- Last schedule refresh / export state

### Sections

**C. Revenue Arrangement Overview** (`ArrangementOverviewSection`)
Source contract, recognition status, accounting policy / template, active obligations, start / end recognition dates, last recalculation, close status.

**D. Performance Obligations / Revenue Buckets** (`ObligationsSection`)
Product / service line, obligation type (over-time, point-in-time, usage-based), allocation basis (SSP), allocated amount, recognized to date, deferred remaining, trigger / method summary.

**E. Recognition Schedule / Waterfall** (`RecognitionScheduleSection`)
Month-by-month: recognized, deferred movement, remaining. Schedule changes after amendment / credit / correction highlighted.

**F. Contract Modifications & Amendment Impact**
Amendments, effective date changes, co-term, upgrades, cancellations, reallocation effect, pending schedule update state.

**G. Invoice / Credit Note Impact**
Billed amount, credited amount, corrections, refund effect on schedule, whether accounting entries updated.

**H. Close Readiness / Controls** (`CloseReadinessSection`)
Unresolved blockers, unmapped lines, period lock state, pending manual adjustments, approval needed, export / posting state, exceptions.

**I. Journal / Export Traceability**
Journal status, ERP export status, posting references, last export, failed export reason, re-export history.

**J. Audit Trail**
Events: schedule created, rerun, modification applied, credit impact posted, manual adjustment approved, blocker resolved, journal exported.

### Context & insights (main content)

Render contextually inside the stage content — near the Close Readiness or Modifications sections.

- **Next best actions** — e.g. "Rerun schedule for AMD-003", "Approve adjustment ADJ-2026-002", "Resolve close blockers" (with count), "Re-export failed journal entries" (with period + reason). Derivation: `getRevRecActions(arrangement)`.
- **AI insights** — e.g. "1 critical blocker preventing period close", "Amendment AMD-003 has not updated the recognition schedule", "1 manual adjustment awaiting approval", "Journal export blocked for 2026-Q1", "1 obligation using usage-based recognition". Derivation: `getRevRecInsights(arrangement)`.

### SLG edge cases

- Amendment changing term and price mid-period
- Co-term expansion
- Prepaid AI credits with policy-driven ratable recognition
- Minimum commit with later true-up
- Credit note affecting recognized value
- Backdated contract ingestion
- Manual adjustment with approval
- Schedule rerun during close period
- ERP export failure
