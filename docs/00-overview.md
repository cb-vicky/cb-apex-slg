# Product Overview & Design Intent

## Goal

Build a **customer-centric revenue workspace** for SLG (sales-led growth) companies where Quote detail and Contract detail are not isolated pages — they are different stages inside the same customer revenue lifecycle workspace.

## Core UX idea

- The **Customer** is the page shell
- Overview, Tasks, Threads, Quote, Contract, Invoicing, Payment, and RevRec are lifecycle stages inside that shell
- Opening a quote or a contract should ultimately land the user inside the same shared customer workspace
- The active stage and selected record change depending on where the user came from
- Avoid a generic "Customer details" page in the middle — the customer context is persistent across all stages

## Primary user personas

- **Billing Manager** (Admin) — approves & sends invoices, creates credit notes, resolves disputes
- **Billing Operator** — reviews, validates, holds/releases, regenerates invoices
- **Finance Ops** — audit trail, schedule review, close-readiness, records payments, matches cash, reconciles
- **AR / Collections** — follows up, promises-to-pay, escalates, resends
- **Finance Manager / CFO** — approves write-offs, reviews aging, period close approval, journal export sign-off
- **RevOps / AE / CSM** — context-only views (secondary)

The prototype does not implement permissions. Actions are present for all users. The **demo persona switcher** in TopNav (Operator / Approver) filters Workbench task visibility and some ingest CTAs.

## Realistic SLG billing context

The prototype uses realistic enterprise billing / SLG language throughout:

- prepaid commitments
- minimum commits
- usage burn-down
- overage pricing
- co-termination
- amendments
- approval routing
- invoice review states
- downstream rev rec impact

Seed customer: **Echo Corp** (AI infrastructure), with linked quote QT-2026-0042, contract CON-2024-0189, invoices, and tasks. Secondary customers (Lumina AI, Northlane Labs, Pioneer Systems, Verdant Health, Zenith Analytics) each showcase a distinct stage of the lifecycle. See `docs/08-mock-data.md` for the full use-case matrix.

## Design tone

- **Functional, aesthetic, clean** — operational workspace with Chargebee flavor
- **Strong information hierarchy** — subtle borders, neutral surfaces, restrained color
- **Readable spacing** — not spreadsheet-tight; tables and cards breathe
- **Chargebee orange** for brand/active sidebar nav; **blue** for workbench tabs and record actions
- **Typography:** Inter body, Sora for primary headings
- Status badges with restrained semantic colors

Use:
- Neutral `grey-100` / white surfaces
- Large purposeful radii (`rounded-3xl` tables, `rounded-2xl` section cards)
- Small orange accents for active sidebar states
- Icons only when useful

Avoid:
- Giant empty hero areas
- Oversized marketing cards
- Too many nested tabs
- Random charts without purpose
- Generic dashboard feel
- Legacy "tight-dense" table cramming or fixed 320px insight columns

## What "good" looks like

The final result should feel like:

- A serious customer revenue operations workspace
- A place where a billing manager or finance ops person can understand the commercial lifecycle of one customer
- Clearly customer-centric
- Still record-aware
- Designed for quote-to-cash complexity
- Useful for design review in Figma and strong enough for prototype demos

## Top-level acceptance principles

A. The page fits naturally inside the existing outer shell and content canvas.
B. No giant blank area remains; pages feel intentionally laid out.
C. Quote and Contract details share one customer-centric shell.
D. The active record is visible through tab chrome + optional action pill (`RecordHeader`).
E. The main content is different for each lifecycle stage.
F. Intelligence (NBA, AI insights, tasks) lives in **stage content** and Workbench — not a fixed right rail.
G. Uses realistic enterprise billing / SLG language throughout.
H. Feels closer to a Figma-quality prototype than a raw admin screen.
I. Every row click from any index page lands in the same customer-centric shell with the correct tab and record active.
J. Alias routes (`/quotes/:quoteId`, `/contracts/:contractId`, `/invoices/:invoiceId`) resolve to the customer shell, not standalone pages.
K. Mock data is rich enough to render all sections without empty placeholders; realistic enterprise values and edge cases are represented.

## Non-negotiable constraints

1. The outer shell already exists and should remain intact (top nav, site switcher, left sidebar, rounded content canvas).
2. Do NOT redesign or replace the outer shell.
3. Do NOT create another full-page wrapper card inside the content area.
4. Work only inside the existing main content canvas and make new layouts feel naturally fitted.
5. Revenue recognition does NOT depend on cash receipt. RevRec follows contract / billing / usage / policy.
