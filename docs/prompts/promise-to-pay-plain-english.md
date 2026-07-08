# Promise to Pay — Plain English Rebuild Guide

This document explains the "Promise to Pay" feature in plain English.  
No code. No technical terms. Just what it does, how it works, and what each piece looks like.

Use this as a reference when rebuilding the feature in any other application.  
There are **8 parts** — build them in order.

---

# What Is Promise to Pay?

When a customer hasn't paid their invoice, a collections agent will reach out to them.  
If the customer says "we'll pay by June 15th" — that is a **Promise to Pay**.

The agent records this promise in the system: the date the customer committed to, the amount, and optionally which invoice it covers.

Over time, that promise might:
- **Be kept** → the customer actually pays → the promise is marked as Paid
- **Be rescheduled** → the customer asks for more time → the agent edits the promise and sets a new date
- **Be broken** → the date passes with no payment → the system automatically marks it as Failed
- **Have a history** → one invoice might have 5 broken promises before it's finally paid

The feature tracks all of this — every attempt, every note, every reschedule — so anyone on the team can see the full story.

---

---

# Part 1 — What Information Do We Store?

> Goal: Define what a "Promise to Pay" looks like as a piece of information.

---

## A Promise (the main record)

Each promise has:

- **A unique ID** — just a reference code, e.g. "PTP-ECHO-0044"
- **Which customer it's for**
- **The amount** that was promised — this updates if the promise is rescheduled
- **Which invoices it's linked to** — can be none, one, or multiple invoices
- **A history of activity** — every revision, every failure, every payment confirmation (see below)

---

## A Log Entry (one line in the history)

Each time something happens to a promise, a new log entry is created. You never delete or overwrite old entries — you just add new ones. This creates a full audit trail.

Each log entry has:

- **A unique ID**
- **A status** — one of four possible states:
  - **Scheduled** — the promise is active and the payment date is set in the future
  - **Edited** — this entry was superseded when the agent rescheduled. It's kept for history.
  - **Failed** — the promised date passed without payment
  - **Paid** — payment was confirmed received

- **The amount for this specific entry** — so if the amount changed during a reschedule, you can see what each revision promised
- **The date the customer promised to pay by** (not for paid entries)
- **The date payment was actually received** (only for paid entries)
- **A note** — the agent's internal comment, e.g. "AP confirmed wire release; bank returned same day — reference field omitted"
- **When this entry was logged**
- **Who logged it** — the agent's name and initials

---

## The Four Statuses Explained Simply

| Status | What it means |
|---|---|
| **Scheduled** | Live active promise. A date is set. We're waiting. |
| **Edited** | This version was replaced by a newer one. Kept only so history is complete. |
| **Failed** | The promised date came and went. No payment arrived. |
| **Paid** | Money received. Promise fulfilled. |

---

## Demo Data — Four Real Examples

These are the four pre-loaded promises used to demonstrate the feature:

---

### Example 1 — EchoAI, active promise (invoice: INV-2026-0044)
- Amount: $6,300
- Promised for: June 15, 2026 — still in the future, so it stays **Scheduled**
- Note: "AP confirmed wire after Q2 close; follow up May 20 if not received"
- Logged by: Lena Patel

---

### Example 2 — EchoAI, paid after one failed attempt (invoice: INV-2026-0034)
- Amount: $1,200
- First promised for April 10, 2026 — the date passed → **Failed**
- Then paid on May 8, 2026 → **Paid**
- This shows a simple two-step story: one failure, then paid

---

### Example 3 — EchoAI, the long story (invoice: INV-2025-0258)

This is the showcase example. The same $3,400 invoice took 5 broken promises before it was finally paid. Each failure has a note explaining why:

1. Nov 22 → **Failed** — "CFO committed payment post-budget-freeze; internal approval still pending"
2. Nov 29 → **Failed** — "Wire rejected by bank — beneficiary name wrong (EchoCorp LLC vs Echo Corp Inc)"
3. Dec 5 → **Failed** — "Primary AP approver out of office; backup couldn't access the system"
4. Dec 9 → **Failed** — "Treasury missed the 2pm cut-off; rescheduled to Dec 11"
5. Dec 11 → **Failed** — "Wire released but bank returned it — PO reference was missing"
6. Dec 13 → **Paid** — "Wire received and matched. Treasury corrected the beneficiary name"

This example is important because it shows the full power of the audit trail.

---

### Example 4 — Northlane, overdue active promise (invoice: INV-2026-0040)
- Amount: $31,200
- Promised for: May 20, 2026 — this date is in the past (demo date is May 26)
- So even though it was logged as Scheduled, the system auto-detects it as **Failed**

---

---

# Part 2 — How the Data Gets Saved and Updated

> Goal: Explain the "database" logic — how we create, edit, and retrieve promises.

---

## The Demo Date

The app uses a fixed "today" of **May 26, 2026** for all date comparisons.  
This means the data always looks realistic in a prototype, regardless of when you actually open it.

---

## Adding a New Promise

When an agent clicks "Add Promise to Pay" and submits the form:

- A brand new promise record is created
- It gets one log entry with status **Scheduled**
- It's added to an in-memory list (no real database — this is a prototype)

---

## Editing an Existing Promise

This is the most important rule: **we never change or delete old log entries**.  
Instead, when the agent updates a promise:

1. The old log entry is marked as **Edited** (its date, amount, and note are frozen forever)
2. A brand new log entry is added with the new date, amount, and note — status **Scheduled**
3. The promise's headline amount is updated to reflect the new amount

This way, anyone can look at the history and see every revision that was ever made.

---

## Auto-Failing Past-Due Promises

Every time the system reads a promise, it checks each "Scheduled" log entry:

- If the promised date is **in the future** → stays Scheduled
- If the promised date has **already passed** → becomes Failed automatically
- Exception: if there's already a "Paid" entry that covers the promise date, it becomes Paid instead of Failed

This means you don't have to manually update statuses. The system figures it out based on dates.

---

## How Promises Are Sorted

When showing the list of promises for a customer, they appear in this order:

1. **Active promises first** (not yet paid) — sorted by how close their date is to today. Overdue promises and near-future promises appear at the top. Far-future promises appear lower.
2. **Settled promises last** (paid) — sorted by most recently paid first.

---

## How Log Entries Are Sorted Inside Each Promise

When you expand a promise row to see its history:

- For **paid** promises: paid entry first, then edited entries, then failed entries
- For **unpaid** promises: scheduled entry first, then edited, then failed
- Within each group: most recent first

---

---

# Part 3 — The Small Visual Building Blocks

> Goal: Describe the small reusable pieces used throughout the feature.

---

## Due Status Badge

A small colored label that tells you how close (or overdue) a date is.

- **Red** — "Overdue by 5 days" (past due)
- **Amber** — "Due in 3 days" (coming up soon)
- **Neutral** — "Due today"

Used in promise list rows to show urgency at a glance.

---

## Date Input Field (clearable)

A date picker field that also has a small **×** button on the right side.  
Clicking × clears the date and returns the field to empty.  
Used in both the Add and Edit forms.

---

## Note Textarea (auto-growing)

A text box for the agent to write a note.

- Starts at a minimum height
- Automatically grows taller as you type more text
- Stops growing at a maximum height (then scrolls inside)

---

## Invoice Badge

A small pill/chip that shows an invoice ID (e.g. "INV-2026-0044").

- **Clickable version** — used in the promise list. Clicking it opens the invoice for review.
- **Static version** — used in the edit form. Just shows the ID, not clickable.

When there are more invoices than the display cap, shows a "+2 more" overflow badge.

---

## Status Icon/Badge (per log entry)

Each log entry in a timeline has a visual indicator of its status:

- **Scheduled** — a small clock icon inside a blue circle
- **Paid** — a checkmark icon inside a solid green circle
- **Edited** — an amber-toned text label saying "Edited"
- **Failed** — a red-toned text label saying "Failed"

---

## Expandable Status Indicator (row-level)

This is a clever little element in the promise list rows.

- **Normally** it shows the status icon/badge for the most relevant log entry
- **On hover**, the status icon fades out and a chevron arrow fades in — indicating the row can be expanded

This is the visual cue that a row is clickable and will reveal more detail.

---

## Promise Row Primary Line

The main text description shown in a collapsed promise row. Written like a sentence:

- Scheduled: **"Promised $6,300 for JUN 15, 2026"** + a due-status badge ("Due in 21 days")
- Failed: **"Missed promise of $3,400 for NOV 22, 2025"**
- Edited: **"Previously promised $1,200 for APR 10, 2026"**
- Paid: **"Paid $3,400 on DEC 13, 2025"**

The amount is always shown in bold. The date is formatted in uppercase short format.

---

## Promise Timeline Step

One step inside the expanded timeline view (the detailed history).

It looks like a vertical timeline:
- A colored dot/circle on the left (color and icon match the status)
- A vertical connecting line between steps (the last step has no line below it)
- On the right: the sentence description, the date it was logged, who logged it, and the note (if any) in a small inset card

---

---

# Part 4 — The "Add Promise to Pay" Form

> Goal: Describe the form an agent fills in to record a new promise.

---

## When It Opens

Clicking the **"Add Promise to pay"** button in the Collections tab opens this form.  
It appears as a new tab in the sub-navigation (see Part 7). The tab has an × to cancel.

---

## Form Fields

---

### Field 1 — Promised to Pay Date (required)

The date the customer said they'd pay by.

**Default state — four quick-pick buttons:**
- "In a week" — shows the actual date (e.g. "Jul 1")
- "In 2 weeks" — shows the date
- "In 1 month" — shows the date
- "Custom date" — lets the agent pick any date from a calendar

Clicking "In a week", "In 2 weeks", or "In 1 month" automatically fills in the date.  
Clicking "Custom date" opens the date picker. After picking, a visible date field appears showing the selected date, with an × button to clear it and go back to the four options.

---

### Field 2 — Amount (required)

How much the customer has promised to pay.

**Default state — three quick-pick buttons:**
- "Full due — $X,XXX" — the total of all overdue/due invoices combined
- "Oldest due — $X,XXX" — just the oldest single outstanding invoice
- "Pay other amount" — the agent types in a custom number

Clicking "Full due" or "Oldest due" automatically fills in the amount AND selects the relevant invoices below.

Clicking "Pay other amount" shows a large bold input field with a $ sign in front. A "Show options" link appears (while typing) to go back to the three quick-picks.

---

### Field 3 — Invoice (optional, appears after Amount is chosen)

The specific invoice(s) this promise covers.

Shows pill buttons — one per unpaid/overdue invoice for this customer.  
Clicking a pill selects or deselects that invoice.  
Each pill has a tiny link icon on the right — clicking it opens that invoice for review (without losing the form — more on this below).

When invoices are selected and the amount hasn't been manually typed, the amount field auto-updates to match the sum of selected invoices.

---

### Field 4 — Note (optional)

A link that says **"Add note"** with a small notepad icon.  
Clicking it reveals the auto-growing note textarea.  
Once open, it stays open.

---

## Save and Cancel

**Save button** — stays disabled until:
- A date has been selected
- An amount has been chosen and is a valid positive number

Clicking Save creates the promise and closes the form. The promise immediately appears in the list.

**Cancel button** — closes the form without saving anything.

---

## Draft Preservation (the "navigate away and come back" scenario)

If the agent is filling out the form and clicks an invoice's link icon to preview it, they leave the form temporarily.  
**When they come back, the form should be exactly as they left it** — same date, same amount, same selected invoices, same note.

This is achieved by continuously saving the form's current state in the background as the agent types. When the form re-opens, it restores from that saved state.

The saved state is cleared when the agent saves or cancels.

---

---

# Part 5 — The "Edit Promise to Pay" Form

> Goal: Describe the form for rescheduling or changing an existing active promise.

---

## When It Opens

Clicking **"Update promise"** on any active (Scheduled) promise row opens this form.  
The "Update promise" text is hidden until you hover over the row — then it appears.

---

## Key Differences from the Add Form

### Shows the linked invoices at the top (read-only)

The form starts by showing which invoices are linked to this promise, in a gray inset box.  
These cannot be changed. They're just shown for context.

### Date field starts already filled in

The form shows the current promised date immediately (not the four quick-pick buttons).  
The agent can:
- Change the date directly in the field
- Clear it to get the four quick-pick buttons back
- Pick a preset (In a week, etc.) after clearing

### Amount field is always a direct input

No quick-pick buttons. Just a $ input pre-filled with the current amount.

### Note shows existing note if there is one

If the original promise had a note, the note field starts open with that note.  
The link says **"Update note"** instead of "Add note".

---

## What Happens When You Save

The original log entry is permanently marked as "Edited" (its data is frozen in the history).  
A brand new "Scheduled" log entry is created with the new date, amount, and note.  
The promise's headline amount updates to the new amount.

The history now shows both the old version (marked Edited) and the new version.

---

---

# Part 6 — The Promise List and the Pending Section

> Goal: Describe how promises are displayed in the Collections tab.

---

## The Full List (Promise to Pay sub-tab)

Shows ALL promises for the customer — active, failed, and paid.  
Each promise is one row.

---

### What a Row Looks Like

Left side:
- The status icon/badge (with the hover-chevron trick explained in Part 3)
- The sentence description ("Promised $6,300 for JUN 15, 2026" + due-status badge)
- The **"Update promise"** link (only appears on hover, only for Scheduled rows)

Right side:
- Invoice badge chips (the invoices linked to this promise)
- If more than 3 invoices: shows the first 3 and a "+N more" chip
- Clicking an invoice badge opens that invoice

---

### Expanding a Row

Clicking anywhere on the row expands it to show the full history (all log entries).  
The status icon on hover shows a chevron arrow indicating this.  
Clicking again collapses it.

The expanded area shows a vertical timeline — one step per log entry, most relevant first.  
Each step shows: what happened, when, who logged it, and any note.  
Scheduled entries in the timeline also have an "Update promise" button.

---

### Empty State

If the customer has no promises at all, the list shows a simple message:  
"No promise-to-pay records for this customer."

---

## The Pending Section (Overview sub-tab)

This is a smaller, embedded version of the list that only shows **active (Scheduled) promises** — the ones that still need action.

It appears on the main Overview tab of the Collections stage.  
If there are no active promises, this section completely hides itself (takes up no space).

The title is "Promise to pay" and it uses the same expandable row format as the full list.

---

---

# Part 7 — The Navigation Tabs and Shared State

> Goal: Describe the sub-navigation tabs inside Collections and how the whole feature shares information.

---

## The Sub-navigation Tabs

Inside the Collections tab, there are navigation pills at the top:

**Always visible:**
- **Overview** — the main summary view
- **Promise to pay** — the full list of all promises, with a count badge showing how many there are

**Flow tabs (temporary, appear only when a form is open):**
- **Add Promise to pay** — appears when the agent starts adding a new promise; has an × button to cancel
- **Edit Promise to pay** — appears when the agent starts editing an existing one; has an × button to cancel

The two flow tabs are separated from the permanent tabs by a thin vertical divider line.

Closing a flow tab (via ×) returns the agent to the previous view.

---

## Dock / Undock Behavior

When the agent scrolls down the Collections page, the sub-navigation pills scroll off the top.  
Once they're off screen, they **reappear as a sticky bar** fixed to the top of the content area — so the agent can always switch between Overview and Promise to Pay without scrolling back up.

When the agent scrolls back up, the sticky bar disappears and the inline pills reappear.

The transition between docked and inline is smooth and only triggers based on scroll direction:
- Scrolling **down** and the pills are off-screen → they dock to the top
- Scrolling **up** → they undock immediately

---

## The "Add Promise to Pay" Button and More Actions Menu

To the right of the sub-navigation pills, there are two controls:

1. **"···" more actions button** — a small icon button that opens a dropdown menu with extra actions:
   - Share Statement to Customer
   - Add Task
   - Manage Credits
   - Record an Offline Payment
   - Change Billing Alignment
   - Request Payment Method Update
   - Update Billing Info
   
   *(These are placeholders in the current version — clicking any of them just closes the menu)*

2. **"Add Promise to pay" button** — the main action button. Clicking it opens the Add form.

These two controls are only visible on the Overview and Promise to Pay tabs.  
They hide when the Add or Edit form is open.

---

## Shared State (how pieces talk to each other)

All the components in the Collections feature need to share information — for example, when the form is saved, the list needs to refresh. When the agent navigates to an invoice, the form state needs to be preserved.

This is handled by a shared "manager" that lives above all the components and holds:

- Which sub-tab is currently active
- Whether the Add form tab is open
- Which promise is being edited (if any)
- The current draft state of the Add form
- Whether the sub-nav is docked or inline
- A "revision counter" — a number that increments every time a promise is saved or edited, which triggers the list to reload itself

Actions the manager exposes:
- Open / close the Add form tab
- Open / close the Edit form tab (passing which promise and which log entry to edit)
- Refresh the list (increments the revision counter)
- Save / retrieve / clear the Add form draft
- Dock / undock the sub-navigation
- Open an invoice from within the collections flow (while preserving the form state for when you return)

---

---

# Part 8 — How It All Fits Together in the Collections Screen

> Goal: Describe the full assembled screen and the final wiring.

---

## The Screen Structure

The Collections screen (inside the customer workspace) looks like this, top to bottom:

```
[ Sub-navigation pills ]  ·····  [ Add Promise to pay button ]  [ ··· more ]
—————————————————————————————————————————————————————————————————————————————
[ Content area — changes based on which tab is active ]
```

---

## What Shows in the Content Area

**Overview tab:**
1. Recent comment banner (if the customer has any collection comments — shown as a highlighted note)
2. AR summary metrics (Available balance, Oldest outstanding, Email sequence progress)
3. Pending promises section (only the active ones — from Part 6)
4. Outstanding invoices table
5. Delayed payments section (invoices that were eventually paid late)
6. Email activity log (history of reminder emails sent)

**Promise to pay tab:**
- The full promise list (all promises including paid/failed history)

**Add Promise to pay tab:**
- The Add form (Part 4)

**Edit Promise to pay tab:**
- The Edit form (Part 5), pre-filled with the promise being edited

---

## The Revision Counter Pattern

Promises are stored in a simple in-memory list (not in the screen's own state).  
When a promise is added or edited, the screen needs to know to reload the list.

This is done with a simple counter. Every time a promise is saved:
1. The counter increments by 1
2. The list sees the counter change and reloads the promise data

This is how the list stays up to date without needing a real database.

---

## Gating — When the Collections Tab Is Hidden

If a customer has **zero invoices**, the Collections tab is disabled and hidden from the workspace navigation. There's nothing to collect if there are no invoices.

---

## Navigating to an Invoice from Inside a Promise Flow

When the agent is filling in the Add form and clicks the link icon on an invoice pill, they're taken to the invoice detail view inside the same workspace.

When they close the invoice and come back:
- If they were in the middle of the Add form, the form is still open with their draft intact
- If they were in the Edit form, that form re-opens in the state they left it

This round-trip navigation is handled by storing a "return context" before navigating away, and restoring it on return.

---

## Breadcrumb Labels for the Form Tabs

When the Add or Edit form is open as a tab, the breadcrumb at the top of the screen shows where you are:

- Add form: `"Collection · Add Promise to pay"`
- Edit form: `"Collection · Edit Promise to pay"`

Closing the tab (via ×) takes you back to the promise list.

---

---

# Summary: Build Order

| Step | What you're building |
|---|---|
| Part 1 | The information structure — what a promise and a log entry contain |
| Part 2 | The data logic — how promises are created, edited, auto-resolved, and retrieved |
| Part 3 | The small visual pieces — badges, timeline steps, date inputs, invoice chips |
| Part 4 | The Add Promise form — with preset buttons, draft saving, and invoice selection |
| Part 5 | The Edit Promise form — simpler, pre-filled, read-only invoice display |
| Part 6 | The list and the pending section — expandable rows with full history |
| Part 7 | The sub-navigation tabs and the shared state manager |
| Part 8 | Wiring everything together into the Collections screen |

---

## Final Checklist

Before calling it done, verify:

- Adding a new promise shows it in the list immediately
- Editing a promise creates a new entry and marks the old one as "Edited" — both visible in history
- Promises with past dates show as "Failed" automatically
- Expanding a row shows all log entries in order with notes
- The "Update promise" button only appears on hover and only for active promises
- The Overview tab only shows active (not-yet-fulfilled) promises
- The Promise to Pay tab shows everything including paid history
- Clicking an invoice badge opens that invoice
- The Add form remembers its state if you navigate to an invoice and come back
- The sub-nav docks when you scroll down and undocks when you scroll up
- The count badge on the "Promise to pay" tab reflects the total number of records
