# Workbench Home — Your Tasks, Queue & Approvals

The Workbench is the default landing at **`/`** and **`/workbench`**. It is the operational hub for task triage, contract ingestion queue, and invoice approvals.

**Key files:**
- `src/pages/workbench/WorkbenchHome.tsx` — tab shell + greeting
- `src/pages/workbench/WorkbenchTaskList.tsx` — Your tasks tab
- `src/pages/workbench/QueueTabContent.tsx` — Queue tab + Import/Connect toolbar
- `src/pages/workbench/ApprovalsTabContent.tsx` — Approvals tab
- `src/data/workbench-tasks.ts` — `deriveWorkbenchTasks`, `computeWorkbenchStats`
- `src/context/DemoPersonaContext.tsx` — Operator / Approver (TopNav, not in-page)
- `src/hooks/usePendingWorkbenchCounts.ts` — pending counts (not wired to sidebar dots yet)

## Tabs

| Tab | URL | Default | Contents |
|-----|-----|---------|----------|
| **Your tasks** | `/` or `/workbench` | Yes | Five stat cards + flat severity-sorted task table |
| **Queue** | `/?tab=queue` | No | Queue list, Import, Connect; row → drawer or full page |
| **Approvals** | `/?tab=approvals` | No | Pending approvals; operator banner when applicable |

Tab chrome: **blue** underline (`text-blue-600`, `bg-blue-600` indicator) — not orange.

Greeting: randomized **"Welcome, Alex."** / **"Greetings, Alex."** at `text-[30px]` with Workbench eyebrow label.

## Demo persona (TopNav)

Persona switcher lives in **`TopNav.tsx`**, not on the Workbench page:

- **Operator** — sees queue review tasks, ingest-related work, broader operational set
- **Approver** — sees pending approvals; ingest drawer may show **Review invoice** when row is ingested

`deriveWorkbenchTasks(ctx, { persona })` filters rows accordingly.

## Your tasks — summary strip

**Five** stat cards from `computeWorkbenchStats` (live `IngestContext`):

1. **Pending approvals** — `approvalRequests` where `status === "Pending Approval"`
2. **Queue — needs review** — `queueItems` with `Pending Review` (after overrides)
3. **TCV pending action** — sum of pending-review queue TCV + pending approval amounts
4. **In-flight closures** — `pendingRenewalIngestions` key count
5. **Grace extensions** — active `contractGraceExtensions` count

## Your tasks — task list

**Flat table** sorted by severity (not grouped by customer — `groupWorkbenchTasks` exists but is unused in UI).

Sources from **`deriveWorkbenchTasks`**:

| Source | Included when | Severity notes |
|--------|----------------|------------------|
| **Queue** | `Pending Review` or `In Progress` | Early Renewal → Critical; New Business / Renewal → High |
| **Approvals** | `Pending Approval` | Closure docs → Critical; invoices → High |
| **Customer tasks** | Open tasks in `customer-tasks.ts` | Maps priority to severity |

**Navigation:**
- `destination` — `useNavigate` to route (e.g. `/approvals/invoices/:id?ingestId=…`, customer workspace with closure params)
- `drawer` — `openDrawer` from `drawer-store` (queue ingest, transitions)

**New task highlight:** `workbenchTaskSnapshotRef` in `IngestContext` marks freshly surfaced items.

**Empty state:** *You're all caught up.*

## Queue tab

- Replaces legacy `/queue` index page (route redirects here)
- **Import** → `UploadModal` → `getQueueItemBySample` → **`openLinkCustomerModal(queueItemId)`** (primary)
- **Connect** → `QueueIntegrationsModal`
- Row behavior: ingestable samples open `LinkCustomerModal`, which routes the user to `/customers/:id?tab=ingestion` after linking; ingested + approver persona may show review CTA

See `docs/09-contract-ingestion.md` for scenario matrix (`sample2`, `sample3`, `sample4`, **`sample5`**). Drawer behavior: `docs/13-drawer-and-flows.md`.

### Pioneer new-deal row (`QI-2026-0007`)

- Queue seed: **Pioneer Systems**, `sample5`, `linkWorkflow: "match_first"`, `suggestedCustomerId: cust_pioneer_004`
- Row / ingest task opens **`NewDealCustomerLinkModal`** with **`NewDealCustomerLinkMatchFirstPanel`** (closest-match banner, approve/reject, similar + full catalog browse)
- **Zenith** path remains **`QI-2026-0002`** / `sample2` (standard link UI → Zenith contract review)

## Approvals tab

- Lists pending approval requests from `IngestContext`
- May show operator-facing banner copy when persona is Operator
- Row click → `EntityDrawer` or `/approvals/invoices/:invoiceId` full page

## Workflow handoff (ingest ↔ approve)

After standard ingest, first-invoice approval appears in **Your tasks** and **Approvals** tab.

After Early Renewal "Proceed to close prior contract," closure approval surfaces under **Verdant Health** with Critical severity and URL params `?closureFor=&queueItemId=`.

No separate workbench context — everything reads **`IngestContext`**.

## Sidebar notification dots

**Not implemented** in current `Sidebar.tsx`. `usePendingWorkbenchCounts` returns `{ pendingApprovalCount, inflightClosures }` for future wiring.

Do not document orange dots on My Workbench / Approvals sidebar rows unless re-added in code.

## Visual spec

- Canvas: `bg-grey-100`, `px-6 pt-6`, no outer wrapper card
- Tabs: blue active state, `text-[13px]` labels
- Task severity pills: red Critical, amber High, blue Medium, gray Low
- Task rows: compact padding, hover muted surface, chevron affordance

## Acceptance

- Fits inside existing shell canvas
- Operational, data-driven from `IngestContext`
- Persona-aware task filtering via TopNav
- Drawer-first queue ingest aligned with `docs/09-contract-ingestion.md`
- Chargebee APEX tone: clean, readable, not dense-cramped
