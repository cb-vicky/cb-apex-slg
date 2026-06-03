# Receivables cutdown branch — summary

**Branch:** `receivables-draft-1-cutdown`  
**Baseline:** `main`  
**Status:** Prototype / demo only — mock data, no backend

This doc describes what changed on the receivables cutdown branch: what was added, what was removed or simplified, and why the branch is named a **cutdown**. For seed data details, see [`15-receivables-cutdown-mock-data.md`](15-receivables-cutdown-mock-data.md).

---

## Purpose (one line)

A narrower **collections-operator demo**: customer queues, a focused Collections overview, **promise-to-pay** workflows, and **internal comments** — instead of the broader Collections layout on `main` (cases + cash matching + heavy AR table in one scroll).

---

## Why “cutdown”?

On **`main`**, the **Collections** tab tried to cover a wide quote-to-cash slice in one long page: AR summary, invoice list, **collection cases**, and **cash matching** together.

This branch **removes or hides** several of those areas and **doubles down** on a collections-operator story. Old building blocks (e.g. collection-case cards, cash application UI) may still exist in the repo but are **not shown** on Collections in this branch.

---

## What was added

### Customers list

- **Saved AR views** in the filter bar: all outstanding, overdue, aging buckets (0–30, 31–60, 61–90, 90+), high-value disputes, without billing email, current due, less likely to pay, etc.
- List is tuned for **collections queues**, not general portfolio metrics.

### Customer header (all tabs)

- **Contact avatars** under the customer name (AE, CSM, billing, collection owner) with a panel to view/reassign owner and edit extra contacts.
- **Subscription summary** hint in the header (where profile data exists).
- **Pinned collection comments** strip when comments are pinned.
- **Priority chips** simplified to **open AR** and **overdue** only.

### Collections tab — structure

- **Sub-tabs:** Overview · Promise to pay · temporary Add / Edit promise flows.
- When you **scroll down**, sub-tabs can **dock into the main Collections tab** so navigation stays visible.
- **Section quick navigator** on the left (same Notion-style line rail as Overview): jump to AR overview, promises, outstanding invoices, delayed history, email activity — only sections that exist for that customer.

### Collections → Overview

- **AR snapshot** — compact metrics (available balance, oldest outstanding) plus **email sequence** indicator where relevant.
- **Recent collection comment** banner when there is a latest unpinned comment.
- **Promise to pay** block on overview when there are open promises.
- **Outstanding invoices** table with clearer due/overdue status labels.
- **Delayed payments history** when demo data includes late-paid invoices.
- **Email activity** — collection emails with status (scheduled, seen, not seen, bounced).

### Collections → Promise to pay

- Full **list** of promise-to-pay records with status, amount, linked invoice pills, expandable **timeline** (scheduled, paid, failed, edited).
- **Add promise to pay** — pick invoices, amount, date, optional note.
- **Edit** scheduled promises.
- **Click an invoice pill** (or open from add form) → opens **Invoicing** as a child tab; closing returns to the same Collections flow.

### Comments

- New **Comments** workspace tab (when customer has invoices).
- List of internal collection comments; **add** with optional **pin**; pin/unpin from list.
- Pinned comments show in the customer header.

### Cross-tab behavior

- Opening invoice or add-comment flows uses **return context** — closing the child tab restores the prior Collections/Comments sub-tab and flow.

### Demo data

- Substantial new mock data for collections scenarios. See [`15-receivables-cutdown-mock-data.md`](15-receivables-cutdown-mock-data.md).

### Minor layout

- AI assistant **collapsed by default** on desktop (more room for workspace; not collections product logic).

---

## What was removed or no longer shown (vs `main`)

### Collections tab — whole sections

| On `main` | On this branch |
|-----------|----------------|
| **Collections workflow** — cards per collection case (stage, owner, dispute, last contact, next step) | **Not on Collections overview**; not in section navigator |
| **Cash application & reconciliation** — payments, match status, allocations, credit notes, collections timeline | **Not on Collections overview**; not in section navigator |
| Single long Collections scroll | **Sub-tabs** (Overview / Promise to pay / flows) |

### Collections — AR overview simplified

| On `main` | On this branch |
|-----------|----------------|
| **Six** top metrics + detail **“AR Overview”** card (risk, collection owner, stage, next step from primary case) | **Two** metrics + email sequence tile; case-driven owner/stage block **removed** |

### Collections — open invoices table simplified

| On `main` (“Open Receivables Ledger”) | On this branch (“Outstanding Invoice”) |
|---------------------------------------|----------------------------------------|
| Age bucket, dispute, owner columns tied to collection cases | Shorter table: due/overdue-style status only |

### Promise to pay model

| On `main` | On this branch |
|-----------|----------------|
| Promise mostly as **fields on a collection case** | **Dedicated tab**, list, add/edit, timeline, invoice links |

### Customers list

| On `main` | On this branch |
|-----------|----------------|
| **Metric strip** (active customers, renewals, open AR total, quotes pending, at-risk) | **Removed** — AR view selector drives the list instead |

### Customer header

| On `main` | On this branch |
|-----------|----------------|
| Text line for AE / CSM / billing | **Contact avatars** |
| Up to three chip types (review, enforcement, credits, renewal, held, etc.) | **Open AR + overdue only** |
| No Comments tab | **Comments** tab added |

### Section navigator (Collections)

| On `main` | On this branch |
|-----------|----------------|
| AR overview · Open receivables · **Collections** · **Cash application** | AR overview · Promise to pay · Outstanding invoice · Delayed history · Email activity |

---

## Still in specs / codebase but not in this cutdown UI

- Full **collections case management** workflow on the Collections page  
- **Cash application** and unapplied-cash matching UI on Collections  
- **Collections timeline** under cash application  
- Rich **AI next-best-actions / insights** blocks on the Collections tab itself (derivation may still exist for other tabs)

Components such as `CollectionsWorkflowSection` and `CashApplicationSection` remain in the repo but are **not wired** into `PaymentStageContent` on this branch.

---

## Commits on this branch (vs `main`)

1. Enhance Collections stage with AR overview, promise to pay, and docked sub-tabs.  
2. Polish Collections dock chrome with scroll-aware tab tweening and promise-to-pay states.  
3. Expand Collections with comments, promise-to-pay flows, contacts, and section nav.

---

## Related docs

- [`04-lifecycle-tabs.md`](04-lifecycle-tabs.md) — full Collections tab spec (long-term; cutdown is a subset)  
- [`08-mock-data.md`](08-mock-data.md) — general mock data conventions  
- [`15-receivables-cutdown-mock-data.md`](15-receivables-cutdown-mock-data.md) — seed data added on this branch  
