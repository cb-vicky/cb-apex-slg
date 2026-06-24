import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { customers, invoices as seedInvoices } from "@/data/mock-data";
import type { Customer, Invoice } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { StatusBadge } from "@/components/ui/primitives";
import { ListTable, ListCreateRow, ListRow, ListCell } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag } from "@/components/index-page/FilterBar";
import {
  CUSTOMER_FILTER_PROPERTIES,
  matchesCustomerPropertyFilter,
} from "@/data/customer-filter-properties";
import {
  INVOICE_FILTER_PROPERTIES,
  matchesInvoicePropertyFilter,
} from "@/data/invoice-filter-properties";
import { CustomerViewSelector } from "@/components/index-page/CustomerViewSelector";
import { InvoiceViewSelector } from "@/components/index-page/InvoiceViewSelector";
import {
  CollectionsEntityTabs,
  type CollectionsEntityTab,
} from "@/components/index-page/CollectionsEntityTabs";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";
import {
  columnsForView,
  formatCustomerListCell,
  cellClassName,
  type CustomerListColumnKey,
  type CustomerListRowData,
} from "@/data/customer-list-columns";
import {
  columnsForInvoiceView,
  formatInvoiceListCell,
  invoiceCellClassName,
  buildInvoiceListRowDataMap,
  type InvoiceListColumnKey,
  type InvoiceListRowData,
} from "@/data/invoice-list-columns";
import {
  DEFAULT_CUSTOMER_LIST_VIEW_ID,
  buildCustomerListRowDataMap,
  countCustomersByView,
  defaultFilterTagsForView,
  filterCustomersByView,
  getCustomerListView,
  type CustomerListViewId,
} from "@/data/customer-list-views";
import {
  DEFAULT_INVOICE_LIST_VIEW_ID,
  buildInvoiceViewContextMap,
  countInvoicesByView,
  defaultInvoiceFilterTagsForView,
  filterInvoicesByView,
  getInvoiceListView,
  type InvoiceListViewId,
} from "@/data/invoice-list-views";

function matchesCustomerTagFilters(
  customer: Customer,
  filters: FilterTag[],
  row: CustomerListRowData,
): boolean {
  return filters.every((filter) => matchesCustomerPropertyFilter(customer, filter, row));
}

function matchesInvoiceTagFilters(
  invoice: Invoice,
  filters: FilterTag[],
  row: InvoiceListRowData,
): boolean {
  return filters.every((filter) => matchesInvoicePropertyFilter(invoice, filter, row));
}

export function CollectionsIndex() {
  const navigate = useNavigate();
  const { sessionCustomers, sessionInvoices, invoiceStatusOverrides } = useIngestContext();
  const [entityTab, setEntityTab] = useState<CollectionsEntityTab>("customers");

  const [customerViewId, setCustomerViewId] = useState<CustomerListViewId>(
    DEFAULT_CUSTOMER_LIST_VIEW_ID,
  );
  const [customerFilters, setCustomerFilters] = useState<FilterTag[]>(() =>
    defaultFilterTagsForView(DEFAULT_CUSTOMER_LIST_VIEW_ID),
  );

  const [invoiceViewId, setInvoiceViewId] = useState<InvoiceListViewId>(
    DEFAULT_INVOICE_LIST_VIEW_ID,
  );
  const [invoiceFilters, setInvoiceFilters] = useState<FilterTag[]>(() =>
    defaultInvoiceFilterTagsForView(DEFAULT_INVOICE_LIST_VIEW_ID),
  );

  const customerView = useMemo(() => getCustomerListView(customerViewId), [customerViewId]);
  const customerColumns = useMemo(() => columnsForView(customerView.columns), [customerView.columns]);

  const invoiceView = useMemo(() => getInvoiceListView(invoiceViewId), [invoiceViewId]);
  const invoiceColumns = useMemo(
    () => columnsForInvoiceView(invoiceView.columns),
    [invoiceView.columns],
  );

  useEffect(() => {
    setCustomerFilters(defaultFilterTagsForView(customerViewId));
  }, [customerViewId]);

  useEffect(() => {
    setInvoiceFilters(defaultInvoiceFilterTagsForView(invoiceViewId));
  }, [invoiceViewId]);

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

  const invoicesView = useMemo(
    () => mergeInvoiceStatuses(invoicesMerged, invoiceStatusOverrides),
    [invoicesMerged, invoiceStatusOverrides],
  );

  const customerRowDataMap = useMemo(
    () => buildCustomerListRowDataMap(customersMerged, invoicesView, invoiceStatusOverrides),
    [customersMerged, invoicesView, invoiceStatusOverrides],
  );

  const invoiceViewContextMap = useMemo(
    () => buildInvoiceViewContextMap(invoicesView),
    [invoicesView],
  );

  const invoiceRowDataMap = useMemo(
    () => buildInvoiceListRowDataMap(invoicesView, customersMerged, invoiceViewContextMap),
    [invoicesView, customersMerged, invoiceViewContextMap],
  );

  const customerViewCounts = useMemo(
    () => countCustomersByView(customersMerged, customerRowDataMap),
    [customersMerged, customerRowDataMap],
  );

  const invoiceViewCounts = useMemo(
    () => countInvoicesByView(invoicesView, invoiceViewContextMap),
    [invoicesView, invoiceViewContextMap],
  );

  const customersFiltered = useMemo(() => {
    const byView = filterCustomersByView(customersMerged, customerViewId, customerRowDataMap);
    return byView.filter((c) => {
      const row = customerRowDataMap.get(c.id);
      if (!row) return false;
      return matchesCustomerTagFilters(c, customerFilters, row);
    });
  }, [customersMerged, customerViewId, customerRowDataMap, customerFilters]);

  const invoicesFiltered = useMemo(() => {
    const byView = filterInvoicesByView(invoicesView, invoiceViewId, invoiceViewContextMap);
    return byView.filter((inv) => {
      const row = invoiceRowDataMap.get(inv.id);
      if (!row) return false;
      return matchesInvoiceTagFilters(inv, invoiceFilters, row);
    });
  }, [invoicesView, invoiceViewId, invoiceViewContextMap, invoiceFilters, invoiceRowDataMap]);

  const { ref: scrollRef, isScrolled } = useScrolled();

  const isCustomersTab = entityTab === "customers";

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={
        <PageHeader
          title="Collections"
          viewToggle={
            <CollectionsEntityTabs active={entityTab} onChange={setEntityTab} />
          }
        />
      }
      filterBar={
        isCustomersTab ? (
          <FilterBar
            filters={customerFilters}
            onFiltersChange={setCustomerFilters}
            filterProperties={CUSTOMER_FILTER_PROPERTIES}
            resultCount={customersFiltered.length}
            resultLabel="customers"
            leadingContent={
              <CustomerViewSelector
                activeViewId={customerViewId}
                viewCounts={customerViewCounts}
                onViewChange={setCustomerViewId}
              />
            }
          />
        ) : (
          <FilterBar
            filters={invoiceFilters}
            onFiltersChange={setInvoiceFilters}
            filterProperties={INVOICE_FILTER_PROPERTIES}
            resultCount={invoicesFiltered.length}
            resultLabel="invoices"
            leadingContent={
              <InvoiceViewSelector
                activeViewId={invoiceViewId}
                viewCounts={invoiceViewCounts}
                onViewChange={setInvoiceViewId}
              />
            }
          />
        )
      }
    >
      {isCustomersTab ? (
        <ListTable columns={customerColumns}>
          <ListCreateRow
            label="New customer"
            columnCount={customerColumns.length}
            firstColumnWidth={customerColumns[0]?.width}
          />
          {customersFiltered.map((customer) => {
            const row = customerRowDataMap.get(customer.id);
            if (!row) return null;

            return (
              <ListRow
                key={customer.id}
                onClick={() =>
                  navigate(`/customers/${customer.id}?tab=payment&from=collections`)
                }
              >
                {customerView.columns.map((columnKey: CustomerListColumnKey) => {
                  const column = customerColumns.find((c) => c.key === columnKey);
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
      ) : (
        <ListTable columns={invoiceColumns}>
          <ListCreateRow
            label="New invoice"
            columnCount={invoiceColumns.length}
            firstColumnWidth={invoiceColumns[0]?.width}
          />
          {invoicesFiltered.map((inv) => {
            const row = invoiceRowDataMap.get(inv.id);
            if (!row) return null;

            return (
              <ListRow
                key={inv.id}
                onClick={() =>
                  navigate(
                    `/customers/${inv.customerId}?tab=payment&invoiceId=${inv.id}&from=collections`,
                  )
                }
              >
                {invoiceView.columns.map((columnKey: InvoiceListColumnKey) => {
                  const column = invoiceColumns.find((c) => c.key === columnKey);
                  const content =
                    columnKey === "status" ? (
                      <StatusBadge status={inv.status} />
                    ) : (
                      formatInvoiceListCell(columnKey, row)
                    );

                  return (
                    <ListCell
                      key={columnKey}
                      width={column?.width}
                      align={column?.align}
                      className={invoiceCellClassName(columnKey, row)}
                    >
                      {content}
                    </ListCell>
                  );
                })}
              </ListRow>
            );
          })}
        </ListTable>
      )}
    </IndexPageFrame>
  );
}
