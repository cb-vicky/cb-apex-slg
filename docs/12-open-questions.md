# Open Questions & Assumptions

Consolidated assumptions from the prototype build and deliberately deferred decisions. Updated to reflect **current** implementation (May 2026).

## Assumptions in effect

### Module labels

Sidebar says **"Invoices"**; workspace tab says **"Invoicing"**. Keep both — route vs in-shell label.

### Customer / Overview tab

**"Overview"** is the first file-folder tab (internal stage id still `customer`). Record action pill is hidden — customer is the record.

### Alias route handling

`/quotes/:quoteId`, `/contracts/:contractId`, `/invoices/:invoiceId` render **through the customer shell**, not redirect.

### Workspace chrome model

Live UI uses **`CustomerContextBar`** + optional **`RecordHeader`** action pill.

### Workbench model

- Tabs: **Your tasks | Queue | Approvals** (not My Tasks + Getting Started)
- Persona: **Operator / Approver** in TopNav (`DemoPersonaContext`)
- Getting Started components exist but are **unwired**

### Drawer-first ingest

Primary demo path: **`EntityDrawer`** via `drawer-store`. Full-page `/queue/:id` and `/approvals/invoices/:id` remain for deep links.

### Multi-customer data volume

Six seed customers with distinct lifecycle stories — enough for demos, not production scale.

### Support / email depth

Echo Corp and Northlane Labs have representative tickets and email summaries; Threads tab uses `email-threads.ts`.

### Items tab — billing-rule gaps (May 2026, additive)

- Gap suggestions are **mock-only** on `ExtractedContract.billingRuleGapItems` in `ingest-data.ts`; not derived from PDF extraction.
- **Ignore** is a valid terminal state for tab completion (same as **Add** + link).
- Renewal samples (`sample3`, `sample4`) have empty gap arrays until Items grid exists for those flows.

---

## Lifecycle tab assumptions

### Invoice selection default

When invoicing tab is active without `invoiceId`, list view shows (no auto-select first invoice in list mode).

### Collections tab

Payment stage content — AR posture primary; no separate payment detail sub-page.

### RevRec arrangement resolution

One arrangement per contract; resolved from selected or first active contract.

### RevRec independence from Payment

RevRec must never imply cash-based recognition.

---

## Contract ingestion / approvals assumptions

### Upload / Import entry

**Workbench Queue tab → Import** (`UploadModal`). Samples: `sample2`, `sample3`, `sample4` → queue ids via `getQueueItemBySample`.

### Session state

`IngestProvider` uses React `useState` only (sidebar collapse uses `localStorage`). Refresh resets session.

### Ingest route scope

`/queue/:queueItemId` = full-page ingest shell. Canonical operator landing = `/?tab=queue`.

### Queue seed size

Minimal seed in `queue-data.ts` includes Zenith (`QI-2026-0002`), Pioneer match-first (`QI-2026-0007`), Early/Late renewal rows — expand when adding scenarios.

### Match-first customer link

- **`linkWorkflow: "match_first"`** on queue row (or `sample5`) selects `NewDealCustomerLinkMatchFirstPanel`.
- Closest match is **suggested**, not auto-linked — operator must **Approve** (or pick another row after Reject / browse).
- After **Approve**, extracted card stays in **Ready** state when opening similar browse; dual linked cards are not shown until operator picks a different customer or leaves approved-ready flow.
- **Reject** lands in **View all customers** with matches on top; closest row has outline **Closest match** pill without green row fill.

### IngestFieldGroup

Canonical wrapper for ingest sections; chips mirror `ValidationPanel` items.

---

## Open questions

### Q1 — Unified approvals module

Should Approvals eventually include **Quote** approvals (`quote.approval.status`)?

### Q2 — Required reasons for submission

Minimum comment before "Send for Approval" in a future iteration?

### Q3 — Session-created customer visibility

Should Zenith-path customers appear immediately on Customers index?

### Q4 — Contract document export

PDF download from document viewer?

### Q5 — Multi-approver chains

Sequential/parallel approvers on approval detail?

### Q6 — Late Renewal queue row

Update `QI-2026-0003` with `sampleId: "sample4"` + `ingestable: true` for full queue-row demo parity?

### Q7 — Early Renewal comments in drawer

Is full-page approval sufficient, or should **`InvoiceApprovalDrawer`** gain inline comments column?

### Q8 — Sidebar notification dots

Wire `usePendingWorkbenchCounts` to Sidebar, or remove hook if not planned?

