# Customer Revenue Workspace — Shell Anatomy

The shared page component used by all detail routes. Located at `src/components/revenue-workspace/CustomerRevenueWorkspace.tsx`.

Used by: `/customers/:customerId`, `/quotes/:quoteId` (alias), `/contracts/:contractId` (alias), `/invoices/:invoiceId` (alias).

Regardless of entry route, the workspace resolves the customer, determines the active tab, and shows the matching stage content. See `docs/06-routing.md` for route + param details.

## Four permanent layers

### A. Customer Header (stable frame across all stages)

Component: `CustomerWorkspaceHeader`

Show:
- Customer name
- Commercial account name
- Billing legal entity
- Chargebee entity / merchant entity
- Segment / tier
- AE / CSM / billing owner
- ARR
- TCV
- Prepaid credit balance / burn-down
- Open AR
- Next renewal date
- Risk badges

Design:
- Title on the left
- Compact metric ribbon or stat chips on the right
- Keep it compact, not hero-heavy
- Sits directly in the existing white content canvas with clean internal padding
- Realistic risk badges: "High burn", "1 overdue invoice", "Renewal in 74 days", "Legal entity mismatch"

### B. Revenue Journey Rail

Component: `RevenueJourneyRail`

Horizontal lifecycle rail directly below the customer header.

**Stages (in order):** Customer → Quote → Contract → Invoicing → Payment → RevRec

Each stage shows dynamic state information derived from mock data (see `docs/07-dynamic-status.md`). Examples:

- Quote: "Pending Approval · Sarah"
- Contract: "Active + 2 amendments"
- Invoicing: "2 pending review"
- Payment: "1 overdue"
- RevRec: "Healthy"

Design:
- This is **not** a plain tab bar — it's a journey rail with status
- Active stage visually distinct (underline, filled pill, or segmented navigation styling)
- Horizontally scrollable if needed on smaller widths

**Tab gating rules** (see `docs/11-workspace-cleanup-and-gating.md` for detail):
- Customer → always enabled
- Quote → always enabled (empty state if no quotes)
- Contract → enabled only if customer has ≥ 1 contract
- Invoicing → enabled only if customer has ≥ 1 contract
- Payment → enabled only if customer has ≥ 1 invoice
- RevRec → enabled only if customer has ≥ 1 contract

Disabled tabs render at 40% opacity with "Not available" sub-text and `cursor-not-allowed`.

### C. Record Context Bar

Component: `RecordContextBar` (or `CustomerContextBar` for the Customer tab)

**Mandatory** on Quote/Contract/Invoicing/Payment/RevRec tabs — users must always know which record is being viewed. Hidden (or shown as a simplified customer-level bar) when the Customer tab is active.

See `docs/04-lifecycle-tabs.md` for per-tab record-context-bar fields and actions.

Active record resolution table:

| Tab        | Selected Record                                | Query Param                |
|------------|------------------------------------------------|----------------------------|
| Customer   | (none — customer is the record)                | —                          |
| Quote      | Quote                                          | `quoteId`                  |
| Contract   | Contract                                       | `contractId`               |
| Invoicing  | Invoice                                        | `invoiceId`                |
| Payment    | Invoice (AR view) or Payment                   | `invoiceId` / `paymentId`  |
| RevRec     | Revenue arrangement (resolved from contract)   | `contractId`               |

### D. Main Workspace + Right Insight Rail

Component layout: `InsightRail` on the right at ~320px. Main content column flexes.

Desktop: `grid grid-cols-[minmax(0,1fr)_320px] gap-6`. Tablet/smaller desktop: right rail collapses below main content.

**The insight rail is consistent across ALL tabs** — identical structure and data. It is purely customer-scoped (not stage-scoped). This makes the rail a stable "customer anchor" you can rely on regardless of which lifecycle stage is active.

#### Three sections (in order)

Expand/collapse is **controlled in `CustomerRevenueWorkspace`** (`railSections` state) so choices **persist when switching lifecycle tabs** (Overview → Quotes → Contracts, etc.) for the same customer. Defaults: **all three expanded**.

1. **Open Tasks** — all open tasks for this customer, spanning across all stages. Count is shown next to the title. Each row: priority dot aligned with the title line, meta line below (assignee · due). Rows are separated by hairline dividers; hover background only (no card chrome). Rows are `<button>` elements (navigation TBD).

2. **Account Details** — flat key / value rows (no sub-headings). Order: health metrics first (NPS, Support tickets 30d, Open escalations when > 0, Churn risk — see `docs/07-dynamic-status.md`), then segment / industry / region / customer since, then commercial + billing + CB entity, then AE / CSM / billing owner. Hairline dividers separate those blocks.

3. **Linked Records** — **external-system references only**, aggregated across the customer. Same list pattern as Open Tasks (dividers, hover, no per-row icons). Rows with a URL show a muted **arrow-up-right** on the right to indicate opening in a new tab; rows without a URL (e.g. CRM account ID only) have no arrow.
   - CRM Account (`customer.crmAccountId` + sync status)
   - CRM Opportunities (one per deal lineage, dedup'd by latest version — from `quote.crmOpportunityLink`)
   - Signed Contract Documents (from `contract.signedDocumentUrl` — shown with extraction confidence sublabel)

   Internal records (invoices, credit notes, support tickets, payments) are intentionally **not** in this list — they belong in main content or in per-stage tooling.

#### What the rail does NOT show

- **Next Best Actions** and **AI Insights** are no longer in the rail. They're shown in **main stage content** instead. This keeps the rail calm, consistent, and 100% customer-scoped.

**On the Customer (Account 360) tab specifically:** the main column leads with a **Next best action** card plus a separate **AI Insights** control (collapsed until the user runs **Generate**). Both are implemented in `CustomerNbaAiRow.tsx` and composed by `CustomerStageContent.tsx`. See `docs/04-lifecycle-tabs.md` — Customer tab — for visual treatment (border animation, collapsed/expanded AI Insights), CTAs, and derivation (`getPrimaryCustomerAction`, `getCustomerInsightsEnriched`). Other lifecycle tabs continue to surface stage-specific NBAs/insights next to their record content as described in doc 04.

#### Scroll / overflow behavior (desktop only, `xl:` ≥ 1280px)

- Rail is `position: sticky` and sits right below the context bar with a 16px gap.
- **When at least one section is expanded:** the scrollable body has a **max-height** = `100vh − (contextBarBottom + 16px) − 32px` (32px bottom margin preserved). The rail **hugs its content** until that cap; only then does internal scrolling kick in (no tall empty card when content is short). When content overflows and the user is not yet at the bottom, a floating **"View more"** chip appears at the bottom, above a subtle white → transparent gradient. Clicking the chip scrolls down ~70% of the visible rail body. Chip and gradient hide once scrolled to the bottom.
- **When all three sections are collapsed:** the card **does not** use that fixed viewport height — it shrinks to only the three section headers (natural height). No internal scroll, no **View more** chip, no gradient. Sticky positioning + `top` offset still apply so the compact rail stays aligned.
- Below `xl:` the rail flows naturally below the main content: regular page scroll, no sticky, no fixed height, no overflow hint.

Implementation: `useRailMetrics()` inside `InsightRail.tsx` measures the context bar (`[data-insight-rail-anchor]`) height on mount and resize. **`maxHeight`** (not fixed `height`) is applied to the scroll container only when `metrics` exists **and** not every section is collapsed (`fixedHeightMode`).

## List-then-detail pattern (Quote, Contract, Invoicing)

When landing on Quote / Contract / Invoicing tab without a specific record ID:

1. Compact table renders listing all records for that customer
2. User clicks a row → full detail view opens
3. A "← All" back button appears to the left of the RecordContextBar switcher/ID, returning to the list

**Exception (deep links):** When arriving via URL with a specific record ID (e.g. `?tab=contract&contractId=CON-2024-0189`), the workspace opens directly in detail mode. Back button still available.

### List components

- `QuoteListView` — grouped by lineage (one row per deal), latest version as primary row, chevron expands older versions
- `ContractListView` — flat table (ID, source quote, effective/end, TCV, enforcement, status)
- `InvoiceListView` — flat table sorted by date desc (ID, date, due date, contract, amount, status, hold reason inline if present)

## Cross-tab linking rules

The shell visibly reflects these relationships:

1. **Contract → Invoicing:** enforcement + amendments create/modify invoices. Show contract link in invoice detail. Show amendment callouts.
2. **Invoicing → Payment:** sent invoices feed AR. Show invoice ref in payment context bar. Overdue invoices appear in collections.
3. **Payment → Invoicing (handoff):** billing disputes hand work back to invoicing. Show "Billing action required" status in collections. Show linked dispute in invoicing corrections.
4. **Invoicing + Credit Notes → RevRec:** feed recognition schedule. Show billed/credited amounts in RevRec invoice-impact section.
5. **Contract amendments → RevRec:** trigger schedule reruns. Show amendment impact in RevRec modifications.
6. **Payment ≠ RevRec gate:** Payment affects AR / cash application only. The UI journey shows RevRec after Payment, but the data model and narrative must **not** imply cash-based recognition.

Use "View in [Tab]" chip links in related-record sections and callout banners wherever practical.
