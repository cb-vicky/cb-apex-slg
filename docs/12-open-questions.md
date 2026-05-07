# Open Questions & Assumptions

Consolidated from the original plan-md. Reflects assumptions made during the prototype build and deliberately deferred decisions.

## Assumptions in effect

### Module labels

The sidebar currently says "Invoices" and the journey rail tab says "Invoicing". Recommendation: keep "Invoices" for sidebar + route, "Invoicing" for the lifecycle tab label inside the shell.

### Customer tab placement

"Customer" is placed as the first tab before Quote. Alternative: could live as a persistent header-level link above the rail rather than inside it, if the rail's visual flow becomes crowded. Current implementation keeps it in the rail.

### Alias route handling

`/quotes/:quoteId`, `/contracts/:contractId`, `/invoices/:invoiceId` render **through the customer shell**, not redirect. This avoids URL changes but means `QuoteDetailPage.tsx`, `ContractDetailPage.tsx`, `InvoiceDetailPage.tsx` must resolve `customerId` from the record and render `CustomerRevenueWorkspace`. Already in place.

### Record context bar on Customer tab

When the Customer (Account 360) tab is active, the Record Context Bar is hidden / replaced with a simplified customer-level bar (entity/site/owner info + customer-level actions like "Edit customer", "View in CRM", "Open support"). Design decision locked in.

### Journey rail status text

When the Customer tab is shown, its status text is the customer's overall health / risk level (e.g. "3 risk flags" or "Healthy") — keeps the rail informative rather than decorative.

### "View all" filtered list view

The grouped page and filtered list page are the **same React component** toggling between modes based on `?group` query param. No separate page components per module.

### Multi-customer data volume

4–5 new customers with minimal linked records. Enough to populate 5 rows per group in the prototype. Production-realistic volumes not required.

### Support / email summary depth

First pass: 3–4 support tickets + 3–4 email summaries for Echo Corp; 1–2 for Northlane Labs. Deeper mocking can follow.

---

## Lifecycle tab assumptions (Invoicing, Payment, RevRec)

### Invoice selection default

When the invoicing tab is active and no `invoiceId` is provided in the URL, the first customer invoice (by date descending) is selected automatically.

### Payment tab record

The payment tab uses the customer's AR posture as the primary view. Individual payment records are shown in a table but there is **no separate "payment detail" sub-page**.

### RevRec arrangement resolution

Revenue arrangements are resolved from the customer's primary contract (`contractId`). **One arrangement per contract.** If multiple contracts exist, the arrangement for the currently selected contract (or first active contract) is shown.

### Journal / ERP export

The prototype **mocks** journal export status and ERP references. No actual export integration exists.

### Write-off approval

The prototype shows a write-off request state but does **not** implement an approval flow.

### Recognition schedule granularity

Monthly granularity for the waterfall schedule. Quarterly roll-ups not needed for prototype.

### RevRec independence from Payment

The RevRec tab data and narrative must **never** state or imply that revenue is recognized upon payment. Revenue follows contract performance and accounting policy.

---

## Contract ingestion / approvals assumptions

### Upload / Import entry

**Queue > Import** is the primary entry (`UploadModal` from `QueueIndex`). The Contracts index does **not** carry the main upload CTA for ingestion demos (see `docs/09-contract-ingestion.md`). `UploadModal` resolves **`sample2` / `sample3`** to queue rows **`QI-2026-0002`** / **`QI-2026-0006`** via `getQueueItemBySample`.

### Contract document viewer

Renders styled HTML — **not** an actual PDF. A realistic HTML representation is sufficient for the prototype.

### Session state

`IngestContext` uses React `useState` only. **No localStorage / sessionStorage.** Refresh resets all prototype state to base mock data.

### "Send for Approval" visibility

Shown on **any** invoice with status "Pending Review". Covers both statically defined invoices and ingest-created ones.

### Approvals module scope

Only **invoice** approvals in this pass. Quote approvals (which already exist as `quote.approval.status` in `QuoteApprovalInfo`) are NOT migrated into this module.

### Hardcoded approver

Approval approver is always hardcoded to "Sarah Chen, VP Revenue". Dynamic approval routing out of scope.

### Invoice status overrides

Live in React context (`IngestContext.invoiceStatusOverrides`). Navigating directly to an invoice via URL (without going through the flow) shows the original static status. Acceptable prototype behavior.

### Ingest route scope

**`/queue/:queueItemId`** is the canonical ingest workspace (**standalone**, not inside `CustomerRevenueWorkspace`). Legacy **`/contracts/ingest?sample=`** style URLs are obsolete for the prototype narrative.

### Queue row cardinality

The **`queue-data.ts`** seed was reduced to **three** operational rows to speed iteration. Re-expand when building **Late Renewal** ingest, **Amendment**, failure buckets, or renewal (`sample1`) demos — update **`docs/09-contract-ingestion.md`** navigation examples whenever ids change.

### IngestFieldGroup as standard drawer primitive

`IngestFieldGroup` is the canonical grouping wrapper for all ingest drawer sections. Flat section components (`*Section.tsx` in `src/components/transitions/sections/`) are designed to be hosted inside its body — no nested cards, no redundant chrome. The chip in the header mirrors the `ValidationPanel` status items so both surfaces stay in sync.

---

## Open questions

These remain unresolved and are worth revisiting as the prototype matures.

### Q1 — Unified approvals module

Should the Approvals module eventually support **Quote** approvals too, unifying the `quote.approval.status` flow with this new module?

### Q2 — Required reasons for submission

Should "Send for Approval" set a minimum comment/reason requirement before submission in a future iteration?

### Q3 — Session-created customer visibility

In the exception path, should the newly created customer appear **immediately** in the Customers Index list, or only after a confirmatory step?

### Q4 — Contract document export

Should contract documents be **downloadable (PDF export)** from the document viewer in a future iteration?

### Q5 — Multi-approver chains

Should the approval detail page support **multi-approver chains** (sequential or parallel) in future iterations?

### Q6 — Late Renewal implementation direction

**Resolved:** Late Renewal is fully implemented with:

- **Backdating:** `TransitionContractTermsSection` supports `allowBackdate` prop — operators can set effective date earlier than today for late renewals
- **Grace extension awareness:** Late renewal banner shows prior contract's grace extension details when present
- **Flow parity:** Late Renewal follows the same `close_prior` → approval → auto-activate pattern as Early Renewal
- **Contract workspace:** Grace extension banner in `ContractStageContent` with "Resolve in drawer" action
- **State-aware actions:** Contract tab actions vary based on status (Extended/inGrace shows "Resolve renewal" as primary action)

Queue row `QI-2026-0003` can be updated with `sampleId: "sample4"` + `ingestable: true` when ready for the full demo.

### Q7 — Early Renewal comments parity

Should the **invoice approval drawer** gain a **comments column** (or inline rail) for **`QI-2026-0006`** threads, or is **full-page** (`/approvals/invoices/...` + optional `ingestId`) sufficient for approvers?
