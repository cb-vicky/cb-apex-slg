# Receivables cutdown — mock data

**Branch:** `receivables-draft-1-cutdown`  
**Companion:** [`14-receivables-cutdown.md`](14-receivables-cutdown.md)

This doc lists **new or expanded demo data** on the receivables cutdown branch compared to `main`. All data is **mock only** — no backend. Some records can be **added in the UI during a session** (comments, new promises); those live in memory until refresh.

---

## Overview

| Change | Approx. scale |
|--------|----------------|
| New data files | 5 |
| Updated data files | 2 (`billing-data.ts`, `mock-data.ts`) |
| Net new lines (data folder vs `main`) | ~1,375 |

**On `main` there was no:** promise-to-pay record store, delayed-payment history, collection comments, AR contact profiles, email activity, or email sequence data.

**On `main` there already was:** collection cases, payments, credit notes — still present; this branch **adds** collections-focused data on top.

---

## New files

### `src/data/collections-comments.ts`

- Internal **collection comments** per customer (author, body, timestamp, pinned flag).
- **Seeded:** one pinned comment for **Echo Corp** (AP / escalation context).
- **Runtime:** `addCollectionComment`, pin/unpin — session-only.

### `src/data/collections-ar-profile.ts`

Per-customer **collections profile** for header chrome:

- **Collection owner** and reassign options (shared owner pool).
- **Internal contacts** (primary, secondary, additional).
- **Subscription summary** counts and detail groups for header popover.

**Rich profiles:**

| Customer | Highlights |
|----------|------------|
| Echo Corp | Multiple internal contacts; active + paused subscriptions |
| Northlane Labs | Active + past-due subscription |
| Verdant Health | Active + scheduled renewal |

**Other customers:** default profile (generic contacts + one active subscription).

### `src/data/collections-email-activity.ts`

Collection **email send/read/bounce** history per customer.

| Customer | Activity |
|----------|----------|
| Echo Corp | 7 items (scheduled, not seen, seen, bounced mix) |
| Northlane Labs | 4 items |
| Lumina AI | 3 items |
| Verdant Health | 2 items |

### `src/data/collections-email-sequence.ts`

**Dunning / reminder sequences** (named sequence + step list with subject, sent/scheduled, date).

| Customer | Sequence name (example) |
|----------|---------------------------|
| Echo Corp | Enterprise US Accounts |
| Northlane Labs | Standard overdue track |
| Lumina AI | Mid-market reminders |

### `src/data/customer-list-views.ts`

**Not seed rows** — rules and labels for Customers index **saved views**:

- All Outstanding, Overdue, High value disputes, Without billing email, Current Due  
- Aged 0–30, 31–60, 61–90, 90+ days  
- Less likely to pay  

Filters derive from existing customers, invoices, collection cases, and AR profiles.

---

## Updated files

### `src/data/billing-data.ts` (~600+ lines added)

#### Promise to pay (new)

Structured **promise records** with linked invoices, amounts, and **log timeline** (scheduled, paid, failed, edited, notes, logged-by).

**Seeded records:**

| Customer | Records | Demo story |
|----------|---------|------------|
| Echo Corp | 3 | Open scheduled promise; paid promise; long failed-then-paid arc on INV-2025-0258 |
| Northlane Labs | 1 | Scheduled promise on overdue invoice |

**Runtime:** add/edit via UI → `runtimePromiseToPayRecords` (session-only).

**Merge behavior:** `getPromiseToPayForCustomer` also surfaces promises implied by legacy **collection cases** with PTP dates where applicable.

**Reference date:** `PROMISE_TO_PAY_AS_OF = "2026-05-26"` — drives scheduled vs paid resolution in demos.

#### Delayed payments (new)

Invoices **paid after due date** (invoice id, amount, days late, paid-on date).

| Customer | Example invoice |
|----------|-----------------|
| Echo Corp | INV-2025-0258 (12 days late) |
| Verdant Health | INV-2025-0310 (14 days late) |
| Northlane Labs | INV-2025-0142 (21 days late) |

#### Unchanged on disk (still used elsewhere)

- `collectionCases`, `payments`, `creditNotes` — existed on `main`; UI for cash/cases removed from Collections cutdown, data retained.

---

### `src/data/mock-data.ts`

**One new invoice:**

| Id | Customer | Amount | Status | Role in demo |
|----|----------|--------|--------|--------------|
| INV-2025-0258 | Echo Corp | $3,400 | Paid | Delayed payment row + promise-to-pay timeline (failures then paid) |

---

## Customer coverage matrix

| Customer | Comments | AR profile | Email activity | Email sequence | Promises (seed) | Delayed pay |
|----------|:--------:|:----------:|:--------------:|:--------------:|:---------------:|:-----------:|
| Echo Corp | ✓ (1 pinned) | Rich | ✓ | ✓ | 3 | ✓ |
| Northlane Labs | — | Rich | ✓ | ✓ | 1 | ✓ |
| Verdant Health | — | Rich | ✓ | — | — | ✓ |
| Lumina AI | — | Default | ✓ | ✓ | — | — |
| Others | — | Default | — | — | — | — |

**Echo Corp** is the primary showcase customer for collections demos.

---

## Session-only data (not in seed files)

| Action in UI | Stored in | Persists after refresh? |
|--------------|-----------|-------------------------|
| Add collection comment | `collections-comments.ts` runtime array | No |
| Add promise to pay | `billing-data.ts` runtime array | No |
| Edit promise / pin comment | Same runtime stores | No |

---

## File map (quick reference)

```
src/data/
  collections-comments.ts      # Comments + pin state
  collections-ar-profile.ts    # Owners, contacts, subscriptions
  collections-email-activity.ts
  collections-email-sequence.ts
  customer-list-views.ts       # Index view rules (not raw entities)
  billing-data.ts              # + promiseToPayRecords, delayedPayments, helpers
  mock-data.ts                 # + INV-2025-0258
```

---

## Related docs

- [`08-mock-data.md`](08-mock-data.md) — types, relationships, use-case matrix  
- [`14-receivables-cutdown.md`](14-receivables-cutdown.md) — UI and product cutdown summary  
