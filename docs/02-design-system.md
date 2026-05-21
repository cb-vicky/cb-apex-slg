# Design System — Visual Style, Badges, Primitives

**Primary reference for any UI polish, layout reorganization, or visual rework.** Covers tone, badge catalog, severity colors, and shared primitives.

## Visual tone

- **Functional, aesthetic, clean** — Chargebee operational product, not marketing
- **Calm and readable** — generous padding in tables and cards; hierarchy from typography and spacing, not cramming
- **Neutral warm surfaces** — `grey-100` canvas, white cards, subtle `border-border-default`
- **Chargebee orange** (`--color-cb-orange`, `--color-cb-orange-light`) — sidebar active nav, NBA card accents, brand moments
- **Blue** (`text-blue-600`, `bg-blue-50`) — workbench tab underline, record actions, primary link CTAs
- **Inter** body; **Sora** (`font-heading`) for page titles and customer name
- Icons only when useful

Avoid: giant empty hero areas, oversized marketing cards, nested tabs, random charts, generic dashboard feel, spreadsheet-tight row density.

### What we moved away from

Older docs described **"dense-but-readable"**, **compact table cramming**, and a **fixed ~320px insight rail**. The current UI instead uses:

- Browser-style **file-folder tabs** in `CustomerContextBar`
- **Drawer overlays** (`EntityDrawer`, 75% width, `rounded-l-[24px]`)
- **Rounded list tables** (`rounded-3xl` white container, `py-3` rows, `text-[14px]`)
- Intelligence in **tab content** (Account 360 NBA/AI) and **Workbench**, not a persistent right column

## Spacing & layout

See `docs/01-shell-and-layout.md` for shell spec. Inside content areas:

- Index/workbench horizontal padding: **24px** (`px-6`)
- List table container: `rounded-3xl border bg-white`
- Table rows: `py-3`, column headers `text-[11px] uppercase tracking-wide
- Workbench greeting: `text-[30px]` semibold
- Sidebar nav: `text-[13px]`, `py-[6px]` rows

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

Used across insights and callouts:

| Severity | Class | Use |
|---|---|---|
| green | `text-emerald-600` | healthy, active, complete |
| amber | `text-amber-600` | pending, review, warning |
| red | `text-red-600` | overdue, blocked, critical |
| blue | `text-blue-600` | informational, draft, links |

## Theme tokens (`index.css` `@theme`)

Prototype CSS variables include Chargebee orange (`--color-cb-orange`) and neutral surfaces/borders. For **secondary emphasis** on Account 360 (e.g. **AI Insights → Generate**), use **`--color-mature-blue`** (`#111827`) — a near-black blue that stays calmer than brand orange next to the Next best action card.

## Reusable component inventory

Components live under `src/components/revenue-workspace/`, `src/components/index-page/`, `src/components/ui/`, `src/components/common/`, `src/components/transitions/`.

### Workspace chrome (live)

- **`CustomerContextBar`** — sticky workspace chrome: breadcrumb, customer title (collapses on scroll), file-folder tabs with grouped child tabs, optional `recordSlot`
- **`RecordHeader`** — **action-only** slim glass pill (`rounded-full`, `bg-white/65`, `backdrop-blur-md`) portaled into `RecordSlotContext`
- **`RecordSlotContext`** — portal target for stage-rendered record actions
- **`SectionCard`** — shared section wrapper with title + slot

### Workspace types

- `stage.ts` — `Stage` union (`customer` | `tasks` | `threads` | `quote` | …)

### Per-tab content components

Each lifecycle stage has a `<Stage>StageContent.tsx`:

- `customer/CustomerStageContent.tsx` (Overview)
- `tasks/TasksStageContent.tsx`
- `threads/ThreadsStageContent.tsx`
- `quote/QuoteStageContent.tsx`
- `contract/ContractStageContent.tsx`
- `invoicing/InvoicingStageContent.tsx`
- `payment/PaymentStageContent.tsx`
- `revrec/RevRecStageContent.tsx`

### Drawer & overlay primitives

- **`EntityDrawer`** (`src/components/common/EntityDrawer.tsx`) — global 75% right panel, orchestrated by `src/store/drawer-store.ts`
- **`UnifiedFlowShell`** — multi-step flows (ingest → invoice review → close_prior / grace)
- **`IngestDrawer`** — ingest/approval body; `presentation="default"` (drawer) or `"page"` (full-page grid)

### Visual primitives

- `StatusBadge`, `KV`, `TimelineRow`, `ActionButton`
- Index: `PageHeader`, `MetricStrip`, `FilterBar`, `ListTable` / `ListRow` / `ListCell`

### Ingest drawer primitives

- `IngestFieldGroup` — bordered card wrapper for ingest sections with header chrome + optional status chip
- `DrawerStackedField`, `DrawerRailIndent`, `DrawerSelectShell`, `DrawerNativeSelect`
- `ValidationPanel` — `vertical` | `horizontal` | `sidebar` layouts

#### ValidationPanel layouts

**`vertical`** — Full-height column for 25% left column in full-page ingest: sticky header, scrollable validation list, comments toggle.

**`horizontal`** — Compact row for narrow contexts: inline chips + expandable comments.

**`sidebar`** — Minimal vertical list for tight spaces.

Status icons: `valid` → emerald check; `warning` / `error` → amber/red alert; `pending` → gray dot.

### Ingest field group chip tones

| Tone | Use case |
|------|----------|
| `valid` | Validation passed, mapped |
| `warning` | Needs attention, unmapped lines |
| `error` | Blocking error |
| `neutral` | Default, informational |

## Section card usage rules

- Use section cards inside pages, **not** nested inside a giant outer card
- `rounded-2xl` or `rounded-xl`, subtle border, white surface, clear titles
- Account 360 uses divider-based list rows inside cards where appropriate (support/comms, lifecycle strips)
