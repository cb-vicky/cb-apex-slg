# Promise to Pay — Plain English Guide

This guide covers **Promise to Pay only**.  
It does not cover other Collection tab areas such as AR summary, outstanding invoices, delayed payments, email activity, or comments.

---

## Important — Build Rules for This Phase

**Do not build or show any user interface for Promise to Pay yet.**

This phase is **data and behavior only**:
- What information exists
- How it is saved, updated, and read
- What rules apply when adding or editing a promise
- How promises and their history should be ordered and interpreted

**Do not render lists, forms, buttons, sections, rows, timelines, badges, or any visible screen elements** until you receive a separate, explicit prompt for each UI piece.

When UI work begins, it will be requested **one piece at a time** — for example:
- the promise list
- the add form
- the edit form
- a single row
- the expanded history view
- and so on

Until then, implement only the underlying logic and sample data so each UI piece can be wired in later without rework.

Use whichever customer already exists in the project. Create new invoice records only if needed for realistic overdue data.

There are **6 parts** — build them in order.

---

---

# What Is Promise to Pay?

When a customer has not paid their invoice, a collections agent may reach out to them.  
If the customer says they will pay by a specific date, that commitment is a **Promise to Pay**.

The agent records:
- the date the customer committed to
- the amount they promised
- optionally which invoice or invoices it relates to
- optionally an internal note

Over time, that promise might:
- **Be kept** → payment arrives → marked **Paid**
- **Be rescheduled** → agent updates date, amount, or note → old version stays in history as **Edited**, new version becomes **Scheduled**
- **Be broken** → promised date passes with no payment → marked **Failed** automatically
- **Build a long history** → one invoice may have several failed attempts before it is finally paid

Every attempt, note, and reschedule is kept. Nothing in the history is deleted.

---

---

# Part 1 — What Information Do We Store

> Goal: Define the data shape for a promise and its history.

---

## A Promise (the main record)

Each promise has:

- **A unique ID** — e.g. "PTP-2026-0001"
- **Which customer it belongs to**
- **The current amount** — updates when the promise is rescheduled to a different amount
- **Linked invoice IDs** — zero, one, or many. Linking is optional.
- **A history log** — all revisions and outcomes (see below)

---

## A Log Entry (one line in the history)

Each time something meaningful happens, a **new** log entry is added.  
**Old entries are never deleted or overwritten.** This is the audit trail.

Each log entry has:

- **A unique ID**
- **A status** — one of four:
  - **Scheduled** — active promise. A payment date is set and we are waiting.
  - **Edited** — this version was replaced by a newer revision. Kept for history only.
  - **Failed** — the promised date passed without payment.
  - **Paid** — payment was confirmed received.

- **Amount for this entry** — if the amount changed on reschedule, the old amount stays on the old entry
- **Promised date** — when the customer said they would pay (for Scheduled, Edited, Failed)
- **Paid date** — when payment was received (for Paid only)
- **Note** — internal agent comment for this revision
- **Logged on** — when this entry was created
- **Logged by** — agent name and initials

---

## The Four Statuses

| Status | Meaning |
|---|---|
| **Scheduled** | Active. Date is set. Waiting for payment. |
| **Edited** | Superseded by a newer revision. History only. |
| **Failed** | Promised date passed. No payment. |
| **Paid** | Payment received. Promise fulfilled. |

---

## Demo Data — What to Set Up

Create at least **three realistic promises** for the customer in your project.

**Aim for this variety:**

1. **One active promise** — promised date in the future. One log entry. Status: Scheduled. Include a short note.

2. **One recently paid promise** — one failed attempt first, then paid. Two log entries: Failed, then Paid.

3. **One with a long history** — same invoice, multiple failed attempts before paid. Aim for 4–6 log entries: several Failed, ending in Paid. Each failed entry should have a realistic note (e.g. approver out of office, wire returned by bank, missed cut-off).

Use existing invoices where possible. Create new invoice records only if the customer needs more realistic overdue or paid-late examples.

**Demo “today” for all date comparisons: May 26, 2026.**  
Any Scheduled entry with a promised date before that date should resolve as Failed (unless covered by a Paid entry — see Part 2).

---

---

# Part 2 — Data Rules: Create, Edit, Read, Sort

> Goal: How promises are added, updated, resolved, and retrieved. No UI in this part.

---

## Adding a New Promise

When a new promise is saved:

- Create a new promise record
- Add one log entry with status **Scheduled**
- Store: customer, amount, promised date, optional invoice IDs, optional note, logged-by, logged-on
- Append to the in-memory store immediately so later reads include it

---

## Editing an Existing Promise

**Golden rule: never change or delete old log entries.**

Editing is only allowed on a log entry that is currently **Scheduled**.

When an edit is saved:

1. Freeze the existing Scheduled entry — mark it **Edited**. Its date, amount, and note stay as they were at edit time.
2. Append a **new** log entry with status **Scheduled** using the new date, amount, and note.
3. Update the promise’s headline **amount** to the new amount.

If nothing actually changed (same date, amount, and note), treat as success but do not create duplicate entries.

Invoices linked to the promise **cannot be changed** on edit — they remain whatever was set when the promise was created.

---

## Automatic Status Resolution

Every time promise data is read, resolve Scheduled entries against the demo date:

- Promised date **on or after** demo today → stay **Scheduled**
- Promised date **before** demo today → become **Failed**
- **Exception:** if the promise has a **Paid** entry and that paid date is on or before the promised date for that Scheduled entry → treat that Scheduled line as **Paid** (not Failed), because payment did arrive in time relative to that promise

Agents do not manually mark Failed — the system derives it from dates.

---

## Which Invoices Can Be Linked (Add Only)

When building add logic, eligible invoices for a customer are those that are:
- Not fully paid
- Overdue, due today, due soon, pending review, or on hold — per your existing invoice status model

Invoice linking remains **optional**. A promise may have zero linked invoices.

---

## Sorting Promises for a Customer

When returning all promises for one customer:

1. **Unsettled first** (no Paid outcome yet) — ordered by how close the primary promised date is to demo today (nearest dates first, whether overdue or upcoming)
2. **Settled last** (has a Paid outcome) — most recently paid first

---

## Sorting Log Entries Within One Promise

When returning the full history for one promise:

- If **settled** (has Paid): Paid → Edited → Failed → any remaining Scheduled; within each group, newest first
- If **not settled**: Scheduled → Edited → Failed; within each group, newest first

---

## Primary Log (for summary display later)

Each promise has one **primary** log entry — the most relevant single line to represent the promise at a glance:

- Use the sorted history above and take the first entry
- This drives collapsed-row text later when UI is built — not needed visually now

---

## Open vs Settled

- **Open promise** — primary log status is **Scheduled**
- **Settled promise** — at least one log resolves to **Paid**

These flags will matter when filtering or grouping later. Implement the helpers now even if nothing is shown on screen yet.

---

## Read Path for One Customer

`get promises for customer` should:

1. Load seed promises for that customer
2. Merge any promises added at runtime during the session
3. Apply edit mutations (Edited markers, appended logs, amount overrides)
4. Run automatic status resolution on all logs
5. Sort promises and return

---

---

# Part 3 — Add Promise: Fields and Rules

> Goal: Everything required to **add** a promise. Behavior and validation only — no UI.

---

## Required Inputs

| Field | Required | Notes |
|---|---|---|
| Promised date | Yes | The date the customer committed to pay by |
| Amount | Yes | Must be a positive number |
| Invoices | No | Zero or more invoice IDs |
| Note | No | Free text |
| Logged by | Yes | Agent name (from customer billing owner or current user) |

---

## Date — Preset Options

The add flow supports quick date choices (UI will come later; implement the logic now):

- **In a week** — today + 7 days
- **In 2 weeks** — today + 14 days
- **In 1 month** — today + 1 calendar month
- **Custom date** — agent picks any date

Only one promised date is stored on save. Presets are shortcuts to compute that date.

---

## Amount — Preset Options

| Preset | Behavior |
|---|---|
| **Full due** | Sum of all eligible unpaid/overdue invoices for this customer. Auto-select all those invoices. |
| **Oldest due** | Amount of the single oldest eligible invoice (by due date). Auto-select that one invoice. |
| **Pay other amount** | Agent enters a custom amount. Do not auto-select any invoice. |

---

## Amount and Invoice Sync

- If the agent has **not** manually locked the amount, changing selected invoices recalculates amount as the sum of selected invoice amounts.
- Once the agent enters a custom amount under “pay other amount”, stop auto-recalculating from invoice selection until they reset the amount choice.

---

## Save Validation

Reject save (or keep save disabled in future UI) when:

- Promised date is missing
- Amount is missing, zero, negative, or not a valid number
- Amount preset was never chosen (for flows that use presets)

On successful save:

- Create the promise and Scheduled log entry
- Clear any in-progress add draft if you store one
- Signal that promise data changed so a future list can refresh

---

## Cancel Add

Discard in-progress add data. No promise created.

---

## Draft While Navigating Away (optional logic only)

If the agent starts adding a promise and temporarily views an invoice elsewhere, preserve the in-progress add values so they can continue later.  
Implement draft storage in logic only — no form UI yet.

---

---

# Part 4 — Edit Promise: Fields and Rules

> Goal: Everything required to **edit** an active promise. Behavior only — no UI.

---

## When Edit Is Allowed

- Only a log entry with status **Scheduled** can be edited
- Failed, Edited, and Paid entries are read-only history

---

## Editable Fields

| Field | Editable |
|---|---|
| Promised date | Yes |
| Amount | Yes |
| Note | Yes |
| Linked invoices | **No** — show for context only when UI exists |

---

## Edit — Date Presets

Same preset logic as add (in a week, 2 weeks, 1 month, custom).  
On edit, the form starts with the current promised date pre-filled.

---

## Edit — Amount

Direct amount entry only on edit — no “full due / oldest due” presets required on edit, though you may reuse them if useful.

---

## Edit — Note

If the existing log has a note, pre-fill it. Agent may change or clear it.

---

## Save Edit

On save:

1. Verify target log is still Scheduled
2. If date, amount, or note unchanged → no-op success
3. Otherwise: mark current Scheduled entry(s) on that promise as **Edited** (freeze their amount and note snapshots), append new **Scheduled** entry, update promise headline amount

---

## Cancel Edit

Discard changes. No mutations.

---

---

# Part 5 — List and History: What to Expose (No UI Yet)

> Goal: Define what a future list and expanded history will need from the data layer. Do not render anything.

---

## One Unified List

All promises for a customer live in **one list** — active, failed, and paid together.  
There is no separate “pending only” vs “full history” data split. Filtering is a view concern for later.

---

## Each Promise Row (future UI) — Data to Prepare Now

For each promise, expose:

- Promise ID
- Customer ID
- Current headline amount
- Linked invoice IDs
- Primary log (status, amount, promised date or paid date, note snippet if any)
- Full sorted log history
- Whether promise is open or settled
- Human-readable primary line text per status:

| Status | Primary line text pattern |
|---|---|
| Scheduled | "Promised {amount} for {date}" |
| Failed | "Missed promise of {amount} for {date}" |
| Edited | "Previously promised {amount} for {date}" |
| Paid | "Paid {amount} on {date}" |

Also compute for Scheduled primary logs:

- **Due status text** from promised date vs demo today:
  - Past → "Overdue by N day(s)"
  - Today → "Due today"
  - Future → "Due in N day(s)"

Do not show overdue-by text on **Failed** missed promises — only on active Scheduled.

---

## Expanded History (future UI) — Data to Prepare Now

When a row is expanded later, show **all log entries** in sort order from Part 2.

Each history step should expose:

- Status
- Amount for that entry
- Promised date or paid date
- Note (if any)
- Logged on
- Logged by name
- Whether this step is editable (Scheduled only → “update promise” action later)

---

## Empty State (future UI)

If customer has zero promises, the list is empty.  
Message for later: "No promise-to-pay records for this customer."

---

## Actions (future UI — do not build yet)

These actions will be wired when prompted:

- **Add promise** — opens add flow
- **Update promise** — opens edit flow for a Scheduled primary log
- **Expand / collapse row** — toggles full history
- **Open linked invoice** — navigates to invoice detail without losing in-progress add draft

Implement the underlying handlers as stubs if helpful, but **do not show buttons or links**.

---

---

# Part 6 — Session State (Logic Only)

> Goal: Track what the feature needs to remember during a session. No visible UI.

---

## What to Track

| State | Purpose |
|---|---|
| Is add flow in progress? | Whether add draft exists |
| Add draft values | Date, amount preset, selected invoices, note, etc. |
| Which promise is being edited? | Promise ID + log ID |
| Revision counter | Increment on every successful add or edit so future UI reloads data |

---

## Revision Counter

Promises live in module-level / store-level data, not inside a screen component.

After add or edit:
- Increment revision counter by 1
- Future UI will depend on this to know data changed

---

## After Successful Add

- Clear add-in-progress flag and draft
- Increment revision counter
- New promise appears in next read of customer promises

---

## After Successful Edit

- Clear edit target (promise ID + log ID)
- Increment revision counter
- Updated history appears in next read

---

## After Cancel

- Clear add or edit in-progress state
- No data mutation

---

---

# Summary — Build Order (This Phase)

| Step | What to build now |
|---|---|
| Part 1 | Data types, statuses, seed promises |
| Part 2 | Add, edit, resolve, sort, read helpers |
| Part 3 | Add field rules, presets, validation, draft logic |
| Part 4 | Edit rules, immutability of invoices, save/cancel logic |
| Part 5 | Primary line text, due-status text, history shape — no rendering |
| Part 6 | Session flags, draft, revision counter |

---

## What NOT to Build Until Prompted

Do **not** implement any of the following until you receive a separate prompt for each:

- [ ] Promise to Pay section or heading
- [ ] Promise list or rows
- [ ] Expand / collapse interaction
- [ ] Timeline / history layout
- [ ] Add promise form or fields on screen
- [ ] Edit promise form or fields on screen
- [ ] Save / Cancel buttons
- [ ] “Update promise” action
- [ ] Invoice chips or links on screen
- [ ] Status icons or badges
- [ ] Empty state message on screen
- [ ] Any Collection tab overview content (AR metrics, outstanding invoices, delayed payments, email, comments)

---

## Logic-Only Checklist (Before Any UI)

- [ ] Seed data: at least 3 promises with varied histories for one customer
- [ ] Add promise creates Scheduled log entry
- [ ] Edit marks old Scheduled as Edited and appends new Scheduled
- [ ] Old log amounts and notes frozen on edit
- [ ] Invoices cannot change on edit
- [ ] Past-due Scheduled entries resolve to Failed
- [ ] Paid exception prevents false Failed when payment was on time
- [ ] Customer promise list sorted: open first, settled last
- [ ] Log history sorted correctly inside each promise
- [ ] Primary log helper returns correct entry
- [ ] Primary line text correct for all four statuses
- [ ] Due-status text only on Scheduled primary logs
- [ ] Revision counter increments after add and edit
- [ ] Add draft can be saved and restored in logic
- [ ] **Nothing visible on screen for Promise to Pay yet**

---

## UI Pieces — Enable One at a Time Later

When you are ready for UI, request each item separately. Suggested order:

1. Promise list (read-only, no expand yet)
2. Single row content (primary line + invoices)
3. Row expand + history timeline
4. Add promise form
5. Edit promise form
6. Actions (add button, update promise, open invoice)
7. Empty state
8. Polish and design system alignment

Each UI prompt should reference this document for behavior and data rules.
