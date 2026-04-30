# Workbench Home — My Tasks & Getting Started

The Workbench is the default landing at **`/`** (also `/workbench`). It combines an operational **My Tasks** view with the existing role-aware **Getting Started** experience inside the shell content area.

**Key files:**
- `src/pages/workbench/WorkbenchHome.tsx` — tab shell (**My Tasks** | **Getting Started**), top-right role switcher (applies to both tabs)
- `src/pages/workbench/WorkbenchTaskList.tsx` — **My Tasks** tab body (summary strip + grouped task list)
- `src/data/workbench-tasks.ts` — `deriveWorkbenchTasks(context)`, `groupWorkbenchTasks`, `computeWorkbenchStats`; unified `WorkbenchTask` type
- `src/components/getting-started/*` — `GettingStartedHeader`, `SummaryStrip`, `EnvironmentBanner`, `MilestoneCard`, `MilestoneGrid`, `OperatorRail`, `FooterCallout` (unchanged; used only on **Getting Started**)
- `src/data/gettingStarted.ts` — milestone config
- `src/context/WorkbenchRoleContext.tsx` — Billing Manager (Admin) vs Billing Operator
- `src/context/IngestContext.tsx` — session state driving queue overrides, approvals, pending renewal ingestions (Workbench reads this; no separate workbench context)

## Tabs

| Tab | Default | Contents |
|-----|---------|----------|
| **My Tasks** | Yes | Summary stats + tasks grouped by customer (see below) |
| **Getting Started** | No | Same layout as before: hero, summary strip, environment banner, milestones + rail + footer |

The **role switcher** (Billing Manager / Billing Operator) sits **top-right** and affects copy and milestone layout on **Getting Started** only; **My Tasks** receives `role` for future use but uses live ingest/mock data for counts and rows.

## Personas (role switcher)

1. **Billing Manager (Admin)** — Getting Started: 8-milestone grid + admin rail cards  
2. **Billing Operator** — Getting Started: 6 milestones + `OperatorRail`

Page title on Getting Started remains **"Welcome back, John."**

## My Tasks — summary strip

Four compact stat cards, **derived from live session state** (`IngestContext` + merged queue items):

1. **Pending approvals** — count of `approvalRequests` where `status === "Pending Approval"`
2. **Queue — needs review** — count of `queueItems` where `status === "Pending Review"` (after runtime `queueItemOverrides`)
3. **TCV pending action** — sum of TCV on those **Pending Review** queue rows **plus** pending approval invoice amounts
4. **In-flight closures** — count of keys in `pendingRenewalIngestions` (Early Renewal path waiting on closure approval)

## My Tasks — task list

Tasks come from **`deriveWorkbenchTasks`** (see `src/data/workbench-tasks.ts`):

| Source | Included when | Severity / notes |
|--------|-----------------|------------------|
| **Queue** | Status `Pending Review` or `In Progress` | Early Renewal → Critical; New Business / Renewal → High; Amendment → Medium. Destination `/queue/:id` |
| **Approvals** | `status === "Pending Approval"` | Closure docs (`CN-CLOSE-*`, `INV-TERM-*`) → **Critical**; standard invoices → **High**. Early Renewal closure URLs include `?closureFor=&queueItemId=` from `pendingRenewalIngestions` |
| **Customer tasks** | Open rows in `mock-data` `tasks` array | Maps priority to severity; destination `/customers/:customerId?tab=…` by task type |

Groups are **by customer** (`customerId`); queue rows without `customerId` appear under **Unmatched**. Groups sort by **highest task severity** in the group; within a group, tasks sort by severity descending.

**Empty state:** centered line — *You're all caught up.*

**Interaction:** each row navigates with `useNavigate` to its `destination` (existing routes only).

## Workflow handoff (ingest ↔ approve)

After **standard** ingestion completes, the first-invoice approval surfaces under the correct customer via **approval requests** in context.

After **Early Renewal** “Proceed to Close Prior Contract,” the **closure approval** surfaces under **Verdant Health** with **Critical** severity and destination  
`/approvals/invoices/CN-CLOSE-…?closureFor=CON-2025-0034&queueItemId=QI-2026-0006` when `pendingRenewalIngestions` contains that prior contract.

No extra global state beyond **`IngestContext`**.

## Sidebar notification dots

In **`Sidebar.tsx`**, **Desk** nav rows:

- **My Workbench** — orange dot when there are pending approvals **or** in-flight renewal ingestions waiting on closure (`pendingRenewalIngestions` non-empty)
- **Approvals** — orange dot when `approvalRequests` has any **Pending Approval**

Dots reflect session activity (e.g. after ingest submits an approval), not static seed-only counts.

## Getting Started tab — layout (unchanged)

1. **HERO ROW** — `GettingStartedHeader`
2. **PROGRESS / SUMMARY STRIP** — `SummaryStrip`
3. **ENVIRONMENT BANNER** — `EnvironmentBanner`
4. **MAIN MILESTONE CONTENT** — role-specific
5. **FOOTER CALLOUT** — `FooterCallout`

### Admin layout

Full-width 2-column milestone grid (`MilestoneGrid`) with 8 milestones.

### Operator layout

Left 8-col checklist (6 milestones) + right 4-col sticky side panel (`OperatorRail`).

### Admin milestones (8)

1. Set up Site and Entity — **Complete**
2. Invite your revenue team — **In progress**
3. Create products, plans, and pricing — **In progress**
4. Configure AI commitments and access — **Not started**
5. Connect CRM and approval routing — **Not started**
6. Enable contract ingestion and enforcement — **Not started**
7. Validate invoice review and collections flow — **Blocked**
8. Run your first end-to-end dry run — **Blocked**

### Operator milestones (6)

1. Confirm your Site and Entity — **Complete**
2. Understand your task queues — **In progress**
3. Review and send a pending invoice — **Not started**
4. Record a payment — **Blocked**
5. Resolve a billing issue from Collections — **Blocked**
6. Check commitment burn-down before dispute — **Not started**

## Visual spec

### Tabs & chrome

- Enterprise, restrained; **orange underline** on active tab; role switcher in segmented control (top-right)
- No full-page wrapper card inside the white canvas

### My Tasks

- Severity pills: **red** Critical, **amber** High, **blue** Medium, **gray** Low  
- Customer group headers: eyebrow style (`text-[11px]` uppercase, tracking), faint health badge from first `riskBadges` entry when present  
- Task rows: compact padding, hover muted surface, chevron **12px**

### Getting Started

- Cards with 16px radius, 20–24px padding
- Orange accents for primary actions
- Milestone status pills:
  - **green** = Complete
  - **amber** = In progress
  - **gray** = Not started
  - **red** = Blocked

## Acceptance

- Fits naturally inside existing white content frame
- Uses available width well
- Clear admin vs operator differentiation on **Getting Started**
- **My Tasks** stays operational and data-driven from `IngestContext` + mock tasks
- Clean spacing and readable hierarchy
- Matches Chargebee APEX tone
