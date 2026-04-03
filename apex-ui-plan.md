You are working inside an existing Chargebee APEX prototype built with Vite + React + TypeScript + Tailwind + shadcn/ui.

Important constraint:
The outer shell already exists and should remain intact:
- top nav bar
- site switcher / entity context
- left module sidebar
- the large rounded white content canvas in the middle

Do NOT redesign or replace the outer shell.
Do NOT create another full-page wrapper card inside the content area.
Work only inside the existing main content canvas and make the new layout feel naturally fitted into it.

Goal:
Build a customer-centric revenue workspace for SLG companies where Quote detail and Contract detail are not isolated pages. They are different stages inside the same customer revenue lifecycle workspace.

Core UX idea:
- The CUSTOMER is the page shell
- Quote / Contract / Invoicing / Payment / RevRec are lifecycle stages inside that shell
- Opening a quote or a contract should ultimately land the user inside the same shared customer workspace
- The active stage and selected record should change depending on where the user came from
- Avoid a generic “Customer details” page in the middle. The customer context should be persistent across all stages.

What to build:
Create a reusable shared page component named something like:
CustomerRevenueWorkspace

This shared page should be used by:
- /quotes/:quoteId
- /contracts/:contractId

The route can remain quote-first or contract-first, but under the hood both should resolve to the same customer-centric workspace.

Behavior:
- Opening /quotes/:quoteId should render the customer workspace with the Quote stage active and that quote selected
- Opening /contracts/:contractId should render the customer workspace with the Contract stage active and that contract selected
- The customer header remains stable
- The center body changes based on active stage
- The selected record is always visible through a context bar

Design intent:
This should feel enterprise-grade, operational, calm, and dense-but-readable.
Not marketing-like.
Not a generic CRM account page.
Not a dashboard with random charts.
It should feel like a serious quote-to-cash operating workspace for Billing, Finance Ops, RevOps, and CFO users.

Use realistic mock content for an AI-first SLG company:
- prepaid commitments
- minimum commit
- usage burn-down
- overage pricing
- co-termination
- amendments
- approval routing
- invoice review states
- downstream rev rec impact

--------------------------------------------------
1. PAGE INFORMATION ARCHITECTURE
--------------------------------------------------

The page should have 4 permanent layers:

A. Customer Header
This is the stable frame across all stages.

Show:
- customer name
- commercial account name
- billing legal entity
- Chargebee entity / merchant entity
- segment / tier
- AE / CSM / billing owner
- ARR
- TCV
- prepaid credit balance / burn-down
- open AR
- next renewal date
- risk badges

Design guidance:
- Title on the left
- Compact metric ribbon or stat chips on the right
- Keep it compact, not hero-heavy
- This should sit directly in the existing white content canvas with clean internal padding
- Use realistic badges like “High burn”, “1 overdue invoice”, “Renewal in 74 days”, “Legal entity mismatch”

B. Revenue Journey Rail
A horizontal lifecycle rail directly below the customer header.

Stages:
- Quote
- Contract
- Invoicing
- Payment
- RevRec

Each stage should show small state information:
Examples:
- Quote: Accepted
- Contract: 1 active + 2 amendments
- Invoicing: 2 pending review
- Payment: 1 overdue
- RevRec: Healthy

Design guidance:
- This is not a plain tab bar
- It should feel like a journey rail with status
- Active stage must be visually distinct
- Use subtle underline, filled pill, or segmented navigation styling
- Make it horizontally scrollable if needed on smaller widths

C. Record Context Bar
This is mandatory.
Because once the page is customer-centric, users must always know which record is being viewed.

For Quote stage, show:
- Quote ID
- version
- status
- source system (Salesforce / HubSpot / In-app)
- quote amount / TCV
- discount %
- expiry date
- approval status

For Contract stage, show:
- Contract ID
- version / amendment number
- status
- signed / effective date
- term
- minimum commit
- co-term / renewal
- enforcement status

Include actions on the right:
For quote:
- Edit quote
- Submit for approval
- Send quote
- Compare with current contract

For contract:
- Review enforcement
- Create amendment quote
- View invoice schedule
- Open signed document

D. Main Workspace + Right Insight Rail
Below the record context bar, create a 2-column layout:
- Main content column
- Right insight rail

Desktop layout:
- main content: flexible / wide
- right rail: ~320px width
- use a clean gap between columns
- right rail should be sticky within the page if practical

Tablet/smaller desktop:
- collapse right rail below main content

--------------------------------------------------
2. LAYOUT SPEC INSIDE THE EXISTING FRAME
--------------------------------------------------

Use the existing rounded white canvas as the main page surface.

Recommended internal page spacing:
- horizontal padding: 24px to 32px
- top padding: 24px
- vertical gap between major sections: 16px to 20px

Use section cards inside the page, but do not nest giant cards inside giant cards.
The content should feel like structured sections on a page, not cards floating inside another card soup.

Recommended structure:
- customer header
- journey rail
- record context bar
- body grid
  - main column with stacked content sections
  - right insight rail

Suggested Tailwind structure:
- page root: h-full w-full overflow-auto
- inner wrapper: flex flex-col gap-4 px-6 py-6
- body grid on xl: grid grid-cols-[minmax(0,1fr)_320px] gap-6
- on smaller widths: single column layout

Use shadcn cards sparingly and consistently.
Prefer:
- subtle border
- white or slightly tinted surface
- modest rounding
- compact spacing
- clear section titles

--------------------------------------------------
3. STAGE-SPECIFIC CONTENT
--------------------------------------------------

Build two stage variants first:
- Quote stage
- Contract stage

Keep the overall shell identical.
Only swap the center content sections and some right-rail content.

==================================================
QUOTE STAGE
==================================================

This page is a pre-signature commercial workspace.

The user should understand:
- what is being proposed
- whether it is within policy
- whether it is approved
- whether it is customer-ready
- what contract it will likely become

Main column sections for Quote stage:

1. Quote Overview
Show summary cards:
- Quote status
- Quote amount / TCV
- ARR
- Discount %
- Expiry date
- Approval status

2. Products and Pricing
A structured table or dense list showing:
- products / SKUs / plans
- quantity / seats
- unit price
- recurring vs one-time
- minimum commit
- prepaid credit block sold
- overage rate
- discount
- net amount
- ramp schedule if any

3. Commercial Terms
Show:
- contract term
- billing frequency
- payment terms
- start / end date
- auto-renew setting
- trial / implementation period
- co-term target
- AI usage drawdown rules
- prepaid credit logic

4. Approvals and Policy Checks
This section should be visually prominent near the top.
Show:
- approval state
- triggered rule
- discount threshold breach
- TCV threshold breach
- non-standard terms
- current approver
- comments
- SLA / pending since

5. CRM and Collaboration
Show:
- source CRM
- opportunity link
- sync status
- last synced amount
- internal comments
- send history
- customer viewed / accepted state

6. Related Records
Show linked or potential downstream records:
- current active contract
- related amendment quotes
- expected contract to be created
- invoice plan preview
- key changes versus existing contract

7. Activity / Audit Timeline
Show:
- created
- edited
- approval submitted
- approved / rejected
- sent
- viewed
- accepted
- matched to contract

Right rail for Quote stage:
- Next best action
- AI insights
- Linked records
- Open tasks
- Customer health context

Examples of AI insights:
- Discount exceeds policy by 8%
- Payment terms differ from prior contract
- Current burn-down suggests the customer may need higher prepaid commitment
- Billing entity missing
- Contract term differs from CRM opportunity

==================================================
CONTRACT STAGE
==================================================

This page is a post-signature operational truth workspace.

The user should understand:
- what terms are actually in force
- whether the contract was enforced correctly
- what downstream billing it will generate
- how it differs from the quote
- what amendments / renewals matter next

Main column sections for Contract stage:

1. Contract Overview
Show summary cards:
- Contract status
- Effective date
- Signed date
- Term
- TCV
- Minimum annual commit
- Prepaid credit balance
- Renewal date

2. Signed Commercial Terms
Show:
- products and plans in force
- quantities / seats
- discounts actually enforced
- minimum commitments
- prepaid credits
- usage drawdown rules
- overage rates
- ramp schedule
- billing cadence
- payment terms

3. Enforcement and Activation
This is the most important section after overview.
Show:
- source of contract (linked quote / CLM / manual upload)
- sale order status
- enforcement status
- product mapping issues
- missing fields
- provisioning signal status
- entitlement activation status
- manual overrides
- blocking issues

4. Billing and Invoice Schedule
Show:
- immediate invoice vs scheduled invoice
- invoice dates
- pending invoice review state
- invoice hold reason
- PO / tax / billing contact readiness
- generated invoice references

5. Amendments and Lifecycle
This must be first-class, not hidden.
Show:
- base contract
- amendment lineage
- seat expansions
- tier upgrades
- co-termination behavior
- next renewal task
- upcoming lifecycle milestones

6. Downstream Finance Impact
Show:
- invoices generated
- credit notes
- open AR
- payments received
- unapplied cash
- rev rec summary
- deferred revenue

7. Documents and Audit
Show:
- signed contract document
- ingestion timestamp
- extraction confidence
- quote match confidence
- important clause flags
- audit trail

8. Quote vs Contract Differences
Create a compact comparison callout or section showing:
- payment terms changed
- discount changed
- effective date changed
- minimum commit changed
- billing schedule changed

Right rail for Contract stage:
- Operational blockers
- AI checks
- Linked quote and invoices
- Renewal task
- Open issues for billing / AR / support

Examples of AI insights:
- Signed contract differs from approved quote on payment terms
- Invoice should have been generated already
- Product mapping incomplete for one SKU
- Minimum commit will exhaust in 41 days at current burn
- Renewal task should be created in 16 days

--------------------------------------------------
4. COMPONENTS TO CREATE
--------------------------------------------------

Create reusable components under something like:
src/components/revenue-workspace/

Suggested components:
- CustomerWorkspaceHeader
- RevenueJourneyRail
- RecordContextBar
- SummaryStatStrip
- SectionCard
- QuoteOverviewSection
- QuotePricingSection
- QuoteApprovalsSection
- ContractOverviewSection
- ContractTermsSection
- ContractEnforcementSection
- BillingScheduleSection
- LifecycleSection
- DownstreamImpactSection
- ActivityTimeline
- InsightRail
- InsightCard
- LinkedRecordsCard
- NextBestActionCard

Create shared visual primitives for:
- status badge
- risk badge
- stage badge
- tiny metric pill
- key-value rows
- compact entity chips
- timeline row

--------------------------------------------------
5. MOCK DATA
--------------------------------------------------

Create or update mock data files with realistic structures:
- customers.json
- quotes.json
- contracts.json
- invoices.json
- tasks.json
- usages.json

Include at least one polished example customer with linked records:
Customer:
- Lovable Inc (or Echo Corp if better aligned with the shell)
- commercial account
- billing entity
- merchant entity
- ARR / TCV / open AR / credits / renewal

Quote example:
- quoteId
- customerId
- version
- source
- status
- amount
- arr
- discountPct
- approvalStatus
- approvalTriggers
- products
- commercialTerms
- relatedContractId
- timeline events

Contract example:
- contractId
- customerId
- sourceQuoteId
- status
- signedDate
- effectiveDate
- term
- minCommit
- prepaidCredits
- overageRate
- billingSchedule
- enforcement
- provisioning
- amendments
- invoices
- revRecSummary
- comparisonToQuote

Make sure the data is rich enough to render the sections properly.
Avoid empty placeholders.
Use realistic enterprise values and edge cases.

--------------------------------------------------
6. ROUTING / STATE
--------------------------------------------------

Implement shared data resolution logic so both quote and contract routes feed the same workspace:
- from quoteId -> quote -> customer -> related contract
- from contractId -> contract -> customer -> related quote

The workspace should accept:
- activeStage
- selectedRecord
- customer
- related records

Allow clicking stage pills in the journey rail to switch visible content between Quote and Contract in the prototype.
Even if Invoicing / Payment / RevRec are not fully built, show them as present with lightweight placeholders or summary cards so the flow feels coherent.

--------------------------------------------------
7. VISUAL STYLE
--------------------------------------------------

Tone:
- enterprise product
- strong information hierarchy
- subtle and premium
- operational, not flashy
- clean but not empty

Use:
- neutral backgrounds
- subtle borders
- small orange accents for active states if aligned with Chargebee
- readable typography hierarchy
- status badges with restrained colors
- compact spacing in tables
- icons only when useful

Avoid:
- giant empty hero areas
- oversized marketing cards
- too many nested tabs
- random charts without purpose
- generic dashboard feel

--------------------------------------------------
8. WHAT “GOOD” LOOKS LIKE
--------------------------------------------------

The final result should feel like:
- a serious customer revenue operations workspace
- a place where a billing manager or finance ops person can understand the commercial lifecycle of one customer
- clearly customer-centric
- still record-aware
- designed for quote-to-cash complexity
- useful for design review in Figma and strong enough for prototype demos

--------------------------------------------------
9. FILES / OUTPUT EXPECTATION
--------------------------------------------------

Please do the following in order:

1. Inspect the current codebase and identify:
- current shell layout
- current route structure
- existing card/table/badge components
- current mock data pattern

2. Propose a small implementation plan before coding:
- files to add
- files to modify
- shared component strategy

3. Implement the shared workspace and wire up:
- quote detail route
- contract detail route
- mock data
- stage switching
- right insight rail

4. Keep the code modular and reusable

5. At the end, summarize:
- what files were added/changed
- what assumptions were made
- what is incomplete or stubbed

--------------------------------------------------
10. ACCEPTANCE CRITERIA
--------------------------------------------------

A. The page fits naturally inside the existing outer shell and white content canvas
B. No giant blank area remains; the page feels intentionally laid out
C. Quote and Contract details share one customer-centric shell
D. The active record is always visible through a context bar
E. The main content is different for Quote vs Contract
F. The right rail provides useful AI / operational context
G. The page uses realistic enterprise billing / SLG language
H. The result feels closer to a Figma-quality prototype than a raw admin screen

Start by inspecting the existing app structure, then propose the implementation plan, then code.

--------------------------------------------------
11. SHELL REDESIGN (from Chargebee screenshot)
--------------------------------------------------

Redesign the top nav, left nav, and background layout to match the actual Chargebee product UI:

A. Top Header Bar (dark)
- Dark background (#1a1d21 or similar charcoal)
- Left side: Chargebee logo icon (orange on dark), then site/entity selector "Echo-corp echocorp.test.charge..." with green dot, then entity/timezone selector "Germany Europe/Berlin (CET)"
- Right side: notification bell, "Configure Chargebee" button, developer console icon, lightbulb/tips, star/favorites, help/question mark, user avatar (orange circle)
- The header spans full width

B. Search Row
- Directly below the dark header
- White/light background row
- Contains a search input: "Search anything... ⌘K"
- This row sits above the sidebar + content area

C. Left Sidebar
- White background, no border-right (or very subtle)
- Top item: "My Workbench" with chevron (orange active color)
- Then plain text nav items (no icons): Customers, Quotes, Contracts, Invoices, Credit notes, Inbox, Product Catalog, Entitlements, Approvals, Usages, RevenueStory
- Active item uses the orange color
- Compact text-only style, ~130px wide

D. Content Area Background
- Light gray background behind the content frame
- Content frame: large rounded white card with subtle shadow
- Generous padding around the white frame

--------------------------------------------------
12. WORKBENCH HOME / GETTING STARTED PAGE
--------------------------------------------------

OBJECTIVE:
Build a role-aware "Getting Started / Workbench Home" page inside the existing shell content area.

Supports 2 personas (with in-page role switcher):
1. Billing Manager (Admin)
2. Billing Operator

Page title: "Welcome back, John."

LAYOUT:
1. HERO ROW (title + badges + CTAs)
2. PROGRESS / SUMMARY STRIP (4 compact cards)
3. ENVIRONMENT BANNER (amber info bar)
4. MAIN MILESTONE CONTENT (role-specific)
5. FOOTER CALLOUT

ADMIN LAYOUT: full-width 2-column milestone grid (8 milestones)
OPERATOR LAYOUT: left 8-col checklist (6 milestones) + right 4-col sticky side panel

ADMIN MILESTONES:
1. Set up Site and Entity (Complete)
2. Invite your revenue team (In progress)
3. Create products, plans, and pricing (In progress)
4. Configure AI commitments and access (Not started)
5. Connect CRM and approval routing (Not started)
6. Enable contract ingestion and enforcement (Not started)
7. Validate invoice review and collections flow (Blocked)
8. Run your first end-to-end dry run (Blocked)

OPERATOR MILESTONES:
1. Confirm your Site and Entity (Complete)
2. Understand your task queues (In progress)
3. Review and send a pending invoice (Not started)
4. Record a payment (Blocked)
5. Resolve a billing issue from Collections (Blocked)
6. Check commitment burn-down before dispute (Not started)

COMPONENTS:
- src/pages/workbench/WorkbenchHome.tsx
- src/components/getting-started/GettingStartedHeader.tsx
- src/components/getting-started/SummaryStrip.tsx
- src/components/getting-started/EnvironmentBanner.tsx
- src/components/getting-started/MilestoneCard.tsx
- src/components/getting-started/MilestoneGrid.tsx
- src/components/getting-started/OperatorRail.tsx
- src/components/getting-started/FooterCallout.tsx
- src/data/gettingStarted.ts

VISUAL: Enterprise, restrained, clean. Cards with 16px radius, 20-24px padding. Orange accents for primary actions. Status pills: green=Complete, amber=In progress, gray=Not started, red=Blocked.

ACCEPTANCE:
- Fits naturally inside existing white content frame
- Uses available width well
- Clear admin vs operator differentiation
- Clean spacing and readable hierarchy
- Matches Chargebee APEX tone

--------------------------------------------------
13. RESOURCE INDEX PAGES FOR SLG WORKFLOW
--------------------------------------------------

Every resource module in the sidebar needs a proper index/landing page.
The default landing experience is a grouped priority page, not a flat table.

Modules requiring index pages:
- Customers (/customers)
- Quotes (/quotes)
- Contracts (/contracts)
- Invoices (/invoices)

Shared landing page anatomy (all four modules):
A. Top metric strip — 4–5 compact summary cards in a row
B. Grouped priority sections — each group is a named operational bucket
C. Each group shows top 5 line items sorted by urgency/priority
D. Each group has a "View all" link
E. Clicking "View all" opens a filtered list view for that module with the group filter applied
F. Clicking any line item navigates to the shared customer details shell with the correct tab and record active

Transition from grouped to filtered list:
- "View all" appends a query param: /quotes?group=pending-approval
- The same page component checks for a group param and renders either:
  - grouped landing (no group param)
  - filtered list with columns (group param present)
- Clear breadcrumb or back link to return to grouped view

=== CUSTOMERS INDEX ===

Top metric strip:
1. Total active customers | count
2. Renewals in 30 days | count
3. Open AR total | currency
4. Quotes pending approval | count
5. At-risk customers | count

Groups (in priority order):
1. "Renewals coming up in 30 days" — customers whose contract renewal date is within 30 days
2. "Quotes pending approval" — customers with at least one quote in pending approval status
3. "Prepaid credit burn-down risk" — customers where credit balance / total < 30%
4. "Overdue invoices" — customers with at least one overdue invoice
5. "Contract enforcement mismatches" — customers with enforcement issues in any contract
6. "Support escalations impacting billing" — customers with open high-priority support tickets
7. "Expansion / amendment opportunity" — customers with active amendment quotes or seat growth signals

Important: the click target for a Customers group row is CONTEXTUAL.
Each group maps to a specific tab in the shared customer shell:
- Renewals -> Contract tab, relevant contract selected
- Quotes pending approval -> Quote tab, relevant quote selected
- Burn-down risk -> Customer tab (Account 360), credit section emphasized
- Overdue invoices -> Invoicing tab, relevant invoice selected
- Enforcement mismatches -> Contract tab, enforcement section visible
- Support escalations -> Customer tab, support section visible
- Expansion opportunity -> Quote tab, relevant amendment quote selected

Grouped row columns:
Customer | Priority reason | Related record | Value / exposure | Owner | Due date | Status

=== QUOTES INDEX ===

Top metric strip:
1. Active quotes | count
2. Pending approval | count
3. Expiring in 14 days | count
4. Total pipeline TCV | currency
5. Avg discount % | percentage

Groups:
1. "Pending approval" — quotes with approval.status === "pending"
2. "Expiring soon" — quotes expiring within 14 days
3. "Accepted, contract not ingested" — quotes accepted but no linked active contract
4. "Amendment quotes in progress" — quotes linked to existing contracts as amendments
5. "CRM sync mismatch" — quotes where amount differs from CRM synced amount
6. "Non-standard terms" — quotes with triggered policy rules

Click behavior: row click -> /customers/:customerId?tab=quote&quoteId=:quoteId

Row columns:
Quote ID | Customer | Type | TCV | Discount | Approval status | Expiry | Owner

=== CONTRACTS INDEX ===

Top metric strip:
1. Active contracts | count
2. Pending enforcement | count
3. Renewals in 60 days | count
4. Total active TCV | currency
5. Amendments in progress | count

Groups:
1. "Pending enforcement" — contracts with enforcementStatus !== "Enforced"
2. "Invoice review pending" — active contracts with Pending Review invoices in billing schedule
3. "Approaching renewal" — contracts with renewalDate within 60 days
4. "Entitlement / provisioning issues" — contracts with non-empty blockingIssues or productMappingIssues
5. "Quote-to-contract mismatch" — contracts with comparisonToQuote differences
6. "Min-commit exhaustion risk" — contracts where prepaidCreditBalance / prepaidCreditTotal < 30%
7. "Amendments in progress" — contracts with amendments in non-Applied status

Click behavior: row click -> /customers/:customerId?tab=contract&contractId=:contractId

Row columns:
Contract ID | Customer | Type | TCV | Renewal date | Enforcement | Billing readiness | Owner

=== INVOICES INDEX ===

Top metric strip:
1. Total invoices | count
2. Pending review | count
3. Overdue | count
4. Open AR | currency
5. Blocked invoices | count

Groups:
1. "Pending invoice review" — invoices with status "Pending Review"
2. "Overdue invoices" — invoices with status "Overdue"
3. "Promise-to-pay upcoming" — invoices with a promise-to-pay date in the next 14 days
4. "Invoice disputes" — invoices flagged with dispute reason
5. "Failed generation" — invoices with generation errors
6. "Blocked by missing PO / tax / billing details" — invoices with holdReason set
7. "Unapplied cash / reconciliation needed" — invoices with partial or mismatched payments

Click behavior: row click -> /customers/:customerId?tab=invoicing&invoiceId=:invoiceId

Row columns:
Invoice ID | Customer | Contract | Amount | Due date | Status | Owner | Blocker

--------------------------------------------------
14. SHARED CUSTOMER SHELL NAVIGATION AND ROUTE REWIRING
--------------------------------------------------

Current state:
- /quotes/:quoteId renders QuoteDetailPage -> CustomerRevenueWorkspace(initialStage="quote")
- /contracts/:contractId renders ContractDetailPage -> CustomerRevenueWorkspace(initialStage="contract")
- No customer-centric canonical route exists
- Stage type is "quote" | "contract" | "invoicing" | "payment" | "revrec"

Target canonical route model:

Index routes (grouped landing + filtered list):
- /customers
- /customers?group=renewals-30d
- /quotes
- /quotes?group=pending-approval
- /contracts
- /contracts?group=pending-enforcement
- /invoices
- /invoices?group=pending-review

Canonical detail shell:
- /customers/:customerId — default to Customer (Account 360) tab
- /customers/:customerId?tab=customer — Account 360 tab
- /customers/:customerId?tab=quote&quoteId=QT-2026-0042 — Quote tab with record selected
- /customers/:customerId?tab=contract&contractId=CON-2024-0189 — Contract tab with record selected
- /customers/:customerId?tab=invoicing&invoiceId=INV-2026-0034 — Invoicing tab with record selected
- /customers/:customerId?tab=payment — Payment tab
- /customers/:customerId?tab=revrec — RevRec tab

Resource alias routes (backward compatibility, rendered through same shell):
- /quotes/:quoteId — resolves quoteId -> customerId, renders shell with tab=quote&quoteId
- /contracts/:contractId — resolves contractId -> customerId, renders shell with tab=contract&contractId
- /invoices/:invoiceId — resolves invoiceId -> customerId, renders shell with tab=invoicing&invoiceId

These alias routes should render the same CustomerRevenueWorkspace component, not redirect.
They resolve the customer from the resource record and pass the correct initial tab and selected record.

Stage type update:
Add "customer" to the Stage union type:
  type Stage = "customer" | "quote" | "contract" | "invoicing" | "payment" | "revrec"

Tab resolution logic:
1. Read ?tab param from URL search params (default: "customer" for /customers/:customerId)
2. Read record ID param (?quoteId, ?contractId, ?invoiceId)
3. Pass initialStage and selectedRecordId to CustomerRevenueWorkspace
4. Journey rail clicking updates the tab param in URL (or local state for prototype)

Deep-linking contract:
- From Customers index group "Renewals in 30 days" row click:
  navigate("/customers/cust_echo_001?tab=contract&contractId=CON-2024-0189")
- From Customers index group "Quotes pending approval" row click:
  navigate("/customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042")
- From Quotes index any row click:
  navigate("/customers/cust_echo_001?tab=quote&quoteId=QT-2026-0042")
- From Invoices index any row click:
  navigate("/customers/cust_echo_001?tab=invoicing&invoiceId=INV-2026-0034")

--------------------------------------------------
15. CUSTOMER / ACCOUNT 360 TAB INSIDE DETAILS SHELL
--------------------------------------------------

Add a new tab called "Customer" as the FIRST tab in the Revenue Journey Rail.

Updated tab order:
Customer | Quote | Contract | Invoicing | Payment | Rev Rec

The Customer tab is the account-level intelligence view.
It is not a generic CRM profile. It is a billing/finance/RevOps-oriented customer snapshot.

When the Customer tab is active:
- The Record Context Bar is hidden (or shows a simplified customer-level bar)
- The main content area shows the sections below
- The right insight rail shows customer-level AI insights

=== CUSTOMER TAB SECTIONS ===

A. Customer Overview
- Company name, domain, industry, segment, region
- ARR, TCV, total spend
- Prepaid credit balance and burn-down percentage
- Open AR
- Renewal timing
- Account health / risk flags (reuse existing riskBadges)

B. Commercial & Billing Setup
- Billing legal entity, sold-to, bill-to
- Payment terms, tax region, PO requirements
- Currency, payment method summary
- Active contracts count, open quotes count

C. CRM / Integration Snapshot
- Salesforce / HubSpot account sync info
- Account owner (AE), CSM, billing owner
- Opportunity links
- CRM sync health (last sync, status)
- Provisioning / entitlement sync state

D. Support & Communications
- Open support tickets (count + top 3 summaries)
- Escalated tickets
- Billing-related issue themes
- Last support interaction
- Email communication summaries (recent 3)
- Customer sentiment / renewal risk signals

E. Lifecycle Summary
- Active quotes (list with status)
- Active contracts (list with enforcement status)
- Pending invoice reviews
- Overdue invoices
- Recent amendments
- Renewal task status
- Promise-to-pay commitments

F. Timeline / Recent Activity
- Unified timeline across all modules for this customer
- Combine quote timeline + contract timeline + invoice events + support events
- Sorted reverse chronological
- Last 15-20 events

The Customer tab right rail should show:
- Account health summary
- AI insights specific to customer posture (burn-down, renewal risk, billing gaps)
- Key contacts
- Open tasks for this customer

Tab placement:
The "Customer" tab sits as the first pill in the RevenueJourneyRail.
When the user opens /customers/:customerId with no ?tab param, it defaults to this tab.
When the user opens via /quotes/:quoteId or /contracts/:contractId, it opens the Quote or Contract tab respectively, but the Customer tab is always available as the first pill.

--------------------------------------------------
16. MOCK DATA EXTENSIONS REQUIRED
--------------------------------------------------

Current mock data state:
- 1 customer (Echo Corp, cust_echo_001)
- 1 quote (QT-2026-0042, Pending Approval)
- 1 contract (CON-2024-0189, Active)
- 2 invoices (1 Overdue, 1 Paid)
- 4 tasks

This is sufficient for the details shell but NOT for grouped index pages.
Index pages need multiple records across multiple customers to populate groups.

=== MINIMAL DATA EXPANSION ===

Add 4-5 additional customers with varying states:

Customer 2: "Lumina AI" — active, renewal in 22 days, healthy
Customer 3: "Northlane Labs" — active, 1 overdue invoice, support escalation
Customer 4: "Pioneer Systems" — new, quote pending approval, no contract yet
Customer 5: "Verdant Health" — active, prepaid credit nearly exhausted (< 20% remaining)

For each new customer, add minimal linked records:

Quotes (add 4-5):
- QT-2026-0038: Lumina AI, Accepted, contract not yet created
- QT-2026-0041: Pioneer Systems, Pending Approval, new deal
- QT-2026-0043: Northlane Labs, amendment quote, In Progress
- QT-2026-0044: Verdant Health, Expiring Soon (expires in 5 days)
- QT-2026-0045: Echo Corp, amendment, CRM sync mismatch

Contracts (add 3-4):
- CON-2024-0201: Lumina AI, Active, renewal in 22 days
- CON-2025-0022: Northlane Labs, Active, enforcement issues (missing product mapping)
- CON-2025-0034: Verdant Health, Active, min-commit exhaustion risk

Invoices (add 5-6):
- INV-2026-0040: Northlane Labs, Overdue
- INV-2026-0041: Lumina AI, Pending Review
- INV-2026-0042: Verdant Health, Blocked (missing PO)
- INV-2026-0043: Pioneer Systems, Pending Review
- INV-2026-0044: Echo Corp, Pending Review (from existing billing schedule)

=== NEW FIELDS ON EXISTING TYPES ===

Customer type additions:
- domain: string (e.g., "echocorp.ai")
- industry: string (e.g., "AI Infrastructure")
- region: string (e.g., "North America")
- crmAccountId: string (Salesforce account ID)
- crmSyncStatus: string
- crmLastSyncedAt: string
- paymentMethod: string (e.g., "ACH", "Wire", "Card")
- currency: string
- taxRegion: string
- poRequired: boolean
- activeContractCount: number
- openQuoteCount: number

=== NEW DATA FILE ===

Add src/data/support-data.ts:

SupportTicket type:
- id: string
- customerId: string
- subject: string
- priority: "High" | "Medium" | "Low"
- status: "Open" | "Escalated" | "Resolved"
- category: string (e.g., "Billing dispute", "Invoice question", "Credit burn-down")
- assignee: string
- createdAt: string
- lastUpdatedAt: string

EmailSummary type:
- id: string
- customerId: string
- subject: string
- from: string
- date: string
- snippet: string (2-3 sentence summary)
- sentiment: "positive" | "neutral" | "negative"

Seed 3-4 support tickets and 3-4 email summaries for Echo Corp.
Seed 1-2 for Northlane Labs (the escalation customer).

=== RELATIONSHIP MAP ===

All records link to customerId.
From any record, the customer can be resolved.
From customer, all linked quotes/contracts/invoices can be found.
Index group rows must carry customerId + relevant recordId for deep-linking.

--------------------------------------------------
17. MODULE-BY-MODULE GROUP DEFINITIONS AND COLUMNS
--------------------------------------------------

=== CUSTOMERS ===

Grouped row fields:
| Customer | Priority reason | Related record | Value / exposure | Owner | Due date | Status |

List view columns (after "View all"):
| Customer | ARR | Open AR | Contracts | Quotes | Renewal | Risk | Owner |

=== QUOTES ===

Grouped row fields:
| Quote ID | Customer | TCV | Discount | Status | Expiry | Owner |

List view columns:
| Quote ID | Customer | Version | Source | TCV | ARR | Discount | Approval | Expiry | Owner |

=== CONTRACTS ===

Grouped row fields:
| Contract ID | Customer | TCV | Term | Status | Renewal | Owner |

List view columns:
| Contract ID | Customer | Source Quote | TCV | Min Commit | Effective | Renewal | Enforcement | Amendments | Owner |

=== INVOICES ===

Grouped row fields:
| Invoice ID | Customer | Amount | Due date | Status | Blocker |

List view columns:
| Invoice ID | Customer | Contract | Amount | Date | Due date | Status | Hold reason | Owner |

Sort logic for all grouped sections:
- Primary: urgency (overdue > pending > upcoming)
- Secondary: value (higher exposure first)
- Tertiary: date (nearest date first)

--------------------------------------------------
18. NAVIGATION FLOWS / CLICK BEHAVIOR
--------------------------------------------------

=== FLOW A: CUSTOMERS ===

1. User clicks "Customers" in sidebar
2. App renders /customers — grouped landing page
3. User sees metric strip + grouped sections
4. Group "Renewals in 30 days" shows top 5 customers
5. User clicks "View all" -> /customers?group=renewals-30d -> filtered list view
6. User clicks row for Lumina AI -> /customers/cust_lumina_002?tab=contract&contractId=CON-2024-0201
7. App renders CustomerRevenueWorkspace with Contract tab active, CON-2024-0201 selected

=== FLOW B: QUOTES ===

1. User clicks "Quotes" in sidebar
2. App renders /quotes — grouped landing
3. Group "Pending approval" shows top 5 quotes
4. User clicks row for QT-2026-0041 (Pioneer Systems)
5. App navigates to /customers/cust_pioneer_004?tab=quote&quoteId=QT-2026-0041
6. CustomerRevenueWorkspace opens with Quote tab, that quote selected

=== FLOW C: CONTRACTS ===

1. User clicks "Contracts" in sidebar
2. App renders /contracts — grouped landing
3. Group "Approaching renewal" shows top 5
4. User clicks row for CON-2024-0201 (Lumina AI)
5. Navigates to /customers/cust_lumina_002?tab=contract&contractId=CON-2024-0201

=== FLOW D: INVOICES ===

1. User clicks "Invoices" in sidebar
2. App renders /invoices — grouped landing
3. Group "Overdue invoices" shows top 5
4. User clicks row for INV-2026-0040 (Northlane Labs)
5. Navigates to /customers/cust_northlane_003?tab=invoicing&invoiceId=INV-2026-0040

=== FLOW E: SUPPORT ESCALATION (special) ===

1. User is on /customers grouped landing
2. Group "Support escalations impacting billing" shows Northlane Labs
3. User clicks Northlane Labs row
4. Navigates to /customers/cust_northlane_003?tab=customer
5. CustomerRevenueWorkspace opens with Customer (Account 360) tab
6. Support & Communications section is visible with escalation details

--------------------------------------------------
19. ACCEPTANCE CRITERIA
--------------------------------------------------

A. Existing Getting Started / Workbench Home page remains untouched and fully functional
B. Existing Quote Details and Contract Details experiences remain visually and functionally intact
C. Resource index pages are grouped-priority landing pages, not flat tables
D. Every group shows top 5 priority rows and a "View all" affordance
E. "View all" applies the corresponding group filter and opens a filtered list view
F. Filtered list pages use realistic columns grounded in mock data
G. All row clicks from any index page land in the same customer-centric CustomerRevenueWorkspace shell
H. The correct tab and selected record open based on the click context (tab + recordId in URL)
I. The CustomerRevenueWorkspace now includes a "Customer" / Account 360 tab as the first tab
J. The Customer tab shows CRM, integrations, support/communications, lifecycle summary, and unified timeline
K. The Stage type is extended to include "customer"
L. Sidebar navigation items point to index routes, not hardcoded record IDs
M. Alias routes (/quotes/:quoteId, /contracts/:contractId) continue to work by resolving to the canonical customer shell
N. The design remains SLG / enterprise / quote-to-cash focused throughout
O. Mock data is expanded minimally to support grouped index pages with multiple customers and records
P. All new pages fit naturally inside the existing AppShell white content frame

--------------------------------------------------
20. OPEN QUESTIONS / ASSUMPTIONS
--------------------------------------------------

1. Module label: The sidebar currently says "Invoices" and the journey rail tab says "Invoicing". The plan uses "Invoices" for the index page route (/invoices) and "Invoicing" for the tab label inside the details shell. This should be made consistent in implementation; recommend "Invoices" for sidebar and route, "Invoicing" for the lifecycle tab.

2. Customer tab position: This plan places "Customer" as the first tab before Quote. If this disrupts the existing journey-rail visual flow, it could alternatively be placed as a persistent header-level link above the rail rather than inside it. Decision point for implementation.

3. Alias route handling: The plan specifies that /quotes/:quoteId should render through the customer shell, not redirect. This avoids URL changes but means the quote detail pages (QuoteDetailPage.tsx, ContractDetailPage.tsx) must resolve customerId from the record and render CustomerRevenueWorkspace. Current implementation already does this; it just needs the canonical /customers/:customerId route added alongside.

4. Support / email summary depth: First pass should mock 3-4 support tickets and 3-4 email summaries for Echo Corp, 1-2 for Northlane Labs. Deeper mocking can follow.

5. "View all" filtered list view: The grouped page and filtered list page should be the same React component toggling between grouped and list mode based on a ?group query param. This avoids separate page components per module.

6. Multi-customer data volume: The plan adds 4-5 new customers with minimal linked records. This is enough to populate 5 rows per group in the prototype. Production-realistic volumes are not required.

7. Record context bar on Customer tab: When the Customer (Account 360) tab is active, the Record Context Bar should either be hidden or replaced with a simplified customer-level bar showing entity/site/owner info and customer-level actions (e.g., "Edit customer", "View in CRM", "Open support"). This is a design decision for implementation.

8. Journey rail status text: When the "Customer" tab is added, its status text should be something like the customer's overall health or risk level (e.g., "3 risk flags" or "Healthy"). This keeps the rail informative rather than decorative.

==================================================
REMAINING LIFECYCLE TABS IN SHARED CUSTOMER SHELL
==================================================

The following sections (21–29) define the Invoicing, Payment / Collections,
and RevRec tabs that complete the quote-to-cash lifecycle inside the
existing customer-centric details shell.

These tabs must:
- Reuse the same shell structure (header, journey rail, record context bar,
  main content + right insight rail).
- Feel like downstream execution workspaces, not generic record pages.
- Reflect SLG / enterprise billing specifics: prepaid credits, minimum
  commits, usage overages, amendments, co-term, PO requirements, legal
  entity controls, multi-party handoffs, and auditability.
- Not depend on cash receipt for revenue recognition logic.

--------------------------------------------------
21. INVOICING TAB IN SHARED CUSTOMER SHELL
--------------------------------------------------

Purpose:
Billing execution workspace answering: What should be invoiced? What is
pending? What is blocked? Does the invoice match the contract?

Selected object: an invoice or invoice schedule item.

A. Invoicing Record Context Bar
   Show: invoice ID, status, amount, billing period, due date, linked
   contract, invoice type. PO state if relevant.
   Actions: Review invoice · Approve & Send · Put on hold / Release hold ·
   Regenerate · Create credit note · Preview PDF.

B. Summary Cards (customer-level invoice posture)
   - Pending review count
   - Total invoiced (YTD)
   - Amount due
   - Next scheduled invoice date + amount
   - Held invoices
   - Disputed amount

C. Invoice Overview
   - Invoice ID, status, date, due date, billing period, currency, total,
     balance due, payment terms, bill-to contact, PO number state, tax
     summary.

D. Invoice Composition / Line Items (enriched)
   Each line must distinguish:
   - Committed platform fee
   - Prepaid credit purchase
   - Usage / overage charge
   - True-up vs scheduled recurring bill
   - Minimum commit line
   - Discount and tax per line

E. Billing Basis & Traceability
   - Source contract and line mapping
   - Amendment impact on this invoice
   - Usage period summary
   - Burn-down / drawdown evidence
   - Minimum commit application
   - Overage calculation basis
   - Co-term handling logic

F. Review Checklist / Validation
   Explicit binary checks:
   - Matches contract ✓/✗
   - Approval exists for non-standard pricing
   - Bill-to entity valid
   - PO available
   - Tax configured
   - Invoice contact valid
   - Usage finalized
   - No blocking dispute
   - No amendment conflict

G. Delivery & Customer Communication
   - Recipients, send history, delivery state, resend, customer-facing notes.

H. Corrections / Credits / Disputes
   - Credit notes, regenerated invoice history, dispute reason and owner,
     corrected invoice references.

I. Invoice Schedule
   - Upcoming invoices for this customer, estimated amounts, type, hold
     state, dependency on amendment / PO / usage finalization.

J. Activity / Audit Trail
   Timeline events: generated, reviewed, held, sent, disputed, credited,
   regenerated, linked to payment.

Right rail:
   - Next best actions (e.g. "Send held invoice after PO", "Create credit note")
   - AI insights (e.g. "invoice differs from contract payment terms",
     "usage charges spiked", "duplicate billing risk on amendment overlap")
   - Linked records (contract, quote, credit notes)

SLG edge cases to represent in mock data:
   - Annual upfront + monthly overage
   - Prepaid credits with usage statement
   - Minimum commit true-up
   - Invoice hold due to missing PO
   - Disputed usage mapping
   - Backdated amendment affecting current invoice

--------------------------------------------------
22. PAYMENT / COLLECTIONS TAB IN SHARED CUSTOMER SHELL
--------------------------------------------------

Purpose:
Collections + Cash Application + AR Handoff workspace answering: What is
outstanding? Which invoices are overdue, promised, or disputed? What is the
next collection action? Has cash been matched?

Selected object: receivable case, invoice balance, or payment record.

A. Payment / Collections Record Context Bar
   Show: AR case or invoice ref, outstanding amount, days overdue,
   promise-to-pay date, owner, collection stage.
   Actions: Record payment · Match payment · Mark promised-to-pay ·
   Assign to billing · Resend invoice · Apply credit note · Request write-off.

B. Summary Cards
   - Total open balance
   - Overdue amount
   - Promised-to-pay total
   - Unapplied cash
   - Average days to pay
   - Oldest outstanding invoice age

C. AR Overview
   - Total outstanding, due now, overdue aging buckets (30/60/90+), oldest
     invoice, payment behavior, risk level, collection owner, current stage.

D. Open Receivables Ledger
   Table: invoice ID, date, due date, amount, balance outstanding, age
   bucket, dispute status, PTP date, AR owner, collection stage.

E. Collections Workflow
   - Owner, next step, follow-up cadence, promised-to-pay, escalation state,
     reminder history, customer response state, internal notes.
   Statuses: Due soon · Overdue · Promised to pay · No response · Disputed ·
   Billing action required · Escalated · Resolved · Written off.

F. Customer Commitments & Communications
   - Last email / call summary, commitment, reason for delay, promised
     action, renewal sensitivity.

G. Billing Handoff / Dispute Resolution
   - Dispute reason, billing owner, issue category, expected resolution,
     replacement invoice needed?, PO / tax / contract mismatch, linked
     support ticket.

H. Cash Application & Reconciliation
   - Received payments, method, bank ref, receipt date, matched invoices,
     partial allocation, unapplied balance, pending match suggestions,
     reversal history.

I. Credits / Write-offs / Offsets
   - Applied credit notes, short pays, settlement adjustments, write-off
     requests, approval state, balance impact.

J. Collections Timeline
   Events: invoice due, reminder sent, customer replied, promised to pay,
   follow-up missed, billing ticket created, payment received, applied.

Right rail:
   - Next best actions (e.g. "Match unapplied wire", "Escalate overdue")
   - AI insights (e.g. "customer usually pays 18 days late",
     "bank ref matches this invoice", "delay reason recurring: missing PO",
     "overdue balance may impact renewal")
   - Linked records (invoices, disputes, support tickets)

SLG edge cases:
   - One payment covering multiple invoices
   - Partial wire / short pay due to dispute
   - Unapplied cash with weak reference data
   - Invoice bounced between AR and Billing
   - Write-off with manager approval

--------------------------------------------------
23. REVREC / CLOSE TAB IN SHARED CUSTOMER SHELL
--------------------------------------------------

Purpose:
Revenue Recognition + Close Readiness + Audit Traceability workspace
answering: How is revenue recognized? What is recognized vs deferred? What
changed due to amendments or credits? Is this customer blocking close?

IMPORTANT: Revenue recognition follows contract / billing / usage / credits /
amendments / policy. Payment affects AR / cash application. The UI shows
RevRec after Payment in the journey, but the logic must NOT depend on cash
receipt.

Selected object: revenue arrangement, recognition schedule, or contract-linked
revenue package.

A. RevRec Record Context Bar
   Show: arrangement reference, linked contract, recognized YTD, deferred
   balance, current period, blocker count.
   Actions: Review schedule · View journal impact · Resolve blocker ·
   Rerun schedule · Create adjustment · Download audit trail.

B. Summary Cards
   - Revenue recognized this month
   - Recognized to date
   - Deferred revenue
   - Remaining unrecognized
   - Close blockers
   - Last schedule refresh / export state

C. Revenue Arrangement Overview
   - Source contract, recognition status, accounting policy / template,
     active obligations, start / end recognition dates, last recalculation,
     close status.

D. Performance Obligations / Revenue Buckets
   - Product / service line, obligation type (over-time, point-in-time,
     usage-based), allocation basis (SSP), allocated amount, recognized to
     date, deferred remaining, trigger / method summary.

E. Recognition Schedule / Waterfall
   - Month-by-month schedule: recognized, deferred movement, remaining.
   - Schedule changes after amendment / credit / correction highlighted.

F. Contract Modifications & Amendment Impact
   - Amendments, effective date changes, co-term, upgrades, cancellations,
     reallocation effect, pending schedule update state.

G. Invoice / Credit Note Impact
   - Billed amount, credited amount, corrections, refund effect on schedule,
     whether accounting entries updated.

H. Close Readiness / Controls
   - Unresolved blockers, unmapped lines, period lock state, pending manual
     adjustments, approval needed, export / posting state, exceptions.

I. Journal / Export Traceability
   - Journal status, ERP export status, posting references, last export,
     failed export reason, re-export history.

J. Audit Trail
   Events: schedule created, rerun, modification applied, credit impact
   posted, manual adjustment approved, blocker resolved, journal exported.

Right rail:
   - Next best actions (e.g. "Resolve unmapped line", "Rerun schedule")
   - AI insights (e.g. "amendment not yet reflected in schedule",
     "credit note will reduce current-period revenue",
     "this customer is blocking close")
   - Linked records (contract, invoices, credit notes, journal entries)

SLG edge cases:
   - Amendment changing term and price mid-period
   - Co-term expansion
   - Prepaid AI credits with policy-driven ratable recognition
   - Minimum commit with later true-up
   - Credit note affecting recognized value
   - Backdated contract ingestion
   - Manual adjustment with approval
   - Schedule rerun during close period
   - ERP export failure

--------------------------------------------------
24. SHARED TAB NAVIGATION AND RECORD CONTEXT RULES
--------------------------------------------------

The three new tabs slot into the existing lifecycle rail:
Customer → Quote → Contract → Invoicing → Payment → Rev Rec

Shell structure per tab (unchanged from existing):
- Stable customer header
- Lifecycle journey rail
- Record context bar (tab-specific)
- Two-column body (main content + 320px insight rail)

Active record resolution:
| Tab        | Selected Record                                 | Query Param    |
|------------|------------------------------------------------|----------------|
| Customer   | (none – customer is the record)                 | —              |
| Quote      | Quote                                          | quoteId        |
| Contract   | Contract                                       | contractId     |
| Invoicing  | Invoice                                        | invoiceId      |
| Payment    | Invoice (AR view) or Payment                   | invoiceId / paymentId |
| Rev Rec    | Revenue arrangement (resolved from contract)    | contractId     |

Record context bar:
- Must always show the active record's key identifiers and status.
- Must expose tab-specific primary actions.
- Hidden when Customer tab is active (existing behavior).

Insight rail:
- Must show tab-specific next best actions, AI insights, and linked records.
- Must always show open tasks and customer health (shared sections).

Cross-tab linking:
- Contract enforcement feeds invoicing; show contract link in invoicing.
- Invoicing feeds payments; show invoice link in payment context bar.
- Amendments feed RevRec schedule reruns; show amendment callout in RevRec.
- Billing disputes in Payment hand work to Invoicing; show handoff link.
- Payment does NOT gate RevRec – revenue recognition follows contract /
  billing / usage / policy, NOT cash receipt.

--------------------------------------------------
25. MOCK DATA EXTENSIONS REQUIRED
--------------------------------------------------

New types to add to mock-data.ts:

A. InvoiceDetailLine (enriched line item)
   - sku, name, type (recurring | one-time | usage | credit), quantity,
     unitPrice, discount, tax, netAmount
   - lineType: "platform_fee" | "prepaid_credit" | "usage_overage" |
     "true_up" | "minimum_commit"

B. ReviewCheck (invoice validation checklist)
   - label, status: "pass" | "warn" | "fail"

C. DeliveryEvent (invoice delivery history)
   - date, method, recipient, status

D. CreditNote
   - id, invoiceId, customerId, amount, reason, status, date, owner

E. Payment
   - id, customerId, invoiceId, amount, method, bankReference, receiptDate,
     matchStatus, allocations: { invoiceId, amount }[], reversals

F. CollectionCase
   - id, customerId, invoiceId, outstandingAmount, daysOverdue, stage,
     owner, ptpDate, nextStep, followUpHistory: { date, action, note }[],
     escalated, lastContactSummary

G. RevenueArrangement
   - id, customerId, contractId, status, policy, obligations: PerfObligation[],
     schedule: RecogEntry[], recognizedToDate, deferred, closeBlockers: CloseBlocker[],
     journalExports: JournalExport[], adjustments, lastRecalculated, closeStatus

H. PerformanceObligation
   - product, obligationType: "over-time" | "point-in-time" | "usage-based",
     allocationBasis, allocatedAmount, recognizedToDate, deferredRemaining, method

I. RecognitionScheduleEntry
   - period, recognized, deferred, remaining, amended

J. CloseBlocker
   - description, severity: "critical" | "warning", category, resolved

K. JournalExport
   - id, period, status, erpReference, exportDate, failReason

Optional Invoice enrichments (added as optional fields):
   - billingPeriodStart, billingPeriodEnd, currency, paymentTerms,
     billToContact, poNumber, taxTotal, balanceDue, detailedLineItems,
     reviewChecklist, deliveryHistory

Seed data:
   Populate all new types for Echo Corp (cust_echo_001) primarily, with
   secondary data for Northlane Labs and Verdant Health to enable the
   Invoicing, Payment, and RevRec tabs to render fully.

--------------------------------------------------
26. ROLES, PERMISSIONS, AND ACTION MODEL
--------------------------------------------------

Invoicing personas:
   - Billing Operator: review, validate, hold/release, regenerate
   - Billing Manager: approve & send, create credit notes, resolve disputes
   - Finance Ops: audit trail, schedule review, close-readiness

Payment / Collections personas:
   - Finance Ops: record payment, match cash, reconcile
   - AR / Collections: follow up, promise-to-pay, escalate, resend
   - Billing Manager: accept handoff from AR, fix invoice issues
   - Finance Manager / CFO: approve write-offs, review aging

RevRec personas:
   - Finance Ops: review schedule, resolve blockers, rerun
   - Finance Manager: approve adjustments, sign off on close
   - CFO: period close approval, journal export sign-off
   - Billing / RevOps: view context (secondary)

The prototype does not implement permissions. Actions should be present for
all users. Role sensitivity is reflected in label tone and action ordering.

--------------------------------------------------
27. CROSS-TAB WORKFLOW LOGIC
--------------------------------------------------

The prototype should visibly reflect these relationships:

1. Contract → Invoicing
   Contract enforcement and amendments create/modify invoices.
   Show contract reference in invoice detail. Show amendment callouts.

2. Invoicing → Payment
   Sent invoices feed AR / collections.
   Show invoice reference in payment context bar.
   Overdue invoices appear in collections workflow.

3. Payment → Invoicing (handoff)
   Billing disputes in collections hand work back to invoicing.
   Show "Billing action required" status in collections.
   Show linked dispute in invoicing corrections section.

4. Invoicing + Credit Notes → RevRec
   Invoices and credit notes feed the recognition schedule.
   Show billed/credited amounts in RevRec invoice impact section.

5. Contract Amendments → RevRec
   Amendments trigger schedule reruns and reallocation.
   Show amendment impact in RevRec modifications section.

6. Payment ≠ RevRec gate
   Payment affects AR / cash application only.
   Revenue recognition follows contract / billing / usage / policy.
   The UI journey shows RevRec after Payment, but the data model and
   narrative must not imply cash-based recognition.

Where practical, link across tabs using "View in [Tab]" chip links in
related record sections and callout banners.

--------------------------------------------------
28. ACCEPTANCE CRITERIA (LIFECYCLE TABS)
--------------------------------------------------

A. Existing functionality preserved:
   1. Getting Started page renders correctly.
   2. Quote and Contract tabs are visually and functionally intact.
   3. Customer / Account 360 tab unchanged.
   4. Index pages and breadcrumbs work.
   5. Alias routes still resolve into the customer shell.

B. New tab completeness:
   6. Invoicing tab has context bar, summary cards, all content sections,
      right rail with insights.
   7. Payment tab has context bar, summary cards, all content sections,
      right rail with insights.
   8. RevRec tab has context bar, summary cards, all content sections,
      right rail with insights.
   9. Each tab has a distinct operational purpose and does not feel copied.

C. Data quality:
   10. Mock data supports all visible sections without empty placeholders.
   11. Labels and amounts reflect SLG / enterprise AI billing reality.
   12. Edge cases (PO hold, dispute, credit note, amendment impact, partial
       payment, close blocker, ERP failure) are represented.

D. Architecture:
   13. Route state works: tab, selected record, from breadcrumb all resolve.
   14. No new standalone detail pages — everything renders through the
       customer shell.
   15. Cross-tab references are visible (linked records, callout banners).

E. Visual quality:
   16. Same density and enterprise tone as existing Quote/Contract tabs.
   17. Each tab feels like a workspace, not a generic record page.
   18. Fits naturally in the existing shell frame.

--------------------------------------------------
29. OPEN QUESTIONS / ASSUMPTIONS (LIFECYCLE TABS)
--------------------------------------------------

1. Invoice selection: When the invoicing tab is active and no invoiceId is
   provided in the URL, the first customer invoice (by date descending)
   should be selected automatically.

2. Payment tab record: The payment tab uses the customer's AR posture as
   the primary view. Individual payment records are shown in a table but
   there is no separate "payment detail" sub-page.

3. RevRec arrangement resolution: Revenue arrangements are resolved from
   the customer's primary contract (contractId). One arrangement per
   contract. If multiple contracts exist, the arrangement for the currently
   selected contract (or first active contract) is shown.

4. Journal / ERP export: The prototype mocks journal export status and ERP
   references. No actual export integration exists.

5. Write-off approval: The prototype shows a write-off request state but
   does not implement an approval flow.

6. Recognition schedule granularity: Monthly granularity for the waterfall
   schedule. Quarterly roll-ups are not needed for the prototype.

7. RevRec independence from Payment: The RevRec tab data and narrative must
   never state or imply that revenue is recognized upon payment. Revenue
   follows contract performance and accounting policy.

==================================================
DYNAMIC STATUS SYSTEM
==================================================

All statuses, labels, AI insights, next-best-actions, linked records, and
customer health metrics in the prototype are dynamically derived from mock
data. Nothing is hardcoded. If the underlying data changes, the UI updates
automatically.

Implementation: src/components/revenue-workspace/derive-stage-data.ts

--------------------------------------------------
30. JOURNEY RAIL TAB STATUS DERIVATION
--------------------------------------------------

Each tab in the lifecycle journey rail shows a dynamic status label and
color beneath the tab name. These are computed from mock data at render
time inside CustomerRevenueWorkspace and passed as a stageStatuses prop
to RevenueJourneyRail.

CUSTOMER TAB STATUS
  Source: customer.riskBadges
  Logic:
    - If riskBadges.length > 0 → "N risk flag(s)"
      Color: red if any badge contains "overdue", else amber
    - Else → "Healthy"
      Color: green

QUOTE TAB STATUS
  Source: quote.status, quote.approval.status, quote.approval.currentApprover
  Logic:
    - approval.status === "pending" → "Pending Approval · {approver first name}"
      Color: amber
    - approval.status === "rejected" → "Rejected"
      Color: red
    - status === "Draft" → "Draft"
      Color: blue
    - status === "Sent" → "Sent · awaiting response"
      Color: amber
    - Approved / Accepted → "Approved · {amount}"
      Color: green
    - Fallback → quote.status
      Color: blue

CONTRACT TAB STATUS
  Source: contract.status, contract.amendments, contract.enforcement,
          contract.billingSchedule
  Logic:
    - Base: contract.status (e.g. "Active")
    - If amendments.length > 0 → appends "+ N amendment(s)"
    - Color: red if enforcement.blockingIssues.length > 0
             amber if any billingSchedule item is "Overdue"
             green otherwise

INVOICING TAB STATUS
  Source: all customer invoices (getInvoices)
  Logic:
    - Count invoices by status: overdue, pending review, held (holdReason)
    - Build string: "N overdue · N pending review · N held"
    - If all clear → "All clear"
    - Color: red if any overdue, amber if pending/held, green otherwise

PAYMENT TAB STATUS
  Source: getCustomerArSummary, getPaymentsForCustomer
  Logic:
    - Count overdue invoices
    - Sum unapplied cash from payments with matchStatus === "unapplied"
    - Build string: "N overdue · $X unapplied"
    - If no open AR → "No open AR"
    - Color: red if overdue, amber if open balance, green otherwise

REVREC TAB STATUS
  Source: getRevenueArrangement(contract.id)
  Logic:
    - If no arrangement → "No arrangement" (blue)
    - Count unresolved closeBlockers
    - If blockers > 0 → "N blocker(s)"
      Color: red if any blocker is severity "critical", else amber
    - Else → "Healthy" or arrangement.status
      Color: green

STATUS SEVERITY COLORS (shared across all tabs)
  green  → text-emerald-600  (healthy, active, complete)
  amber  → text-amber-600    (pending, review, warning)
  red    → text-red-600      (overdue, blocked, critical)
  blue   → text-blue-600     (informational, draft, neutral)

--------------------------------------------------
31. AI INSIGHTS DERIVATION
--------------------------------------------------

All AI insights shown in the right insight rail are dynamically generated
from mock data. Each stage has a dedicated derivation function.

CUSTOMER INSIGHTS (getCustomerInsights)
  Sources: customer.prepaidCreditTotal, .prepaidCreditBalance, .openAr,
           .riskBadges, .nextRenewalDate, .crmSyncStatus
  Examples:
    - warning: "Prepaid credit 74% consumed — $31,400 remaining"
    - warning: "$24,300 in open accounts receivable"
    - info: "Contract renewal in 73 days — start planning"
    - info: "CRM sync is stale"
    - success: "Account in healthy state" (fallback when no issues)

QUOTE INSIGHTS (getQuoteInsights)
  Sources: quote.discountPct, .approval, .commercialTerms, .crmSyncStatus,
           .products; contract.paymentTerms, .term
  Examples:
    - warning: "Discount (22%) exceeds policy threshold"
    - warning: "Payment terms (Net 30) differ from prior contract (Net 45)"
    - info: "Quote includes 80,000 prepaid credits"
    - warning: "Approval pending for 6 days with Sarah Chen, VP Revenue"
    - info: "Contract term (24mo) differs from current contract (36mo)"

CONTRACT INSIGHTS (getContractInsights)
  Sources: contract.comparisonToQuote, .enforcement, .amendments,
           .prepaidCreditBalance, .renewalDate; customer invoices
  Examples:
    - warning: "Invoice INV-2026-0034 is 16 days overdue ($5,800)"
    - warning: "Signed contract differs from quote on 1 field: Billing cadence"
    - info: "Minimum commit will exhaust in ~41 days"
    - info: "Renewal in 73 days — start planning"
    - success: "Product mapping complete — all SKUs matched"

INVOICING INSIGHTS (getInvoicingInsights)
  Sources: invoice enrichment (paymentTerms), invoice.holdReason,
           .disputeReason; enrichment.reviewChecklist; creditNotes;
           contract.amendments, .paymentTerms
  Examples:
    - warning: "Invoice payment terms (Net 45) differ from contract (Net 30)"
    - warning: "Invoice on hold: PO number required"
    - warning: "2 validation checks failed — resolve before sending"
    - info: "1 credit note pending for this invoice"
    - success: "PO number available — ready for delivery"

PAYMENT INSIGHTS (getPaymentInsights)
  Sources: getCustomerArSummary, getPaymentsForCustomer,
           getCollectionCasesForCustomer
  Examples:
    - warning: "Customer typically pays 22 days after due date"
    - info: "$28,000 unapplied cash — review bank references for match"
    - info: "Partial payment on INV-2026-0034 — $4,600 received"
    - warning: "Active dispute: Usage overage disputed"
    - warning: "$5,800 overdue across 1 invoice — may impact renewal"
    - info: "Customer committed to pay by 2026-04-10"

REVREC INSIGHTS (getRevRecInsights)
  Sources: revenueArrangement.closeBlockers, .amendmentImpacts,
           .adjustments, .journalExports, .obligations
  Examples:
    - warning: "1 critical blocker preventing period close"
    - warning: "Amendment AMD-003 has not updated the recognition schedule"
    - info: "1 manual adjustment awaiting approval"
    - warning: "Journal export blocked for 2026-Q1"
    - info: "1 obligation using usage-based recognition"

--------------------------------------------------
32. NEXT-BEST-ACTIONS DERIVATION
--------------------------------------------------

Next best actions in the right rail are generated dynamically.

CUSTOMER TAB: No actions (customer tab is informational)

QUOTE TAB (getQuoteActions)
  Sources: quote.approval.status, .status, .discountPct,
           .customerAcceptedAt
  Examples:
    - "Follow up on approval" (if pending, with approver + date)
    - "Follow up with customer" (if sent, no response)
    - "Complete and send quote" (if draft)
    - "Review discount level" (if > 15%)

CONTRACT TAB (getContractActions)
  Sources: customer invoices filtered by contractId, contract.renewalDate,
           contract.enforcement.blockingIssues
  Examples:
    - "Resolve overdue invoice" (with ID, amount)
    - "Collect PO for held invoice" (with hold reason)
    - "Start renewal planning" (if < 90 days to renewal)
    - "Resolve enforcement blockers" (with first blocking issue)

INVOICING TAB (getInvoicingActions)
  Sources: invoice.holdReason, .status, .dueDate; customer credit notes
  Examples:
    - "Release hold on INV-2026-0044" (if held)
    - "Send overdue reminder" (with days past due)
    - "Review and approve INV-2026-0041" (if pending review)
    - "Process credit note CN-2026-0001" (if pending credit notes)

PAYMENT TAB (getPaymentActions)
  Sources: payments (unapplied, partial), collection cases (PTP, no response),
           AR summary
  Examples:
    - "Match unapplied $28,000" (with bank reference)
    - "Resolve partial payment" (with invoice and amount)
    - "Follow up on promised payment" (with PTP date)
    - "Escalate INV-2026-0040" (if no response, with attempt count)

REVREC TAB (getRevRecActions)
  Sources: arrangement.amendmentImpacts, .adjustments, .closeBlockers,
           .journalExports
  Examples:
    - "Rerun schedule for AMD-003" (pending amendments)
    - "Approve adjustment ADJ-2026-002" (pending approvals)
    - "Resolve close blockers" (with count)
    - "Re-export failed journal entries" (with period + reason)

--------------------------------------------------
33. LINKED RECORDS DERIVATION
--------------------------------------------------

Linked records are derived from the actual data relationships.

QUOTE: Related contract (relatedContractId), CRM opportunity (parsed from URL)
CONTRACT: Source quote, pending customer quotes for this contract, overdue invoices
INVOICING: Source contract, credit notes for this invoice, collection cases
PAYMENT: Overdue invoices, held invoices, credit notes, open support tickets
REVREC: Source contract, pending amendments, blocked journal entries

--------------------------------------------------
34. CUSTOMER HEALTH DERIVATION
--------------------------------------------------

The Customer Health section in the insight rail is now fully dynamic.

Source: deriveCustomerHealth(customer)

NPS:
  Derived from risk score.
  Risk score = (has overdue × 2) + (has escalation × 2) + (has high burn × 1)
               + (open support escalations > 0 × 1)
  NPS: score ≥ 4 → 32; score ≥ 2 → 52; else → 72

Support tickets (30d):
  Count of support tickets with lastUpdatedAt within last 30 days.
  Source: getTicketsForCustomer(customer.id)

Open escalations:
  Count of tickets with status === "Escalated".
  Only shown if count > 0.

Product adoption:
  Derived from prepaid credit consumption percentage.
  > 50% consumed → "High" (green)
  > 20% consumed → "Medium" (amber)
  ≤ 20% consumed → "Low" (red)

Churn risk:
  Derived from risk score (same calculation as NPS).
  score ≥ 4 → "High" (red)
  score ≥ 2 → "Medium" (amber)
  < 2 → "Low" (green)

--------------------------------------------------
35. FULL STATUS BADGE CATALOG
--------------------------------------------------

All status badges rendered by the StatusBadge component use consistent
color coding. The following statuses are recognized in the prototype:

GREEN (bg-emerald-50 / text-emerald-700)
  Active, Paid, Healthy, Enforced, Approved, Applied, Completed, Synced,
  Matched, Posted, Ready, Updated, Resolved, Issued, Delivered

AMBER (bg-amber-50 / text-amber-700)
  Pending, Pending Approval, Pending Review, Pending Rerun,
  Review Required, In Progress, Partial, On Hold, PO Required,
  Medium Risk

BLUE (bg-blue-50 / text-blue-700)
  Reminder Sent, Overdue Notice, Re-exported, Trialing

RED (bg-red-50 / text-red-700)
  Overdue, Rejected, Blocked, Failed, Unapplied, Reversed,
  No Response, High Risk

GRAY (bg-gray-100 / text-gray-500)
  Cancelled, Low Risk

Fallback: any unrecognized status renders as gray.

LINE TYPE BADGES (invoice composition):
  Platform Fee        → blue
  Prepaid Credit      → purple
  Usage / Overage     → amber
  True-up             → orange
  Minimum Commit      → indigo
  Proration           → gray
  Support             → emerald

OBLIGATION TYPE BADGES (RevRec):
  Over-time           → blue
  Point-in-time       → purple
  Usage-based         → amber

RISK BADGES (customer header):
  High-severity (contains "overdue", "mismatch", "high burn") → red
  Warning-severity (contains "renewal")                       → amber
  Default                                                     → gray

SEVERITY ICONS (AI insights):
  Warning  → amber triangle
  Info     → blue lightbulb
  Success  → green checkmark