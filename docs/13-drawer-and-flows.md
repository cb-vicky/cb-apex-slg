# Drawer & Customer 360 Ingestion

Reference for the **global overlay** pattern and the **Customer 360 Ingestion tab** architecture.

**Architecture change (May 2026):** Contract ingestion has moved from the drawer-based `IngestDrawer` + `UnifiedFlowShell` to a **Customer 360 Ingestion tab** inside `CustomerRevenueWorkspace`. The `EntityDrawer` is now simplified to only handle invoice approvals.

**Related:** `docs/09-contract-ingestion.md` (business flows), `docs/06-routing.md` (URLs), `docs/03-customer-workspace.md` (workspace tabs).

---

## Architecture overview

```
App.tsx
  <EntityDrawer />          ← invoice approval only, z-[60]
  <LinkCustomerModal />     ← customer linking for ingestion
  <Routes> … </Routes>

drawer-store.ts             ← simplified: open/close, no flow state
useDrawerStore.ts           ← React hook (useSyncExternalStore)

EntityDrawer.tsx            ← only renders InvoiceApprovalDrawer

link-customer-modal-store.ts ← modal state for ingestion entry
useLinkCustomerModalStore.ts ← React hook

CustomerRevenueWorkspace
  └─ IngestionStageContent  ← when tab=ingestion
```

Session business state (queue overrides, approvals, closures, ingestion sessions) stays in **`IngestProvider`**. The drawer store only holds **UI orchestration** for invoice approval: what is open and which invoice.

---

## LinkCustomerModal

**File:** `src/components/ingestion/LinkCustomerModal.tsx`

The entry point for contract ingestion. Opened via `openLinkCustomerModal(queueItemId)`.

| Property | Value |
|---|---|
| Layout | Centered modal, **720px** width |
| Backdrop | `bg-black/30`, click to close |
| z-index | `60` |

**Content:**
1. Header with document name, extraction confidence, queue ID
2. Customer search typeahead (existing customers)
3. "Create new customer" expandable form
4. "Open in workspace" CTA

**On submit:**
```typescript
startIngestionSession(queueItemId, customerId, sampleId, customerLink)
closeModal()
navigate(`/customers/${customerId}?tab=ingestion`)
```

### Store API

**Files:** `src/store/link-customer-modal-store.ts`, `src/store/useLinkCustomerModalStore.ts`

| Function | Purpose |
|---|---|
| `openLinkCustomerModal(queueItemId)` | Open modal with queue item context |
| `closeLinkCustomerModal()` | Close modal |
| `getLinkCustomerModalState()` | Get current state |
| `subscribeLinkCustomerModal()` | Subscribe to changes |

---

## EntityDrawer (simplified)

**File:** `src/components/common/EntityDrawer.tsx`

Now **only** handles invoice approval. Opens when:
- `mode === "invoice_approval"`
- `entityType === "invoice"`
- `entityId` is set

| Property | Value |
|---|---|
| Layout | `fixed inset-0`, **25%** backdrop (`bg-black/30`), **75%** white panel |
| Panel | `rounded-l-[24px]`, left shadow, full height |
| z-index | `60` |

**Body:** `InvoiceApprovalDrawer` component.

---

## drawer-store API (simplified)

**Files:** `src/store/drawer-store.ts`, `src/store/useDrawerStore.ts`

| Function | Purpose |
|---|---|
| `openDrawer(next)` | Open with entity type, id, mode, context |
| `closeDrawer()` | Reset to closed state |
| `getDrawerState()` | Get current state |
| `subscribeDrawer()` | Subscribe to changes |

### `openDrawer` parameters

```typescript
openDrawer({
  entityType: "queue_item" | "contract" | "invoice" | "transition",
  entityId?: string,
  mode?: "invoice_approval",  // only approval mode supported now
  context?: {
    customerId?,
    contractId?,
    queueItemId?,  // for ingest-linked approvals
  },
})
```

### Types (`contract-transition.ts`)

```typescript
interface DrawerState {
  isOpen: boolean;
  entityType: DrawerEntityType;
  entityId?: string;
  mode?: DrawerMode;
  flow?: null;  // flow state removed
  context?: { customerId?, contractId?, queueItemId? };
}
```

---

## Customer 360 Ingestion Tab

Contract ingestion now happens **inside the customer workspace** via the Ingestion tab.

### Entry points

| Source | Action |
|---|---|
| `UploadModal` | `openLinkCustomerModal(queueItem.id)` |
| `QueueTabContent` | Row click → `openLinkCustomerModal(q.id)` |
| `WorkbenchTaskList` | Queue-sourced tasks → `openLinkCustomerModal(task.drawer.entityId)` |

### IngestionSession

Managed in `IngestContext`:

```typescript
interface IngestionSession {
  queueItemId: string;
  customerId: string;
  sampleId: "sample2" | "sample3" | "sample4";
  customerLink: "matched" | "created";
  overallStatus: "in_review" | "ready" | "awaiting_approval";
  sections: Record<IngestionSectionId, IngestionSectionState>;
  startedAt: string;
}
```

### Tab visibility

The Ingestion tab **only appears** when `getActiveIngestionForCustomer(customerId)` returns a session. This is unlike other workspace tabs which are always visible (but may be disabled).

### URL structure

```
/customers/:id?tab=ingestion&frame=1&sub=summary
/customers/:id?tab=ingestion&frame=1&sub=items
/customers/:id?tab=ingestion&frame=2&sub=contract-preview
```

### Frame 1 (Review)

Sub-tabs via `ContextInfoPill`:
- Summary, Items, Billing, Addresses, Additional Info, PDFs

Each section has a status indicator (issues/review/done) and "Mark as done" CTA.

### Frame 2 (Preview)

Sub-tabs:
- `← Back to ingestion` (returns to `?frame=1&sub=summary`)
- Contract Preview — mock of Chargebee contract
- Invoice Preview — mock of first invoice

The pill swaps between the Frame-1 and Frame-2 layouts based on `?frame=`. `IngestionStageContent` also normalizes `?sub=` to a valid value for the active frame so cross-frame transitions never land on a blank canvas.

### Actions (right context pill)

`IngestionActions` is **portaled** into the right context pill via `RecordSlotContext` / `RecordHeader` — the same pattern Quote / Contract / Invoicing detail pages use. Only flat-text CTAs live in the pill; there is no status dropdown.

| Frame | Primary CTAs | Overflow (`…`) |
|---|---|---|
| Frame 1 | **Preview** (disabled until every section is `done` or `overallStatus === "ready"`) | — |
| Frame 2 | **Send for approval** | Restart ingestion · Discard contract |

---

## Invoice approval flow

After "Send for approval" in the Ingestion tab:

1. Contract and invoice are created via `buildSessionContractFromIngestion` / `buildSessionInvoiceFromIngestion`
2. Invoice is submitted for approval via `submitInvoiceForApproval` and its status is overridden to `"Pending Approval"` via `setInvoiceStatusOverride`
3. The ingestion session is `completeIngestion`-ed so the Ingestion tab is hidden, and the user is navigated to `/customers/:id?tab=invoicing&invoiceId=INV-...`
4. `CustomerRevenueWorkspace` syncs `activeTab` from the URL-driven `initialStage` / `activeRecordId` props (via a `useRef`-guarded effect) so the new invoice opens directly in detail view — no flicker back to Overview
5. Approval can happen via:
   - `EntityDrawer` with `InvoiceApprovalDrawer` (opened from the **View in Approvals** CTA on the invoice details page or from `Workbench → Approvals`)
   - Full-page `ApprovalDetailPage` at `/approvals/invoices/:id`
6. On approve, `setInvoiceStatusOverride(invoiceId, "Approved")` flips the invoice status; the action set on the invoice details page falls back to the default Approved branch

---

## Deleted components

The following were removed as part of the Customer 360 migration:

- `src/components/transitions/UnifiedFlowShell.tsx`
- `src/components/transitions/IngestDrawer.tsx`
- `src/components/transitions/ValidationPanel.tsx`
- `src/components/transitions/IngestDocumentPreviewPane.tsx`
- `src/components/transitions/IngestFieldGroup.tsx`
- `src/components/transitions/sections/*`
- `src/components/transitions/panels/*`
- `src/pages/QueueIngestPage.tsx`

The `src/components/transitions/` directory no longer exists.

Flow-related store functions (`patchFlowSession`, `setFlowStep`) and types (`TransitionFlowSession`, `FlowStepId`, `FlowScenario`) are no longer used.

---

## Key files checklist

| File | Role |
|---|---|
| `src/components/common/EntityDrawer.tsx` | Invoice approval overlay only |
| `src/store/drawer-store.ts` | Simplified drawer state |
| `src/store/link-customer-modal-store.ts` | LinkCustomerModal state |
| `src/components/ingestion/LinkCustomerModal.tsx` | Customer linking modal |
| `src/components/revenue-workspace/ingestion/*` | Ingestion tab components |
| `src/context/IngestProvider.tsx` | Session state including IngestionSession |
| `src/data/ingestion-session.ts` | Contract/Invoice builders |
| `src/components/approvals/InvoiceApprovalDrawer.tsx` | Approval drawer body |

---

## Do / Don't for agents

**Do**

- Use `openLinkCustomerModal(queueItemId)` for new ingestion entry points.
- Persist ingestion session state in `IngestContext` via `IngestionSession`.
- Navigate to `/customers/:id?tab=ingestion` after customer linking.
- Use `openDrawer` only for invoice approval.
- Render Ingestion-tab CTAs through `RecordHeader` (with `ActionButton` + `OverflowItem`) so they appear in the right context pill — same primitives as other detail pages.
- After Send-for-approval, drive the new invoice details page entirely from URL params (`?tab=invoicing&invoiceId=...`); rely on `CustomerRevenueWorkspace`'s URL → `activeTab` sync effect rather than imperatively setting tab state.

**Don't**

- Add flow/step state to drawer-store (removed).
- Reference deleted transition components.
- Create new drawer modes for ingestion (use Customer 360 tab).
- Reintroduce a status chip / status dropdown into the Ingestion actions pill — sections drive the gate, not a global selector.
- Use `useState` initializers to mirror props (e.g. `preselectedCustomer` in `LinkCustomerModal`); use `useEffect` so the state updates when the prop changes.
