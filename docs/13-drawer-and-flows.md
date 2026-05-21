# Drawer & Unified Flows

Reference for the **global overlay** pattern: how `EntityDrawer`, `drawer-store`, and `UnifiedFlowShell` orchestrate ingest, invoice review, approvals, renewals, and grace flows without leaving the Workbench or customer shell.

**Related:** `docs/09-contract-ingestion.md` (business flows), `docs/06-routing.md` (URLs), `docs/08-mock-data.md` (`contract-transition.ts` types).

---

## Why drawer-first

Most operator paths stay in context:

- Workbench **Queue** / **Your tasks** rows
- **UploadModal** after sample pick
- **Prospects** index
- Contract **Transition**, **Extend grace**, **Resolve renewal** from workspace

Full-page routes (`/queue/:queueItemId`, `/approvals/invoices/:id`) remain for bookmarks and legacy deep links; **Queue tab and Upload default to `openDrawer`**.

---

## Architecture

```
App.tsx
  <EntityDrawer />          ← always mounted, z-[60]
  <Routes> … </Routes>

drawer-store.ts             ← module singleton + subscribe/emit
useDrawerStore.ts           ← React hook (useSyncExternalStore)

EntityDrawer.tsx            ← picks shell by flow + mode
  ├─ UnifiedFlowShell       ← multi-step flows (stepper + lifecycle peek)
  ├─ IngestDrawer           ← single-surface ingest / transition / late_renewal
  └─ InvoiceApprovalDrawer  ← standalone approval (no ingest link)
```

Session business state (queue overrides, approvals, closures, grace) stays in **`IngestProvider`**. The drawer store only holds **UI orchestration**: what is open, which entity, which flow step.

---

## EntityDrawer

**File:** `src/components/common/EntityDrawer.tsx`

| Property | Value |
|---|---|
| Layout | `fixed inset-0`, **25%** backdrop (`bg-black/30`, click to close), **75%** white panel |
| Panel | `rounded-l-[24px]`, left shadow, full height |
| Escape | Closes drawer |
| z-index | `60` |

**Shell selection** (simplified):

```typescript
if (flow && scenario in ["ingest_invoice", "invoice_only", "late_grace"])
  → UnifiedFlowShell
else if (mode === "invoice_approval" && entityType === "invoice")
  → InvoiceApprovalDrawer
else
  → IngestDrawer
```

`IngestDrawer` supports `presentation="default"` inside the drawer and `presentation="page"` when embedded in `QueueIngestPage` (full 25/35/40 grid). When `unifiedChrome` is true, sticky header is owned by `UnifiedFlowShell`.

---

## drawer-store API

**Files:** `src/store/drawer-store.ts`, `src/store/useDrawerStore.ts`

| Function | Purpose |
|---|---|
| `openDrawer(next)` | Open with entity + optional auto-created `flow` |
| `closeDrawer()` | Reset to closed initial state |
| `patchFlowSession(partial)` | Merge into active `flow` (step, ids, flags) |
| `setFlowStep(step)` | Shorthand for `{ step }` |
| `getDrawerState()` / `subscribeDrawer()` | Low-level subscribe (hook wraps this) |

### `openDrawer` parameters

```typescript
openDrawer({
  entityType: "queue_item" | "contract" | "invoice" | "transition",
  entityId?: string,
  mode?: "ingest" | "transition" | "late_renewal" | "invoice_approval",
  context?: {
    customerId?, contractId?,
    latePhase?: "extend" | "resolve",
    queueItemId?,
  },
  flow?: TransitionFlowSession | null,  // explicit flow; else auto-inferred
  skipUnifiedFlow?: boolean,            // force IngestDrawer for queue ingest
})
```

### Auto-created flows

When `flow` is omitted:

| Condition | Created flow |
|---|---|
| `mode === "ingest"` + `entityType === "queue_item"` + `entityId` (and not `skipUnifiedFlow`) | `scenario: "ingest_invoice"`, `step: "ingest"`, `furthestUnlockedStep: "ingest"` |
| `mode === "invoice_approval"` + linked `context.queueItemId` | `scenario: "ingest_invoice"`, stepper shown, step depends on persona via URL sync |
| `mode === "invoice_approval"` without queue link | `scenario: "invoice_only"`, `step: "approval"`, no stepper |

Each auto flow gets a unique `key` (`entityType-entityId-timestamp-random`) for stable React remounting when switching rows quickly.

---

## Types (`contract-transition.ts`)

### `DrawerState`

```typescript
{
  isOpen: boolean;
  entityType: DrawerEntityType;
  entityId?: string;
  mode?: DrawerMode;
  flow?: TransitionFlowSession | null;
  context?: { customerId?, contractId?, latePhase?, queueItemId? };
}
```

### `TransitionFlowSession`

| Field | Role |
|---|---|
| `scenario` | `ingest_invoice` \| `invoice_only` \| `late_grace` \| `late_renewal_resolve` |
| `step` | Current `FlowStepId` |
| `queueItemId` / `invoiceId` / `contractId` / `customerId` | Binding to mock + session records |
| `showStepper` | Horizontal step UI (default true for linked ingest) |
| `furthestUnlockedStep` | Max step user can jump to via stepper (gates forward nav) |
| `ingestReadOnly` | Approver peek at ingest step without editing |

### `FlowStepId`

| Step | Typical surface |
|---|---|
| `ingest` | `IngestDrawer` — extraction, mapping, catalog |
| `close_prior` | `EarlyRenewalClosePriorStep` — close active contract before renewal |
| `grace_extend` | `ExtendGraceStep` — late renewal grace configuration |
| `invoice_review` | `InvoiceReviewStep` |
| `approval` | `InvoiceApprovalDrawer` body (invoice-only path) |
| `approval_settings` | `ApprovalSettingsStep` — merchant policy capture |

### Scenarios → step sequences

**`ingest_invoice` — New Business / default**

1. Contract extraction → 2. Invoice review → 3. Approval settings

**`ingest_invoice` — Early Renewal / Late Renewal**

1. Contract extraction → 2. Close prior → 3. Invoice review → 4. Approval settings

**`late_grace`**

1. Extend grace (or Resolve when `context.latePhase === "resolve"`) → 2. Approval settings

**`invoice_only`**

Single approval surface; optional stepper hidden.

---

## UnifiedFlowShell

**File:** `src/components/transitions/UnifiedFlowShell.tsx`

Wraps multi-step flows with:

1. **Header** — close, customer name (or "New Contract"), scenario tag (Early/Late Renewal), **horizontal stepper**, trailing actions from `UnifiedDrawerChromeContext`
2. **Lifecycle peek tabs** — Overview, Quotes, Contracts, Invoicing, Collections, RevRec (subset used in practice)
3. **Step body** — switches on `flow.step`

### Lifecycle peek behavior

Operators can peek at customer workspace sections **inside the drawer** without closing the overlay:

- Default stage follows flow step (`contract` for ingest/close_prior/grace; `invoicing` for review/settings)
- User can switch tabs; selecting quote/contract/invoice rows renders embedded `*StageContent` / list views
- **"All contracts"** tab (Early/Late Renewal only) shows `ContractListView` + pending ingestion rows

Returning to the flow step clears peek selections.

### Step gating

`furthestUnlockedStep` limits stepper clicks. Forward progress is committed by primary actions in each step (e.g. **Next** on ingest advances `furthestUnlockedStep` to `invoice_review`).

Approver persona: opening ingest-linked approval may land on `invoice_review` with `ingestReadOnly` on the ingest step.

### Celebration

Brief UI celebration when advancing into `invoice_review` (prototype affordance).

---

## Entry points (where `openDrawer` is called)

| Source | Typical `openDrawer` shape |
|---|---|
| `UploadModal` | `{ entityType: "queue_item", mode: "ingest", entityId }` → auto `ingest_invoice` |
| `QueueTabContent` | Status-driven: pending → ingest; invoice review → `step: "invoice_review"`; ingested + approver → approval drawer |
| `WorkbenchTaskList` | `task.drawer` from `deriveWorkbenchTasks` |
| `ApprovalsTabContent` | Invoice approval with optional `queueItemId` |
| `ProspectsIndex` | New-business queue rows |
| `ContractStageContent` | `mode: "transition"` or `late_renewal` with `latePhase` |
| `ContractListView` | Pending ingestion row → ingest |
| `CustomerRevenueWorkspace` | Transition from record actions |
| `useApprovalUrlDrawerSync` | `/approvals/invoices/:id?ingestId=&step=` opens drawer over page |

### Workbench task `drawer` field

`WorkbenchTask.drawer?: WorkbenchTaskDrawerLaunch` mirrors `openDrawer` args. **Your tasks** calls `openDrawer(task.drawer)` instead of `navigate(task.destination)` when set.

---

## Drawer vs full page

| Surface | When | Layout |
|---|---|---|
| **EntityDrawer** | Default for Queue, Upload, tasks, transitions | 75% panel; unified flow or `IngestDrawer` narrow rail + preview |
| **QueueIngestPage** | `/queue/:id`, Failed/Rejected, or non-drawer fallback | Page canvas; ingestable late renewal may render `UnifiedFlowShell` inline (no overlay) |
| **ApprovalDetailPage** | `/approvals/invoices/:id` without drawer sync | Full-page 25/25/50 grid |

`QueueIngestPage` intentionally mirrors Workbench drawer content for sample-backed rows so both paths stay identical.

---

## URL sync (`useApprovalUrlDrawerSync`)

**Hook:** `src/hooks/useApprovalUrlDrawerSync.ts`

Used on approval routes to open the drawer from query params:

```
/approvals/invoices/:invoiceId?ingestId=QI-…&step=invoice_review
```

- `ingestId` → `ingest_invoice` flow with stepper
- `step` must be in allowed set; approver defaults to `invoice_review` when linked to ingest
- Cleanup on unmount: `closeDrawer()`

Closure handoff may pass `queueItemId` without `ingestId` for renewal closure approvals.

---

## IngestDrawer modes (non-unified)

When `flow` is null or scenario not unified, `IngestDrawer` handles:

| `mode` | Use |
|---|---|
| `ingest` | Queue item extraction + finish |
| `transition` | Contract transition from workspace |
| `late_renewal` | Grace extend / resolve (`context.latePhase`) |
| `invoice_approval` | Only via `InvoiceApprovalDrawer` shortcut in `EntityDrawer` |

`entityType` + `entityId` + `context` select seed data (`sample2`/`3`/`4`), customer mapping, and validation chips.

Early Renewal (`sample3`) and Late Renewal (`sample4`) short-circuit standard finish inside `IngestDrawer` — they `patchFlowSession({ step: "close_prior" })` or invoke late-renewal handlers instead of navigating away immediately.

---

## Adding a new flow step

1. Add `FlowStepId` and scenario steps in `contract-transition.ts` if needed.
2. Extend `buildIngestInvoiceSteps` or scenario branch in `UnifiedFlowShell`.
3. Render step body in `UnifiedFlowShellInner` switch.
4. Advance via `patchFlowSession` / `setFlowStep` from step component actions.
5. Open with explicit `flow` in `openDrawer` from the entry point (Queue row, task, etc.).
6. Update `deriveWorkbenchTasks` if Workbench should open the drawer.

Keep **`IngestContext`** as the source of truth for persisted session outcomes (approvals, queue status, closures).

---

## Key files checklist

| File | Role |
|---|---|
| `src/components/common/EntityDrawer.tsx` | Overlay chrome + shell router |
| `src/store/drawer-store.ts` | State + `openDrawer` inference |
| `src/store/useDrawerStore.ts` | React subscription hook |
| `src/data/contract-transition.ts` | Types, grace extension, intent helpers |
| `src/components/transitions/UnifiedFlowShell.tsx` | Multi-step shell + stepper |
| `src/components/transitions/IngestDrawer.tsx` | Ingest/transition body |
| `src/context/UnifiedDrawerChromeContext.tsx` | Trailing header actions slot |
| `src/hooks/useApprovalUrlDrawerSync.ts` | Approval URL → drawer |

---

## Do / Don't for agents

**Do**

- Prefer `openDrawer` for new Queue or Workbench entry points.
- Pass explicit `flow` when opening mid-pipeline (e.g. `step: "invoice_review"`).
- Use `patchFlowSession` to advance steps; persist outcomes in `IngestContext`.
- Reuse `UnifiedFlowShell` when the flow has ≥2 gated steps with stepper UX.

**Don't**

- Add a second global overlay — extend `EntityDrawer` / `UnifiedFlowShell`.
- Store invoice/queue business state in `drawer-store` (UI only).
- Use `/?tab=queue` as the queue landing (no standalone queue index page).
