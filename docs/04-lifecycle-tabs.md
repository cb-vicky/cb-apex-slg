# Lifecycle Tabs — Per-Tab Specifications

Detail specs for each tab inside the `CustomerRevenueWorkspace`. Read alongside `docs/03-customer-workspace.md` (shell anatomy) and `docs/07-dynamic-status.md` (status/insight derivation).

Tab order: **Customer → Quote → Contract → Invoicing → Payment → RevRec**.

---

## Customer tab (Account 360)

**Purpose:** Account-level intelligence view. Billing/finance/RevOps-oriented customer snapshot. NOT a generic CRM profile.

**Record context bar:** Hidden, or simplified customer-level bar (e.g., "Edit customer", "View in CRM", "Open support").

Component: `CustomerStageContent`.

### Sections

**A. Customer Overview** (`CustomerOverviewSection`)
- Company name, domain, industry, segment, region
- ARR, TCV, total spend
- Prepaid credit balance and burn-down percentage
- Open AR, renewal timing
- Account health / risk flags (reuse existing `riskBadges`)

**B. Commercial & Billing Setup** (`BillingSetupSection`)
- Billing legal entity, sold-to, bill-to
- Payment terms, tax region, PO requirements
- Currency, payment method summary
- Active contracts count, open quotes count

**C. CRM / Integration Snapshot** (`CrmSnapshotSection`)
- Salesforce / HubSpot account sync info
- Account owner (AE), CSM, billing owner
- Opportunity links
- CRM sync health (last sync, status)
- Provisioning / entitlement sync state

**D. Support & Communications** (`SupportCommsSection`)
- Open support tickets (count + top 3 summaries)
- Escalated tickets
- Billing-related issue themes
- Last support interaction
- Email communication summaries (recent 3)
- Customer sentiment / renewal risk signals

**E. Lifecycle Summary** (`LifecycleSummarySection`)
- Active quotes (list with status)
- Active contracts (list with enforcement status)
- Pending invoice reviews
- Overdue invoices
- Recent amendments
- Renewal task status
- Promise-to-pay commitments

**F. Timeline / Recent Activity** (`CustomerTimelineSection`)
- Unified timeline across all modules for this customer
- Combines quote timeline + contract timeline + invoice events + support events
- Sorted reverse chronological
- Last 15–20 events

### Right rail

- Account health summary (dynamic — see `docs/07-dynamic-status.md`)
- AI insights specific to customer posture (burn-down, renewal risk, billing gaps)
- Key contacts
- Open tasks for this customer

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

### Right rail

- Next best action
- AI insights — e.g. "Discount exceeds policy by 8%", "Payment terms differ from prior contract", "Current burn-down suggests customer may need higher prepaid commitment", "Billing entity missing", "Contract term differs from CRM opportunity"
- Linked records
- Open tasks
- Customer health context

---

## Contract tab

**Purpose:** Post-signature operational truth workspace. User should understand: what terms are actually in force, whether the contract was enforced correctly, what downstream billing it will generate, how it differs from the quote, what amendments / renewals matter next.

**Record context bar fields:** Contract ID, version / amendment number, status, signed / effective date, term, minimum commit, co-term / renewal, enforcement status.

**Actions:** Review enforcement · Create amendment quote · View invoice schedule · Open signed document.

Component: `ContractStageContent`.

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

### Right rail

- Operational blockers
- AI checks — e.g. "Signed contract differs from approved quote on payment terms", "Invoice should have been generated already", "Product mapping incomplete for one SKU", "Minimum commit will exhaust in 41 days at current burn", "Renewal task should be created in 16 days"
- Linked quote and invoices
- Renewal task
- Open issues for billing / AR / support

---

## Invoicing tab

**Purpose:** Billing execution workspace answering: What should be invoiced? What is pending? What is blocked? Does the invoice match the contract?

**Selected object:** an invoice or invoice schedule item.

**Record context bar fields:** Invoice ID, status, amount, billing period, due date, linked contract, invoice type, PO state if relevant.

**Actions:** Review invoice · Approve & Send · Put on hold / Release hold · Regenerate · Create credit note · Preview PDF.

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

### Right rail

- Next best actions — e.g. "Send held invoice after PO", "Create credit note"
- AI insights — e.g. "invoice differs from contract payment terms", "usage charges spiked", "duplicate billing risk on amendment overlap"
- Linked records (contract, quote, credit notes)

### SLG edge cases to represent

- Annual upfront + monthly overage
- Prepaid credits with usage statement
- Minimum commit true-up
- Invoice hold due to missing PO
- Disputed usage mapping
- Backdated amendment affecting current invoice

---

## Payment / Collections tab

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

### Right rail

- Next best actions — e.g. "Match unapplied wire", "Escalate overdue"
- AI insights — e.g. "customer usually pays 18 days late", "bank ref matches this invoice", "delay reason recurring: missing PO", "overdue balance may impact renewal"
- Linked records (invoices, disputes, support tickets)

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

### Right rail

- Next best actions — e.g. "Resolve unmapped line", "Rerun schedule"
- AI insights — e.g. "amendment not yet reflected in schedule", "credit note will reduce current-period revenue", "this customer is blocking close"
- Linked records (contract, invoices, credit notes, journal entries)

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
