import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { contracts, customers } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeContractsWithRuntimeClosures } from "@/components/revenue-workspace/derive-stage-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListCreateRow, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag, type FilterOption } from "@/components/index-page/FilterBar";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countPendingEnforcement(source: typeof contracts) {
  return source.filter((c) => c.enforcement.enforcementStatus !== "Enforced").length;
}

function countApproachingRenewal(source: typeof contracts) {
  const now = Date.now();
  const sixtyDays = 60 * 86400000;
  return source.filter(
    (c) => c.renewalDate && new Date(c.renewalDate).getTime() - now < sixtyDays && new Date(c.renewalDate).getTime() > now
  ).length;
}

function countAmendmentsInProgress(source: typeof contracts) {
  return source.filter((c) => c.amendments.some((a) => a.status !== "Applied")).length;
}

const listColumns: Column[] = [
  { key: "id", label: "Contract ID", width: "140px", sortable: true },
  { key: "customer", label: "Customer", width: "150px", sortable: true },
  { key: "tcv", label: "TCV", width: "100px", align: "right" },
  { key: "term", label: "Term", width: "90px" },
  { key: "renewal", label: "Renewal", width: "110px", sortable: true },
  { key: "enforcement", label: "Enforcement", width: "110px" },
  { key: "status", label: "Status", width: "90px" },
  { key: "owner", label: "Owner", width: "110px" },
];

const filterOptions: FilterOption[] = [
  { field: "Status", label: "Status", values: ["Active", "Extended", "Closing", "Scheduled", "Closed", "Terminated"] },
  { field: "Enforcement", label: "Enforcement", values: ["Enforced", "Pending", "Not Enforced"] },
  { field: "Owner", label: "Owner", values: ["Sarah Chen", "Mike Ross", "Alex Kim"] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContractsIndex() {
  const navigate = useNavigate();
  const { contractClosures, contractGraceExtensions, sessionContracts, sessionCustomers } = useIngestContext();
  const [filters, setFilters] = useState<FilterTag[]>([]);

  const customersMerged = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    for (const c of sessionCustomers) {
      byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [sessionCustomers]);

  const contractsWithSession = useMemo(() => {
    const byId = new Map(contracts.map((c) => [c.id, c]));
    for (const c of sessionContracts) {
      byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [sessionContracts]);

  const contractsView = useMemo(
    () => mergeContractsWithRuntimeClosures(contractsWithSession, contractClosures, contractGraceExtensions),
    [contractsWithSession, contractClosures, contractGraceExtensions],
  );

  const { ref: scrollRef, isScrolled } = useScrolled();

  const renewalCount = useMemo(() => countApproachingRenewal(contractsView), [contractsView]);
  const pendingEnf = useMemo(() => countPendingEnforcement(contractsView), [contractsView]);
  const amendmentsCount = useMemo(() => countAmendmentsInProgress(contractsView), [contractsView]);

  const operationalCount = contractsView.filter((c) =>
    ["Active", "Extended", "Closing", "Scheduled"].includes(c.status),
  ).length;

  const metrics: MetricCard[] = [
    { label: "Operational contracts", value: operationalCount },
    { label: "Pending enforcement", value: pendingEnf, variant: pendingEnf > 0 ? "warning" : "default" },
    { label: "Renewals in 60 days", value: renewalCount, variant: renewalCount > 0 ? "warning" : "default" },
    { label: "Active TCV", value: currency(contractsView.reduce((s, c) => s + c.tcv, 0)) },
    { label: "Amendments in progress", value: amendmentsCount },
  ];

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Contracts" />}
      metrics={<MetricStrip metrics={metrics} />}
      filterBar={
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          resultCount={contractsView.length}
          resultLabel="contracts"
        />
      }
    >
      <ListTable columns={listColumns}>
        <ListCreateRow
          label="New contract"
          columnCount={listColumns.length}
          firstColumnWidth={listColumns[0].width}
        />
        {contractsView.map((c) => {
          const cu = customersMerged.find((x) => x.id === c.customerId);
          return (
            <ListRow key={c.id} onClick={() => navigate(`/customers/${c.customerId}?tab=contract&contractId=${c.id}&from=contracts`)}>
              <ListCell width="140px" className="font-medium text-blue-600">{c.id}</ListCell>
              <ListCell width="150px" className="font-medium">{cu?.name ?? "—"}</ListCell>
              <ListCell width="100px" align="right" className="tabular-nums">
                {currency(c.tcv)}
              </ListCell>
              <ListCell width="90px">{c.term}</ListCell>
              <ListCell width="110px">{c.renewalDate ? shortDate(c.renewalDate) : "—"}</ListCell>
              <ListCell width="110px">
                <StatusBadge status={c.enforcement.enforcementStatus} />
              </ListCell>
              <ListCell width="90px">
                <StatusBadge status={c.status} />
              </ListCell>
              <ListCell width="110px" className="text-text-secondary">{c.owner}</ListCell>
            </ListRow>
          );
        })}
      </ListTable>
    </IndexPageFrame>
  );
}
