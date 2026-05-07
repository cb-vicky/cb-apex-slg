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

### C. Record Header (Glass Card)

Component: `RecordHeader` (portaled into `RecordSlotContext`)

**Mandatory** on Quote/Contract/Invoicing tabs when in detail view — users must always know which record is being viewed. Hidden when in list view or on Customer/Payment/RevRec tabs (customer is the record context, or no per-record bar is needed).

The record header uses a **portal pattern**: `CustomerContextBar` renders an empty `<div ref>` slot, and `RecordHeader` renders its content into that slot via `createPortal`. This allows the stage content components to control their own header without lifting state.

#### Visual design (glass card)

The record header is a floating glass card with:

- `bg-white/65` + `backdrop-blur-md` + `backdrop-saturate-150` — semi-transparent with blur
- Subtle shadow: `shadow-[0_8px_24px_-12px_rgba(17,24,39,0.18)]`
- Rounded: `rounded-2xl`
- Horizontal padding: `px-5 py-2.5`

**Left side:**
- Optional back link (text + left arrow) for "All contracts", "All invoices", etc.
- ID pill: `border-blue-300 bg-blue-50` with bold blue ID text
- Optional pill tag (e.g. "v3" for quote versions)
- Optional dropdown chevron when multiple sibling records exist

**Right side:**
- Flat text action buttons (e.g. "Transition", "Create amendment") separated by vertical hairline dividers
- Optional overflow menu (`…`) for additional actions

#### Record dropdown

When `recordOptions` prop is provided, the ID pill becomes a dropdown trigger. The dropdown shows all sibling records (other quotes in lineage, contracts for customer, invoices for customer) with:

- ID + optional pill tag + status badge
- Description line (e.g. TCV · term · date range)
- Optional error line (e.g. rejection reason)
- Selected record gets blue highlight

See `docs/04-lifecycle-tabs.md` for per-tab record actions and overflow items.

#### Active record resolution

| Tab        | Selected Record                                | Query Param                |
|------------|------------------------------------------------|----------------------------|
| Customer   | (none — customer is the record)                | —                          |
| Quote      | Quote                                          | `quoteId`                  |
| Contract   | Contract                                       | `contractId`               |
| Invoicing  | Invoice                                        | `invoiceId`                |
| Payment    | Invoice (AR view) or Payment                   | `invoiceId` / `paymentId`  |
| RevRec     | Revenue arrangement (resolved from contract)   | `contractId`               |

### D. Main Workspace + Floating Insight Rail

Component layout: Main content column is centered (`max-w-860` for detail, `max-w-1020` for list views). The **InsightRail** floats on the right and pushes the main content over when expanded.

**The insight rail is consistent across ALL tabs** — identical structure and data. It is purely customer-scoped (not stage-scoped). This makes the rail a stable "customer anchor" you can rely on regardless of which lifecycle stage is active.

#### Floating icon stack (collapsed state)

On desktop (`xl:` ≥ 1280px), the rail starts as a **floating icon stack** pinned to the right edge of the viewport. The stack is a vertical white pill with soft shadow containing three icon buttons:

- **Open Tasks** (`ListChecks` icon) — shows red badge with count when > 0
- **Account Details** (`IdCard` icon)
- **Linked Records** (`FileText` icon)

Icons have a left-side hover tooltip showing the section name.

**Position:** Fixed to the right side, anchored from `[data-tabs-anchor]` bottom + 80px offset (so it clears the optional record bar). Uses `position: fixed`, not sticky.

#### Panel (expanded state)

Clicking any icon opens a **340px floating panel** that slides in from the right. The panel is:

- `position: fixed`, same `top` as the icon stack
- White card with `rounded-2xl`, border, and deep shadow
- Max height: `100vh - top - 24px` (24px bottom margin)

**Panel header:** "Insights" title + collapse button (`PanelRightClose` icon).

**Panel body:** Scrollable accordion with the three sections. Only one section can be expanded at a time. Section state persists across tab switches via `railSections` state in `CustomerRevenueWorkspace`.

When the panel is open, the main content area receives `padding-right` equal to `panel width + gap` (352px total) via direct DOM manipulation on `[data-workspace-content]`, creating a smooth push effect.

#### Three sections (accordion behavior)

1. **Open Tasks** — all open tasks for this customer, spanning across all stages. Count badge in header turns blue when expanded. Each row: priority dot (gray, colored on hover) aligned with the title line, meta line below (assignee · due). Rows are separated by hairline dividers; hover background only (no card chrome). Rows are `<button>` elements (navigation TBD).

2. **Account Details** — flat key / value rows grouped with hairline dividers. Order: health metrics first (NPS, Support tickets 30d, Open escalations when > 0, Churn risk — see `docs/07-dynamic-status.md`), then segment / industry / region / customer since, then commercial + billing + CB entity, then AE / CSM / billing owner.

3. **Linked Records** — **external-system references only**, aggregated across the customer. Same list pattern as Open Tasks (dividers, hover, no per-row icons). Rows with a URL show a muted **arrow-up-right** on the right to indicate opening in a new tab; rows without a URL (e.g. CRM account ID only) have no arrow.
   - CRM Account (`customer.crmAccountId` + sync status)
   - CRM Opportunities (one per deal lineage, dedup'd by latest version — from `quote.crmOpportunityLink`)
   - Signed Contract Documents (from `contract.signedDocumentUrl` — shown with extraction confidence sublabel)

   Internal records (invoices, credit notes, support tickets, payments) are intentionally **not** in this list — they belong in main content or in per-stage tooling.

#### What the rail does NOT show

- **Next Best Actions** and **AI Insights** are no longer in the rail. They're shown in **main stage content** instead. This keeps the rail calm, consistent, and 100% customer-scoped.

**On the Customer (Account 360) tab specifically:** the main column leads with a **Next best action** card plus a separate **AI Insights** control (collapsed until the user runs **Generate**). Both are implemented in `CustomerNbaAiRow.tsx` and composed by `CustomerStageContent.tsx`. See `docs/04-lifecycle-tabs.md` — Customer tab — for visual treatment (border animation, collapsed/expanded AI Insights), CTAs, and derivation (`getPrimaryCustomerAction`, `getCustomerInsightsEnriched`). Other lifecycle tabs continue to surface stage-specific NBAs/insights next to their record content as described in doc 04.

#### Responsive behavior

- **Below `xl:`** the floating rail is hidden entirely — no icon stack, no panel. Content uses full width.
- **`xl:` and above:** floating icon stack is visible. Panel opens on click.

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
