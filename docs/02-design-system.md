# Design System — Visual Style, Badges, Primitives

**Primary reference for any UI polish, layout reorganization, or visual rework.** Covers tone, badge catalog, severity colors, and shared primitives.

## Visual tone

- **Enterprise product** — strong information hierarchy, subtle, premium, operational
- **Calm and dense-but-readable** — not marketing, not flashy, not a dashboard
- **Neutral surfaces + subtle borders** — let content hierarchy carry the design
- **Small orange accents** for active states (Chargebee brand), used sparingly
- **Compact spacing in tables**, icons only when useful

Avoid: giant empty hero areas, oversized marketing cards, nested tabs, random charts, generic dashboard feel.

## Spacing & layout

See `docs/01-shell-and-layout.md` for shell spec. Inside the white content canvas:

- Internal horizontal padding: 24–32px
- Top padding: 24px
- Vertical gap between major sections: 16–20px
- Right insight rail: ~320px, sticky when practical, collapses below main on smaller widths

## Full status badge catalog

All status badges rendered by the `StatusBadge` component use consistent color coding. The following statuses are recognized in the prototype:

### GREEN (`bg-emerald-50 / text-emerald-700`)
Active, Paid, Healthy, Enforced, Approved, Applied, Completed, Synced, Matched, Posted, Ready, Updated, Resolved, Issued, Delivered

### AMBER (`bg-amber-50 / text-amber-700`)
Pending, Pending Approval, Pending Review, Pending Rerun, Review Required, In Progress, Partial, On Hold, PO Required, Medium Risk, **Closing** (contract wind-down)

### BLUE (`bg-blue-50 / text-blue-700`)
Reminder Sent, Overdue Notice, Re-exported, Trialing, **Scheduled** (renewal contract pending activation)

### RED (`bg-red-50 / text-red-700`)
Overdue, Rejected, Blocked, Failed, Unapplied, Reversed, No Response, High Risk, **Terminated** (contract closed for non-payment)

### GRAY (`bg-gray-100 / text-gray-500`)
Cancelled, Low Risk, **Closed** (contract closed neutrally)

**Fallback:** any unrecognized status renders as gray.

### Line type badges (invoice composition)

| Line type | Color |
|---|---|
| Platform Fee | blue |
| Prepaid Credit | purple |
| Usage / Overage | amber |
| True-up | orange |
| Minimum Commit | indigo |
| Proration | gray |
| Support | emerald |

### Obligation type badges (RevRec)

| Type | Color |
|---|---|
| Over-time | blue |
| Point-in-time | purple |
| Usage-based | amber |

### Risk badges (customer header)

- High-severity (contains "overdue", "mismatch", "high burn") → **red**
- Warning-severity (contains "renewal") → **amber**
- Default → **gray**

### Severity icons (AI insights)

- Warning → amber triangle
- Info → blue lightbulb
- Success → green checkmark

## Shared severity color tokens

Used across tab statuses, insights, and callouts:

| Severity | Class | Use |
|---|---|---|
| green | `text-emerald-600` | healthy, active, complete |
| amber | `text-amber-600` | pending, review, warning |
| red | `text-red-600` | overdue, blocked, critical |
| blue | `text-blue-600` | informational, draft, neutral |

## Theme tokens (`index.css` `@theme`)

Prototype CSS variables include Chargebee orange (`--color-cb-orange`) and neutral surfaces/borders. For **secondary emphasis** on Account 360 (e.g. **AI Insights → Generate**), use **`--color-mature-blue`** (`#111827`) — a near-black blue that stays calmer than brand orange next to the Next best action card.

## Reusable component inventory

Components live under `src/components/revenue-workspace/`, `src/components/index-page/`, `src/components/ui/`.

### Workspace primitives

- `CustomerWorkspaceHeader` — stable customer header (name, entity, metrics, risk badges)
- `RevenueJourneyRail` — lifecycle stage rail with status labels
- `RecordContextBar` — per-tab record identifier + actions bar
- `CustomerContextBar` — simplified context bar when Customer tab is active
- `RecordHeader` — alternate compact record header
- `DetailBreadcrumb` — breadcrumb for shared shell
- `InsightRail` — 320px right rail container
- `SectionCard` — shared section wrapper with title + slot

### Per-tab content components

Each lifecycle stage has a `<Stage>StageContent.tsx` that composes its sections:
- `customer/CustomerStageContent.tsx`
- `quote/QuoteStageContent.tsx`
- `contract/ContractStageContent.tsx`
- `invoicing/InvoicingStageContent.tsx`
- `payment/PaymentStageContent.tsx`
- `revrec/RevRecStageContent.tsx`

Sections below are reusable building blocks. See `docs/04-lifecycle-tabs.md` for what each tab renders.

### Visual primitives

- Status badge — `StatusBadge` (see color catalog above)
- Risk badge, stage badge, tiny metric pill
- Key-value rows (`KV`)
- Compact entity chips
- Timeline row (`TimelineRow`)
- `ActionButton` — consistent action styling for record context bar

### Ingest drawer primitives

- `IngestFieldGroup` — bordered card wrapper for ingest form sections with header chrome + optional status chip
  - Header: `bg-gray-50` with bold title, optional subtitle
  - Chip tones: `valid` (emerald), `warning` (amber), `error` (red), `neutral` (gray border)
  - Body: white surface with `px-5 py-4` padding
  - Supports `forwardRef` for scroll-to-section behavior
- `DrawerStackedField` — label + input stacked vertically for drawer forms
- `DrawerRailIndent` — left padding wrapper for sub-content inside drawer sections
- `DrawerSelectShell` / `DrawerNativeSelect` — select input shells for drawer forms
- `ValidationPanel` — left-rail validation status list with clickable items + comments section

### Ingest field group chip tones

| Tone | Border / BG | Text | Use case |
|------|-------------|------|----------|
| `valid` | emerald-200 / emerald-50 | emerald-700 | Validation passed, mapped |
| `warning` | amber-200 / amber-50 | amber-700 | Needs attention, unmapped lines |
| `error` | red-200 / red-50 | red-700 | Blocking error, invalid |
| `neutral` | border-subtle / white | text-secondary | Default, informational |

### Index-page primitives

- `MetricStrip` — top 4–5 summary cards
- `GroupedSection` — named priority bucket with top-5 rows + "View all"
- `GroupedRow` — a single priority row
- `ListTable` / `ListRow` / `ListCell` — filtered list view
- `PageHeader` — index-page header

## Section card usage rules

- Use section cards inside the page, **not** nested inside a giant outer card
- Subtle border, white or slightly tinted surface, modest rounding, compact spacing, clear section titles
- Content should feel like structured sections on a page, not cards floating inside another card soup
