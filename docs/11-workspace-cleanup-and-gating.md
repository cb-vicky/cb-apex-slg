# Workspace Cleanup — Tab Gating & List-then-Detail

Hardened behavior for the customer shell. If you're touching tab gating, list-detail transitions, or empty states, read this.

## 1. Tab gating — lifecycle stage disabling

Gating is enforced on **`CustomerContextBar`** tabs in `CustomerRevenueWorkspace`:

| Tab | Rule |
|---|---|
| Overview | always enabled |
| Tasks | always enabled |
| Threads | always enabled |
| Quote | always enabled (empty state if no quotes) |
| Contract | enabled only if customer has ≥ 1 contract |
| Invoicing | enabled only if customer has ≥ 1 contract |
| Collections | enabled only if customer has ≥ 1 invoice |
| RevRec | enabled only if customer has ≥ 1 contract |

**Visual treatment of disabled tabs:**
- 40% opacity
- "Not available" sub-text
- `cursor-not-allowed`
- Click has no effect

### Important nuance — don't over-gate

Existing contracts are **NOT** blocked when a renewal quote is pending approval. Gating applies only when **no contract exists at all** (e.g. Pioneer Systems). An active prior contract keeps downstream stages accessible.

## 2. List-then-detail pattern (Quote, Contract, Invoicing)

### Flow

1. User opens Quotes / Contracts / Invoicing parent tab
2. Compact table lists all records
3. Row click opens detail and adds a **child tab** under the parent
4. Return to list: click **parent tab** again or close child tab (×)

### Exception — deep links

URL with `?quoteId` / `?contractId` / `?invoiceId` opens directly in detail with child tab active.

### Navigation note

List return is via **parent tab click** or closing a child tab — `RecordHeader` is action-only (no back link).

### List specifics

**Quote list (`QuoteListView`):**
- Grouped by lineage; chevron expands older versions

**Contract list (`ContractListView`):**
- Flat table; may show pending ingestion annotations from `queueItems`

**Invoice list (`InvoiceListView`):**
- Flat table, date desc; hold reason inline

## 3. Prototype use-case matrix

Full matrix: `docs/08-mock-data.md`. Quick reference:

- **Echo Corp** — renewal pending + draft amendment; active + scheduled renewal lineage; overdue + held invoices
- **Lumina AI** — contract closing; pending review invoice; closure credit note
- **Northlane Labs** — enforcement issues; overdue invoice; late renewal queue placeholder
- **Pioneer Systems** — quote pending; **no contract** → Contract/Invoicing/Collections/RevRec disabled
- **Verdant Health** — sent quote; active contract; Early Renewal demo (`QI-2026-0006`)
- **Zenith Analytics** — no quote (empty state); ingested contract; pending review invoice

### Bug fixed during cleanup

Pioneer Systems and Zenith Analytics previously inherited Echo Corp data as fallback in `CustomerDetailPage`. Fixed with null guards for missing quote/contract.

## 4. Data changes from cleanup pass

### CON-INGEST-002 (Zenith)

Active ingested contract, partial enforcement, INV-INGEST-002 ($155,000) with corrected line items totaling $155,000.

### INV-INGEST-002 line items

- Apex Analytics Pro 200 × $60: $144,000
- Premium Support: $11,000
- **Total: $155,000 ✓**
