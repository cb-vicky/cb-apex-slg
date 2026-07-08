/**
 * PROMISE TO PAY — ALL USER PROMPTS (CHRONOLOGICAL)
 * ===================================================
 * Every prompt given across all chat sessions that shaped the
 * Promise to Pay feature inside the Collections stage.
 *
 * Organised by session/phase. CSS-only tweaks and unrelated prompts
 * are excluded — only prompts that drove behaviour, data, or UX decisions
 * are included here.
 *
 * Sessions (oldest → newest):
 *   Phase 1  — 2f09707c  — Initial PTP section in Collections overview
 *   Phase 2  — df98a2c7  — Full Collections / PTP build-out
 *   Phase 3  — 0058236b  — Refinements: amount presets, invoice nav, style
 *   Phase 4  — 391f8dac  — Expand/collapse chevron pattern
 *   Phase 5  — c35c085d  — Deep-dive summary + rebuild prompt generation
 *   Phase 6  — 4332b6da  — Build fix (Vercel type error)
 */

// =============================================================================
// PHASE 1 — Initial Promise to Pay section in Collections overview
// Session: 2f09707c-62b8-4268-9932-f51c300b246a
// =============================================================================

export const PHASE_1_PROMPTS = [
  // [1]
  `add a new section above Outstanding Invoice as Promise to Pay (like Outstanding Invoice)

Add columns of Promised date, invoice, amount.
Add a badge due in x days or overdue by x days by cases or case basis accordingly.
Add one record with example of due in x days.`,

  // [2]
  `add a column called additional notes with some relevant data asked for promise to pay by customer.
Lets one be simple and another with long text with ellipses and show full text on hover`,

  // [3]
  `add a tab inside collections as Overview and Promise to pay like you have in tasks.
In promise to pay, use list like we used in quotes with collapsable list.

Every row will have invoice, on opening toggle will show data like attached. Have amount column.
logged on date, logged by name, Status column 2 column as paid, pending.`,

  // [4]
  `Have status as one column and show pending, paid as badge as their value.
Have this only for invoice row and not for promises row.

Logged by values should be for each promises row and not for invoice row.

Show logged on date in respective column for promise row and not as right side data.
same for logged by value too.

Have status as 2nd column before amount.`,

  // [5]
  `place the overview and promise to pay tabs in center and not right.
When user scrolls down to see the content on top, immediately, show the all tabs and
when again scroll up show these 2 tabs states.

Add some smooth animation when collection full strip with tabs introduces.

Normal state, put the overview and promise to pay tab in center.

Promise to pay tab: show the promise to pay collapsed info like
"Paid on MAY 8, 2026", "Missed promise for APR 10, 2026" in a timeline way.
do not stick this to list/column view. show the when and who did as stacked info`,

  // [6]
  `Fix scroll: when user comes down and when secondary tabs starts to hide show the
collection full strip tab, after this when user goes down and when user tries to
again come on top, then show the all tabs.

Overview and collection need to be in placed at bottom of collection,
they can be right to collection when in full strip state.
On click of collection - show the overview and promise to pay`,

  // [7]
  `good. now lets tween the animation when transition from collection selected in all
tabs to collection only full strip`,

  // [8]
  `Promise to pay tab: show the promise to pay collapsed info like Paid on MAY 8, 2026,
Missed promise for APR 10, 2026 in a timeline way.
do not stick this to list/column view. show the when and who did as stacked info`,

  // [9]
  `show pending promise to pay table (only pending data) in collection overview tab
below the AR overview section. (put similar format section)`,

  // [10]
  `when there's no promise to pay / Delayed payments data - do not show as empty section
in collection overview.
remove the section at all as it might take some space — it should be an actionable and
key insightful area.`,

  // [11]
  `merge status badge column with Promise column.`,
];


// =============================================================================
// PHASE 2 — Full Collections / PTP build-out
// Session: df98a2c7-f733-40c9-8845-ca162489d568
// =============================================================================

export const PHASE_2_PROMPTS = [
  // [1]
  `move the Overview, Promise to pay from center to left`,

  // [2]
  `in both tabs of collection tab: introduce a button like used in overview tab review invoice
(orange button) in right side. Also have more (icon button) icon in style of why this matters.

Have primary button as "Add promise to pay" and have below action in more action:
- Add Note
- Share Statement to Customer
- Add Task
- Manage Credits
- Record an Offline Payment
- Change Billing Alignment
- Request Payment Method Update
- Update Billing Info`,

  // [3]
  `fix: Add Promise to pay tab should be at collection tab level and not within collections`,

  // [4]
  `invoice field: instead of showing as dropdown field show as pills for selection`,

  // [5]
  `show preselect option for Promised to pay date. Show options like In a week, In 2 weeks,
In 1 month, Customer date. on selecting any of these can pill in as in the field like we have now.
These option will be a preset option to enter the date.
Customer date can open the date picker. Show the appropriate date next to the preset options`,

  // [6]
  `make the invoice selection non mandatory and on save, save it in promise to pay table.
after Promised to pay date selection autofocus on the amount field to allow user to enter,
on selecting of invoice to auto focus on the amount field too.

Rename as Save instead of Save promise to pay.`,

  // [7]
  `For promise to pay that are created without invoice, in table show as
"Invoice not associated" in secondary grey text`,

  // [8]
  `give edit functionality to the promise to pay date (scheduled) on edit, open Edit window
in new tab like new tab. On change of date or any value consider it as new entry and update as
another record within the timeline of that invoice.

Do not give option to edit invoice. show as not editable info. show as first info before date
while editing.

Change scheduled badge to Edited badge for the old one when it gets edited.`,

  // [9]
  `on edit, make the old value as edited badge for any time and not just for 1st time.
anytime old value should be marked as edited and only the updated new value entry should be scheduled`,

  // [10]
  `give clear option for Promised to pay date field.
on clicking clear option get back to state of showing presets`,

  // [11]
  `Add a note functionality. open the note in new tab like we did for add promise to pay.
Have a comment field. on saving comment, show that added Comment above the AR Overview.
use orange colors to highlight it as Comment. Have a pin comment checkbox to whether to pin it or not.
On pinning it should show in overview tab.

Add a section called pinned comment and show who added it, time, and added note.
Remove close button for normal tab. And have close button on hover for ephemeral tabs like
add promise to pay and add comment.`,

  // [12]
  `make the comment tab as high level with collections and not within that`,

  // [13]
  `change the add note label to add comment. Provide it within the comment tab on top as
action with orange primary button.`,

  // [14]
  `on save, cancel of promise to pay or add comment, after successful action, redirect to
same place where user came from instead of selecting the previous tab`,

  // [15]
  `collection tab - remove Total Open, Overdue card in overview.

remove subscription and internal contacts in AR Overview.

remove Collections Case, Cash Application & Reconciliation, Credits / Write-offs / Offsets section`,

  // [16]
  `put add, edit new promise to pay in secondary tabs (inside collection tab, next to promise to pay).`,

  // [17]
  `add a separator for temporary living tabs (inside collection tab, next to promise to pay).`,

  // [18]
  `Inside collection tab, next to promise to pay:
show the invoice as associated data rather than the first information.
Do not have invoice column — show the latest status like scheduled / failed / paid as first info.
On expanding show the timeline as we built it now.`,

  // [19]
  `Inside collection tab, promise to pay:
make the scheduled tag as Schedule icon and paid as green tick.`,

  // [20]
  `lets rework on how data flow in terms of UI for promise to pay.
so every add new promise to pay will have a date, amount and associated invoice.
Associated invoice is optional, we can or cannot have invoice for that.

On adding a date and amount (and optional invoice) and saving — show the entry in the list.

On editing:
  - Old date, amount, note should be preserved as "Edited" entry
  - New entry is added as "Scheduled"
  - This builds a full audit trail

On paying: the entry is marked "Paid".
On failure (date passes): auto-mark as "Failed".`,

  // [21]
  `change "Edit" to "Update promise"

Use white neutral outline light badge for invoice number and remove text "Associated".

Say "Promised $xxxx ($xxx in bold) for [Date]"

move the invoice to right side column`,

  // [22]
  `show Update promise in collapsed state only on hover.`,

  // [23]
  `remove the open collapse of promise to pay rows. let it not openable.`,

  // [24]
  `in overview tab of collection: remove the open collapse of promise to pay rows. let it not openable`,

  // [25]
  `replace the white color with grey (of overall app) in the table for Outstanding Invoice and
Delayed payments section in overview tab`,

  // [26]
  `replace the white color with grey (of overall app) in the table for Email activity and
Delayed payments section in overview tab`,

  // [27]
  `when a promise to pay is updated, old value (date and amount) should be retained in its place.
currently its getting replaced with new value.
new value can be applied only for new entry`,

  // [28]
  `show the added note in promise to pay list after opening. allow to update the note too.
where / how it works for amount and date. old value still be there and new value will also be added.
if no new value leave it empty.`,
];


// =============================================================================
// PHASE 3 — Refinements: amount presets, invoice redirect, style polish
// Session: 0058236b-48d3-46b9-910f-08d19087ec25
// =============================================================================

export const PHASE_3_PROMPTS = [
  // [1]
  `for echo corp alone add 1 more promise to pay data. with 5 fail scenarios and paid on 6th time.
apply real life like data. use invoice correctly.
We'll assume this happened last year.
If invoice need to be created, create it`,

  // [2]
  `for missed promises do not show overdue by x days.`,

  // [3]
  `have 3 options for amount. Full due, oldest due, pay other amount.

Show the amount appropriately near this value. lets reuse style of promise to pay date
in a week and date format.

on click of full due, then show and populate amount field.
till selecting 3 option do not show.

Select the invoice appropriately on selecting these 3 values.
For pay other do not select any invoice.

put the invoice pill selection after amount field.`,

  // [4]
  `on selecting pay other amount show all invoice pill but unselected`,

  // [5]
  `have redirect icon in pill of invoice to land them in respective invoice in new tab.
This alone have separate click. show it after showing value in grey lighter than text color shown by default.
add hover state for it`,

  // [6]
  `on redirect open the invoice in same browser tab. with redirect to appropriate invoice view
after invoice tab. on close of it, come back to where it was which is Add promise to pay`,

  // [7]
  `while closing the opened invoice tab, is not retaining the entered data in promise to pay data.
retain it`,

  // [8]
  `when a Promised to pay date pill is selected except customer date. do not show the date field.
let it show as selected pill.
for customer date, before showing date field show the picker and then show the field after picker selection

same for amount full due and oldest due. do not show the field`,

  // [9]
  `for secondary tabs of collection tab:
Overview and Promise to pay - can be in grey like in background and not have white BG.
selected tab can be in white replacing gradient blue.

while clicking paying other amount. amount field style can be different.
use 20px sized bold style for amount. immediately focused after clicking pay other amount.`,
];


// =============================================================================
// PHASE 4 — Expand/collapse chevron pattern
// Session: 391f8dac-cc84-4b5d-9c1f-294b3d678547
// =============================================================================

export const PHASE_4_PROMPTS = [
  // [1]
  `collection tab — promise to pay tab:

show the chevron inside on top of the existing icon (of same size) on hover to expand and collapse.
do not have as separate column for it`,
];


// =============================================================================
// PHASE 5 — Deep-dive recap + rebuild prompt generation
// Session: c35c085d-da2e-4618-afbe-365e7031091d
// =============================================================================

export const PHASE_5_PROMPTS = [
  // [1]
  `Lets deep dive in to Collections Stage — Full Rebuild (AR Overview, Promise to Pay, Sub-tabs, Dock):
Bring as much as detail possible. Read from what i asked / instructed and what was last implemented
so far successfully.`,

  // [2]
  `Create a new .ts file with a detailed prompt for each of these points of collection —
I'll use this prompt to recreate all in a different repo.

Get as much detail as you can — Do not be specific about current UI or design system,
put it generic as UI color here might not work in the place I'm gonna work.
We'll have another version later with UI detailing optimised for that repo I'm gonna work.

I'm planning on using this prompt to recreate collections from scratch without this codebase.`,
];


// =============================================================================
// PHASE 6 — Build fix
// Session: 4332b6da-6f00-4b19-80c6-698396614c86
// =============================================================================

export const PHASE_6_PROMPTS = [
  // [1]
  `Please open src/components/revenue-workspace/payment/AddPromiseToPayForm.tsx and look at line 446.

Vercel is failing to build with this error:
Type 'Element' is not assignable to type 'string | (string & ReactElement<...>) | ...'

It looks like a JSX element is being passed to a prop that expects a plain string or a different type.
Please fix this type mismatch.`,
];


// =============================================================================
// FLAT EXPORT — all prompts in one ordered array
// =============================================================================

export const ALL_PROMISE_TO_PAY_PROMPTS: string[] = [
  ...PHASE_1_PROMPTS.map((p, i) => `[Phase 1 · ${i + 1}] ${p}`),
  ...PHASE_2_PROMPTS.map((p, i) => `[Phase 2 · ${i + 1}] ${p}`),
  ...PHASE_3_PROMPTS.map((p, i) => `[Phase 3 · ${i + 1}] ${p}`),
  ...PHASE_4_PROMPTS.map((p, i) => `[Phase 4 · ${i + 1}] ${p}`),
  ...PHASE_5_PROMPTS.map((p, i) => `[Phase 5 · ${i + 1}] ${p}`),
  ...PHASE_6_PROMPTS.map((p, i) => `[Phase 6 · ${i + 1}] ${p}`),
];
