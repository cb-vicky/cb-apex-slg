import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { customers, invoices as seedInvoices } from "@/data/mock-data";
import type { Customer } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { ListTable, ListCreateRow, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
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
  buildCustomerArViewContextMap,
  countCustomersByView,
  filterCustomersByView,
  type CustomerListViewId,
} from "@/data/customer-list-views";

function matchesTagFilters(customer: Customer, filters: FilterTag[]): boolean {
  return filters.every((filter) => matchesCustomerPropertyFilter(customer, filter));
}

const listColumns: Column[] = [
  { key: "customer", label: "Customer", width: "180px", sortable: true },
  { key: "arr", label: "ARR", width: "100px", align: "right" },
  { key: "openAr", label: "Open AR", width: "100px", align: "right" },
  { key: "contracts", label: "Contracts", width: "80px", align: "right" },
  { key: "quotes", label: "Quotes", width: "80px", align: "right" },
  { key: "renewal", label: "Renewal", width: "110px", sortable: true },
  { key: "risk", label: "Risk", width: "120px" },
  { key: "owner", label: "Owner", width: "120px" },
];

export function CustomersIndex() {
  const navigate = useNavigate();
  const { sessionCustomers, sessionInvoices, invoiceStatusOverrides } = useIngestContext();
  const [filters, setFilters] = useState<FilterTag[]>([]);
  const [activeViewId, setActiveViewId] = useState<CustomerListViewId>(
    DEFAULT_CUSTOMER_LIST_VIEW_ID,
  );

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

  const arContextMap = useMemo(
    () => buildCustomerArViewContextMap(customersMerged, invoicesMerged, invoiceStatusOverrides),
    [customersMerged, invoicesMerged, invoiceStatusOverrides],
  );

  const viewCounts = useMemo(
    () => countCustomersByView(customersMerged, arContextMap),
    [customersMerged, arContextMap],
  );

  const customersFiltered = useMemo(() => {
    const byView = filterCustomersByView(customersMerged, activeViewId, arContextMap);
    return byView.filter((c) => matchesTagFilters(c, filters));
  }, [customersMerged, activeViewId, arContextMap, filters]);

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
          firstColumnWidth={listColumns[0].width}
        />
        {customersFiltered.map((c) => (
          <ListRow key={c.id} onClick={() => navigate(`/customers/${c.id}?tab=customer&from=customers`)}>
            <ListCell width="180px" className="font-medium text-text-primary">{c.name}</ListCell>
            <ListCell width="100px" align="right">
              {currency(c.arr)}
            </ListCell>
            <ListCell width="100px" align="right" className={c.openAr > 0 ? "text-red-600 font-medium" : ""}>
              {currency(c.openAr)}
            </ListCell>
            <ListCell width="80px" align="right">
              {c.activeContractCount}
            </ListCell>
            <ListCell width="80px" align="right">
              {c.openQuoteCount}
            </ListCell>
            <ListCell width="110px">{c.nextRenewalDate ? shortDate(c.nextRenewalDate) : "—"}</ListCell>
            <ListCell width="120px">
              {c.riskBadges.length > 0 ? <StatusBadge status={`${c.riskBadges.length} flags`} /> : <span className="text-emerald-600 text-[12px]">Healthy</span>}
            </ListCell>
            <ListCell width="120px">{c.billingOwner}</ListCell>
          </ListRow>
        ))}
      </ListTable>
    </IndexPageFrame>
  );
}
