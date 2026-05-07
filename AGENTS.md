# Chargebee APEX — Agent Context

This is a Vite + React + TypeScript + Tailwind + shadcn/ui prototype of **Chargebee APEX**: a customer-centric, quote-to-cash operating workspace for SLG companies (prepaid commitments, minimum commits, usage burn-down, overages, co-termination, amendments, approval routing, invoice review, downstream rev rec).

Target users: Billing, Finance Ops, RevOps, CFO.

## Core UX idea

The **Customer** is the page shell. Quote, Contract, Invoicing, Payment, and RevRec are lifecycle stages *inside* that shell, not isolated pages. Opening a quote or contract ultimately lands the user in the same shared customer workspace — the active stage and selected record differ based on entry point, but the customer context is persistent.

## Tech & structure

- Vite + React 18 + TypeScript, React Router, Tailwind, shadcn/ui
- Mock data only — no backend. State in React context + `src/data/*.ts`
- Entry: `src/App.tsx`. Shell: `src/components/layout/AppShell.tsx`

```
src/
  pages/                    # route components (index pages + detail shells)
    workbench/              # WorkbenchHome (My Tasks + Getting Started tabs), WorkbenchTaskList
  components/
    layout/                 # AppShell, TopNav, Sidebar
    revenue-workspace/      # customer-centric lifecycle shell + per-tab sections
    index-page/             # grouped landing + list table primitives
    getting-started/        # Getting Started tab (milestones, rails, etc.)
    approvals/              # invoice approval UI + ApprovalSettingsModal
    contracts/              # upload modal, closure modal + ClosureSummaryCard + ClosureBanner
    queue/                  # Inbox > Queue: integrations modal + queue UI bits
    transitions/            # IngestDrawer, IngestFieldGroup, ValidationPanel, panels/*
      sections/             # flat section components (CustomerMappingSection, BillingStructureSection, etc.)
    ui/                     # shared primitives (StatusBadge, KV, SectionCard, etc.)
  data/                     # mock-data, revrec, support, billing, ingest,
                            # queue-data, approval-policy, gettingStarted,
                            # workbench-tasks (deriveWorkbenchTasks for My Tasks)
  context/                  # IngestContext, WorkbenchRoleContext
```

## Non-negotiable constraints

1. The outer shell (top nav, site switcher, left sidebar, rounded white content canvas) is already built — **do NOT redesign or replace it**.
2. **Do NOT create a full-page wrapper card inside the content area** — work inside the existing canvas.
3. Both `/quotes/:quoteId` and `/contracts/:contractId` (and other resource-detail routes) must render the **same** `CustomerRevenueWorkspace` shell, not standalone pages.
4. All statuses, AI insights, next-best-actions, and health metrics are **derived from mock data dynamically** — never hardcoded. See `src/components/revenue-workspace/derive-stage-data.ts`.
5. Revenue recognition does **NOT** depend on cash receipt. RevRec follows contract / billing / usage / policy.

## Design tone

Enterprise, operational, calm, dense-but-readable. Not marketing, not generic CRM, not a dashboard with random charts. It should feel like a serious quote-to-cash workspace — strong information hierarchy, subtle borders, neutral surfaces, restrained color, small orange accents for active states (Chargebee brand).

Avoid: giant empty hero areas, oversized marketing cards, nested tabs, random charts, generic dashboard feel.

## Context docs — load on demand

Detailed specs are split across `docs/` so you load only what's relevant. Cursor rules in `.cursor/rules/` auto-attach docs based on which files are being edited, but you can also explicitly reference any doc with `@docs/<file>.md`.

| When you're working on… | Read… |
|---|---|
| Anything UI / polish / layout / visual tweak | `docs/02-design-system.md` |
| The outer shell (TopNav, Sidebar, AppShell) | `docs/01-shell-and-layout.md` |
| `CustomerRevenueWorkspace` or any lifecycle tab | `docs/03-customer-workspace.md` + `docs/04-lifecycle-tabs.md` |
| Deriving tab statuses, AI insights, NBAs, health | `docs/07-dynamic-status.md` |
| A module index page (Customers/Quotes/Contracts/Invoices/Approvals/Queue) | `docs/05-index-pages.md` |
| Routing, URL params, navigation flows | `docs/06-routing.md` |
| Mock data types, seed entries, use-case matrix | `docs/08-mock-data.md` |
| The Queue, contract ingestion, or first-invoice approval flow | `docs/09-contract-ingestion.md` |
| Workbench (My Tasks + Getting Started) | `docs/10-workbench-home.md` |
| Tab gating, list-then-detail behavior | `docs/11-workspace-cleanup-and-gating.md` |
| Product intent, personas, "what good looks like" | `docs/00-overview.md` |
| Open questions / assumptions / stubs | `docs/12-open-questions.md` |

`docs/archive/apex-ui-plan-original.md` preserves the full original 2,619-line plan for reference. Do not load it by default.

## Build / dev

```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

## Status

Prototype is ~75% complete functionally. Remaining work is mostly **UI finesse, layout reorganization, and visual rework** — treat `docs/02-design-system.md` and `docs/03-customer-workspace.md` as the primary references for most upcoming tasks.

**Queue / ingest / approvals:** `docs/09-contract-ingestion.md`, `docs/06-routing.md`, `docs/08-mock-data.md`, and `docs/12-open-questions.md` reflect the **full-page ingest + approval** layout (25/35/40 grid), **`ValidationPanel`** + **`ApprovalCommentsCard`** in left column, **`IngestFieldGroup`** as the canonical wrapper for ingest sections, **reduced `queue-data` seeds**, and a **Roadmap** section for renewal follow-up work.

**Recent implementation:** `IngestFieldGroup` component with status chips, flat section components (`*Section.tsx`), Late Renewal support with backdating and grace extension awareness, unified validation + group chip state.
