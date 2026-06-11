# Outer Shell & Page Layout

The outer shell is built in `src/components/layout/` (`AppShell.tsx`, `TopNav.tsx`, `Sidebar.tsx`). **Do NOT redesign or replace it.** Work inside the existing content canvas.

## Shell anatomy

### A. Top header bar (dark teal)

- Background: `#012A38` (Chargebee dark teal)
- Height: **36px** compact bar
- **Left:** Chargebee logo (orange mark on dark), site/entity selector ("Echo-corp echocorp.test.charge…"), entity/timezone ("Germany Europe/Berlin")
- **Right:** notification bell, Configure Chargebee, dev console, tips, favorites, help, **demo persona switcher** (Operator / Approver), user avatar
- Orange logo tab bleeds under the sidebar (absolute positioning)
- **No separate search row** below the header (older plans had a ⌘K search row — removed)

### B. Left sidebar (grey, integrated)

- Background: `bg-grey-100` — merges visually with the content frame (not a white card-in-card)
- Width: **210px** expanded, **48px** collapsed; persisted in `localStorage` (`apex-sidebar-collapsed`)
- **Defaults to collapsed** on fresh page load — user can expand manually
- **Flat nav list** — no Desk / Records / Catalog groups
- Collapse control + non-functional **"Go to ⌘K"** affordance at bottom
- Active row: orange left accent + semibold label
- Several items are **disabled stubs** (Credit notes, Product Catalog, Entitlements, Usages, RevenueStory, Signals)

**Primary nav items (live):**

| Label | Path | Notes |
|---|---|---|
| My Workbench | `/` | Default landing |
| Customers | `/customers` | |
| Prospects | `/prospects` | New-business queue view |
| Quotes | `/quotes` | |
| Contracts | `/contracts` | |
| Invoices | `/invoices` | |
| Collections | `/collections` | `ModuleStubPage` |
| RevRec | `/revrec` | `ModuleStubPage` |
| Communications | `/communications` | `ModuleStubPage` |
| Tasks | `/workbench` | Same `WorkbenchHome` as `/` |

**Redirects (not sidebar entries):**

- `/queue` → `/?tab=queue`
- `/approvals` → `/?tab=approvals`

Queue and Approvals are **Workbench tabs**, not standalone sidebar modules.

### C. AI Assistant sidebar (right)

- **Defaults to collapsed** on fresh page load — user can expand manually
- Width: 320px default when expanded, 32px collapsed strip
- Resizable via drag handle
- Can expand to full workspace mode with sessions rail + artifact column

### D. Content area

- Outer frame: `#012A38` full-screen; inner scroll area `bg-grey-100` with `rounded-tr-[24px]`
- `WorkspaceShellContext` sets customer workspace inner bg to `bg-gray-100`
- **No nested full-page white wrapper card** inside the canvas

## Layout rules inside the canvas

Use the existing rounded content surface. Do **not** nest another full-page wrapper card inside it.

### Recommended internal page spacing

- Horizontal padding: **24px** (`px-6`)
- Top padding: **24px** (`pt-6`) on index/workbench pages; workspace uses `pt-2` below chrome
- Vertical gap between major sections: **16–20px**
- Customer workspace content: `max-w-[1020px]` (list) / `max-w-[860px]` (detail), centered

### Section card usage

Use section cards inside pages sparingly:

- Subtle border, white surface, `rounded-2xl` or `rounded-xl`
- Clear section titles
- Content should feel like structured sections on a page, not cards floating inside another card soup

### Tailwind structure for customer detail

```
- workspace root:  flex flex-1 flex-col bg-gray-100
- context bar:     CustomerContextBar (sticky chrome)
- content:         relative flex-1, data-workspace-content
- inner column:    mx-auto px-6 pt-2 pb-12 max-w-[860|1020]
- record actions:  RecordHeader portaled into recordSlot (optional)
```

### Standard customer workspace structure

```
- CustomerContextBar (breadcrumb + title + file-folder tabs + record slot)
- centered main column with stage content
- optional RecordHeader action pill when viewing a record
```

Workspace chrome is `CustomerContextBar` + optional `RecordHeader` action pill — see `docs/03-customer-workspace.md`.
