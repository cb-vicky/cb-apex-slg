# Chargebee APEX — Docs

This folder replaces the monolithic `apex-ui-plan.md`. Each doc is a self-contained reference for one concern, so you can load only what you need into an AI agent's context instead of the full 2,600-line plan.

**Start here:** `../AGENTS.md` (at repo root) is the slim always-on project overview. It points to specific docs in this folder based on what you're working on.

## Doc index

| # | Doc | Read when… |
|---|---|---|
| 00 | [`00-overview.md`](00-overview.md) | You need product goal, personas, design tone, acceptance principles |
| 01 | [`01-shell-and-layout.md`](01-shell-and-layout.md) | Editing the outer shell (TopNav, Sidebar, AppShell) or page-level spacing |
| 02 | [`02-design-system.md`](02-design-system.md) | Any UI polish, layout tweak, badge, or visual rework (**primary UI reference**) |
| 03 | [`03-customer-workspace.md`](03-customer-workspace.md) | Editing `CustomerRevenueWorkspace`, `CustomerContextBar`, record chrome |
| 04 | [`04-lifecycle-tabs.md`](04-lifecycle-tabs.md) | Editing any per-tab content (Overview / Tasks / Threads / Quote / Contract / …) |
| 05 | [`05-index-pages.md`](05-index-pages.md) | Editing a module index page or list/metric primitives |
| 06 | [`06-routing.md`](06-routing.md) | Routing, alias routes, URL params, navigation flows |
| 07 | [`07-dynamic-status.md`](07-dynamic-status.md) | Editing `derive-stage-data.ts` or insight/NBA/health derivation |
| 08 | [`08-mock-data.md`](08-mock-data.md) | Adding / changing types, seed records, context state |
| 09 | [`09-contract-ingestion.md`](09-contract-ingestion.md) | Contract ingestion, drawer flows, invoice approval |
| 10 | [`10-workbench-home.md`](10-workbench-home.md) | Workbench: Your tasks + Queue + Approvals tabs |
| 11 | [`11-workspace-cleanup-and-gating.md`](11-workspace-cleanup-and-gating.md) | Tab gating rules, list-then-detail transitions |
| 12 | [`12-open-questions.md`](12-open-questions.md) | Decisions, assumptions, stubs, outstanding Qs |
| 13 | [`13-drawer-and-flows.md`](13-drawer-and-flows.md) | `EntityDrawer`, `drawer-store`, `LinkCustomerModal`, Customer 360 Ingestion tab |

## Archive

[`archive/apex-ui-plan-original.md`](archive/apex-ui-plan-original.md) — the original 2,619-line plan preserved verbatim. **Do not load this by default** — it's kept only as a historical reference.

## Cursor rules (auto-attached)

`.cursor/rules/*.mdc` at the repo root auto-attach the relevant doc(s) when you're editing files in certain paths:

| Rule | Attaches when editing… | References |
|---|---|---|
| `revenue-workspace.mdc` | `src/components/revenue-workspace/**`, detail page components | docs 03, 04, 07, 02, 11 |
| `index-pages.mdc` | `src/pages/*Index.tsx`, `src/components/index-page/**` | docs 05, 06, 02, 08 |
| `ingestion-approvals.mdc` | ingest/approval pages, `IngestContext`, drawer store, ingestion components | docs 09, 13, 06, 08 |
| `mock-data.mdc` | `src/data/**`, `src/context/**` | doc 08 |
| `shell-and-layout.mdc` | `src/components/layout/**`, `App.tsx`, `main.tsx` | docs 01, 02, 06 |
| `workbench-home.mdc` | `src/pages/workbench/**` | docs 10, 02, 09 |
| `design-system.mdc` | `src/components/ui/**`, `src/components/revenue-workspace/primitives/**` | doc 02 |

## How to use this with Cursor

1. **Default turn:** only `AGENTS.md` (root) is pulled in automatically. ~2 KB.
2. **When editing a file matched by a rule:** that rule is auto-attached, and it points me to the relevant docs. I read those docs on demand.
3. **When you want to steer context explicitly:** reference a doc directly in your message, e.g. "Polish the Quote tab — see `@docs/04-lifecycle-tabs.md` and `@docs/02-design-system.md`."

This gives you ~5–7 KB of context per typical turn instead of the original ~100 KB.

## Editing these docs

- Keep docs focused on one concern. Don't merge cross-cutting topics into one file.
- Use relative links between docs (`docs/04-lifecycle-tabs.md`) so references stay valid.
- When adding a new concern, prefer a new doc over bloating an existing one.
- Update this README's index when adding or renaming a doc.
- **Match the live UI** — removed legacy modules (journey rail, insight rail, Getting Started, standalone queue/approvals indexes) are not in the repo; see `stage.ts` for workspace tab types.
