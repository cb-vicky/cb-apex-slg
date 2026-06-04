import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { invoices, customers } from "@/data/mock-data";
import type { Invoice } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { ListTable, ListCreateRow, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag, type FilterOption } from "@/components/index-page/FilterBar";
import { InvoiceViewSelector } from "@/components/index-page/InvoiceViewSelector";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";
import {
  DEFAULT_INVOICE_LIST_VIEW_ID,
  buildInvoiceViewContextMap,
  countInvoicesByView,
  filterInvoicesByView,
  type InvoiceListViewId,
} from "@/data/invoice-list-views";

function matchesTagFilters(invoice: Invoice, filters: FilterTag[]): boolean {
  for (const filter of filters) {
    if (filter.field === "Status" && invoice.status !== filter.value) return false;
    if (filter.field === "Owner" && invoice.owner !== filter.value) return false;
    if (filter.field === "Blocker") {
      const hasBlocker = Boolean(invoice.holdReason);
      if (filter.value === "Has blocker" && !hasBlocker) return false;
      if (filter.value === "No blocker" && hasBlocker) return false;
    }
  }
  return true;
}

const listColumns: Column[] = [
  { key: "id", label: "Invoice ID", width: "130px", sortable: true },
  { key: "customer", label: "Customer", width: "150px", sortable: true },
  { key: "contract", label: "Contract", width: "130px" },
  { key: "amount", label: "Amount", width: "100px", align: "right" },
  { key: "due", label: "Due date", width: "100px", sortable: true },
  { key: "status", label: "Status", width: "110px" },
  { key: "owner", label: "Owner", width: "110px" },
  { key: "blocker", label: "Blocker", width: "160px" },
];

const filterOptions: FilterOption[] = [
  { field: "Status", label: "Status", values: ["Pending Review", "Pending Approval", "Paid", "Overdue", "Draft"] },
  { field: "Owner", label: "Owner", values: ["Sarah Chen", "Mike Ross", "Alex Kim"] },
  { field: "Blocker", label: "Blocker", values: ["Has blocker", "No blocker"] },
];

export function InvoicesIndex() {
  const navigate = useNavigate();
  const { invoiceStatusOverrides, sessionInvoices, sessionCustomers } = useIngestContext();
  const [filters, setFilters] = useState<FilterTag[]>([]);
  const [activeViewId, setActiveViewId] = useState<InvoiceListViewId>(
    DEFAULT_INVOICE_LIST_VIEW_ID,
  );

  const customersMerged = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    for (const c of sessionCustomers) {
      byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [sessionCustomers]);

  const invoicesWithSession = useMemo(() => {
    const byId = new Map(invoices.map((i) => [i.id, i]));
    for (const inv of sessionInvoices) {
      byId.set(inv.id, inv);
    }
    return [...byId.values()];
  }, [sessionInvoices]);

  const invoicesView = useMemo(
    () => mergeInvoiceStatuses(invoicesWithSession, invoiceStatusOverrides),
    [invoicesWithSession, invoiceStatusOverrides],
  );

  const viewContextMap = useMemo(
    () => buildInvoiceViewContextMap(invoicesView),
    [invoicesView],
  );

  const viewCounts = useMemo(
    () => countInvoicesByView(invoicesView, viewContextMap),
    [invoicesView, viewContextMap],
  );

  const invoicesFiltered = useMemo(() => {
    const byView = filterInvoicesByView(invoicesView, activeViewId, viewContextMap);
    return byView.filter((inv) => matchesTagFilters(inv, filters));
  }, [invoicesView, activeViewId, viewContextMap, filters]);

  const { ref: scrollRef, isScrolled } = useScrolled();

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Invoices" />}
      filterBar={
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          resultCount={invoicesFiltered.length}
          resultLabel="invoices"
          leadingContent={
            <InvoiceViewSelector
              activeViewId={activeViewId}
              viewCounts={viewCounts}
              onViewChange={setActiveViewId}
            />
          }
        />
      }
    >
      <ListTable columns={listColumns}>
        <ListCreateRow
          label="New invoice"
          columnCount={listColumns.length}
          firstColumnWidth={listColumns[0].width}
        />
        {invoicesFiltered.map((inv) => {
          const c = customersMerged.find((cu) => cu.id === inv.customerId);
          return (
            <ListRow key={inv.id} onClick={() => navigate(`/customers/${inv.customerId}?tab=invoicing&invoiceId=${inv.id}&from=invoices`)}>
              <ListCell width="130px" className="font-medium text-blue-600">{inv.id}</ListCell>
              <ListCell width="150px" className="font-medium">{c?.name ?? "—"}</ListCell>
              <ListCell width="130px">{inv.contractId || "—"}</ListCell>
              <ListCell width="100px" align="right" className="tabular-nums">
                {currency(inv.amount)}
              </ListCell>
              <ListCell width="100px">{shortDate(inv.dueDate)}</ListCell>
              <ListCell width="110px">
                <StatusBadge status={inv.status} />
              </ListCell>
              <ListCell width="110px" className="text-text-secondary">{inv.owner}</ListCell>
              <ListCell width="160px" className="text-text-muted">{inv.holdReason || "—"}</ListCell>
            </ListRow>
          );
        })}
      </ListTable>
    </IndexPageFrame>
  );
}
