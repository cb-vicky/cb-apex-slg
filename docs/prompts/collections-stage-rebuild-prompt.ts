/**
 * COLLECTIONS STAGE — REBUILD PROMPT SERIES
 * ==========================================
 * This file contains a series of self-contained implementation prompts to
 * recreate the full Collections (AR / Payment) stage inside a customer workspace
 * in any React + TypeScript codebase. Execute them in order — each part builds
 * on the previous one.
 *
 * TECH ASSUMPTIONS (adjust per repo):
 *   - React 18 + TypeScript
 *   - A component/styling library of your choice. All UI patterns are described
 *     BEHAVIORALLY — colors, borders, and specific class names are intentionally
 *     omitted. Use your own design system.
 *   - Mock / in-memory data only — no backend API
 *   - React Context for cross-component state sharing
 *   - A customer workspace shell already exists (a tabbed detail page per customer)
 *
 * RELATIONSHIP TO PROMISE TO PAY:
 *   The Promise to Pay feature has its own dedicated prompt file:
 *     docs/prompts/promise-to-pay-rebuild-prompt.ts
 *   Complete that series first (or in parallel). This file covers everything
 *   AROUND Promise to Pay inside the Collections stage — the sections, chrome,
 *   data, scroll behavior, and wiring.
 *
 * PARTS IN THIS FILE:
 *   Part 1 — Supporting Data Files
 *             (Email Sequence data, Email Activity data, Delayed Payments)
 *   Part 2 — Display Primitives
 *             (Due-status badge, comment banner, delayed payments section,
 *              email activity timeline section)
 *   Part 3 — AR Overview Section + Email Sequence Hover Tile
 *   Part 4 — Outstanding Invoice Section
 *             (with live "Overdue by X days / Due in X days" status)
 *   Part 5 — Sub-tab Navigation Bar
 *             (pill tabs: Overview, Promise to pay, Add PTP, Edit PTP)
 *   Part 6 — Collections Actions Bar
 *             ("Add Promise to pay" primary CTA + overflow menu)
 *   Part 7 — Scroll Dock Behavior
 *             (sub-tabs dock to top on scroll-down; undock on scroll-up)
 *   Part 8 — PaymentStageContent — Full Orchestration
 *             (Chrome Context wiring + all sections assembled into the stage)
 *
 * EXECUTION STRATEGY:
 *   Parts 1–4 are pure data + independent display components. You can run them
 *   in any order among themselves and nothing will break.
 *   Parts 5–8 depend on each other and on Part 1–4. Run them in order.
 *   All 8 parts together with the PTP prompt series = the complete Collections stage.
 */

// =============================================================================
// PART 1: SUPPORTING DATA FILES
// =============================================================================
export const PART_1_SUPPORTING_DATA = `
You are building the supporting data layer for a Collections (AR) module inside
a SaaS billing application. This part creates three data files:
  A. Email Sequence data (which automated reminder sequence a customer is enrolled in)
  B. Email Activity data (log of sent / scheduled / seen / bounced collection emails)
  C. Delayed Payments logic (invoices paid after their due date)

These are all read-only mock data sources — no backend, no API calls.

---

## A. EMAIL SEQUENCE DATA

### What it represents
Each customer can be enrolled in an "offline reminder sequence" — a named series
of reminder emails sent at scheduled intervals (e.g. 7 days before due, on due
date, 3 days after, 10 days after). The Collections tab surface shows a compact
metric tile for the active sequence with progress.

### File to create: \`src/data/collections-email-sequence.ts\`

#### Types

\`\`\`typescript
export type EmailSequenceStepStatus = "sent" | "scheduled";

export interface EmailSequenceStep {
  step: number;               // 1-based step number
  subject: string;            // Email subject line
  status: EmailSequenceStepStatus;
  at: string;                 // ISO datetime when sent or scheduled for
}

export interface CollectionEmailSequence {
  customerId: string;
  name: string;               // Name of the sequence, e.g. "Enterprise US Accounts"
  steps: EmailSequenceStep[];
}
\`\`\`

#### Seed data

Create a \`sequences\` object keyed by customerId with at least 2–3 customers.
Each should have 4 steps total (2 sent, 2 scheduled) as a realistic example:

- Step 1: "Upcoming Payment Reminder" — sent ~20 days before the demo date
- Step 2: "Payment Due Soon" — sent ~10 days before the demo date
- Step 3: "Overdue Payment Notice" — scheduled ~7 days in the future
- Step 4: "Final Payment Notice" — scheduled ~30 days in the future

For customers with no sequence, \`getEmailSequenceForCustomer\` returns \`null\`.

#### Functions to export

\`\`\`typescript
export function getEmailSequenceForCustomer(
  customerId: string,
): CollectionEmailSequence | null;
\`\`\`

---

## B. EMAIL ACTIVITY DATA

### What it represents
A chronological log of individual collection email delivery events per customer
(separate from the sequence steps above). This is a detailed audit trail shown
as a vertical timeline in the Overview section.

### File to create: \`src/data/collections-email-activity.ts\`

#### Types

\`\`\`typescript
export type EmailActivityStatus =
  | "scheduled"   // Not yet sent
  | "not_seen"    // Delivered but not opened
  | "seen"        // Opened by recipient
  | "bounced";    // Delivery failed

export interface EmailActivityItem {
  id: string;
  customerId: string;
  subject: string;
  to: string;           // Recipient email address
  date: string;         // ISO datetime
  status: EmailActivityStatus;
  templateName?: string; // e.g. "Overdue Notice"
}
\`\`\`

#### Seed data

Create at least 4–6 items per customer that has sequence data, covering all
four statuses at least once. Sort will be done by the component, not the data.

#### Functions to export

\`\`\`typescript
export function getEmailActivityForCustomer(
  customerId: string,
): EmailActivityItem[];
\`\`\`

---

## C. DELAYED PAYMENTS

### What it represents
Invoices that the customer eventually paid, but paid AFTER the due date.
These are surfaced in a "Delayed payments history" section inside Collections
as a retrospective signal of payment behavior.

### Where to add it: extend \`src/data/billing-data.ts\`

The type definition (add if not already present from the PTP prompt series):

\`\`\`typescript
export interface DelayedPayment {
  customerId: string;
  invoiceId: string;
  amount: number;
  daysLate: number;   // How many calendar days after due date payment arrived
  paidOn: string;     // ISO date string (YYYY-MM-DD) of actual payment receipt
}
\`\`\`

### How to derive it (no separate seed needed)

Derive delayed payments dynamically from existing invoice + payment records
rather than storing them separately. The function signature:

\`\`\`typescript
export function getDelayedPaymentsForCustomer(
  customerId: string,
  invoices: Invoice[],  // Already-resolved invoices for this customer
): DelayedPayment[];
\`\`\`

Implementation logic:
1. Filter \`invoices\` to those with status "Paid".
2. For each paid invoice, look up the payment in your payments data by matching
   the invoice ID in payment.allocations.
3. Compare payment.receiptDate (or equivalent) to invoice.dueDate.
4. If receipt date > due date, create a DelayedPayment entry with
   \`daysLate = daysBetween(dueDate, receiptDate)\`.
5. Return the list sorted most-recently-paid first.

If your data model doesn't have payment allocations, you can seed a static map
of \`invoiceId → { paidOn, daysLate }\` for demo customers.

---

## CHECKLIST FOR PART 1

□ \`src/data/collections-email-sequence.ts\` created with types + 2–3 seed customers
□ \`src/data/collections-email-activity.ts\` created with types + seed items per customer
□ \`getDelayedPaymentsForCustomer\` exported from billing-data.ts
□ All files compile cleanly with no TypeScript errors
`;

// =============================================================================
// PART 2: DISPLAY PRIMITIVES
// =============================================================================
export const PART_2_DISPLAY_PRIMITIVES = `
You are building four display-only components that are used throughout the
Collections stage. None of these components have their own state (except
EmailActivitySection which has a "show more" toggle). They receive data as props
and render it.

No specific styling library is assumed — implement visual intent using whatever
your repo uses. The behavior and layout are described in detail; adapt the
visual treatment to your design system.

---

## A. ReceivableDueStatusBadge

### What it does
Converts a "days until due" number into a human-readable label and renders it
as a colored inline badge/chip. Used wherever invoice due dates are shown.

### File: \`src/components/collections/ReceivableDueStatusBadge.tsx\`

#### Helper function (export this too — used in multiple places)

\`\`\`typescript
export function formatDueStatusFromDays(days: number): string
\`\`\`

Logic:
- days < 0  → "Overdue by X days" (use absolute value; if Math.abs(days) === 1, say "1 day")
- days === 0 → "Due today"
- days > 0  → "Due in X days" (if days === 1, say "Due in 1 day")

#### Component

\`\`\`typescript
export function ReceivableDueStatusBadge({ label }: { label: string })
\`\`\`

Rendering rules:
- If label starts with "Overdue": render with a red/danger visual treatment
- If label starts with "Due": render with an amber/warning visual treatment
- If label is neither (shouldn't happen but guard it): return null
- Rendered as an inline chip/badge (not full-width)
- The label text is the full string from \`formatDueStatusFromDays\`

---

## B. RecentCollectionCommentBanner

### What it does
Shows the most recent unpinned collection comment as a banner at the top of
the Collections Overview section. This is a bridge so collectors see the latest
note without switching to the Comments tab. It uses a warm/amber visual
treatment to distinguish it from section cards.

### File: \`src/components/collections/RecentCollectionCommentBanner.tsx\`

#### Props

\`\`\`typescript
interface Props {
  comment: CollectionComment; // Import from your comments data file
}
\`\`\`

#### Layout (top to bottom)

1. **Header row** (single line):
   - Label chip: "Comment" — small, uppercase, in a brand accent color
   - Author name (medium weight)
   - Separator dot
   - Relative date label (e.g. "3 days ago", "Today") — use a helper like
     \`commentDayLabel(createdAt: string): string\`

2. **Body**: The full comment text, in a readable text size.

The component is a horizontally-padded, vertically-compact card with a
warm/amber background tone (not a standard card — it should feel like an alert
or notice, not a data section).

#### Helper: commentDayLabel

\`\`\`typescript
export function commentDayLabel(isoDate: string): string
\`\`\`

Logic:
- Same calendar day as today → "Today"
- 1 day ago → "Yesterday"
- 2–6 days ago → "X days ago"
- 7+ days ago → formatted short date (e.g. "May 4")

---

## C. DelayedPaymentsSection

### What it does
Renders a list of invoices the customer paid late — a retrospective view of
payment behavior. Only appears if there is at least one delayed payment.

### File: \`src/components/collections/DelayedPaymentsSection.tsx\`

#### Props

\`\`\`typescript
interface Props {
  delayedPayments: DelayedPayment[]; // From billing-data.ts
}
\`\`\`

#### Behavior

If \`delayedPayments.length === 0\`: return null (render nothing).

Otherwise render a titled section card with a table:

| Column   | Content |
|----------|---------|
| Invoice  | The invoice ID string |
| Delayed by | A red badge like "3 days late" + inline secondary text "Paid on [date]" |
| Amount   | Right-aligned currency |

The "Delayed by" column renders two things inline:
1. A small red/danger chip: "X day late" (1 day) or "X days late" (plural)
2. Secondary muted text immediately after: "Paid on [shortDate]"

The section should use a slightly muted/gray background compared to standard
section cards — it's historical context, not an action item.

---

## D. EmailActivitySection

### What it does
Renders a vertical timeline of collection email events per customer — each
item is an email that was sent, scheduled, seen, or bounced. This is a
chronological audit trail, shown at the bottom of the Overview tab.

### File: \`src/components/collections/EmailActivitySection.tsx\`

#### Props

\`\`\`typescript
interface Props {
  items: EmailActivityItem[]; // From collections-email-activity.ts
  className?: string;
}
\`\`\`

#### Behavior

If \`items\` is empty: render an empty state message "No collection emails for this customer."

Otherwise:

1. Sort items newest-first by date.
2. Show the first 5 by default.
3. If there are more than 5, show a "View more" text link below the list that
   expands to show all items.

#### Timeline layout (per item)

Each item is a row with:
- **Left**: A vertical column containing:
  - A small circular icon container (colored by status — see below)
  - A thin vertical line connecting to the next item (absent on the last item)
- **Right**: Text content:
  - Primary line: status label + "·" + short date
    - e.g. "Scheduled · Jun 2, 2026" or "Not seen · May 16"
  - (No subject/to shown — keep it minimal)

#### Status → icon + color mapping

| Status     | Icon suggestion | Color treatment |
|------------|-----------------|-----------------|
| scheduled  | Calendar        | Blue/info       |
| not_seen   | Alert/Warning   | Amber/warning   |
| seen       | Eye             | Neutral/gray    |
| bounced    | MailX / broken  | Red/danger      |

Use whatever icon library is available in your repo. The color treatment
should match your design system's semantic colors.

---

## CHECKLIST FOR PART 2

□ \`ReceivableDueStatusBadge\` + \`formatDueStatusFromDays\` created and exported
□ \`commentDayLabel\` helper exported from comments data or a utils file
□ \`RecentCollectionCommentBanner\` renders author, date label, and body
□ \`DelayedPaymentsSection\` returns null when empty, renders table otherwise
□ \`EmailActivitySection\` shows first 5, expands on "View more", shows empty state
□ All compile cleanly
`;

// =============================================================================
// PART 3: AR OVERVIEW SECTION + EMAIL SEQUENCE METRIC TILE
// =============================================================================
export const PART_3_AR_OVERVIEW = `
You are building the AR Overview section — the first content block visible in
the Collections stage Overview tab. It renders 2–3 compact metric tiles in a
small grid, one of which is a special interactive "Email Sequence" tile that
shows a live progress bar and expands a popover with the full sequence detail
on hover.

---

## A. EmailSequenceMetricTile + EmailSequencePopoverContent

### What it does
A single tile in the AR Overview grid that shows the current email reminder
sequence status for the customer. It replaces the old "Collection Case" info.
The tile is interactive: hovering (or focusing) opens a rich popover showing
each step in the sequence with sent/scheduled status.

### File: \`src/components/collections/EmailSequenceCard.tsx\`

---

### EmailSequenceMetricTile

#### Props

\`\`\`typescript
interface Props {
  sequence: CollectionEmailSequence;
  popoverAlign?: "left" | "right"; // Which side the popover anchors to
}
\`\`\`

#### Tile layout (same dimensions as sibling metric tiles)

1. **Top line**: Label "Sequence" + a small inline progress bar
   - Progress bar: fills proportionally to (sentCount / totalCount)
   - Bar width is compact (e.g. 30–40px), thin height (6px)
   - Bar fills left-to-right as steps are sent
   - On hover, the bar subtly grows slightly taller (to communicate interactivity)
2. **Bottom line**: Value text — "X of N emails left"
   - e.g. "2 of 4 emails left" or "1 of 4 email left" (singular when 1)

The tile itself is button-like but does not navigate — it's a hover trigger.
Add \`role="button"\`, \`tabIndex={0}\`, \`aria-haspopup="dialog"\`.

#### Popover behavior

The popover:
- Appears on hover AND on keyboard focus (use CSS opacity/visibility transitions,
  not JS state — this keeps it snappy)
- Is absolutely positioned relative to the tile, aligned to \`popoverAlign\`
- Is \`z-50\` or equivalent (must float above all content)
- Is a proper \`role="dialog"\` with \`aria-label\`

The popover should be wide enough to show email subjects without truncation
(minimum 280px, maximum ~320px or full viewport with margin).

---

### EmailSequencePopoverContent

Renders inside the popover:

1. **Header**: Sequence name in bold
2. **Progress summary**:
   - A horizontal progress bar (full width this time)
   - "N of total emails left in Sequence"
3. **Step list** (vertical timeline):
   Each step:
   - Icon: filled circle with checkmark if sent, lighter circle with clock if scheduled
   - "Email N" label (small, muted, uppercase)
   - Subject line (bold, readable)
   - Status + date: "Sent on [datetime]" or "Scheduled for [datetime]"
   - Connecting vertical line between steps (except last)

Format the datetime with month, day, year, hour, minute for sent steps.
Use the same format for scheduled steps.

---

#### Helper functions to export

\`\`\`typescript
export function getSequenceMetricValue(sequence: CollectionEmailSequence): string;
// Returns "X of N emails left" (handles singular/plural)
\`\`\`

---

## B. ArOverviewSection

### What it does
Renders a compact row of metric tiles at the top of the Collections Overview tab.
The old implementation had 6 tiles in a SectionCard table. The new one is a
lean 2–3 tile grid with no outer card container — just tiles side by side.

### File: \`src/components/collections/ArOverviewSection.tsx\`

#### Props

\`\`\`typescript
interface ArSummary {
  totalOpen: number;           // Total outstanding amount (not currently shown)
  totalOverdue: number;        // Total overdue amount
  overdueCount: number;        // Number of overdue invoices
  unappliedCash: number;       // Unapplied / available balance
  avgDaysToPay: number;        // Average days customer takes to pay
  oldestOutstandingDays: number; // How many days old the oldest open invoice is
}

interface Props {
  customerId: string;
  summary: ArSummary;
}
\`\`\`

#### What to render

A grid (2 columns on small screens, 3 columns on medium+) of these tiles:

**Tile 1 — Available balance**
- Label: "Available balance"
- Value: formatted currency of \`summary.unappliedCash\`
- Tone: warning/amber if > 0, neutral if 0

**Tile 2 — Oldest Outstanding**
- Label: "Oldest Outstanding"
- Value: \`\`\`oldestOutstandingDays > 0 ? \`\${oldestOutstandingDays}d\` : "—"\`\`\`
- Tone: danger/red if > 30 days, neutral otherwise

**Tile 3 — Email Sequence tile (conditional)**
- Only render if \`getEmailSequenceForCustomer(customerId)\` returns a non-null sequence
- Render \`<EmailSequenceMetricTile sequence={emailSequence} popoverAlign="right" />\`

#### Tile visual spec (generic)

Each tile is a compact container (a small card):
- Uppercase label in small muted text (e.g. 10–11px)
- Value in bold, slightly larger (e.g. 14px), tabular-nums
- Danger/warning tone changes the value text color only — not the whole tile
- All three tiles should have the same height and general appearance

---

## CHECKLIST FOR PART 3

□ \`EmailSequenceMetricTile\` tile renders label + mini progress bar + "X of N emails left"
□ Hover/focus opens a popover with sequence name, full progress bar, and step list
□ Popover closes when focus moves away (CSS visibility approach)
□ \`ArOverviewSection\` renders 2 metric tiles + conditional sequence tile
□ Grid adapts: 2 cols on small, 3 cols on wider screens
□ All compile cleanly
`;

// =============================================================================
// PART 4: OUTSTANDING INVOICE SECTION
// =============================================================================
export const PART_4_OUTSTANDING_INVOICE = `
You are building the "Outstanding Invoice" section — a table of all non-paid
invoices for the customer, shown inside the Collections Overview tab.

The key difference from a standard invoice list is how due dates are rendered:
instead of showing just the date or a simple "Overdue" badge, each row computes
and shows a precise "Overdue by X days" or "Due in X days" status as a colored
inline badge alongside the date.

---

## COMPONENT: OpenReceivablesSection

### File: \`src/components/collections/OpenReceivablesSection.tsx\`

### Props

\`\`\`typescript
interface Props {
  invoices: Invoice[];  // All invoices for the customer (merged with overrides)
}
\`\`\`

### Behavior

Filter \`invoices\` to those where \`status !== "Paid"\` — these are "open".

If no open invoices: render an empty-state card titled "Outstanding Invoice"
with a muted message "No open receivables for this customer."

Otherwise: render a titled section card ("Outstanding Invoice") containing
a full-width table.

### Table columns

| Column   | Header | Content |
|----------|--------|---------|
| Invoice  | Invoice | Invoice ID string (e.g. "INV-2026-0034"), bold |
| Date     | Date | Invoice issue date, formatted as short date |
| Due Date | Due Date | Due date string + status badge (see below), inline |
| Amount   | Amount | Right-aligned, bold, tabular-nums currency |

### Due Date column — the key behavior

The due date cell contains TWO things inline:
1. The raw due date in muted secondary text (e.g. "Mar 1")
2. A \`ReceivableDueStatusBadge\` (from Part 2) computed from the invoice

#### How to determine the badge label:

\`\`\`typescript
function daysUntilDue(dueDate: string): number {
  // Positive = future (not yet due), Negative = past (overdue)
  return Math.round(
    (new Date(dueDate).getTime() - Date.now()) / 86_400_000
  );
}

function formatReceivableStatus(invoice: Invoice): string {
  const days = daysUntilDue(invoice.dueDate);

  // Explicitly overdue or past due date
  if (invoice.status === "Overdue" || days < 0) {
    return formatDueStatusFromDays(days); // from Part 2
  }

  // Pending Review also shows due-date-relative label
  if (invoice.status === "Pending Review") {
    return formatDueStatusFromDays(days);
  }

  // All other statuses (On hold, Scheduled, etc.): show the status as-is
  return invoice.status;
}
\`\`\`

Then render:

\`\`\`typescript
function ReceivableStatusBadge({ invoice }: { invoice: Invoice }) {
  const label = formatReceivableStatus(invoice);
  const isOverdue = label.startsWith("Overdue");
  const isDueIn = label.startsWith("Due");

  if (isOverdue || isDueIn) {
    // Use the colored ReceivableDueStatusBadge from Part 2
    return <ReceivableDueStatusBadge label={label} />;
  }

  // Fall back to your standard status badge component
  return <YourStatusBadge status={label} />;
}
\`\`\`

### Table spec

- \`<table>\` with header row (uppercase, muted, small text) and body rows
- Each body row has a bottom border (except the last)
- Row height is comfortable — enough padding to breathe (e.g. py-1.5 or equivalent)
- No hover state needed — this is read-only

### Section card title

Use "Outstanding Invoice" (not "Open Receivables Ledger" — shorter, cleaner).

---

## CHECKLIST FOR PART 4

□ Section renders nothing / empty state when all invoices are paid
□ Table shows correct columns in correct order
□ Due date column shows raw date + colored status badge inline
□ "Overdue by X days" badge is red; "Due in X days" badge is amber
□ Invoice status "Overdue" always triggers the date-relative label regardless of \`days\`
□ "Pending Review" also triggers date-relative label
□ All other statuses fall back to standard status badge
□ Compiles cleanly
`;

// =============================================================================
// PART 5: SUB-TAB NAVIGATION BAR
// =============================================================================
export const PART_5_SUBTAB_NAVIGATION = `
You are building the sub-tab navigation bar for the Collections stage. This is
a pill-style tab strip that sits inside the stage content area (not in the main
workspace tab bar). It allows switching between:
  - Overview
  - Promise to pay
  - Add Promise to pay (transient, closable)
  - Edit Promise to pay (transient, closable)

---

## COMPONENT: PaymentCollectionsSubTabs

### File: \`src/components/collections/PaymentCollectionsSubTabs.tsx\`

---

### Tab types

\`\`\`typescript
export type PaymentCollectionsTab =
  | "overview"
  | "promise-to-pay"
  | "add-promise-to-pay"
  | "edit-promise-to-pay";
\`\`\`

---

### Props

\`\`\`typescript
interface Props {
  active: PaymentCollectionsTab;
  promiseToPayCount: number;  // Shows as a count badge on "Promise to pay" pill
  addTabOpen: boolean;        // Whether "Add Promise to pay" pill is visible
  editTabOpen: boolean;       // Whether "Edit Promise to pay" pill is visible
  onChange: (tab: PaymentCollectionsTab) => void;
  onCloseAdd: () => void;     // Called when "Add" pill × is clicked
  onCloseEdit: () => void;    // Called when "Edit" pill × is clicked
}
\`\`\`

---

### Visual design of a SubTabPill

Each tab is a rounded-pill button (not an underline tab). Implement a shared
\`SubTabPill\` internal component:

\`\`\`typescript
interface SubTabPillProps {
  label: string;
  count?: number;     // Shown as a badge inside the pill when > 0
  active: boolean;    // Active pill is visually distinct (bold text, filled bg)
  closable?: boolean; // If true, shows an × button on the right
  onClick: () => void;
  onClose?: () => void;
}
\`\`\`

#### Pill anatomy (left to right)

- **[Label text]**: Font weight bold when active, medium when inactive.
- **[Count badge]** (conditional): Only shown when count > 0. Small rounded
  pill/chip inside the tab pill. Use a blue accent when active, gray when not.
- **[× button]** (conditional, closable only): An accessible button with
  \`aria-label=\`Close \${label}\`\`. Clicking it calls \`onClose\`.
  \`e.stopPropagation()\` is required on the × click so it doesn't also trigger
  the tab switch.

#### Pill states

| State    | Visual treatment |
|----------|-----------------|
| Active   | Filled background (e.g. white or surface), shadow, ring border |
| Inactive | Transparent background, ring border, lighter text; hover fills bg slightly |

Both states use the same ring/border color — the fill is the differentiator.

---

### Separator between permanent and transient tabs

When either \`addTabOpen\` or \`editTabOpen\` is true, render a vertical divider
line (1px, muted) between the "Promise to pay" pill and the transient pills.
This is a purely visual separator — not interactive.

\`\`\`typescript
function FlowTabsSeparator() { /* render a vertical 1px line */ }
\`\`\`

---

### Full component layout

\`\`\`
[Overview] [Promise to pay (3)] | [Add Promise to pay ×] [Edit Promise to pay ×]
                                 ^
                          Only shown when add/edit tabs exist
\`\`\`

The component itself is a horizontal flex row, left-aligned, wrapping on narrow
viewports. The separator appears only when \`hasFlowTabs = addTabOpen || editTabOpen\`.

---

### Component structure

\`\`\`typescript
export function PaymentCollectionsSubTabs({
  active, promiseToPayCount, addTabOpen, editTabOpen,
  onChange, onCloseAdd, onCloseEdit,
}: Props) {
  const hasFlowTabs = addTabOpen || editTabOpen;

  return (
    <div className="...">
      <SubTabPill label="Overview" active={active === "overview"} onClick={() => onChange("overview")} />
      <SubTabPill
        label="Promise to pay"
        count={promiseToPayCount}
        active={active === "promise-to-pay"}
        onClick={() => onChange("promise-to-pay")}
      />
      {hasFlowTabs ? <FlowTabsSeparator /> : null}
      {addTabOpen ? (
        <SubTabPill
          label="Add Promise to pay"
          active={active === "add-promise-to-pay"}
          closable
          onClick={() => onChange("add-promise-to-pay")}
          onClose={onCloseAdd}
        />
      ) : null}
      {editTabOpen ? (
        <SubTabPill
          label="Edit Promise to pay"
          active={active === "edit-promise-to-pay"}
          closable
          onClick={() => onChange("edit-promise-to-pay")}
          onClose={onCloseEdit}
        />
      ) : null}
    </div>
  );
}
\`\`\`

---

## CHECKLIST FOR PART 5

□ \`PaymentCollectionsTab\` type exported
□ Overview and Promise to pay always render
□ Count badge on "Promise to pay" shows when promiseToPayCount > 0
□ Add/Edit pills only render when their respective open flags are true
□ Separator renders between permanent and transient pills when either is open
□ × on transient pills calls onClose without triggering onClick (stopPropagation)
□ Active pill is visually distinct from inactive (filled vs transparent)
□ Compiles cleanly
`;

// =============================================================================
// PART 6: COLLECTIONS ACTIONS BAR
// =============================================================================
export const PART_6_ACTIONS_BAR = `
You are building the Collections actions bar — a right-aligned row of action
buttons that sits to the right of the sub-tab pills within the same horizontal
strip at the top of the Collections stage.

It has two elements:
  1. A "⋯" (more) overflow dropdown button with secondary actions
  2. A primary "Add Promise to pay" button

---

## COMPONENT: PaymentCollectionsActionsBar

### File: \`src/components/collections/PaymentCollectionsActionsBar.tsx\`

### Props

\`\`\`typescript
interface Props {
  onAddPromiseToPay: () => void;
}
\`\`\`

---

### Layout

The component renders \`ml-auto\` (right-aligned) in a flex row:

\`\`\`
[⋯ overflow button]  [Add Promise to pay →]
\`\`\`

---

### Overflow (⋯) button

- Icon-only button using a horizontal ellipsis (⋯) or "more" icon
- On click, opens a dropdown menu anchored to the button's bottom-right
- Menu items (all stubs — just close the menu on click, no action needed):
  1. "Share Statement to Customer"
  2. "Add Task"
  3. "Manage Credits"
  4. "Record an Offline Payment"
  5. "Change Billing Alignment"
  6. "Request Payment Method Update"
  7. "Update Billing Info"
- Menu closes when clicking outside (use a \`mousedown\` listener on \`document\`
  that checks whether the click target is inside the menu ref)
- Menu styling: white background, rounded corners, drop shadow, py-1 padding,
  each item is a full-width text button with hover fill

### Click-outside pattern

\`\`\`typescript
useEffect(() => {
  if (!menuOpen) return;
  function onClickOutside(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }
  document.addEventListener("mousedown", onClickOutside);
  return () => document.removeEventListener("mousedown", onClickOutside);
}, [menuOpen]);
\`\`\`

---

### Primary button — "Add Promise to pay"

- Your primary/brand color button
- Label: "Add Promise to pay" with a right-pointing chevron icon (→)
- On click: calls \`onAddPromiseToPay\`
- Hover: slightly reduced opacity or a lightened shade

---

### Visibility rule

The actions bar is only rendered by the parent (PaymentStageContent) when:
\`collectionsTab === "overview" || collectionsTab === "promise-to-pay"\`

It is hidden when a form tab (add / edit) is active — the form provides its
own Cancel/Save buttons.

---

## CHECKLIST FOR PART 6

□ Right-aligned in its container (flex, ml-auto)
□ ⋯ button opens dropdown menu
□ Dropdown closes on outside click
□ All menu items are stubs that close the menu
□ Primary "Add Promise to pay" button calls onAddPromiseToPay
□ Compiles cleanly
`;

// =============================================================================
// PART 7: SCROLL DOCK BEHAVIOR
// =============================================================================
export const PART_7_SCROLL_DOCK = `
You are implementing a scroll-aware "dock" behavior for the sub-tab navigation
bar in the Collections stage.

---

## WHAT THE DOCK BEHAVIOR DOES

When the user scrolls DOWN past the sub-tab bar (past the point where it would
normally appear in the DOM), the sub-tab bar should "dock" — meaning a version
of it appears fixed/sticky at the top of the scrollable content area, so the
user can switch tabs without scrolling back up.

When the user scrolls UP, the docked version should disappear and the natural
position sub-tab bar reappears.

---

## HOW IT WORKS IN PRACTICE

The DOM structure inside the Collections stage is:

\`\`\`
<div> ← This is the sentinel div. It:
  - Is the NATURAL position of the sub-tab bar in the DOM
  - Has the sub-tab bar rendered inside it
  - When this div scrolls out of view, the dock activates

  <PaymentCollectionsSubTabs ... />  ← fades out when docked
  <PaymentCollectionsActionsBar ... />
</div>

← All other sections: AR Overview, PTP Pending, Open Receivables, etc.
\`\`\`

When \`subTabsDocked = true\`:
- The sentinel's sub-tab bar becomes invisible (opacity 0, pointer-events none)
- Your workspace chrome (wherever it is — a sticky header, a portal, etc.) renders
  a docked version of the same sub-tab bar

---

## IMPLEMENTATION: Inside PaymentStageContent

Two mechanisms work together:

### Mechanism 1 — IntersectionObserver (sentinel visibility)

\`\`\`typescript
const subTabsSentinelRef = useRef<HTMLDivElement>(null);
const subTabsVisibleRef = useRef(true); // mutable ref, not state

useEffect(() => {
  const root = document.querySelector<HTMLElement>("[data-main-scroll-container]");
  // ↑ This is the scrollable container element in your app.
  //   Replace the selector with whatever selector/ref targets YOUR scroll container.

  const target = subTabsSentinelRef.current;
  if (!root || !target || !chrome) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      subTabsVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        chrome.setSubTabsDocked(false); // re-enter → undock
      }
      // Do NOT dock here — scroll direction handles dock-on to prevent false triggers
    },
    { root, threshold: 0 },
  );

  observer.observe(target);
  return () => observer.disconnect();
}, [chrome]);
\`\`\`

### Mechanism 2 — Scroll direction listener

\`\`\`typescript
const lastScrollTopRef = useRef(0);

// Inside the same useEffect (same root + cleanup):
const onScroll = () => {
  cancelAnimationFrame(raf); // raf is a ref<number>
  raf = requestAnimationFrame(() => {
    const current = root.scrollTop;
    const delta = current - lastScrollTopRef.current;

    if (delta < -1) {
      // Scrolling UP → always undock immediately
      chrome.setSubTabsDocked(false);
    } else if (delta > 1 && !subTabsVisibleRef.current) {
      // Scrolling DOWN + sentinel is already off-screen → dock
      chrome.setSubTabsDocked(true);
    }

    lastScrollTopRef.current = current;
  });
};

root.addEventListener("scroll", onScroll, { passive: true });
// Clean up: root.removeEventListener("scroll", onScroll) + cancelAnimationFrame(raf)
\`\`\`

### Why two mechanisms?

- IntersectionObserver handles the sentinel going in/out of view cleanly.
- The scroll direction listener handles one edge case: if the user is scrolled
  far down and scrolls back up slowly, the observer fires "not intersecting" →
  "intersecting" only AFTER the sentinel re-enters. The direction listener
  undocks immediately on any upward scroll, so the user sees the docked bar
  disappear as they scroll up, not only after the sentinel re-enters.

---

## TRANSITION ANIMATION

The sentinel's sub-tab bar transitions between visible and invisible:
\`\`\`
invisible (docked):  opacity: 0, pointer-events: none, visibility: hidden
visible (undocked):  opacity: 1
\`\`\`

Use a CSS transition on opacity + visibility (duration ~300ms, ease-out curve).
Do NOT use display:none — that breaks transitions.

---

## WHERE THE DOCKED VERSION LIVES

This depends on your workspace shell. Options:
1. A sticky header bar in your workspace shell that, when \`subTabsDocked\` is true,
   renders a compact version of the sub-tab pills.
2. A fixed-position portal that only renders when \`subTabsDocked = true\`.
3. If your workspace doesn't support this, you can skip the docked version
   entirely and just use the \`PaymentDockedTabButton\` pattern shown below.

### Minimal docked version

At the very minimum, when docked, show the same \`PaymentCollectionsSubTabs\`
in a compact sticky bar fixed to the top of the content scroll area:
\`\`\`
position: sticky;
top: 0;
z-index: high;
background: white/surface;
border-bottom: 1px;
padding: 8px 16px;
\`\`\`

---

## CHROME CONTEXT VALUES NEEDED

\`\`\`typescript
subTabsDocked: boolean;
setSubTabsDocked: (docked: boolean) => void;
\`\`\`

These live in \`PaymentCollectionsChromeContext\` (built in Part 8).

---

## SCROLL CONTAINER SELECTOR

In the reference implementation, the scroll container is identified with
\`[data-main-scroll-container]\`. In your repo, use whatever attribute or ref
identifies the primary content scroll container. This is the element whose
\`.scrollTop\` changes when the user scrolls the workspace content.

---

## CHECKLIST FOR PART 7

□ Sentinel div wraps the sub-tab bar at its natural DOM position
□ IntersectionObserver watches the sentinel against the scroll container
□ Scroll direction listener immediately undocks on upward scroll
□ \`subTabsDocked\` state in chrome context updates correctly
□ Sub-tab bar in sentinel transitions to invisible when docked
□ Docked version appears (sticky or fixed) when \`subTabsDocked = true\`
□ Both cleanup correctly (observer.disconnect + removeEventListener + cancelAnimationFrame)
□ Compiles cleanly
`;

// =============================================================================
// PART 8: PAYMENTSTAGECONTEXT + FULL ORCHESTRATION
// =============================================================================
export const PART_8_ORCHESTRATION = `
You are wiring together everything built in Parts 1–7 (and the PTP prompt series)
into a working Collections stage. This involves:
  A. Creating the PaymentCollectionsChromeContext
  B. Creating the CommentsChromeContext (for the pinned comments bar)
  C. Assembling PaymentStageContent with all sections and tab switching
  D. Wiring the chrome context into the parent workspace

---

## A. PaymentCollectionsChromeContext

### What it is
A React context that holds all the shared state for the Collections stage.
Components deep in the tree (form, list view, actions bar, sub-tabs) all read
from and write to this context without prop drilling.

### File: \`src/components/collections/PaymentCollectionsChromeContext.tsx\`

### Interface

\`\`\`typescript
export interface PaymentCollectionsChromeValue {
  // Current sub-tab
  collectionsTab: PaymentCollectionsTab;
  setCollectionsTab: (tab: PaymentCollectionsTab) => void;

  // Add PTP form tab
  addPromiseTabOpen: boolean;
  openAddPromiseTab: () => void;
  closeAddPromiseTab: () => void;

  // Edit PTP form tab
  editPromiseTarget: { promiseId: string; logId: string } | null;
  openEditPromiseTab: (promiseId: string, logId: string) => void;
  closeEditPromiseTab: () => void;

  // PTP data freshness (increment to force useMemo re-computation)
  promiseToPayRevision: number;
  refreshPromiseToPay: () => void;

  // Add PTP draft — persists when user navigates away to view an invoice
  getAddPromiseDraft: () => AddPromiseToPayDraft | null;
  persistAddPromiseDraft: (draft: AddPromiseToPayDraft) => void;
  clearAddPromiseDraft: () => void;

  // Invoice navigation from within the Collections flow
  // Calling this opens an invoice without destroying the Add PTP form
  openInvoiceFromCollectionsFlow: (invoiceId: string) => void;

  // Scroll dock state
  subTabsDocked: boolean;
  setSubTabsDocked: (docked: boolean) => void;

  // Utility
  expandAllTabs: () => void;
}
\`\`\`

### Provider creation

\`\`\`typescript
const PaymentCollectionsChromeContext =
  createContext<PaymentCollectionsChromeValue | null>(null);

export function PaymentCollectionsChromeProvider({
  value,
  children,
}: {
  value: PaymentCollectionsChromeValue;
  children: ReactNode;
}) {
  return (
    <PaymentCollectionsChromeContext.Provider value={value}>
      {children}
    </PaymentCollectionsChromeContext.Provider>
  );
}

export function usePaymentCollectionsChrome() {
  return useContext(PaymentCollectionsChromeContext);
}
\`\`\`

---

## B. CommentsChromeContext (simplified)

Used by the Comments tab and the pinned comments bar in the workspace header.

### File: \`src/components/collections/CommentsChromeContext.tsx\`

\`\`\`typescript
export interface CommentsChromeValue {
  commentsRevision: number;
  refreshComments: () => void;
  addCommentPinByDefault: boolean;
  openAddCommentTab: () => void;
  closeAddCommentTab: () => void;
}

export function useCommentsChrome() {
  return useContext(CommentsChromeContext);
}
\`\`\`

---

## C. PaymentStageContent — Full Assembly

### File: \`src/components/collections/PaymentStageContent.tsx\`

### Props

\`\`\`typescript
interface Props {
  customer: Customer;
}
\`\`\`

### Data fetching (all useMemo)

\`\`\`typescript
const { invoiceStatusOverrides } = useIngestContext(); // or equivalent
const chrome = usePaymentCollectionsChrome();
const commentsChrome = useCommentsChrome();

const collectionsTab = chrome?.collectionsTab ?? "overview";
const subTabsDocked = chrome?.subTabsDocked ?? false;

// Merge invoice overrides (from ingestion flow, if any)
const customerInvoices = useMemo(
  () => mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides),
  [customer.id, invoiceStatusOverrides],
);

// AR summary (total open, overdue count, unapplied cash, etc.)
const summary = useMemo(
  () => getCustomerArSummary(customer.id, customerInvoices),
  [customer.id, customerInvoices],
);

// Delayed payments (derived from paid invoices vs payment dates)
const delayedPayments = useMemo(
  () => getDelayedPaymentsForCustomer(customer.id, customerInvoices),
  [customer.id, customerInvoices],
);

// Email activity log
const emailActivity = useMemo(
  () => getEmailActivityForCustomer(customer.id),
  [customer.id],
);

// All PTP records (revision counter forces refresh after mutations)
const promiseToPay = useMemo(
  () => getPromiseToPayForCustomer(customer.id),
  [customer.id, chrome?.promiseToPayRevision],
);

// Latest unpinned comment (for the banner in Overview)
const latestUnpinnedComment = useMemo(
  () => getLatestUnpinnedComment(customer.id),
  [customer.id, commentsChrome?.commentsRevision],
);

// Edit target lookup
const editPromiseTarget = chrome?.editPromiseTarget ?? null;
const editPromiseMatch = useMemo(() => {
  if (!editPromiseTarget) return null;
  return findPromiseToPayLog(
    customer.id,
    editPromiseTarget.promiseId,
    editPromiseTarget.logId,
  );
}, [customer.id, editPromiseTarget, chrome?.promiseToPayRevision]);
\`\`\`

### Actions bar visibility

\`\`\`typescript
const showActionsBar =
  collectionsTab === "overview" || collectionsTab === "promise-to-pay";
\`\`\`

### JSX structure

\`\`\`tsx
return (
  <div className="flex flex-col gap-3">

    {/* ── Sentinel div: sub-tabs + actions bar ── */}
    <div ref={subTabsSentinelRef} className="flex h-11 items-center justify-between gap-4">
      <div className={subTabsDocked ? "invisible opacity-0 pointer-events-none" : "opacity-100"}>
        <PaymentCollectionsSubTabs
          active={collectionsTab}
          promiseToPayCount={promiseToPay.length}
          addTabOpen={chrome?.addPromiseTabOpen ?? false}
          editTabOpen={chrome?.editPromiseTarget != null}
          onChange={(tab) => chrome?.setCollectionsTab(tab)}
          onCloseAdd={() => chrome?.closeAddPromiseTab()}
          onCloseEdit={() => chrome?.closeEditPromiseTab()}
        />
      </div>
      {!subTabsDocked && showActionsBar ? (
        <PaymentCollectionsActionsBar
          onAddPromiseToPay={() => chrome?.openAddPromiseTab()}
        />
      ) : null}
    </div>

    {/* ── Tab content ── */}
    {collectionsTab === "add-promise-to-pay" ? (
      <AddPromiseToPayForm
        customerId={customer.id}
        loggedByName={customer.billingOwner} // or however your Customer type exposes this
        invoices={customerInvoices}
        onCancel={() => chrome?.closeAddPromiseTab()}
        onSave={() => {
          chrome?.refreshPromiseToPay();
          chrome?.closeAddPromiseTab();
        }}
      />

    ) : collectionsTab === "edit-promise-to-pay" &&
        editPromiseTarget &&
        editPromiseMatch?.log.promisedFor ? (
      <EditPromiseToPayForm
        customerId={customer.id}
        loggedByName={customer.billingOwner}
        promiseId={editPromiseTarget.promiseId}
        logId={editPromiseTarget.logId}
        invoiceIds={editPromiseMatch.record.invoiceIds}
        initialPromisedDate={editPromiseMatch.log.promisedFor}
        initialAmount={getPromiseLogAmount(editPromiseMatch.log, editPromiseMatch.record.amount)}
        initialNote={getPromiseLogNote(editPromiseMatch.log) ?? ""}
        onCancel={() => chrome?.closeEditPromiseTab()}
        onSave={() => {
          chrome?.refreshPromiseToPay();
          chrome?.closeEditPromiseTab();
        }}
      />

    ) : collectionsTab === "promise-to-pay" ? (
      <PromiseToPayListView
        promises={promiseToPay}
        onEditScheduled={(promiseId, logId) =>
          chrome?.openEditPromiseTab(promiseId, logId)
        }
      />

    ) : (
      /* Overview tab — all sections stacked */
      <>
        {latestUnpinnedComment && (
          <RecentCollectionCommentBanner comment={latestUnpinnedComment} />
        )}

        <ArOverviewSection customerId={customer.id} summary={summary} />

        <PendingPromiseToPaySection
          promises={promiseToPay}
          onEditScheduled={(promiseId, logId) =>
            chrome?.openEditPromiseTab(promiseId, logId)
          }
        />

        <OpenReceivablesSection invoices={customerInvoices} />

        <DelayedPaymentsSection delayedPayments={delayedPayments} />

        <EmailActivitySection items={emailActivity} />
      </>
    )}
  </div>
);
\`\`\`

---

## D. Wiring the Chrome Context in the Parent Workspace

Inside your customer workspace component (the one that renders all lifecycle tabs):

### State to add

\`\`\`typescript
// ── Collections / Payment ──
const [paymentCollectionsTab, setPaymentCollectionsTab] =
  useState<PaymentCollectionsTab>("overview");
const [addPromiseTabOpen, setAddPromiseTabOpen] = useState(false);
const [editPromiseTarget, setEditPromiseTarget] = useState<{
  promiseId: string;
  logId: string;
} | null>(null);
const [paymentSubTabsDocked, setPaymentSubTabsDocked] = useState(false);
const [promiseToPayRevision, setPromiseToPayRevision] = useState(0);
const addPromiseDraftRef = useRef<AddPromiseToPayDraft | null>(null);

// ── Comments ──
const [commentsRevision, setCommentsRevision] = useState(0);
const [addCommentPinByDefault, setAddCommentPinByDefault] = useState(false);
\`\`\`

### Reset effect

When the user navigates away from the Collections stage, reset dock state:

\`\`\`typescript
useEffect(() => {
  if (activeStage !== "payment") {
    setPaymentSubTabsDocked(false);
    // If not in a "flow return" (returning from invoice), also reset form tabs
    if (!isInFlowReturn) {
      setAddPromiseTabOpen(false);
      setEditPromiseTarget(null);
    }
  }
}, [activeStage]);
\`\`\`

### Chrome context value object

\`\`\`typescript
const paymentChromeValue: PaymentCollectionsChromeValue = {
  collectionsTab: paymentCollectionsTab,
  setCollectionsTab: setPaymentCollectionsTab,

  addPromiseTabOpen,
  openAddPromiseTab: () => {
    setAddPromiseTabOpen(true);
    setPaymentCollectionsTab("add-promise-to-pay");
  },
  closeAddPromiseTab: () => {
    setAddPromiseTabOpen(false);
    addPromiseDraftRef.current = null;
    setPaymentCollectionsTab("overview");
  },

  editPromiseTarget,
  openEditPromiseTab: (promiseId, logId) => {
    setEditPromiseTarget({ promiseId, logId });
    setPaymentCollectionsTab("edit-promise-to-pay");
  },
  closeEditPromiseTab: () => {
    setEditPromiseTarget(null);
    setPaymentCollectionsTab("promise-to-pay");
  },

  promiseToPayRevision,
  refreshPromiseToPay: () => setPromiseToPayRevision((n) => n + 1),

  getAddPromiseDraft: () => addPromiseDraftRef.current,
  persistAddPromiseDraft: (draft) => { addPromiseDraftRef.current = draft; },
  clearAddPromiseDraft: () => { addPromiseDraftRef.current = null; },

  openInvoiceFromCollectionsFlow: (invoiceId) => {
    // Save current state so we can restore it when the invoice tab closes
    flowReturnRef.current = {
      tab: { kind: "parent", stage: "payment" },
      paymentCollectionsTab,
      addPromiseTabOpen,
      editPromiseTarget,
    };
    // Navigate to the invoice in the workspace
    navigateToInvoice(invoiceId); // your workspace navigation function
  },

  subTabsDocked: paymentSubTabsDocked,
  setSubTabsDocked: setPaymentSubTabsDocked,
  expandAllTabs: () => { /* optional: set a ref that PromiseToPayListView reads */ },
};
\`\`\`

### Provider wrapping

\`\`\`tsx
<CommentsChromeProvider value={commentsChromeValue}>
  <PaymentCollectionsChromeProvider value={paymentChromeValue}>
    {/* render your stage tab content here */}
    {activeStage === "payment" && <PaymentStageContent customer={customer} />}
    {activeStage === "comments" && <CommentsStageContent customer={customer} />}
    {/* other stages */}
  </PaymentCollectionsChromeProvider>
</CommentsChromeProvider>
\`\`\`

---

## INVOICE FLOW RETURN PATTERN

When \`openInvoiceFromCollectionsFlow\` is called, the user navigates to an invoice
record tab. When they close that record tab, the workspace should detect it's
returning from a "flow" and restore the previous PTP state. This requires:

1. A \`flowReturnRef\` that stores the state snapshot before navigation.
2. A check in the workspace's tab-close handler: if \`flowReturnRef.current\` exists
   and matches the closed tab's origin, restore the saved state and clear the ref.

Minimum viable version (if your workspace doesn't support this):
Simply omit the flow return — the user will land back on the Collections overview
instead of the Add PTP form. The draft is preserved in \`addPromiseDraftRef\` anyway,
so they can re-open the Add tab and continue where they left off.

---

## SECTION ORDER IN OVERVIEW TAB

The sections render in this exact vertical order:

1. \`RecentCollectionCommentBanner\` — only if \`latestUnpinnedComment\` is non-null
2. \`ArOverviewSection\` — always (metric tiles)
3. \`PendingPromiseToPaySection\` — only if there are open/scheduled PTP records
4. \`OpenReceivablesSection\` — always (shows empty state if no open invoices)
5. \`DelayedPaymentsSection\` — only if there are delayed payment records
6. \`EmailActivitySection\` — always (shows empty state if no emails)

---

## GATING: HIDE COLLECTIONS IF NO INVOICES

In the workspace, add Collections + Comments to the disabled stages list when
the customer has zero invoices:

\`\`\`typescript
const disabledStages: Stage[] = [
  ...(customerInvoices.length === 0 ? (["payment", "comments"] as Stage[]) : []),
  // ... other gating rules
];
\`\`\`

---

## FINAL VERIFICATION CHECKLIST

□ \`PaymentCollectionsChromeContext\` created with all fields
□ \`CommentsChromeContext\` created with commentsRevision + refresh
□ Chrome value object built correctly in the parent workspace
□ Both providers wrap the stage content
□ \`PaymentStageContent\` renders all 4 tab states correctly:
    □ overview: banner + AR tiles + PTP pending + receivables + delayed + email
    □ promise-to-pay: full PTP list
    □ add-promise-to-pay: AddPromiseToPayForm
    □ edit-promise-to-pay: EditPromiseToPayForm
□ Scroll dock effect (sentinel + scroll listener) attached and cleaned up
□ Actions bar hidden when form tab is active
□ Refreshing PTP after save updates the list and the tab count badge
□ navigating to an invoice from Add PTP form persists the draft
□ Collections stage gated (hidden) when customer has no invoices
□ Compiles cleanly with no TypeScript errors
`;

// =============================================================================
// APPENDIX: INTEGRATION ORDER + DEPENDENCIES MAP
// =============================================================================
export const APPENDIX_INTEGRATION_ORDER = `
## INTEGRATION ORDER & DEPENDENCY MAP

Run in this order for the smoothest experience. Parts that are independent of
each other can be parallelized.

────────────────────────────────────────────────────
 Step 1 — Data (no UI dependencies)
────────────────────────────────────────────────────
   Part 1A: collections-email-sequence.ts
   Part 1B: collections-email-activity.ts
   Part 1C: DelayedPayment types + getDelayedPaymentsForCustomer in billing-data.ts
   [PTP Prompt] Part 1: PTP data types
   [PTP Prompt] Part 2: PTP data layer (seed + runtime mutations)

────────────────────────────────────────────────────
 Step 2 — Display Primitives (independent, parallelizable)
────────────────────────────────────────────────────
   Part 2A: ReceivableDueStatusBadge + formatDueStatusFromDays
   Part 2B: RecentCollectionCommentBanner + commentDayLabel
   Part 2C: DelayedPaymentsSection
   Part 2D: EmailActivitySection
   [PTP Prompt] Part 3: PTP display primitives (status badges, timeline step, invoice cells)

────────────────────────────────────────────────────
 Step 3 — Data-connected display components
────────────────────────────────────────────────────
   Part 3: ArOverviewSection + EmailSequenceMetricTile + EmailSequencePopoverContent
   Part 4: OpenReceivablesSection
   [PTP Prompt] Part 4: AddPromiseToPayForm
   [PTP Prompt] Part 5: EditPromiseToPayForm
   [PTP Prompt] Part 6: PromiseToPayListView + PendingPromiseToPaySection

────────────────────────────────────────────────────
 Step 4 — Chrome + Navigation
────────────────────────────────────────────────────
   Part 5: PaymentCollectionsSubTabs
   Part 6: PaymentCollectionsActionsBar
   [PTP Prompt] Part 7: Sub-tab chrome context
   Part 8A: PaymentCollectionsChromeContext (extends PTP prompt Part 7)
   Part 8B: CommentsChromeContext

────────────────────────────────────────────────────
 Step 5 — Orchestration + Scroll
────────────────────────────────────────────────────
   Part 7: Scroll dock behavior (add to PaymentStageContent)
   Part 8C: PaymentStageContent full assembly
   Part 8D: Workspace wiring (providers + state in parent)

────────────────────────────────────────────────────

## MINIMUM VIABLE VERSION (if you want to ship incrementally)

If all 8 parts at once is too heavy, ship in this order:

PHASE 1 (read-only Collections):
  → Parts 1, 2, 3, 4, and wire a static PaymentStageContent
  → Result: Overview tab shows AR tiles + receivables + delayed payments + email activity

PHASE 2 (Promise to Pay):
  → PTP Prompt Parts 1–6
  → Parts 5, 6 (sub-tabs + actions bar)
  → Wire PTP list into PaymentStageContent
  → Result: Full PTP list + Add/Edit forms

PHASE 3 (Polish + Dock):
  → Part 7 (scroll dock)
  → Part 8D (full workspace wiring with chrome context)
  → Result: Dock behavior + draft persistence + invoice navigation flow
`;
