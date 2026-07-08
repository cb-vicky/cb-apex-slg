# Promise to Pay — Plain English Rebuild Guide

This guide explains the Promise to Pay feature in plain English — what it does, how it works, and how it should appear inside the Collection tab.

**How this version is structured:**
- The Collection tab is one single scrollable screen. Everything lives on it.
- There are no sub-tabs inside Collections — no "Overview", no separate "Promise to pay", no "Add" or "Edit" tabs.
- The AR summary at the top has no title — it just appears naturally as the first thing you see.
- Promise to Pay is one unified section on this screen — active, failed, and paid promises all appear in the same list.
- Adding and editing a promise opens inline on the same screen — not in a new tab or drawer.
- Use the design system's **InlineEditField** for form fields and **CollectionsInvoiceRow** for promise list rows.
- Use whichever customer already exists in the project. Create new invoice records only if needed for realistic overdue data.

There are **9 parts** — build them in order.

---

---

# What Is Promise to Pay?

When a customer hasn't paid their invoice, a collections agent will reach out to them.  
If the customer says "we'll pay by June 15th" — that is a **Promise to Pay**.

The agent records this promise: the date the customer committed to, the amount they promised, and optionally which invoice it relates to.

Over time, that promise might:
- **Be kept** → the customer pays → the promise is marked Paid
- **Be rescheduled** → the customer asks for more time → the agent edits the promise and sets a new date
- **Be broken** → the date passes without payment → the system marks it Failed automatically
- **Have a long history** → one invoice might accumulate several failed promises before it's finally paid

The feature records every single attempt, every note, and every reschedule — so anyone on the team can see the full story when they open a customer.

---

---

# Part 1 — What Information Do We Store?

> Goal: Define what a "Promise to Pay" looks like as a piece of information.

---

## A Promise (the main record)

Each promise has:

- **A unique ID** — just a reference code, e.g. "PTP-2026-0001"
- **Which customer it's for**
- **The current amount** — this updates if the promise is rescheduled to a different amount
- **Which invoices it's linked to** — can be zero, one, or multiple invoices. Linking is optional.
- **A history log** — every revision, every failure, every payment (explained next)

---

## A Log Entry (one line in the history)

Every time something happens to a promise, a new log entry is created. **Old entries are never deleted or changed.** You only ever add new ones. This builds a full, permanent audit trail.

Each log entry has:

- **A unique ID**
- **A status** — one of four possible states:
  - **Scheduled** — the promise is currently active. A date is set and we're waiting for payment.
  - **Edited** — this entry was replaced when the agent rescheduled. It stays in history forever.
  - **Failed** — the promised date passed without payment.
  - **Paid** — payment was confirmed received.

- **The amount for this specific entry** — so if the amount changed when rescheduled, the old amount is preserved
- **The date the customer promised to pay by** — only for Scheduled, Edited, and Failed entries
- **The date payment was actually received** — only for Paid entries
- **A note** — the agent's internal comment explaining context (e.g. "AP team confirmed wire; bank returned it due to wrong reference number")
- **When this entry was logged**
- **Who logged it** — the agent's full name and initials

---

## The Four Statuses, Simply

| Status | What it means |
|---|---|
| **Scheduled** | Active promise. Date is set. Waiting for the customer to pay. |
| **Edited** | This version was superseded by a newer revision. Kept for history only. |
| **Failed** | The promised date passed. No payment came. |
| **Paid** | Money received. The promise was fulfilled. |

---

## Demo Data — What to Set Up

Create at least **three realistic promises** for the customer you are using in this project.

**Aim for this variety:**

1. **One active promise** — a date in the future (relative to the demo date). Single log entry. Status: Scheduled. With a short note from the agent.

2. **One recently paid promise** — had one failed attempt first, then was paid. Two log entries: the failed one (date in the past) and the paid one.

3. **One with a long history** — the same invoice had multiple failed promises before being paid. This is the showcase example that proves the audit trail works. Aim for 4–6 log entries: several Failed ones, ending in a Paid one. Each failed entry should have a realistic note explaining why it didn't happen (e.g. "AP approver was out of office", "wire released but returned by bank", "missed treasury cut-off time").

For invoices: use ones that already exist for the customer. If the customer doesn't have enough overdue or recently-paid invoices to make the demo realistic, **create new invoice records** with appropriate amounts, due dates, and statuses. Make the data feel real — use industry-appropriate amounts, realistic dates spread over a few months.

**The demo date for all date comparisons is: May 26, 2026.**  
This means any promise with a promised date before May 26, 2026 will auto-show as Failed.

---

---

# Part 2 — How the Data Works Behind the Scenes

> Goal: Explain how promises are created, edited, and read.

---

## Adding a New Promise

When an agent fills in the Add form and saves:

- A brand new promise record is created
- It contains one log entry with status **Scheduled**
- It is added to the in-memory list immediately and appears in the collection screen

---

## Editing an Existing Promise

**The golden rule: never change or delete old log entries.**

When the agent edits a scheduled promise:

1. The existing log entry is permanently marked **Edited** — its date, amount, and note are frozen
2. A brand new **Scheduled** log entry is created with the new date, amount, and note
3. The promise's headline amount is updated to the new amount

The result: the history now shows both the old version (labelled "Edited") and the new current version side by side.

---

## Automatic Status Resolution

Every time the screen loads and reads a promise's log entries, it checks:

- If a Scheduled entry's promised date is **in the future** → leave it as Scheduled
- If a Scheduled entry's promised date **has already passed** → automatically show it as Failed
- Special case: if the promise also has a Paid entry that was logged before or on the promised date → show the old Scheduled as Paid (not Failed), because the money did actually arrive

This means agents don't have to manually mark things as Failed. The system does it based on dates.

---

## Sorting Promises in the List

When showing all promises for a customer:

1. **Active promises first** — sorted by how close their date is to today. Overdue promises and near-future ones appear at the top. Far-future ones appear lower.
2. **Settled (paid) promises last** — most recently paid appears first among them.

---

## Sorting Log Entries Within an Expanded Promise

When the agent expands a promise row to see its full history:

- If the promise is **paid**: Paid entry first, then Edited entries, then Failed entries
- If the promise is **not yet settled**: Scheduled entry first, then Edited, then Failed
- Within each group: most recent date first

---

---

# Part 3 — The Small Visual Pieces

> Goal: Describe the reusable building blocks.

Use your design system's existing components wherever there is a match. The descriptions below are behavioral — substitute the appropriate component from your system if it does the same job.

---

## Due Status Label

A small indicator that tells you how overdue or close a promise date is:

- Past due → **"Overdue by N days"** — use a red/danger visual treatment
- Due today → **"Due today"**
- Upcoming → **"Due in N days"** — use an amber/warning visual treatment

Used inline inside promise rows for Scheduled entries.

---

## Status Indicator (per log entry)

Each promise row and each timeline step has a status indicator:

- **Scheduled** → a clock icon, blue tone
- **Paid** → a checkmark icon, green tone
- **Edited** → a text label "Edited", amber tone
- **Failed** → a text label "Failed", red tone

---

## Expand Affordance

Each promise row can be expanded to show its full history. The visual cue for this works as follows:

- At rest: the row shows the status indicator normally
- On hover: the status indicator fades out and a directional arrow (chevron) fades in, indicating the row can be opened

This is a CSS transition — no layout shift, just an opacity swap. Both elements sit on top of each other.

---

## Promise Row Description Text

The sentence shown in a collapsed promise row:

| Status | Text shown |
|---|---|
| Scheduled | "Promised **$6,300** for JUN 15, 2026" + due-status label |
| Failed | "Missed promise of **$3,400** for NOV 22, 2025" |
| Edited | "Previously promised **$1,200** for APR 10, 2026" |
| Paid | "Paid **$3,400** on DEC 13, 2025" |

The amount is always bold and formatted as currency.  
Dates are formatted in uppercase short format: "JUN 15, 2026".

---

## Promise Row — Use CollectionsInvoiceRow

**Each row in the Promise to Pay list should use the `CollectionsInvoiceRow` component from your design system.**

The component should receive:
- The status indicator on the left
- The description text (sentence format above)
- The due-status label (for Scheduled entries only)
- The invoice badges on the right
- The "Update promise" action (visible on hover, only for Scheduled rows)

If the component needs to be extended or its props tweaked to fit this data shape, do so — don't force the data to fit a rigid structure that breaks the meaning.

---

## Invoice Badge

A small chip that displays an invoice ID. Two variants:

- **Clickable** — used in the list rows. Clicking opens the invoice detail. Stop the click from also triggering the row expand.
- **Static** — used inside the edit form's read-only invoice display.

Show a "+N more" overflow chip when there are more invoices than a small cap (e.g. 3 visible, rest hidden with "+2 more").

---

## Timeline Step

One step in the expanded history view. Rendered as a vertical timeline list.

Layout per step:
- **Left**: a colored circular dot/icon matching the status. A vertical connecting line runs from the bottom of the dot to the next step. The last step has no line.
- **Right**: the description sentence, the date it was logged, who logged it, and the note (in a clearly distinct inset box).

For Scheduled entries in the timeline, also show an "Update promise" button next to the description.

---

---

# Part 4 — The Add Promise to Pay Form

> Goal: Describe how adding a new promise works — inline, no new tab.

---

## How It Opens

**There is no sub-tab or drawer.** When the agent clicks the **"Add Promise to pay"** button (in the Promise to Pay section header), a form section appears **inline directly below the section header and above the promise list.**

The form feels like editing a contact inline — it's part of the page, not a popup.

Use your design system's **InlineEditField** for each input field in this form.

---

## Form Fields

---

### Field 1 — Promised to Pay Date (required)

The date the customer said they would pay by.

**Default state — four quick-pick options shown as selectable pills or buttons:**
- "In a week" — shows the actual resolved date next to the label (e.g. "Jul 1")
- "In 2 weeks" — shows the resolved date
- "In 1 month" — shows the resolved date
- "Custom date" — opens the date picker

Clicking "In a week", "In 2 weeks", or "In 1 month" selects that option and fills in the date automatically. The option button remains visually selected.

Clicking "Custom date" opens the native calendar/date picker. After the agent picks a date, a visible date field appears showing the selected value with a small × button to clear it. Clearing returns to the four quick-pick options.

When a non-custom option is selected, **do not show a separate date text field** — the selected pill is enough. The field only appears after picking a custom date.

---

### Field 2 — Amount (required)

How much the customer promised.

**Default state — three quick-pick options:**
- "Full due — $X,XXX" — the combined total of all overdue/due invoices for this customer
- "Oldest due — $X,XXX" — just the single oldest unpaid invoice's amount
- "Pay other amount" — the agent enters a custom number

Clicking "Full due" or "Oldest due":
- Selects that option
- Auto-selects the corresponding invoices in the invoice field below
- Does not show a separate amount input — the pill is enough

Clicking "Pay other amount":
- Shows a large bold input field with a currency symbol in front
- Immediately auto-focuses this field so the agent can start typing
- Does not pre-select any invoice

When the agent selects invoices manually (next field), the amount auto-updates to match their combined total — but only if the agent hasn't manually typed their own amount yet.

---

### Field 3 — Invoice (optional, appears once an amount option is chosen)

The specific invoice(s) this promise is connected to.

Show one selectable pill per unpaid/overdue invoice for this customer.  
Clicking a pill selects or deselects it.

Each pill also has a small external link icon at the right end. Clicking the icon (separately from clicking the pill itself) navigates to that invoice's detail view.

If the agent has not manually typed an amount, the amount auto-updates to the sum of whatever invoices are selected.

---

### Field 4 — Note (optional)

A small "Add note" link (with a note icon).  
Clicking it reveals a text area for the agent to write their notes.  
Once opened, it stays open. No collapse.

---

## Save and Cancel

**Save** is disabled until a date and a valid positive amount are both chosen.  
On save: the promise is created and immediately appears in the list. The form closes.

**Cancel** closes the form with no changes.

---

## Form State While Previewing an Invoice

Since the form opens inline on the same screen, the agent usually stays on the page while filling it in. If they click an invoice's link icon to preview it, keep the form state intact — either hold the form data in local screen state, or return them to the same form when they come back. A separate draft-saving mechanism is not required unless your navigation flow takes them far away from the Collection tab.

---

---

# Part 5 — The Edit Promise to Pay Form

> Goal: Describe how editing an existing active promise works — also inline.

---

## How It Opens

The agent hovers over an active (Scheduled) promise row. An **"Update promise"** link appears inline within the row. Clicking it opens the edit form **inline, immediately below that row** — not in a new tab, not in a drawer.

Use your design system's **InlineEditField** for each input.

---

## What the Form Shows

**At the top (read-only):** The invoice(s) linked to this promise, shown in a muted inset box. Not editable.

**Date field:** Starts already filled in with the current promised date. The agent can change it directly.  
If they clear it, the four quick-pick options appear.  
If they pick a preset, the date field updates and the agent can keep going.

**Amount field:** A direct currency input, pre-filled with the current amount. No preset options.

**Note field:** If the original promise had a note, the note field starts open with that note already in it. The label says **"Update note"** instead of "Add note". If there was no note, it shows the "Add note" link as normal.

---

## What Happens on Save

- The original log entry is **permanently marked as Edited** — its date, amount, and note are frozen forever in history
- A brand new Scheduled entry is created with the new values
- The promise's headline amount updates to reflect the new amount
- The form closes and the row updates in place

---

## Cancel

Closes the form. No changes made. The row returns to its normal collapsed state.

---

---

# Part 6 — The Promise to Pay List

> Goal: Describe how all promises are displayed — in one unified list, no tabs.

---

## Where It Lives

The Promise to Pay list is a **section within the Collection tab**, not a separate tab.  
It shows **all promises** for this customer — active, failed, and paid — in one list.  
There is no split between "active only" and "full history". It is all one list.

---

## Section Header

The section header contains:
- The section title: **"Promise to pay"**
- An **"Add Promise to pay"** button on the right side — clicking it opens the inline Add form

---

## The List

Each promise = one row. Uses **CollectionsInvoiceRow** from the design system.

**Collapsed row layout:**
- Left: status indicator (with the hover-chevron expand affordance)
- Middle: the description sentence (e.g. "Promised $6,300 for JUN 15, 2026") + due-status label
- Right: invoice badge chips
- On hover (Scheduled rows only): an **"Update promise"** link appears

**Expand behavior:**
- Clicking the row expands it to show the full history timeline below
- Clicking again collapses it
- The status indicator on hover shows the chevron arrow affordance

**Expanded view:**
- A vertical timeline of all log entries for this promise
- Most relevant entry first (see Part 2 for sort order)
- Each step: status dot, description sentence, logged-on date, logged-by name, note card

---

## Empty State

If the customer has no promises at all, show a simple, clean message in the section:  
"No promise-to-pay records for this customer."

---

---

# Part 7 — The Full Collection Tab Screen

> Goal: Describe the complete layout of the Collection tab.

---

## The Golden Rule: No Sub-tabs

**The Collection tab has no inner navigation tabs.**  
No "Overview" tab, no "Promise to pay" tab, no "Add Promise to pay" tab.

Everything lives on one single scrollable screen.

---

## Screen Layout (Top to Bottom)

---

### 1. AR Summary Metrics — No Title

The first thing that appears when the agent opens the Collection tab.  
**No section title or label** — it just appears as the natural start of the screen.

Show a small set of key metrics side by side. Suggested metrics:

- **Available balance** — any unapplied cash credits on this customer's account
- **Oldest outstanding** — how many days the oldest overdue invoice has been unpaid
- **Email sequence** — a compact tile showing the name of any active reminder sequence, which step it's on, and when the next email is scheduled

These three tiles sit horizontally at the top. Keep them compact.

---

### 2. Recent Comment Banner (conditional)

If the customer has any recent collection comments, show the latest unpinned one as a highlighted banner below the metrics.

Visually distinct from the rest of the screen — use a warm accent color (like a soft amber or orange tint) to make it stand out. Show the author's name, the relative date ("3 days ago"), and the comment text.

If there are no comments, this area is completely hidden. It takes up no space.

---

### 3. Promise to Pay Section

The section described in Part 6.

**Header row:**
- Section title: "Promise to pay"
- "Add Promise to pay" button on the right

**Below the header (conditional):**
- When the Add form is open: the inline Add form appears here, directly below the header and above the list
- When an Edit form is open: the inline Edit form appears directly below the specific row being edited

**The list:** all promises for this customer

---

### 4. Outstanding Invoices Section

A list of all unpaid invoices for this customer.

Each row: invoice ID, invoice date, due date, amount, and a status indicator showing whether it's overdue or upcoming and by how many days.

Title: "Outstanding Invoice"

If there are no outstanding invoices, hide this section entirely.

---

### 5. Delayed Payments Section

A list of invoices that were eventually paid, but were paid after their due date.

Each row: invoice ID, amount paid, how many days late it was, and when it was paid.

Title: "Delayed Payments"

If there are no delayed payments for this customer, hide this section entirely.

---

### 6. Email Activity Section

A timeline-style log of all reminder emails sent to this customer.

Each row: the email subject, who it was sent to, and when it was sent.

Title: "Email Activity"

If there is no email activity, hide this section.

---

## No Dock / Undock Behavior

Since there are no sub-tabs, there is no tab bar to dock or undock. Remove this behavior entirely.

---

## The "Add Promise to Pay" Button

The button lives in the Promise to Pay section header (not in a shared top bar).  
It is always visible when the section is visible.  
When the inline Add form is open, this button should either hide or become disabled (to avoid opening it twice).

---

## Actions Menu (More)

A small **"···"** icon button in the Promise to Pay section header, to the left of the "Add Promise to pay" button. Clicking it opens a small dropdown with secondary actions:

- Share Statement to Customer
- Add Task
- Manage Credits
- Record an Offline Payment
- Change Billing Alignment
- Request Payment Method Update
- Update Billing Info

These are placeholders for now — clicking any of them just closes the menu.

---

---

# Part 8 — How State Is Managed

> Goal: Explain how the screen keeps itself updated without tabs or navigation.

---

## Simple Screen State

There are no inner tabs, so the screen only needs to track whether a form is open and whether the list should refresh. State management stays simple.

---

## What Still Needs to Be Tracked

The screen needs to know:

- **Is the Add form currently open?** — so it can show or hide the inline form
- **Which promise is being edited?** — so it can show the inline Edit form in the right place
- **Has anything been saved recently?** — so the list reloads after a save

---

## The Revision Counter (Still Needed)

Promises are stored in an in-memory list that lives outside the screen's own state.  
When a promise is added or edited, the list doesn't automatically know to refresh.

Use a simple counter: every time a promise is saved, the counter goes up by 1. The list watches this counter — when it changes, the list re-reads the promise data and updates.

---

## Opening / Closing the Add Form

When the agent clicks "Add Promise to pay":
- Set a flag: "Add form is open"
- The inline form appears below the section header

When the agent saves or cancels:
- Clear the flag
- The form disappears
- If saved: increment the revision counter so the list refreshes

---

## Opening / Closing the Edit Form

When the agent clicks "Update promise" on a row:
- Store which promise ID and which log entry ID they clicked
- The inline Edit form appears below that specific row

When the agent saves or cancels:
- Clear the stored promise/log IDs
- The form disappears and the row returns to normal
- If saved: increment the revision counter

---

## Auto-Hide the Add Button When Form Is Open

When the inline Add form is visible, either hide the "Add Promise to pay" button or disable it. Prevents opening a second form on top of the first.

---

---

# Part 9 — Design System Usage Notes

> Key guidance for integrating with your existing design system.

---

## Use InlineEditField for All Form Inputs

Both the Add form and Edit form should use your design system's **InlineEditField** component for each input.

The form should feel like it belongs on the page — not like a card that dropped in from outside. Inline editing style: the fields are visible directly on the screen, in a contained but unobtrusive layout.

Do not wrap the form in a separate card or modal container. It lives flush with the section content.

---

## Use CollectionsInvoiceRow for Promise List Rows

Each row in the Promise to Pay list should use the **CollectionsInvoiceRow** component from your design system.

Map the data to the component's props:
- Status indicator → left slot
- Description sentence + due-status label → main content slot
- Invoice badges → right slot
- "Update promise" hover action → action slot

If the component requires changes to accommodate all of this, extend it — don't work around it by using a completely different approach.

---

## Use Existing Components First

For everything else — badges, buttons, section headers, timeline steps, input fields — check your design system first. Only build something custom if no existing component fits.

---

---

# Summary — Build Order

| Step | What you're building |
|---|---|
| Part 1 | The data structure — what a promise and its log entries contain |
| Part 2 | The data logic — creating, editing, auto-resolving, and sorting promises |
| Part 3 | The small visual pieces — status indicators, row text, timeline steps, invoice chips |
| Part 4 | The inline Add form — using InlineEditField, preset buttons, invoice selection |
| Part 5 | The inline Edit form — pre-filled, read-only invoice display, same inline style |
| Part 6 | The Promise to Pay list — using CollectionsInvoiceRow, expandable rows, all promises in one list |
| Part 7 | The full Collection tab screen — AR metrics, comment banner, P2P, invoices, delayed, email |
| Part 8 | State management — add/edit open flags, revision counter, no tab navigation needed |
| Part 9 | Design system alignment — InlineEditField and CollectionsInvoiceRow integration |

---

## Final Checklist

Before calling it done, verify:

- [ ] The Collection tab is one single screen — no inner tabs anywhere
- [ ] AR metrics appear at the top with no section title
- [ ] The Promise to Pay section shows all promises — active, failed, and paid — in one list
- [ ] Clicking "Add Promise to pay" opens the form inline on the same screen
- [ ] Clicking "Update promise" opens the edit form inline below that specific row
- [ ] Forms use InlineEditField components from the design system
- [ ] Rows use CollectionsInvoiceRow from the design system
- [ ] The description sentence is correct for each status (Promised / Missed / Previously promised / Paid)
- [ ] Due-status label appears on Scheduled rows
- [ ] Expanding a row shows the full timeline history
- [ ] Promises with past dates auto-show as Failed
- [ ] Editing a promise creates a new Scheduled entry and marks the old one as Edited — both visible in history
- [ ] Adding a new promise shows it immediately in the list after saving
- [ ] The recent comment banner only appears when there is a comment, and hides when there isn't
- [ ] Outstanding invoices, delayed payments, and email activity sections all hide when empty
- [ ] The actions menu (···) opens a dropdown with the secondary actions list
- [ ] No dock/undock tab bar behavior anywhere
