# Workspace Cleanup — Tab Gating & List-then-Detail

Recent cleanup work (Apr 2026) that hardened the customer shell. If you're touching tab behavior, list-detail transitions, or customer-specific empty states, read this.

## 1. Tab gating — lifecycle stage disabling

The Revenue Journey Rail enforces downstream stage access based on whether the required data exists for a customer. This prevents users from navigating to empty or misleading stages before the lifecycle has progressed.

**Gating rule** (implemented in `CustomerRevenueWorkspace`):

| Tab | Rule |
|---|---|
| Customer | always enabled |
| Quote | always enabled (shows empty state if no quotes) |
| Contract | enabled only if customer has ≥ 1 contract |
| Invoicing | enabled only if customer has ≥ 1 contract |
| Payment | enabled only if customer has ≥ 1 invoice |
| RevRec | enabled only if customer has ≥ 1 contract |

**Visual treatment of disabled tabs:**
- 40% opacity
- "Not available" sub-text
- `cursor-not-allowed`
- Clicking has no effect

### Important nuance — don't over-gate

Existing contracts are **NOT** blocked when a renewal quote is pending approval. The gating only applies when **no contract exists at all** (e.g. a new-business prospect). An active prior contract keeps all downstream stages accessible, which is the correct operational behavior for billing and finance ops users.

---

## 2. List-then-detail pattern (Quote, Contract, Invoicing)

Landing on a tab shows a compact record list **before** any specific record is opened. This supports customers with multiple records per stage (e.g. multiple invoice cycles, multiple quote versions across deals).

### Flow

1. User clicks a tab (Quote / Contract / Invoicing)
2. A compact table renders listing all records for that customer
3. User clicks a row → the full detail view opens (same content as before)
4. A **"← All"** back button appears to the left of the `RecordContextBar` switcher/ID, returning the user to the list

### Exception — deep links

When arriving via a URL with a specific record ID (e.g. `?tab=contract&contractId=CON-2024-0189`), the workspace opens **directly in detail mode**, skipping the list. The back button is still available to navigate back to the list from there.

### List specifics

**Quote list (`QuoteListView`):**
- Grouped by lineage (one row per deal, not per version)
- Latest version is the primary row
- Clicking the chevron icon expands older versions as sub-rows
- Clicking any row (latest or older version) opens that specific version in the detail view; the existing version switcher is still available

**Contract list (`ContractListView`):**
- Flat table
- Columns: ID, source quote, effective/end dates, TCV, enforcement status, contract status

**Invoice list (`InvoiceListView`):**
- Flat table sorted by date descending
- Columns: ID, date, due date, contract, amount, status
- Hold reason shown inline if present

---

## 3. Prototype use-case matrix

Each customer showcases a distinct stage of the revenue lifecycle. Full matrix lives in `docs/08-mock-data.md`. Quick reference:

- **Echo Corp** — renewal pending approval + draft amendment; prior contract active; overdue + held invoices
- **Lumina AI** — accepted quote; active contract; pending review invoice
- **Northlane Labs** — draft amendment; contract with enforcement issues; overdue invoice
- **Pioneer Systems** — pending approval quote; **no contract** → Contract/Invoicing/Payment/RevRec DISABLED
- **Verdant Health** — sent quote; active contract; pending review invoice (missing PO)
- **Zenith Analytics** — **no quote** → Quote tab shows empty state; ingested contract; pending review invoice

### Bug fixed during cleanup

Pioneer Systems and Zenith Analytics previously inherited Echo Corp's data as a **fallback** due to a missing null guard in `CustomerDetailPage`. Both now correctly pass `null` quote/contract when no data exists, triggering the appropriate empty/disabled states.

---

## 4. Data changes from cleanup pass

### Added contract CON-INGEST-002 for Zenith Analytics

- Status: Active
- Source: Ingested PDF (no linked quote)
- Enforcement: Partial (SKU mapping pending)
- Provisioning: Pending
- Invoice: INV-INGEST-002 ($155,000 Pending Review)
- Extraction confidence: 91%

### Fixed INV-INGEST-002 line items

Previously summed to $164,400 against a $155,000 invoice total. Corrected:

- Apex Analytics Pro – 200 seats × $60/seat: **$144,000**
- Premium Support (Annual): **$11,000**
- **Total: $155,000 ✓**
