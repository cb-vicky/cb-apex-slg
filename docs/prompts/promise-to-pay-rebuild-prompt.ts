/**
 * PROMISE TO PAY — REBUILD PROMPT SERIES
 * =======================================
 * This file contains a series of self-contained implementation prompts to
 * recreate the full Promise to Pay (PTP) feature in any React + TypeScript
 * codebase. Execute them in order — each part builds on the previous one.
 *
 * TECH ASSUMPTIONS (adjust per repo):
 *   - React 18 + TypeScript
 *   - A component library of your choice (all UI patterns described
 *     behaviorally — no specific CSS framework or design tokens assumed)
 *   - Mock/in-memory data only — no backend API
 *   - React Context for cross-component state
 *
 * PARTS:
 *   Part 1 — Data Types & Interfaces
 *   Part 2 — Data Layer: Seed Records, Runtime Mutations, Resolvers
 *   Part 3 — Display Primitives (Status Badges, Timeline Step, Invoice Cells, Date Input)
 *   Part 4 — Add Promise to Pay Form (Full form with draft persistence)
 *   Part 5 — Edit Promise to Pay Form
 *   Part 6 — Promise to Pay List View + Pending Section
 *   Part 7 — Sub-tab Navigation & Chrome Context
 *   Part 8 — Stage Content Integration (wiring all parts into the Collections stage)
 */

// =============================================================================
// PART 1: DATA TYPES & INTERFACES
// =============================================================================
export const PART_1_DATA_TYPES = `
You are implementing the data types and interfaces for a Promise to Pay (PTP)
feature inside a Collections module of a SaaS billing/AR application.

---

## WHAT IS PROMISE TO PAY?

Promise to Pay (PTP) is a collections workflow feature. When a customer's
invoice is overdue, a collections agent calls or emails the customer and records
a "promise": the customer commits to pay a specific amount by a specific date.
Each such commitment is a PTPRecord. Over time, a single commitment may be
rescheduled (creating a log trail), broken (failed), or eventually paid.

The data model must support:
- Recording a new promise (date + amount + optional invoice links + note)
- Editing an existing scheduled promise (reschedule/change amount) — old entry
  must be preserved as "edited" (immutable log pattern)
- Automatic status resolution: past-due scheduled entries → failed
- Full audit trail per commitment (every revision visible in a timeline)
- Linking promises to 0..N invoices
- Supporting both a "summary" view (most relevant log only) and an "expanded"
  view (full timeline of all log entries per commitment)

---

## TYPES TO CREATE

Create a file at: \`src/data/billing-data.ts\`
(or extend it if it already exists — add these types at the top)

### 1. PromiseToPayEntryStatus

A string union of four states:

\`\`\`typescript
export type PromiseToPayEntryStatus = "scheduled" | "edited" | "failed" | "paid";
\`\`\`

- \`scheduled\`: Active promise. A date is set in the future (or was in the future
  when logged). This is the "live" state.
- \`edited\`: This log entry was superseded by a newer revision. The original data
  is frozen and preserved for the audit trail. Never shown as the primary entry.
- \`failed\`: The promised date passed without payment. Either set manually or
  auto-resolved by the date comparison logic.
- \`paid\`: Payment was confirmed received. Terminal state.

---

### 2. PromiseToPayLogEntry

Each revision of a promise is a log entry. A PromiseToPayRecord contains an
array of these entries.

\`\`\`typescript
export interface PromiseToPayLogEntry {
  id: string;
  status: PromiseToPayEntryStatus;

  // The amount promised in THIS revision. Optional — falls back to
  // PromiseToPayRecord.amount if not set. Frozen when status becomes "edited".
  amount?: number;

  // ISO date string (YYYY-MM-DD). The date the customer promised to pay by.
  // Only present for scheduled/edited/failed. Not present for "paid" entries.
  promisedFor?: string;

  // ISO date string. Only present when status is "paid". The actual payment date.
  paidOn?: string;

  // A collector note for this specific revision (e.g. "AP confirmed wire release;
  // bank returned same day — reference field omitted"). Frozen when edited.
  note?: string;

  // ISO date string. When this log entry was created.
  loggedOn: string;

  // The collector who logged this entry.
  loggedByName: string;
  loggedByInitials: string; // e.g. "LP" for "Lena Patel"
}
\`\`\`

---

### 3. PromiseToPayRecord

The root commitment entity. One per customer-invoice-commitment combination.

\`\`\`typescript
export interface PromiseToPayRecord {
  id: string;           // e.g. "PTP-ECHO-0044"
  customerId: string;
  amount: number;       // The canonical/current amount. Overridden at runtime
                        // when edited. Always reflects the latest revision.
  invoiceIds: string[]; // 0..N linked invoice IDs. Can be empty if not tied to
                        // a specific invoice (e.g. partial payment arrangement).
  logs: PromiseToPayLogEntry[];
}
\`\`\`

---

### 4. AddPromiseToPayParams

Input params for creating a new PTP record via the UI form.

\`\`\`typescript
export interface AddPromiseToPayParams {
  customerId: string;
  promisedDate: string;     // YYYY-MM-DD
  amount: number;
  invoiceIds: string[];
  loggedByName: string;
  note?: string;
}
\`\`\`

---

### 5. EditPromiseToPayParams

Input params for editing an existing scheduled log entry.

\`\`\`typescript
export interface EditPromiseToPayParams {
  customerId: string;
  promiseId: string;    // The PromiseToPayRecord.id
  logId: string;        // The specific PromiseToPayLogEntry.id to supersede
  promisedDate: string; // YYYY-MM-DD (new date)
  amount: number;       // New amount
  loggedByName: string;
  note?: string;
}
\`\`\`

---

### 6. DelayedPayment

A separate type for invoices that were paid after their due date
(shown in a "Delayed Payments" section in the Collections tab).

\`\`\`typescript
export interface DelayedPayment {
  customerId: string;
  invoiceId: string;
  amount: number;
  daysLate: number;   // How many days after the due date the payment arrived
  paidOn: string;     // ISO date string of payment receipt
}
\`\`\`

---

### 7. Helper functions (stubs — implement in Part 2)

Export these function signatures now:

\`\`\`typescript
export function getPromiseLogAmount(log: PromiseToPayLogEntry, recordAmount: number): number;
export function getPromiseLogNote(log: PromiseToPayLogEntry): string | undefined;
export function resolvePromiseToPayLogs(logs: PromiseToPayLogEntry[], asOf?: string): PromiseToPayLogEntry[];
export function isPromiseSettled(record: PromiseToPayRecord): boolean;
export function isPromiseOpen(record: PromiseToPayRecord): boolean;
export function sortPromiseToPayLogs(logs: PromiseToPayLogEntry[], settled?: boolean, asOf?: string): PromiseToPayLogEntry[];
export function getPrimaryPromiseToPayLog(record: PromiseToPayRecord, asOf?: string): PromiseToPayLogEntry | undefined;
export function sortPromiseToPayRecords(records: PromiseToPayRecord[]): PromiseToPayRecord[];
export function getPromiseToPayForCustomer(customerId: string): PromiseToPayRecord[];
export function findPromiseToPayLog(customerId: string, promiseId: string, logId: string): { record: PromiseToPayRecord; log: PromiseToPayLogEntry } | null;
export function addPromiseToPay(params: AddPromiseToPayParams): void;
export function editPromiseToPayLog(params: EditPromiseToPayParams): boolean;
\`\`\`

---

DONE. When this compiles cleanly, proceed to Part 2.
`;


// =============================================================================
// PART 2: DATA LAYER — SEED RECORDS, RUNTIME MUTATIONS, RESOLVERS
// =============================================================================
export const PART_2_DATA_LAYER = `
You are implementing the data layer and business logic for the Promise to Pay
feature. This builds on the types from Part 1.

All data is in-memory mock data. There is no backend API.

---

## DEMO ANCHOR DATE

The entire feature uses a fixed "demo today" for date comparisons so the data
always looks correct in a prototype regardless of actual system date:

\`\`\`typescript
export const PROMISE_TO_PAY_AS_OF = "2026-05-26";
\`\`\`

Use this constant (not \`new Date()\`) in all date comparison logic within the
resolver and sorting functions.

---

## SEED RECORDS

Create a constant \`promiseToPayRecords: PromiseToPayRecord[]\` with the
following four seed entries. These are the demo data for two customers:
\`cust_echo_001\` and \`cust_northlane_003\`.

---

### Record 1 — PTP-ECHO-0044 (cust_echo_001, active scheduled)

\`\`\`
id: "PTP-ECHO-0044"
customerId: "cust_echo_001"
amount: 6300
invoiceIds: ["INV-2026-0044"]
logs: [
  {
    id: "PTP-LOG-0044-1",
    status: "scheduled",
    amount: 6300,
    promisedFor: "2026-06-15",       // Future from demo date → stays scheduled
    note: "AP confirmed wire after Q2 close; follow up May 20 if not received.",
    loggedOn: "2026-05-11",
    loggedByName: "Lena Patel",
    loggedByInitials: "LP",
  }
]
\`\`\`

---

### Record 2 — PTP-ECHO-0034 (cust_echo_001, settled/paid)

\`\`\`
id: "PTP-ECHO-0034"
customerId: "cust_echo_001"
amount: 1200
invoiceIds: ["INV-2026-0034"]
logs: [
  {
    id: "PTP-LOG-0034-3",
    status: "paid",
    amount: 1200,
    paidOn: "2026-05-08",
    loggedOn: "2026-05-08",
    loggedByName: "Sarah Mitchell",
    loggedByInitials: "SM",
  },
  {
    id: "PTP-LOG-0034-1",
    status: "scheduled",
    amount: 1200,
    promisedFor: "2026-04-10",      // Past demo date + paid entry exists → resolves to "paid"
    loggedOn: "2026-03-28",
    loggedByName: "Lena Patel",
    loggedByInitials: "LP",
  }
]
\`\`\`

---

### Record 3 — PTP-ECHO-0258 (cust_echo_001, settled — rich 6-entry history)

This is the SHOWCASE record demonstrating the full audit trail. It represents
a real story: INV-2025-0258 for $3,400 that required 5 failed promises before
finally being paid on Dec 13, 2025.

\`\`\`
id: "PTP-ECHO-0258"
customerId: "cust_echo_001"
amount: 3400
invoiceIds: ["INV-2025-0258"]
logs: [
  {
    id: "PTP-LOG-0258-6",
    status: "paid",
    amount: 3400,
    paidOn: "2025-12-13",
    note: "Wire WT-ECHO-20251213-3400 received and matched to INV-2025-0258 after treasury corrected beneficiary to Echo Corp Inc.",
    loggedOn: "2025-12-13",
    loggedByName: "Sarah Mitchell",
    loggedByInitials: "SM",
  },
  {
    id: "PTP-LOG-0258-5",
    status: "failed",
    amount: 3400,
    promisedFor: "2025-12-11",
    note: "AP confirmed wire release; bank returned same day — reference field omitted PO-EC-2025-041 required by Echo treasury.",
    loggedOn: "2025-12-09",
    loggedByName: "Lena Patel",
    loggedByInitials: "LP",
  },
  {
    id: "PTP-LOG-0258-4",
    status: "failed",
    amount: 3400,
    promisedFor: "2025-12-09",
    note: "Treasury queued batch but missed 2:00 PM PT same-day cut-off; rescheduled to Dec 11.",
    loggedOn: "2025-12-06",
    loggedByName: "Priya Mehta",
    loggedByInitials: "PM",
  },
  {
    id: "PTP-LOG-0258-3",
    status: "failed",
    amount: 3400,
    promisedFor: "2025-12-05",
    note: "Primary AP approver OOO until Dec 8; backup approver could not access Coupa — no wire initiated.",
    loggedOn: "2025-12-02",
    loggedByName: "Lena Patel",
    loggedByInitials: "LP",
  },
  {
    id: "PTP-LOG-0258-2",
    status: "failed",
    amount: 3400,
    promisedFor: "2025-11-29",
    note: "Month-end wire rejected by receiving bank — beneficiary listed as EchoCorp LLC; billing entity is Echo Corp Inc.",
    loggedOn: "2025-11-25",
    loggedByName: "Sarah Mitchell",
    loggedByInitials: "SM",
  },
  {
    id: "PTP-LOG-0258-1",
    status: "failed",
    amount: 3400,
    promisedFor: "2025-11-22",
    note: "CFO Mira Patel committed payment post–Q4 budget freeze; internal approval still pending on Nov 21 collections call.",
    loggedOn: "2025-11-18",
    loggedByName: "Priya Mehta",
    loggedByInitials: "PM",
  },
]
\`\`\`

---

### Record 4 — PTP-NL-0040 (cust_northlane_003, past demo date → auto-fails)

\`\`\`
id: "PTP-NL-0040"
customerId: "cust_northlane_003"
amount: 31200
invoiceIds: ["INV-2026-0040"]
logs: [
  {
    id: "PTP-LOG-0040-1",
    status: "scheduled",
    amount: 31200,
    promisedFor: "2026-05-20",      // Before demo date 2026-05-26 → auto-fails
    loggedOn: "2026-05-18",
    loggedByName: "Priya Mehta",
    loggedByInitials: "PM",
  }
]
\`\`\`

---

## RUNTIME MUTATION LAYER

All UI interactions (Add, Edit) write to module-level runtime arrays/maps. The
seed data is NEVER mutated directly. The read path merges seed + runtime on
every call to \`getPromiseToPayForCustomer()\`.

Declare these at module level:

\`\`\`typescript
const runtimePromiseToPayRecords: PromiseToPayRecord[] = [];
let runtimePromiseToPayRecordCounter = 0;
let runtimePromiseToPayLogCounter = 0;

// Maps log ID → new status (for marking logs as "edited" after a revision)
const runtimeLogStatusOverrides: Record<string, PromiseToPayEntryStatus> = {};

// Array of appended logs (result of edits). Each edit appends a new log to
// the parent record.
const runtimeAppendedLogs: Array<{ promiseId: string; log: PromiseToPayLogEntry }> = [];

// When a record is edited, its canonical amount is updated here.
const runtimeRecordAmountOverrides: Record<string, number> = {};

// When a log is marked "edited", its amount at that moment is snapshotted here
// so it displays the correct historical value forever.
const runtimeLogAmountSnapshots: Record<string, number> = {};

// Same pattern for notes.
const runtimeLogNoteSnapshots: Record<string, string | undefined> = {};
\`\`\`

---

## HELPER FUNCTIONS — IMPLEMENT THESE

### getPromiseLogAmount
\`\`\`typescript
export function getPromiseLogAmount(log: PromiseToPayLogEntry, recordAmount: number): number {
  return log.amount ?? recordAmount;
}
\`\`\`
Log-level amount takes priority. Falls back to the record's canonical amount.

---

### getPromiseLogNote
\`\`\`typescript
export function getPromiseLogNote(log: PromiseToPayLogEntry): string | undefined {
  const trimmed = (log.note ?? "").trim();
  return trimmed || undefined;
}
\`\`\`
Returns undefined for empty/whitespace notes so callers can use truthiness checks.

---

### resolvePromiseToPayLogs

This function is called on every read. It auto-transitions scheduled entries
that have passed the demo anchor date into "failed" or "paid":

\`\`\`
Rules:
1. If a log is NOT "scheduled", return it unchanged.
2. If the log has no promisedFor date, return it unchanged.
3. If promisedFor >= PROMISE_TO_PAY_AS_OF (future/today), return unchanged.
4. If a "paid" entry exists in the logs AND paid.paidOn <= promisedFor,
   return this entry with status "paid" and paidOn set.
5. Otherwise (promisedFor is past and not covered by a paid entry),
   return with status "failed".
\`\`\`

\`\`\`typescript
export function resolvePromiseToPayLogs(
  logs: PromiseToPayLogEntry[],
  asOf: string = PROMISE_TO_PAY_AS_OF,
): PromiseToPayLogEntry[] {
  const paidEntry = logs.find((l) => l.status === "paid");
  return logs.map((log) => {
    if (log.status !== "scheduled" || !log.promisedFor) return log;
    if (log.promisedFor >= asOf) return log;
    if (paidEntry?.paidOn && paidEntry.paidOn <= log.promisedFor) {
      return { ...log, status: "paid" as const, paidOn: paidEntry.paidOn };
    }
    return { ...log, status: "failed" as const };
  });
}
\`\`\`

---

### isPromiseSettled
A record is settled when any of its logs is in "paid" status (after resolution).
\`\`\`typescript
export function isPromiseSettled(record: PromiseToPayRecord): boolean {
  return resolvePromiseToPayLogs(record.logs).some((l) => l.status === "paid");
}
\`\`\`

---

### isPromiseOpen
A record is "open" (still needs action) when the primary log is "scheduled".
\`\`\`typescript
export function isPromiseOpen(record: PromiseToPayRecord): boolean {
  const primary = getPrimaryPromiseToPayLog(record);
  return primary?.status === "scheduled";
}
\`\`\`

---

### sortPromiseToPayLogs

Sort logs for timeline display within an expanded row.

\`\`\`
For SETTLED records (has a paid entry):
  Order: paid → edited → failed → scheduled
  Within each group: most recent date first

For UNSETTLED records:
  Order: scheduled → edited → failed
  Within each group: most recent date first

Date used for sorting: paidOn ?? promisedFor ?? loggedOn
\`\`\`

---

### getPrimaryPromiseToPayLog
The most relevant single log to show in a collapsed list row:
\`\`\`typescript
export function getPrimaryPromiseToPayLog(record, asOf = PROMISE_TO_PAY_AS_OF) {
  return sortPromiseToPayLogs(record.logs, isPromiseSettled(record), asOf)[0];
}
\`\`\`

---

### sortPromiseToPayRecords

Sort records for the list view:
\`\`\`
Rule 1: Unsettled records before settled records.
Rule 2: Within unsettled: sort by distance from PROMISE_TO_PAY_AS_OF to the
        primary log's promisedFor, ASCENDING by Math.abs(days distance).
        This means both overdue promises and near-future promises sort first,
        with far-future promises at the end.
Rule 3: Within settled: sort by paidOn descending (most recently settled first).
Rule 4: Records with no promisedFor date sort to the end of unsettled.
\`\`\`

---

### applyRuntimePromiseToPayMutations (private helper)

Merges runtime overrides onto a list of records:

\`\`\`
For each record:
1. Gather all runtimeAppendedLogs for this record.id
2. Build a Map<logId, PromiseToPayLogEntry> from record.logs (applying
   runtimeLogStatusOverrides, runtimeLogAmountSnapshots, runtimeLogNoteSnapshots)
3. Merge in appended logs (same per-log override application).
4. Reconstruct the record with merged logs and runtimeRecordAmountOverrides
   applied to amount.
\`\`\`

---

### getPromiseToPayForCustomer (main read path)

\`\`\`typescript
export function getPromiseToPayForCustomer(customerId: string): PromiseToPayRecord[] {
  // 1. Seed records for this customer
  const seeded = promiseToPayRecords.filter((r) => r.customerId === customerId);

  // 2. Runtime-added records for this customer
  const runtime = runtimePromiseToPayRecords.filter((r) => r.customerId === customerId);

  const existing = [...seeded, ...runtime];

  // 3. Apply runtime mutations
  const withMutations = applyRuntimePromiseToPayMutations(existing);

  // 4. Auto-resolve log statuses
  const withResolved = withMutations.map((record) => ({
    ...record,
    logs: resolvePromiseToPayLogs(record.logs),
  }));

  // 5. Sort
  return sortPromiseToPayRecords(withResolved);
}
\`\`\`

NOTE: A secondary pattern (present in the reference implementation) derives
synthetic PTP records from legacy "CollectionCase" data — if a case has a
ptpDate and that invoice isn't already in an existing PTP record, it generates
a synthetic record from the case. Include this if your codebase has a
CollectionCase concept, otherwise skip.

---

### findPromiseToPayLog

\`\`\`typescript
export function findPromiseToPayLog(customerId, promiseId, logId) {
  const record = getPromiseToPayForCustomer(customerId).find((r) => r.id === promiseId);
  const log = record?.logs.find((entry) => entry.id === logId);
  if (!record || !log) return null;
  return { record, log };
}
\`\`\`

---

### addPromiseToPay

\`\`\`typescript
export function addPromiseToPay(params: AddPromiseToPayParams): void {
  const loggedOn = new Date().toISOString().slice(0, 10);
  const note = (params.note ?? "").trim();
  const log: PromiseToPayLogEntry = {
    id: \`PTP-LOG-RUNTIME-\${++runtimePromiseToPayLogCounter}\`,
    status: "scheduled",
    amount: params.amount,
    promisedFor: params.promisedDate,
    ...(note ? { note } : {}),
    loggedOn,
    loggedByName: params.loggedByName,
    loggedByInitials: ownerInitials(params.loggedByName), // helper below
  };
  runtimePromiseToPayRecords.push({
    id: \`PTP-RUNTIME-\${++runtimePromiseToPayRecordCounter}\`,
    customerId: params.customerId,
    amount: params.amount,
    invoiceIds: [...params.invoiceIds],
    logs: [log],
  });
}

function ownerInitials(name: string): string {
  return name.split(/\\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
\`\`\`

---

### editPromiseToPayLog

This is the most complex mutation. Read carefully.

\`\`\`
Logic:
1. Find the record + target log via findPromiseToPayLog.
2. Verify the log status is "scheduled". If not, return false (cannot edit non-scheduled).
3. Compute whether anything actually changed (amount, date, note). If nothing
   changed, return true without mutating anything.
4. For each log in record.logs that is currently "scheduled":
   a. Snapshot its current amount → runtimeLogAmountSnapshots[log.id]
   b. Snapshot its current note → runtimeLogNoteSnapshots[log.id]
   c. Mark it "edited" → runtimeLogStatusOverrides[log.id] = "edited"
5. Create a NEW PromiseToPayLogEntry with status "scheduled", new date/amount/note,
   logged by the current user, logged today.
6. Push the new log to runtimeAppendedLogs: { promiseId, log: newLog }
7. Update runtimeRecordAmountOverrides[promiseId] = params.amount
8. Return true.
\`\`\`

---

DONE. When all functions compile and the seed data loads correctly, proceed to Part 3.
`;


// =============================================================================
// PART 3: DISPLAY PRIMITIVES
// =============================================================================
export const PART_3_DISPLAY_PRIMITIVES = `
You are implementing the display primitive components for the Promise to Pay
feature. These are small, focused building blocks used by the list view, forms,
and timeline.

Implement each in its own file. Apply your repo's existing styling conventions.

---

## FILE 1: ReceivableDueStatusBadge

File: \`src/components/collections/ReceivableDueStatusBadge.tsx\`

This badge shows how close (or overdue) a date is, using a human-readable label
with a colored background indicating urgency.

### formatDueStatusFromDays(days: number): string

\`\`\`
Input: signed integer — positive = days until due, negative = days past due

Output:
  days < 0  → "Overdue by N day(s)"    (singular for 1)
  days = 0  → "Due today"
  days > 0  → "Due in N day(s)"        (singular for 1)
\`\`\`

### ReceivableDueStatusBadge({ label }: { label: string })

A badge component. Style it with:
- Overdue (label starts with "Overdue"): red/danger styling
- Due today or upcoming (label starts with "Due"): amber/warning styling
- Anything else: render nothing (return null)

---

## FILE 2: PromiseToPayDateInput

File: \`src/components/collections/PromiseToPayDateInput.tsx\`

A clearable date input field. Uses forwardRef.

Props:
\`\`\`typescript
type Props = {
  id: string;
  value: string;        // YYYY-MM-DD
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
};
\`\`\`

Behavior:
- Renders a \`type="date"\` input.
- When value is non-empty, shows an X (clear) button overlaid on the right side
  of the input.
- Clicking X calls onClear().
- Uses forwardRef so the parent can call \`ref.current?.showPicker?.()\` on it.

---

## FILE 3: PromiseToPayNoteTextarea

File: \`src/components/collections/PromiseToPayNoteTextarea.tsx\`

An auto-growing textarea for collector notes.

Props:
\`\`\`typescript
interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;  // default: "Add context for this promise to pay…"
}
\`\`\`

Behavior:
- Min height: 100px. Max height: 300px. No resize handle (resize-none).
- On every value change, auto-adjust height: set height to "auto", then set to
  Math.min(Math.max(el.scrollHeight, 100), 300) px.
- Use a useRef + useEffect watching \`value\` to do this.

---

## FILE 4: PromiseToPayInvoiceCell

File: \`src/components/collections/PromiseToPayInvoiceCell.tsx\`

Three export components for displaying linked invoice IDs.

### PromiseToPayInvoiceBadge

A chip/badge showing an invoice ID. Can be interactive (clickable) or static.

Props:
\`\`\`typescript
interface Props {
  invoiceId: string;
  className?: string;
  onClick?: (invoiceId: string) => void;
}
\`\`\`

When \`onClick\` is provided → render as a \`<button>\` with hover state (highlight
on hover). When not provided → render as a \`<span>\`. Both use the same badge
styling (bordered chip, small text, slightly elevated appearance).
Stop propagation on click so it doesn't trigger parent row expand.

### PromiseToPayInvoiceOverflowBadge

Shows "+N" when there are more invoices than the visible cap.

\`\`\`typescript
interface Props { count: number; className?: string; }
\`\`\`

### PromiseToPayInvoiceCell (plain text variant)

Just a \`<span>\` with bold styling for showing an invoice ID inline in forms.

---

## FILE 5: PromiseToPayAssociatedInvoices

File: \`src/components/collections/PromiseToPayAssociatedInvoices.tsx\`

Renders the invoice badge list for a PTP record. Used in both the list view
(capped) and the edit form (uncapped, non-clickable).

Props:
\`\`\`typescript
interface Props {
  invoiceIds: string[];
  className?: string;
  emptyLabel?: string;          // Text to show when invoiceIds is empty
  maxVisible?: number;          // Cap — show +N overflow badge if exceeded
  onInvoiceClick?: (invoiceId: string) => void;
}
\`\`\`

Behavior:
- If invoiceIds is empty AND emptyLabel is provided → show the emptyLabel text.
- If invoiceIds is empty AND no emptyLabel → render nothing.
- If maxVisible is provided, cap the visible badges and show a
  PromiseToPayInvoiceOverflowBadge for the remainder.
- Render badges in a horizontal row (no wrapping in list context).

---

## FILE 6: promise-to-pay-entry-ui.tsx

File: \`src/components/collections/promise-to-pay-entry-ui.tsx\`

Contains display components for individual log entries — used in both the
collapsed list row (primary line) and the expanded timeline view.

---

### PromiseToPayEntryStatusBadge({ status })

Renders the status indicator icon/badge:

\`\`\`
"scheduled": A clock icon in a circular badge — blue/info tone
"paid":      A checkmark icon in a solid circular badge — green/success tone
"edited":    A text badge saying "Edited" — amber/warning tone
"failed":    A text badge saying "Failed" — red/danger tone
\`\`\`

The clock and check use icon-in-circle style (small icon, round background).
The edited and failed are text labels with a tinted background and border.

---

### PromiseToPayExpandableStatusIndicator({ status, hasLogs, isExpanded })

A dual-layer element used in list rows:
- At rest: shows \`PromiseToPayEntryStatusBadge\`
- On row hover (uses CSS group-hover): the status badge fades out and a
  ChevronDown (if expanded) or ChevronRight (if collapsed) fades in.
- This is the expand/collapse affordance for the row.

The transition is CSS opacity only — no layout shift. Use relative positioning
with the chevron absolutely overlaid.

---

### promiseToPayLogEntryLabel(log: PromiseToPayLogEntry): string

Returns a plain-text label for a log entry (used in aria-labels etc):
\`\`\`
"paid" + paidOn:    "Paid on DEC 13, 2025"
"failed" + date:    "Missed promise for NOV 22, 2025"
any + date:         "Promised for JUN 15, 2026"
fallback:           "Promise logged"
\`\`\`
Format dates as uppercase short: "DEC 13, 2025" (use en-US locale with
{ day: "numeric", month: "short", year: "numeric" }, then toUpperCase()).

---

### PromiseToPayDueStatusBadge({ promisedFor: string })

Wraps ReceivableDueStatusBadge for a promise date. Calculates days from
PROMISE_TO_PAY_AS_OF to promisedFor and formats via formatDueStatusFromDays.

---

### PromiseToPayRowPrimaryLine({ amount, log })

The sentence-style display for the most relevant log in a collapsed row.

\`\`\`
"paid":     "Paid $6,300 on DEC 13, 2025"
            amount is bold/tabular nums; date is regular weight
"failed":   "Missed promise of $3,400 for NOV 22, 2025"
"edited":   "Previously promised $1,200 for APR 10, 2026"
"scheduled":"Promised $6,300 for JUN 15, 2026"
             + PromiseToPayDueStatusBadge inline (e.g. "Due in 21 days" badge)
\`\`\`

The amount is always formatted as currency and rendered in bold/tabular-nums
within the sentence.

---

### PromiseToPayTimelineStep({ log, amount, isLast, onEdit? })

A single step in the expanded timeline. Used inside a \`<ol>\` list.

Layout: left column (vertical dot + connecting line) + right column (content).

Left column:
- A colored circular dot/icon representing the status:
  \`\`\`
  "paid":      solid green circle with white check icon
  "edited":    light amber circle with pencil icon (amber tone)
  "failed":    light red circle with X icon (red tone)
  "scheduled": light blue circle with clock icon (blue tone)
  \`\`\`
- A vertical connecting line from the bottom of the dot to the next step.
  The LAST step (isLast = true) must NOT show this line.

Right column (stacked vertically):
1. \`PromiseToPayRowPrimaryLine\` + "Update promise" button (blue link style,
   only when status === "scheduled" AND onEdit is provided)
2. Date line: formatted loggedOn date (short format)
3. Author: loggedByName
4. Note (if present): rendered in a distinct inset card — slightly different
   background, readable text, good line height.

Export \`PROMISE_UPDATE_ACTION_LABEL = "Update promise"\` as a constant.

---

DONE. Proceed to Part 4.
`;


// =============================================================================
// PART 4: ADD PROMISE TO PAY FORM
// =============================================================================
export const PART_4_ADD_FORM = `
You are implementing the "Add Promise to Pay" form component. This is a
multi-field form that lets a collections agent record a new PTP commitment.

File: \`src/components/collections/AddPromiseToPayForm.tsx\`

---

## DRAFT PERSISTENCE

The form must persist its state while the user navigates away (e.g., clicks an
invoice to preview it) and restores the state on return. Implement this via
a draft type:

\`\`\`typescript
// src/components/collections/add-promise-draft.ts

export type AddPromiseDatePresetId = "week" | "two-weeks" | "month" | "custom";
export type AddPromiseAmountPresetId = "full-due" | "oldest-due" | "other";

export interface AddPromiseToPayDraft {
  promisedDate: string;
  datePreset: AddPromiseDatePresetId | null;
  showCustomDateField: boolean;
  amountPreset: AddPromiseAmountPresetId | null;
  showAmountInput: boolean;
  selectedInvoiceIds: string[];
  amount: string;           // string to preserve partial input (e.g. "1,2")
  amountTouched: boolean;   // true once the user manually typed an amount
  note: string;
  noteOpen: boolean;
}

export function createEmptyAddPromiseDraft(): AddPromiseToPayDraft {
  return {
    promisedDate: "",
    datePreset: null,
    showCustomDateField: false,
    amountPreset: null,
    showAmountInput: false,
    selectedInvoiceIds: [],
    amount: "",
    amountTouched: false,
    note: "",
    noteOpen: false,
  };
}
\`\`\`

The form reads from a \`savedDraft\` supplied by the parent context. On every
state change, it writes back via a \`persistAddPromiseDraft\` callback from the
context. On save or cancel, the draft is cleared via \`clearAddPromiseDraft\`.

---

## COMPONENT INTERFACE

\`\`\`typescript
interface Props {
  customerId: string;
  loggedByName: string;         // Billing owner name — pre-fills "logged by"
  invoices: Invoice[];          // All invoices for this customer (merged)
  onCancel: () => void;
  onSave: () => void;
}
\`\`\`

Access the draft via:
\`\`\`typescript
const paymentChrome = usePaymentCollectionsChrome(); // from context (Part 7)
const savedDraft = paymentChrome?.getAddPromiseDraft() ?? null;
\`\`\`

Initialize all state from savedDraft if present.

---

## HELPER: getDueOrOverdueInvoices(invoices: Invoice[]): Invoice[]

Filter invoices that are eligible for PTP association:
- Exclude "Paid" status
- Include "Overdue"
- Include any invoice where daysUntilDue <= 0
- Include "Pending Review" and "On hold"

---

## FIELDS

The form is laid out as a vertical stack of labeled form fields.

---

### Field 1: Promised to pay date (required)

Two UI states: **Preset pills mode** (default) and **Custom date field mode**.

**Preset pills mode** (showCustomDateField === false):

Render four pill buttons horizontally:
\`\`\`
| In a week    | In 2 weeks   | In 1 month   | Custom date  |
\`\`\`

Each non-custom pill shows a secondary detail text: the computed date as a
short formatted string (e.g. "Jul 1").

Clicking a non-custom preset:
- Sets datePreset to that preset ID
- Computes and sets promisedDate = today + N days/months

Clicking "Custom date":
- This is a LABEL wrapping a hidden \`type="date"\` input (opacity-0, positioned
  absolute to overlay the label). Clicking the label triggers showPicker() on
  the hidden input.
- If a custom date was already picked (promisedDate set), opens the picker again.
- After picking: sets promisedDate, sets datePreset = "custom", sets
  showCustomDateField = true, focuses the visible date field.

**Custom date field mode** (showCustomDateField === true):

Render \`PromiseToPayDateInput\` (a visible date input with X clear button).
Clicking X → clearPromisedDate():
  - Sets promisedDate = ""
  - Sets datePreset = null
  - Sets showCustomDateField = false (returns to pills mode)

---

### Field 2: Amount (required)

Two UI states: **Preset pills mode** (default) and **Amount input mode**.

**Preset pills mode**:
\`\`\`
| Full due $X,XXX | Oldest due $X,XXX | Pay other amount |
\`\`\`

"Full due": sum of ALL selectable (due/overdue) invoices. Disabled if no
  selectable invoices. Clicking → auto-selects all selectable invoices,
  sets amount = sum, amountTouched = false.

"Oldest due": the single invoice with the earliest dueDate. Disabled if none.
  Clicking → selects that one invoice, sets amount = its amount, amountTouched = false.

"Pay other amount": always enabled. Clicking → sets showAmountInput = true,
  clears selectedInvoiceIds, sets amount = "", sets amountTouched = true,
  focuses the amount input.

**Amount input mode** (showAmountInput === true):

Renders a large bold \`$\` prefix + text input (inputMode="decimal").
A "Show options" link appears (visible on focus of the input) that resets back
to preset pills mode: clearAmountSelection() — resets amountPreset, showAmountInput,
amount, amountTouched, selectedInvoiceIds.

**Auto-amount sync**: when amountTouched is false AND amountPreset !== "other",
a useEffect recomputes amount from the sum of selectedInvoiceIds. This means
if the user clicks individual invoice pills (in the Invoice field below), the
amount auto-updates as long as they haven't manually typed.

---

### Field 3: Invoice (optional, appears once amountPreset is chosen)

Show a list of selectable invoice pill buttons, one per selectable invoice.

Each pill button:
- Left: a small checkbox circle (filled blue when selected, empty otherwise;
  for overdue invoices, the empty state has a red tint)
- Middle: invoice ID + currency amount
- Right: an external link icon button — clicking it (without triggering the
  pill selection) calls paymentChrome.openInvoiceFromCollectionsFlow(invoiceId)

Toggle behavior: clicking a pill selects/deselects that invoice. If selecting,
attempt to focus the amount input (via focusAmountField helper).

---

### Field 4: Note (optional)

Initially collapsed as a text link with a sticky-note icon: "Add note".
Clicking expands a \`PromiseToPayNoteTextarea\`.
Once open, it stays open (no collapse).

---

### Save / Cancel buttons

Save button:
- Disabled when: promisedDate missing, datePreset null, custom date not
  confirmed, amountPreset null, or amount is not a valid positive number.
- On click: parse amount (strip commas), call addPromiseToPay(), call onSave().

Cancel button: calls onCancel() without mutation.

---

### canSave logic

\`\`\`typescript
const hasDateSelection =
  promisedDate.length > 0 &&
  datePreset !== null &&
  (datePreset !== "custom" || showCustomDateField);

const parsedAmount = parseFloat(amount.replace(/,/g, ""));

const canSave =
  hasDateSelection &&
  amountPreset !== null &&
  Number.isFinite(parsedAmount) &&
  parsedAmount > 0;
\`\`\`

---

DONE. Proceed to Part 5.
`;


// =============================================================================
// PART 5: EDIT PROMISE TO PAY FORM
// =============================================================================
export const PART_5_EDIT_FORM = `
You are implementing the "Edit Promise to Pay" form component. This lets a
collections agent reschedule or change the amount/note on an existing active
(scheduled) promise.

File: \`src/components/collections/EditPromiseToPayForm.tsx\`

---

## COMPONENT INTERFACE

\`\`\`typescript
interface Props {
  customerId: string;
  loggedByName: string;
  promiseId: string;             // PromiseToPayRecord.id
  logId: string;                 // PromiseToPayLogEntry.id being superseded
  invoiceIds: string[];          // From the original record (read-only display)
  initialPromisedDate: string;   // Pre-fill from existing log
  initialAmount: number;         // Pre-fill from existing log (via getPromiseLogAmount)
  initialNote?: string;          // Pre-fill from existing log (via getPromiseLogNote)
  onCancel: () => void;
  onSave: () => void;
}
\`\`\`

---

## KEY DIFFERENCES FROM ADD FORM

1. **No draft persistence** — the edit form does not need to persist state.
   It's always initialized from the existing log's values.

2. **Associated invoices field** — shows the invoice IDs linked to the original
   record as a READ-ONLY display. Use \`PromiseToPayAssociatedInvoices\` with
   emptyLabel="No invoices linked". Render it in a muted inset box.

3. **Date field starts pre-populated** — showDateField defaults to true,
   rendering \`PromiseToPayDateInput\` immediately with initialPromisedDate.
   The date preset pills only appear if the user clears the date field
   (showDateField = false). Clearing triggers: setPromisedDate(""), setShowDateField(false).
   Picking a preset recalculates and updates promisedDate, then sets showDateField = true
   and auto-focuses the amount field.

4. **Amount is always the direct input** — no preset pills. Render
   \`PrefixInput\` (or equivalent) with \`$\` prefix, initialized to
   String(initialAmount).

5. **Note open if initial note exists** — noteOpen defaults to
   \`initialNote.trim().length > 0\`. The "Add note" link text changes to
   "Update note" when initialNote has content.

---

## ON SAVE

\`\`\`typescript
function handleSave() {
  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  if (!promisedDate || !isFinite(parsedAmount) || parsedAmount <= 0) return;

  editPromiseToPayLog({
    customerId,
    promiseId,
    logId,
    promisedDate,
    amount: parsedAmount,
    loggedByName,
    note: note.trim() || undefined,
  });

  onSave();
}
\`\`\`

Note: \`editPromiseToPayLog\` marks the current scheduled log as "edited" and
appends a new "scheduled" log. The form component does not need to know this
detail — it just calls the function and delegates.

---

## canSave logic

\`\`\`typescript
const canSave =
  promisedDate.length > 0 &&
  isFinite(parseFloat(amount.replace(/,/g, ""))) &&
  parseFloat(amount.replace(/,/g, "")) > 0;
\`\`\`

---

## FORM LAYOUT

Field stack:
1. Associated invoices (read-only, shown at top)
2. Promised to pay date (required)
3. Amount (required)
4. Note (optional, collapsed by default unless initialNote)
5. Save / Cancel buttons

---

DONE. Proceed to Part 6.
`;


// =============================================================================
// PART 6: LIST VIEW + PENDING SECTION
// =============================================================================
export const PART_6_LIST_VIEW = `
You are implementing the PromiseToPayListView and PendingPromiseToPaySection
components — the primary display of all PTP records for a customer.

---

## FILE 1: PromiseToPayListView

File: \`src/components/collections/PromiseToPayListView.tsx\`

---

### Props

\`\`\`typescript
interface Props {
  promises: PromiseToPayRecord[];
  onEditScheduled?: (promiseId: string, logId: string) => void;
  /** When true, suppresses the outer card wrapper (used inside another card). */
  embedded?: boolean;
}
\`\`\`

---

### Empty state

If promises.length === 0:
- embedded mode: return null
- standalone mode: render a centered empty state with message
  "No promise-to-pay records for this customer."

---

### Layout

The table uses a two-column grid layout:
\`\`\`
Column 1 (grows): Promise description column
Column 2 (shrinks to content): Invoice badges column
\`\`\`

Use CSS grid with \`grid-cols-[minmax(0,1fr)_auto]\` or equivalent.

**Header row**: Two labels — "Promise" (left) and "Invoice" (right-aligned).
Small caps / muted styling.

**Record rows**: One row per PromiseToPayRecord. Rows are divided by a subtle
border (divide-y pattern).

---

### Row (collapsed state)

Left cell (Promise column):
\`\`\`
[PromiseToPayExpandableStatusIndicator]  [PromiseToPayRowPrimaryLine]  [Update promise button]
\`\`\`

- \`PromiseToPayExpandableStatusIndicator\`: passes status of the primaryLog,
  whether row hasLogs, and isExpanded
- \`PromiseToPayRowPrimaryLine\`: passes amount = getPromiseLogAmount(primaryLog, record.amount)
  and the log itself
- "Update promise" button: appears via CSS group-hover (opacity-0 at rest,
  opacity-100 on row hover). Only rendered when:
  - primaryLog.status === "scheduled"
  - onEditScheduled is provided
  - Row is NOT currently expanded
  Clicking calls e.stopPropagation() then onEditScheduled(record.id, primaryLog.id)

Right cell (Invoice column):
\`\`\`
[PromiseToPayAssociatedInvoices]
\`\`\`
- maxVisible = 3 (show max 3 invoice badges, +N for rest)
- onInvoiceClick → paymentChrome?.openInvoiceFromCollectionsFlow(invoiceId)

---

### Row click / expand behavior

The entire row div is the expand trigger:
- role="button", tabIndex=0
- aria-expanded={isExpanded}
- onClick → toggle(record.id) — toggles a Set<string> of expanded record IDs
- onKeyDown: Enter/Space → toggle
- cursor-pointer when rowExpandable is true

---

### Expanded state

When expanded, renders directly below the row div (still inside the same record
container):
\`\`\`
<div with slightly different background (muted gray), padding>
  <ol>
    {sortedLogs.map((log, idx) => (
      <PromiseToPayTimelineStep
        key={log.id}
        log={log}
        amount={getPromiseLogAmount(log, record.amount)}
        isLast={idx === sortedLogs.length - 1}
        onEdit={log.status === "scheduled" && onEditScheduled
          ? () => onEditScheduled(record.id, log.id)
          : undefined}
      />
    ))}
  </ol>
</div>
\`\`\`

Use \`sortPromiseToPayLogs(record.logs, settled)\` to get sorted logs.

---

### Outer wrapper

- embedded = false: wrap in a card with rounded corners, border, white background
- embedded = true: render just the list content without card chrome

---

## FILE 2: PendingPromiseToPaySection

File: \`src/components/collections/PendingPromiseToPaySection.tsx\`

A narrow wrapper that shows only OPEN (active scheduled) PTP records inside
the Collections Overview tab.

\`\`\`typescript
interface Props {
  promises: PromiseToPayRecord[];
  onEditScheduled?: (promiseId: string, logId: string) => void;
}

export function PendingPromiseToPaySection({ promises, onEditScheduled }: Props) {
  const pending = promises.filter(isPromiseOpen);
  if (pending.length === 0) return null;

  return (
    <SectionCard title="Promise to pay" bodyClassName="p-0">
      <PromiseToPayListView
        promises={pending}
        onEditScheduled={onEditScheduled}
        embedded
      />
    </SectionCard>
  );
}
\`\`\`

SectionCard is your local named-card wrapper component (title in header, children
in body). Adjust to your UI kit.

---

DONE. Proceed to Part 7.
`;


// =============================================================================
// PART 7: SUB-TAB NAVIGATION & CHROME CONTEXT
// =============================================================================
export const PART_7_CHROME_CONTEXT = `
You are implementing the navigation sub-tabs and the shared React context
(PaymentCollectionsChromeContext) that coordinates state between the Collections
stage shell and the individual tab content components.

---

## FILE 1: PaymentCollectionsSubTabs

File: \`src/components/collections/PaymentCollectionsSubTabs.tsx\`

---

### Tab type

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
  promiseToPayCount: number;   // Badge count shown on "Promise to pay" tab
  addTabOpen: boolean;         // Whether the "Add Promise to pay" flow tab is open
  editTabOpen: boolean;        // Whether the "Edit Promise to pay" flow tab is open
  onChange: (tab: PaymentCollectionsTab) => void;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
}
\`\`\`

---

### Layout

Horizontal pill-style tabs, rendered as a flex row.

Always-visible tabs:
1. **Overview** — no count badge
2. **Promise to pay** — shows a count badge when promiseToPayCount > 0

Flow tabs (ephemeral, separated by a vertical divider line):
3. **Add Promise to pay** — only when addTabOpen === true; has an × close button
4. **Edit Promise to pay** — only when editTabOpen === true; has an × close button

The vertical divider only appears when at least one flow tab is visible.

---

### SubTabPill component (internal)

Each tab is a "pill" with these states:
- Active: slightly elevated (shadow/ring), bold label text, count badge in blue tint
- Inactive: transparent background, ring border, medium weight text; count badge in gray

Flow tabs (Add/Edit) are "closable" — they have an × button on the right side
of the pill. Clicking × calls the appropriate onClose callback.
The × click must NOT trigger the tab switch (use e.stopPropagation()).

---

## FILE 2: PaymentCollectionsChromeContext

File: \`src/components/collections/PaymentCollectionsChromeContext.tsx\`

This is a React Context that acts as the nerve center for all PTP + Collections
state. It lives in the parent workspace component and is consumed by the
Collections stage content and sub-components.

---

### Context interface

\`\`\`typescript
export interface EditPromiseTarget {
  promiseId: string;
  logId: string;
}

export interface PaymentCollectionsChromeValue {
  // Active sub-tab
  collectionsTab: PaymentCollectionsTab;
  setCollectionsTab: (tab: PaymentCollectionsTab) => void;

  // Flow tab open state
  addPromiseTabOpen: boolean;
  editPromiseTarget: EditPromiseTarget | null;

  // PTP data revision counter — increment to force re-fetch in useMemo
  promiseToPayCount: number;
  promiseToPayRevision: number;
  refreshPromiseToPay: () => void;  // increments promiseToPayRevision

  // Draft persistence for Add form (survives navigation to invoice preview)
  getAddPromiseDraft: () => AddPromiseToPayDraft | null;
  persistAddPromiseDraft: (draft: AddPromiseToPayDraft) => void;
  clearAddPromiseDraft: () => void;

  // Flow tab actions
  openAddPromiseTab: () => void;
  closeAddPromiseTab: () => void;
  openEditPromiseTab: (promiseId: string, logId: string) => void;
  closeEditPromiseTab: () => void;

  // Navigation helper — opens invoice for preview while preserving the
  // current flow state for restoration on return.
  openInvoiceFromCollectionsFlow: (invoiceId: string) => void;

  // Dock/undock state for the sub-tab bar when scrolled
  subTabsDocked: boolean;
  setSubTabsDocked: (docked: boolean) => void;

  // Expand all tabs (for programmatic navigation)
  expandAllTabs: () => void;
}
\`\`\`

---

### Context setup

\`\`\`typescript
const PaymentCollectionsChromeContext =
  createContext<PaymentCollectionsChromeValue | null>(null);

export function PaymentCollectionsChromeProvider({ value, children }) {
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

The actual STATE lives in the parent workspace component (see Part 8).
This context is just the provider/consumer wiring.

---

### How the context value is assembled (in the parent workspace)

The parent workspace component declares:
\`\`\`typescript
const [paymentCollectionsTab, setPaymentCollectionsTab] =
  useState<PaymentCollectionsTab>("overview");
const [addPromiseTabOpen, setAddPromiseTabOpen] = useState(false);
const [editPromiseTarget, setEditPromiseTarget] = useState<EditPromiseTarget | null>(null);
const [paymentSubTabsDocked, setPaymentSubTabsDocked] = useState(false);
const [promiseToPayRevision, setPromiseToPayRevision] = useState(0);
const addPromiseDraftRef = useRef<AddPromiseToPayDraft | null>(null);

// flowReturnRef stores what to restore when a navigation-away (invoice view)
// is dismissed:
const flowReturnRef = useRef<{
  tab: WorkspaceTab;                      // The parent workspace tab to return to
  paymentCollectionsTab?: PaymentCollectionsTab;
  flowRecord?: { stage: string; recordId: string };
  addPromiseTabOpen?: boolean;
  editPromiseTarget?: EditPromiseTarget | null;
} | null>(null);
\`\`\`

And assembles the context value, including:

**openAddPromiseTab()**: Sets addPromiseTabOpen = true, sets collectionsTab =
  "add-promise-to-pay".

**closeAddPromiseTab()**: Sets addPromiseTabOpen = false, sets collectionsTab =
  "overview" (or "promise-to-pay" if returning from flow), clears draft.

**openEditPromiseTab(promiseId, logId)**: Sets editPromiseTarget = {promiseId, logId},
  sets collectionsTab = "edit-promise-to-pay".

**closeEditPromiseTab()**: Sets editPromiseTarget = null, sets collectionsTab =
  "promise-to-pay" (return to list view).

**refreshPromiseToPay()**: setPromiseToPayRevision(n => n + 1).

**openInvoiceFromCollectionsFlow(invoiceId)**:
  1. Store current state in flowReturnRef (current workspace tab, collectionsTab,
     addPromiseTabOpen, editPromiseTarget)
  2. Navigate the workspace to the invoicing tab with invoiceId as the active record
  3. On return (when invoice tab is closed), read flowReturnRef and restore
     collectionsTab, addPromiseTabOpen, editPromiseTarget back to saved state.

---

## DOCK/UNDOCK BEHAVIOR (explained for Part 8 implementation)

The sub-tab bar in the Collections tab content area docks to the top of the
viewport when the user scrolls down past it.

Implementation pattern using IntersectionObserver:

1. Place a sentinel \`<div ref={subTabsSentinelRef}>\` where the sub-tabs normally
   render inline in the content.
2. An IntersectionObserver watches this sentinel:
   - When sentinel exits viewport → docking CANDIDATE (scroll direction check needed)
   - When sentinel enters viewport → undock immediately
3. A separate scroll listener tracks direction (delta between current and last scrollTop):
   - delta > 1 AND sentinel not visible → setSubTabsDocked(true) (dock on scroll down)
   - delta < -1 → setSubTabsDocked(false) (undock on scroll up regardless)
4. Use requestAnimationFrame for scroll listener performance.
5. When docked: the inline sentinel goes invisible (opacity-0 pointer-events-none).
   The docked version renders in a sticky/fixed position container above the content.

The docked position renders the same PaymentCollectionsSubTabs component but in
a position that stays visible while scrolling (typically a sticky bar in the
stage header area).

---

DONE. Proceed to Part 8.
`;


// =============================================================================
// PART 8: STAGE CONTENT INTEGRATION
// =============================================================================
export const PART_8_STAGE_INTEGRATION = `
You are wiring all Promise to Pay components into the Collections stage content.
This is the final integration step.

---

## OVERVIEW: Collections Stage Layout

The Collections stage renders inside a customer workspace tab called
"Collections" (or "payment" internally). It contains:

\`\`\`
[Sub-tab bar sentinel + Actions bar]   ← always rendered at the top
[Content area — switches based on active sub-tab]
  ├── "overview" sub-tab:
  │     [RecentCollectionCommentBanner?]   ← if latest unpinned comment exists
  │     [ArOverviewSection]               ← AR summary metrics
  │     [PendingPromiseToPaySection]      ← only open PTPs
  │     [OpenReceivablesSection]          ← outstanding invoices
  │     [DelayedPaymentsSection]          ← recently paid-late invoices
  │     [EmailActivitySection]            ← email sequence log
  │
  ├── "promise-to-pay" sub-tab:
  │     [PromiseToPayListView (full)]     ← ALL PTPs, with expand/timeline
  │
  ├── "add-promise-to-pay" sub-tab:
  │     [AddPromiseToPayForm]
  │
  └── "edit-promise-to-pay" sub-tab:
        [EditPromiseToPayForm]
\`\`\`

---

## FILE: PaymentStageContent.tsx

\`\`\`typescript
interface Props {
  customer: Customer;
}

export function PaymentStageContent({ customer }: Props) {
  const chrome = usePaymentCollectionsChrome();
  const commentsChrome = useCommentsChrome(); // separate context for comments tab
  const collectionsTab = chrome?.collectionsTab ?? "overview";
  const subTabsDocked = chrome?.subTabsDocked ?? false;

  // Scroll sentinel refs for dock/undock
  const subTabsSentinelRef = useRef<HTMLDivElement>(null);
  const subTabsVisibleRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  // Data derived with useMemo — re-run when promiseToPayRevision increments
  const customerInvoices = useMemo(...);
  const summary = useMemo(() => getCustomerArSummary(customer.id, customerInvoices), [...]);
  const delayedPayments = useMemo(() => getDelayedPaymentsForCustomer(customer.id, customerInvoices), [...]);
  const emailActivity = useMemo(() => getEmailActivityForCustomer(customer.id), [customer.id]);
  const promiseToPay = useMemo(
    () => getPromiseToPayForCustomer(customer.id),
    [customer.id, chrome?.promiseToPayRevision],
  );
  const latestUnpinnedComment = useMemo(
    () => getLatestUnpinnedComment(customer.id),
    [customer.id, commentsChrome?.commentsRevision],
  );

  // Resolve the edit target record + log for the EditPromiseToPayForm
  const editPromiseTarget = chrome?.editPromiseTarget ?? null;
  const editPromiseMatch = useMemo(() => {
    if (!editPromiseTarget) return null;
    return findPromiseToPayLog(customer.id, editPromiseTarget.promiseId, editPromiseTarget.logId);
  }, [customer.id, editPromiseTarget, chrome?.promiseToPayRevision]);
\`\`\`

---

## SCROLL SENTINEL + DOCK EFFECT

\`\`\`typescript
useEffect(() => {
  const root = document.querySelector<HTMLElement>("[data-main-scroll-container]");
  const target = subTabsSentinelRef.current;
  if (!root || !target || !chrome) return;

  lastScrollTopRef.current = root.scrollTop;

  const observer = new IntersectionObserver(
    ([entry]) => {
      subTabsVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        chrome.setSubTabsDocked(false);
      }
    },
    { root, threshold: 0 },
  );
  observer.observe(target);

  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const current = root.scrollTop;
      const delta = current - lastScrollTopRef.current;
      if (delta < -1) {
        chrome.setSubTabsDocked(false);
      } else if (delta > 1 && !subTabsVisibleRef.current) {
        chrome.setSubTabsDocked(true);
      }
      lastScrollTopRef.current = current;
    });
  };

  root.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    observer.disconnect();
    root.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(raf);
  };
}, [chrome]);
\`\`\`

\`[data-main-scroll-container]\` is a data attribute on whatever scrolling
container wraps the main content area. Adjust to your app's scroll architecture.

---

## JSX STRUCTURE

\`\`\`tsx
return (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

    {/* Sentinel: this div becomes invisible when docked, but its position
        is observed by IntersectionObserver to know when to dock/undock */}
    <div
      ref={subTabsSentinelRef}
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Inline sub-tabs — hidden when docked */}
      <div style={{ opacity: subTabsDocked ? 0 : 1, pointerEvents: subTabsDocked ? "none" : "auto" }}>
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

      {/* Actions bar — only on overview and promise-to-pay tabs, not during forms */}
      {!subTabsDocked && (collectionsTab === "overview" || collectionsTab === "promise-to-pay") ? (
        <div style={{ opacity: subTabsDocked ? 0 : 1 }}>
          <PaymentCollectionsActionsBar
            onAddPromiseToPay={() => chrome?.openAddPromiseTab()}
          />
        </div>
      ) : null}
    </div>

    {/* Content area — switches based on active sub-tab */}
    {collectionsTab === "add-promise-to-pay" ? (
      <AddPromiseToPayForm
        customerId={customer.id}
        loggedByName={customer.billingOwner}
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
        onEditScheduled={(promiseId, logId) => chrome?.openEditPromiseTab(promiseId, logId)}
      />
    ) : (
      /* Overview tab */
      <>
        {latestUnpinnedComment && (
          <RecentCollectionCommentBanner comment={latestUnpinnedComment} />
        )}
        <ArOverviewSection customerId={customer.id} summary={summary} />
        <PendingPromiseToPaySection
          promises={promiseToPay}
          onEditScheduled={(promiseId, logId) => chrome?.openEditPromiseTab(promiseId, logId)}
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

## ACTIONS BAR: PaymentCollectionsActionsBar

File: \`src/components/collections/PaymentCollectionsActionsBar.tsx\`

\`\`\`typescript
interface Props {
  onAddPromiseToPay: () => void;
}
\`\`\`

Contains two elements:
1. **"···" more actions menu button**: opens a dropdown with stub action items:
   - Share Statement to Customer
   - Add Task
   - Manage Credits
   - Record an Offline Payment
   - Change Billing Alignment
   - Request Payment Method Update
   - Update Billing Info
   These are stubs — clicking just closes the menu. Click-outside closes the menu
   (addEventListener "mousedown" on document, check if target is inside menuRef).

2. **"Add Promise to pay" primary button**: calls onAddPromiseToPay().
   Style as a prominent primary action button (your repo's primary CTA style).

---

## PROVIDER SETUP IN THE PARENT WORKSPACE

The parent workspace component (wherever your customer-workspace-level routing
and state management lives) must:

1. Declare all the state variables listed in Part 7.
2. Construct the chromeValue object (implementing all the action functions).
3. Wrap the stage content in:
   \`\`\`tsx
   <PaymentCollectionsChromeProvider value={chromeValue}>
     {/* workspace content */}
   </PaymentCollectionsChromeProvider>
   \`\`\`

4. When active stage changes AWAY from "payment", reset flow state:
   \`\`\`typescript
   useEffect(() => {
     if (activeStage !== "payment") {
       setPaymentSubTabsDocked(false);
       if (!flowReturnRef.current) {
         setAddPromiseTabOpen(false);
         setEditPromiseTarget(null);
       }
     }
   }, [activeStage]);
   \`\`\`

5. Gate the Collections/payment tab: if the customer has zero invoices,
   disable the payment tab in the workspace navigation.

---

## REVISION COUNTER PATTERN (important)

The PTP data is not in React state — it's in module-level arrays in billing-data.ts.
To force React to re-render after a mutation (addPromiseToPay, editPromiseToPayLog),
increment a revision counter in React state:

\`\`\`typescript
const [promiseToPayRevision, setPromiseToPayRevision] = useState(0);
// In refreshPromiseToPay:
setPromiseToPayRevision((n) => n + 1);
\`\`\`

All useMemo calls that read PTP data include \`promiseToPayRevision\` in their
dependency array. When the counter increments, useMemo re-runs and the fresh
data from the module-level arrays is returned.

---

## BREADCRUMB / URL TAB ROUTING FOR ADD & EDIT FLOWS

In the reference implementation, the Add and Edit forms each open as a closable
"record tab" in the workspace breadcrumb navigation (like how invoices open in
record tabs). This requires:

- A \`RecordTabStage\` union that includes "payment" (not just list-detail stages).
- Special record IDs:
  - Add: a constant string like "add-promise-to-pay"
  - Edit: a compound ID encoding promiseId and logId, e.g.
    \`"edit-promise-to-pay:\${encodeURIComponent(promiseId)}|\${encodeURIComponent(logId)}"\`
- A display label function that maps these IDs to human-readable breadcrumb text:
  - "add-promise-to-pay" → "Add Promise to pay"
  - "edit-promise-to-pay:..." → "Edit Promise to pay"

If your workspace navigation supports closable record tabs, implement this pattern.
If not, the Add/Edit forms can simply render inline without breadcrumb tabs —
the sub-tab pills in \`PaymentCollectionsSubTabs\` already provide the close (×)
affordance.

---

## DONE — ALL 8 PARTS COMPLETE

Once all 8 parts are implemented and compile cleanly:

Verification checklist:
✓ Adding a new PTP record persists in the list immediately after save
✓ Editing a scheduled PTP creates a new "scheduled" log + marks old as "edited"
✓ Expanding a row shows the full timeline of all log entries with notes
✓ "Update promise" hover button on scheduled rows opens the Edit form
✓ Past-due scheduled promises auto-show as "failed" in the list
✓ Overview tab shows only OPEN (scheduled) PTPs via PendingPromiseToPaySection
✓ Promise to pay sub-tab shows ALL PTPs including settled/paid
✓ Invoice badges on list rows are clickable (navigate to invoice)
✓ Add form draft persists when navigating to an invoice and returning
✓ Sub-tab bar docks to top on scroll-down, undocks on scroll-up
✓ Count badge on "Promise to pay" sub-tab reflects total record count
`;
