# Chargebee APEX — Agent Context

This is a Vite + React + TypeScript + Tailwind + shadcn/ui prototype of **Chargebee APEX**: a customer-centric, quote-to-cash operating workspace for SLG companies (prepaid commitments, minimum commits, usage burn-down, overages, co-termination, amendments, approval routing, invoice review, downstream rev rec).

Target users: Billing, Finance Ops, RevOps, CFO.

## Core UX idea

The **Customer** is the page shell. Overview, Tasks, Threads, Quote, Contract, Invoicing, Payment, and RevRec are lifecycle stages *inside* that shell, not isolated pages. Opening a quote or contract ultimately lands the user in the same shared customer workspace — the active stage and selected record differ based on entry point, but the customer context is persistent.

## Tech & structure

- Vite + React 18 + TypeScript, React Router, Tailwind, shadcn/ui
- Mock data only — no backend. State in React context + `src/data/*.ts` + `src/store/drawer-store.ts`
- Entry: `src/App.tsx`. Shell: `src/components/layout/AppShell.tsx`

```
src/
  pages/                    # route components (index pages + detail shells)
    workbench/              # WorkbenchHome (Your tasks | Queue | Approvals), tab content
  components/
    layout/                 # AppShell, TopNav, Sidebar
    revenue-workspace/      # CustomerRevenueWorkspace, CustomerContextBar, stages
      ingestion/            # Legacy ingestion tab components (IngestionStageContent, sections)
      contract/zenith/      # NEW DEAL ingestion flow — Zenith contract review UI
                            # (ZenithContractChromeContext, tab strip, tab panels,
                            #  ZenithContractInvoicePreviewTab, line item drawer, etc.)
    index-page/             # list table + metric strip primitives
    approvals/              # invoice approval UI + ApprovalSettingsModal
    contracts/              # upload modal, closure modal + ClosureSummaryCard + ClosureBanner
    queue/                  # QueueIntegrationsModal
    workbench/              # NEW DEAL customer linking: NewDealCustomerLinkModal,
                            # CreateCustomerForm, CustomerLinkSearchResults,
                            # ExtractedCustomerDetailsCard, LinkedCustomerDetailsCard
    common/                 # EntityDrawer, RootErrorBoundary
    ui/                     # shared primitives (StatusBadge, KV, SectionCard, etc.)
  data/                     # mock-data, revrec, support, billing, ingest, queue-data,
                            # approval-policy, workbench-tasks, customer-tasks, email-threads,
                            # contract-transition, zenith-* (catalog, comments, preview, summary)
  context/                  # IngestProvider + ingest-context-core, DemoPersonaContext,
                            # WorkspaceShellContext
  store/                    # drawer-store (EntityDrawer — invoice approval only),
                            # new-deal-customer-link-store (NewDealCustomerLinkModal)
  hooks/                    # usePendingWorkbenchCounts, useApprovalUrlDrawerSync, useScrolled,
                            # useNewDealCustomerLinkGate
  lib/                      # new-deal-customer-link (helpers), resolve-ingestion-session
```

## Non-negotiable constraints

1. The outer shell (top nav, site switcher, left sidebar, rounded content canvas) is already built — **do NOT redesign or replace it**.
2. **Do NOT create a full-page wrapper card inside the content area** — work inside the existing canvas.
3. Both `/quotes/:quoteId` and `/contracts/:contractId` (and other resource-detail routes) must render the **same** `CustomerRevenueWorkspace` shell, not standalone pages.
4. All statuses, AI insights, next-best-actions, and health metrics are **derived from mock data dynamically** — never hardcoded. See `src/components/revenue-workspace/derive-stage-data.ts`.
5. Revenue recognition does **NOT** depend on cash receipt. RevRec follows contract / billing / usage / policy.

## Design tone

Functional, aesthetic, and clean with Chargebee's own flavor — not marketing, not generic CRM, not a dashboard with random charts. It should feel like a serious quote-to-cash workspace:

- **Strong information hierarchy** — content carries the design, not decoration
- **Neutral warm surfaces** — `grey-100` canvas, white cards, subtle borders
- **Generous but purposeful spacing** — readable tables (`py-3` rows), rounded containers (`rounded-3xl` list tables, `rounded-2xl` cards)
- **Chargebee orange** (`--color-cb-orange`) for sidebar active nav and primary brand moments
- **Blue** for workbench tabs, record actions, and operational links
- **Inter** body + **Sora** for primary titles

Avoid: giant empty hero areas, oversized marketing cards, nested tabs, random charts, spreadsheet-tight density, generic dashboard feel.

**Do not** reintroduce the old "tight-dense" or fixed insight-rail patterns unless explicitly requested — the live UI uses browser-style tabs (`CustomerContextBar`) and drawer overlays (`EntityDrawer`).

## Context docs — load on demand

Detailed specs are split across `docs/` so you load only what's relevant. Cursor rules in `.cursor/rules/` auto-attach docs based on which files are being edited, but you can also explicitly reference any doc with `@docs/<file>.md`.

| When you're working on…                                              | Read…                                                              |
|----------------------------------------------------------------------|--------------------------------------------------------------------|
| Anything UI / polish / layout / visual tweak                         | `docs/02-design-system.md`                                         |
| The outer shell (TopNav, Sidebar, AppShell)                          | `docs/01-shell-and-layout.md`                                      |
| `CustomerRevenueWorkspace` or any lifecycle tab                      | `docs/03-customer-workspace.md` + `docs/04-lifecycle-tabs.md`      |
| Deriving tab statuses, AI insights, NBAs, health                     | `docs/07-dynamic-status.md`                                        |
| A module index page (Customers/Quotes/Contracts/Invoices/Prospects)  | `docs/05-index-pages.md`                                           |
| Routing, URL params, navigation flows                                | `docs/06-routing.md`                                               |
| Mock data types, seed entries, use-case matrix                       | `docs/08-mock-data.md`                                             |
| Queue, NEW DEAL ingestion, Zenith contract review, first-invoice approval | `docs/09-contract-ingestion.md` + `docs/13-drawer-and-flows.md`    |
| `EntityDrawer`, `NewDealCustomerLinkModal`, Zenith flow, or `drawer-store` | `docs/13-drawer-and-flows.md`                                      |
| Workbench (Your tasks + Queue + Approvals tabs)                      | `docs/10-workbench-home.md`                                        |
| Tab gating, list-then-detail behavior                                | `docs/11-workspace-cleanup-and-gating.md`                          |
| Product intent, personas, "what good looks like"                     | `docs/00-overview.md`                                              |
| Open questions / assumptions / stubs                                 | `docs/12-open-questions.md`                                        |

`docs/archive/apex-ui-plan-original.md` preserves the full original 2,619-line plan for reference. Do not load it by default.

## Build / dev

```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

## Status

Prototype is functionally rich for demo flows. Recent work implemented the **NEW DEAL INGESTION** flow with a full-screen customer linking modal and a tabbed contract review workspace (Zenith flow).

### Current implementation (live UI)

**Shell:**
- Compact **36px** teal top nav (`#012A38`) with **demo persona switcher** (Operator / Approver) — no separate search row
- **Grey integrated sidebar** (210px expanded / 48px collapsed) — **defaults to collapsed** on page load, persisted in `localStorage`
- **AI Assistant sidebar** (right) — **defaults to collapsed** on page load, 320px when expanded
- `/queue` and `/approvals` redirect to Workbench tabs (`/?tab=queue`, `/?tab=approvals`)

**Workbench (`/`):**
- Tabs: **Your tasks** | **Queue** | **Approvals** (blue underline accent)
- `deriveWorkbenchTasks` + `DemoPersonaContext` filter operator vs approver views
- Queue Import opens `UploadModal` → **`NewDealCustomerLinkModal`** → Zenith Contract Review (primary NEW DEAL ingest path)

**NEW DEAL Ingestion (Zenith flow):**
- **`NewDealCustomerLinkModal`** — full-screen modal (left: contract PDF preview, right: customer search/create)
  - Two modes: "Link to existing" (customer table) or "Create new customer" (inline form)
  - Shows extracted customer details with match status badge
  - On continue: creates ingestion session → navigates to `/customers/:id?tab=ingestion`
- **Zenith Contract Review** (`src/components/revenue-workspace/contract/zenith/`)
  - **`ZenithContractChromeContext`** — shared state for active tab, scroll collapse, line items, comments
  - **Tab strip**: Summary | Items | Billing info | Addresses | Invoice Preview
  - Each tab has completion status (incomplete → complete) with "Mark as done" CTAs
  - **Items tab**: line item table with catalog mapping (Map to existing / Create new panels)
  - **Invoice Preview tab**: PDF-style invoice document with zoom controls + **Send for approval** CTA
  - **Comments panel**: slide-out panel for contract review comments with pinning
- **Send for approval** creates session contract + invoice, navigates to Invoicing tab detail

**Customer workspace:**
- **`CustomerContextBar`** with restructured header:
  - Row 1: Breadcrumb (left) + Team meta AE/CSM/Billing (right)
  - Row 2: Customer name (left) + Priority chips (right, center-aligned)
  - **Center-aligned trapezoidal tabs** — 62px expanded / 30px collapsed, 10px radius, tightly spaced
  - **Context pills** below tab line (inverted trapezoid shape): left info pill + right actions pill
- **`RecordHeader`** — actions render inside right context pill (no separate glass container)
- Stages: Overview, Tasks, Threads, Quotes, Contracts, **Ingestion (conditional — only when an active session exists)**, Invoicing, Collections, RevRec
- Content column: `max-w-[1020px]` list / `max-w-[860px]` detail on `bg-gray-100`
- URL → `activeTab` sync: `CustomerRevenueWorkspace` listens for changes in `initialStage` / `activeRecordId` props and updates internal tab + active record state

**Drawer / flows:**
- **`EntityDrawer`** — simplified global overlay; only renders `InvoiceApprovalDrawer` (mode `invoice_approval`)
- **Approver flow**: Invoice approval via `InvoiceApprovalDrawer` — shows invoice PDF preview, Approve/Reject CTAs

**Stage type:** `src/components/revenue-workspace/stage.ts` — shared `Stage` union for workspace tabs (includes `ingestion`).
