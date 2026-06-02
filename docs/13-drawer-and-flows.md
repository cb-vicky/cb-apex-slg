# Drawer & NEW DEAL Ingestion

Reference for the **global overlay** pattern and the **NEW DEAL Ingestion** architecture (Zenith flow).

**Architecture change (June 2026):** The NEW DEAL ingestion flow now uses:
1. **`NewDealCustomerLinkModal`** — full-screen modal for customer linking (replaces `LinkCustomerModal`)
2. **Zenith Contract Review** — tabbed review UI inside Customer 360 (`contract/zenith/` components)

The `EntityDrawer` remains simplified to only handle invoice approvals.

**Related:** `docs/09-contract-ingestion.md` (business flows), `docs/06-routing.md` (URLs), `docs/03-customer-workspace.md` (workspace tabs).

---

## Architecture overview

```
App.tsx
  <EntityDrawer />              ← invoice approval only, z-[60]
  <NewDealCustomerLinkGateHost />  ← renders NewDealCustomerLinkModal when pending
  <Routes> … </Routes>

drawer-store.ts                 ← simplified: open/close, no flow state
useDrawerStore.ts               ← React hook (useSyncExternalStore)

EntityDrawer.tsx                ← only renders InvoiceApprovalDrawer

new-deal-customer-link-store.ts ← modal state for NEW DEAL ingestion entry

CustomerRevenueWorkspace
  └─ IngestionStageContent      ← when tab=ingestion
       └─ ZenithContractChromeProvider  ← Zenith flow state
            └─ ZenithContractTabStrip + ZenithContractTabPanel
```

Session business state (queue overrides, approvals, closures, ingestion sessions) stays in **`IngestProvider`**. The drawer store only holds **UI orchestration** for invoice approval: what is open and which invoice.

---

## NewDealCustomerLinkModal

**File:** `src/components/workbench/NewDealCustomerLinkModal.tsx`

The entry point for NEW DEAL contract ingestion. Opened via `openNewDealCustomerLinkModal(queueItemId)`.

| Property | Value |
|---|---|
| Layout | **Full-screen** modal (`fixed inset-0`) |
| Grid | 2-column: left 40% (PDF preview), right 60% (linking UI) |
| z-index | `70` |

**Left panel (DocumentPreviewPane):**
- Contract PDF preview with zoom controls
- Page navigation
- Mock contract document rendering

**Right panel:**
1. **Extracted customer details card** — company, legal entity, domain, contact
2. **Mode toggle:** "Link to existing" | "Create new customer"
3. **Link mode:** Search bar + scrollable customer table (`CustomerLinkCustomerTable`)
4. **Create mode:** Inline form (`CreateCustomerForm`)
5. **Footer:** Cancel + "Continue to ingest" CTA

**Related components:**
- `ExtractedCustomerDetailsCard` — displays extracted PDF data (`ready` / `linked` accent props)
- `LinkedCustomerDetailsCard` — displays linked customer data (standard flow + non-approved browse)
- `CustomerLinkCondensedStrip` — sticky header when scrolled
- `CustomerLinkSearchResults` — `CustomerLinkSearchBar`, `CustomerLinkCustomerTable`, `ViewSimilarMatchesButton`
- `CreateCustomerForm` — inline customer creation form
- `NewDealCustomerLinkMatchFirstPanel` — **match-first** right column (`sample5` / `linkWorkflow: "match_first"`)
- `CustomerClosestMatchPanel` — closest-match banner with approve/reject + optional **View similar matches**

**Workflow variants (right panel):**

| Variant | When | Right panel |
|---------|------|-------------|
| **standard** | Default; `sample2` Zenith path | Extracted card + link/create tabs + search table |
| **match_first** | `QI-2026-0007`, `sample5`, or `linkWorkflow: "match_first"` | `NewDealCustomerLinkMatchFirstPanel` (banner → browse; see `docs/09-contract-ingestion.md`) |

**On submit:**
```typescript
startIngestionSession(queueItemId, customerId, sampleId, "matched" | "created")
applyQueueItemOverride(queueItemId, { status: "In Progress", customerId })
closeNewDealCustomerLinkModal()
openQueueIngestionTab(customerId, queueItemId, navigate)
// → /customers/:customerId?tab=ingestion&queueItemId=...
```

### Store API

**File:** `src/store/new-deal-customer-link-store.ts`

| Function | Purpose |
|---|---|
| `openNewDealCustomerLinkModal(queueItemId)` | Open modal with queue item context |
| `closeNewDealCustomerLinkModal()` | Close modal |
| `getNewDealCustomerLinkState()` | Get current state (`{ pendingQueueItemId }`) |
| `subscribeNewDealCustomerLink()` | Subscribe to changes |

### Gate Host

**File:** `src/components/workbench/NewDealCustomerLinkGateHost.tsx`

Uses `useNewDealCustomerLinkGate()` hook to:
1. Read pending queue item ID from store
2. Resolve to full `QueueItem` object
3. Render `NewDealCustomerLinkModal` when pending, null otherwise

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

## Customer 360 Ingestion Tab (Zenith Flow)

Contract ingestion now happens **inside the customer workspace** via the Ingestion tab with the Zenith contract review UI.

### Entry points

| Source | Action |
|---|---|
| `UploadModal` | `openNewDealCustomerLinkModal(queueItem.id)` |
| `QueueTabContent` | Row click → `openNewDealCustomerLinkModal(q.id)` |
| `WorkbenchTaskList` | Queue-sourced tasks → `openNewDealCustomerLinkModal(task.drawer.entityId)` |

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
/customers/:id?tab=ingestion&queueItemId=QI-...&zenithTab=Summary
/customers/:id?tab=ingestion&queueItemId=QI-...&zenithTab=Items
/customers/:id?tab=ingestion&queueItemId=QI-...&zenithTab=Billing+info
/customers/:id?tab=ingestion&queueItemId=QI-...&zenithTab=Addresses
/customers/:id?tab=ingestion&queueItemId=QI-...&zenithTab=Invoice+Preview
```

### Zenith Contract Chrome

**Provider:** `ZenithContractChromeContext` wraps the ingestion content and provides:

```typescript
interface ZenithContractChromeValue {
  activeTab: ZenithContractActiveTab;
  setActiveTab: (tab: ZenithContractActiveTab) => void;
  ingestionQueueItemId?: string;
  ingestionCustomerId?: string;
  isScrollCollapsed: boolean;
  getContentTabStatus: (tab: ZenithContractContentTab) => ZenithTabCompletionStatus;
  markTabComplete: (tab: ZenithContractContentTab) => void;
  unmarkTabComplete: (tab: ZenithContractContentTab) => void;
  contractLineItems: ZenithSummaryLineItem[];
  setContractLineItems: (items: ZenithSummaryLineItem[]) => void;
  reviewStatus: ZenithContractReviewStatus;
  comments: ZenithContractComment[];
  commentsPanelOpen: boolean;
  openCommentsPanel: (focus?: ZenithCommentFocus) => void;
  closeCommentsPanel: () => void;
  addComment: (input: { tab, anchorLabel, text }) => void;
}
```

### Tab strip (`ZenithContractTabStrip`)

Horizontal tab bar with:
- Tab buttons: Summary | Items | Billing info | Addresses | Invoice Preview
- Status icons per tab (`ZenithContractTabStatusIcon`):
  - Gray circle — incomplete
  - Green checkmark — complete
- Invoice Preview tab disabled until all other tabs complete

### Tab content (`ZenithContractTabPanel`)

Renders the appropriate tab component based on `activeTab`:
- `ZenithContractSummaryTab`
- `ZenithContractItemsTab` + `ZenithLineItemBottomDrawer`

**`ZenithLineItemBottomDrawer` — line item mapping (additive):**

- Portal overlay; ~80vh default, ~20vh compact after successful map/approve (`compact={Boolean(drawerResolution)}`).
- `headerTitle` frozen at open (contract PDF name); pinned `LineItemPinnedStrip` shows live row state.
- Yellow rows (`needs_mapping`, `billing_rule_match`): map/create panels only — **no** green “Match found” banner.
- Green system-match rows: Match found approve/reject; billing-rule adds use catalog id from `mappedCatalogByLine`.
- `ZenithContractBillingInfoTab` + `ZenithMarkTabDoneBar`
- `ZenithContractAddressesTab` + `ZenithMarkTabDoneBar`
- `ZenithContractInvoicePreviewTab`

### Comments panel (`ZenithContractCommentsPanel`)

Slide-out panel (right side) for contract review comments:
- Comment list with author, timestamp, pinned status
- "Add comment" form
- Filter by tab anchor
- Pin/unpin comments

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

The following were removed as part of the NEW DEAL ingestion refactor:

- `src/components/ingestion/LinkCustomerModal.tsx` — replaced by `NewDealCustomerLinkModal`
- `src/store/link-customer-modal-store.ts` — replaced by `new-deal-customer-link-store.ts`
- `src/store/useLinkCustomerModalStore.ts` — no longer needed
- `src/components/transitions/UnifiedFlowShell.tsx`
- `src/components/transitions/IngestDrawer.tsx`
- `src/components/transitions/ValidationPanel.tsx`
- `src/components/transitions/IngestDocumentPreviewPane.tsx`
- `src/components/transitions/IngestFieldGroup.tsx`
- `src/components/transitions/sections/*`
- `src/components/transitions/panels/*`
- `src/pages/QueueIngestPage.tsx`

The `src/components/transitions/` and `src/components/ingestion/` directories no longer exist.

Flow-related store functions (`patchFlowSession`, `setFlowStep`) and types (`TransitionFlowSession`, `FlowStepId`, `FlowScenario`) are no longer used.

---

## Key files checklist

| File | Role |
|---|---|
| `src/components/common/EntityDrawer.tsx` | Invoice approval overlay only |
| `src/store/drawer-store.ts` | Simplified drawer state |
| `src/store/new-deal-customer-link-store.ts` | NewDealCustomerLinkModal state |
| `src/components/workbench/NewDealCustomerLinkModal.tsx` | Full-screen customer linking modal (branches standard vs match-first) |
| `src/components/workbench/NewDealCustomerLinkMatchFirstPanel.tsx` | Match-first orchestration (approve, reject, browse scopes) |
| `src/components/workbench/CustomerClosestMatchPanel.tsx` | Closest-match banner + catalog row table |
| `src/components/workbench/CreateCustomerForm.tsx` | Inline customer creation form |
| `src/components/workbench/CustomerLinkSearchResults.tsx` | Search bar, customer table, browse meta links |
| `src/components/workbench/ExtractedCustomerDetailsCard.tsx` | Extracted PDF fields + ready/linked accents |
| `src/components/workbench/NewDealCustomerLinkGateHost.tsx` | Modal gate wrapper |
| `src/hooks/useNewDealCustomerLinkGate.tsx` | Hook to resolve pending queue item |
| `src/lib/new-deal-customer-link.ts` | Extracted summary, domain helpers |
| `src/lib/new-deal-customer-link-workflow.ts` | Variant, closest/similar ranking, browse list builders |
| `src/data/customer-link-search-seed.ts` | Extra catalog + Pioneer similar-match ids |
| `src/components/revenue-workspace/contract/zenith/*` | Zenith contract review UI |
| `src/components/revenue-workspace/ingestion/*` | Legacy ingestion tab components |
| `src/context/IngestProvider.tsx` | Session state including IngestionSession |
| `src/data/zenith-*.ts` | Zenith seed data (catalog, summary, comments) |
| `src/components/approvals/InvoiceApprovalDrawer.tsx` | Approval drawer body |

---

## Do / Don't for agents

**Do**

- Use `openNewDealCustomerLinkModal(queueItemId)` for NEW DEAL ingestion entry points.
- Persist ingestion session state in `IngestContext` via `IngestionSession`.
- Navigate to `/customers/:id?tab=ingestion&queueItemId=...` after customer linking.
- Use `ZenithContractChromeContext` for Zenith flow state (active tab, line items, comments).
- Use `openDrawer` only for invoice approval.
- Render Invoice Preview tab with PDF-style invoice document + Send for approval CTA.
- After Send-for-approval, drive the new invoice details page entirely from URL params (`?tab=invoicing&invoiceId=...`); rely on `CustomerRevenueWorkspace`'s URL → `activeTab` sync effect rather than imperatively setting tab state.

**Don't**

- Reference deleted `LinkCustomerModal` or `link-customer-modal-store` (use NEW DEAL equivalents).
- Add flow/step state to drawer-store (removed).
- Reference deleted transition components.
- Create new drawer modes for ingestion (use Customer 360 Zenith tabs).
- Mix Zenith tab state with legacy ingestion frame/sub URL params — Zenith uses `&zenithTab=...`.
- Skip the `ZenithContractChromeProvider` wrapper when rendering Zenith content.
