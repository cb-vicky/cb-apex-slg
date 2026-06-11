# Bucket 3 defer — merge from main (2026-06-11)

Safety tag before merge: `pre-main-merge-65dcc4b` → commit `65dcc4b`.

## Brought now (wired to buckets 1 / 2 / 5)

| Item | File(s) |
|---|---|
| `ingestion` stage in tab order | `workspace-tabs.ts` |
| Ingestion stage + Zenith provider | `CustomerRevenueWorkspace.tsx`, `ingestion/*`, `contract/zenith/*` |
| Ingestion sub-tab URL state | `CustomerRevenueWorkspace.tsx` |
| `IngestionTabPill` (document switcher + stepper) | `CustomerContextBar.tsx` |
| Ingestion tab auto-collapse | `CustomerContextBar.tsx` |
| `deriveIngestionTabSummary` | `derive-tab-summaries.ts` |
| Notes floating button + drawer | `AppShell.tsx`, `components/notes/*` |
| Build / type fixes | various |
| Docs + `AGENTS.md` | `docs/*`, `AGENTS.md` |

## Deferred — decide later with main owner

| Item | File(s) | Our branch alternative |
|---|---|---|
| Trapezoidal SVG tabs | `CustomerContextBar.tsx` | Folder-style rounded tabs |
| Rich tab hover tooltips | `CustomerContextBar.tsx` | Subtitles only |
| `CustomerTeamMeta` header | `CustomerContextBar.tsx` | `CustomerContactsAvatars` + `SubscriptionHeaderHint` |
| `ContextInfoPill` KPI pills | `CustomerContextBar.tsx` | None |
| `InvoicingTabPill` in chrome | `CustomerContextBar.tsx` | Index views / stage content |
| `ActionsPillWrapper` + simplified `RecordHeader` | `CustomerContextBar.tsx`, `RecordHeader.tsx` | Glass pill `RecordHeader` |
| `ActionButton` chevron / disabled | `ActionButton.tsx` | Current buttons |
| Centered tab strip, scroll hysteresis | `CustomerContextBar.tsx` | Left-aligned, 40px threshold |
| Customer-link CSS animations | `index.css` | Optional |

## Keep from receivables branch

- Collections dock (`PaymentDockedTabButton`)
- Pinned comments bar
- Contacts avatars + subscription hint in header
- Collections / P2P / automation / filters work

## Rollback

```bash
git reset --hard pre-main-merge-65dcc4b
# or
git reset --hard 65dcc4b
```
