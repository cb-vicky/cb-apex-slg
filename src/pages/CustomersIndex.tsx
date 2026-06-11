import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { customers, invoices as seedInvoices } from "@/data/mock-data";
import type { Customer } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import {
  columnsForView,
  formatCustomerListCell,
  cellClassName,
  type CustomerListColumnKey,
  type CustomerListRowData,
} from "@/data/customer-list-columns";
import { ListTable, ListCreateRow, ListRow, ListCell } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag } from "@/components/index-page/FilterBar";
import {
  CUSTOMER_FILTER_PROPERTIES,
  matchesCustomerPropertyFilter,
} from "@/data/customer-filter-properties";
import { CustomerViewSelector } from "@/components/index-page/CustomerViewSelector";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";
import {
  DEFAULT_CUSTOMER_LIST_VIEW_ID,
  buildCustomerListRowDataMap,
  countCustomersByView,
  defaultFilterTagsForView,
  filterCustomersByView,
  getCustomerListView,
  type CustomerListViewId,
} from "@/data/customer-list-views";

function matchesTagFilters(
  customer: Customer,
  filters: FilterTag[],
  row: CustomerListRowData,
): boolean {
  return filters.every((filter) => matchesCustomerPropertyFilter(customer, filter, row));
}

export function CustomersIndex() {
  const navigate = useNavigate();
  const { sessionCustomers, sessionInvoices, invoiceStatusOverrides } = useIngestContext();
  const [activeViewId, setActiveViewId] = useState<CustomerListViewId>(
    DEFAULT_CUSTOMER_LIST_VIEW_ID,
  );
  const [filters, setFilters] = useState<FilterTag[]>(() =>
    defaultFilterTagsForView(DEFAULT_CUSTOMER_LIST_VIEW_ID),
  );

  const activeView = useMemo(() => getCustomerListView(activeViewId), [activeViewId]);
  const listColumns = useMemo(() => columnsForView(activeView.columns), [activeView.columns]);

  useEffect(() => {
    setFilters(defaultFilterTagsForView(activeViewId));
  }, [activeViewId]);

  const customersMerged = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    for (const c of sessionCustomers) {
      byId.set(c.id, c);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionCustomers]);

  const invoicesMerged = useMemo(() => {
    const byId = new Map(seedInvoices.map((i) => [i.id, i]));
    for (const inv of sessionInvoices) {
      byId.set(inv.id, inv);
    }
    return [...byId.values()];
  }, [sessionInvoices]);

  const rowDataMap = useMemo(
    () => buildCustomerListRowDataMap(customersMerged, invoicesMerged, invoiceStatusOverrides),
    [customersMerged, invoicesMerged, invoiceStatusOverrides],
  );

  const viewCounts = useMemo(
    () => countCustomersByView(customersMerged, rowDataMap),
    [customersMerged, rowDataMap],
  );

  const customersFiltered = useMemo(() => {
    const byView = filterCustomersByView(customersMerged, activeViewId, rowDataMap);
    return byView.filter((c) => {
      const row = rowDataMap.get(c.id);
      if (!row) return false;
      return matchesTagFilters(c, filters, row);
    });
  }, [customersMerged, activeViewId, rowDataMap, filters]);

  const { ref: scrollRef, isScrolled } = useScrolled();

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Customers" />}
      filterBar={
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterProperties={CUSTOMER_FILTER_PROPERTIES}
          resultCount={customersFiltered.length}
          resultLabel="customers"
          leadingContent={
            <CustomerViewSelector
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
          label="New customer"
          columnCount={listColumns.length}
          firstColumnWidth={listColumns[0]?.width}
        />
        {customersFiltered.map((customer) => {
          const row = rowDataMap.get(customer.id);
          if (!row) return null;

          return (
            <ListRow
              key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}?tab=customer&from=customers`)}
            >
              {activeView.columns.map((columnKey: CustomerListColumnKey) => {
                const column = listColumns.find((c) => c.key === columnKey);
                return (
                  <ListCell
                    key={columnKey}
                    width={column?.width}
                    align={column?.align}
                    className={cellClassName(columnKey, row)}
                  >
                    {formatCustomerListCell(columnKey, row)}
                  </ListCell>
                );
              })}
            </ListRow>
          );
        })}
      </ListTable>
    </IndexPageFrame>
  );
}
