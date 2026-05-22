import { useMemo, useState } from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { useIngestContext } from "@/context/IngestContext";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListCreateRow, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag, type FilterOption } from "@/components/index-page/FilterBar";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";
import { openDrawer } from "@/store/drawer-store";
import type { QueueItem } from "@/data/queue-data";

const listColumns: Column[] = [
  { key: "customer", label: "Customer", width: "200px", sortable: true },
  { key: "document", label: "Document", width: "260px" },
  { key: "tcv", label: "TCV", width: "110px", align: "right" },
  { key: "source", label: "Source", width: "100px" },
  { key: "uploadedAt", label: "Received", width: "110px", sortable: true },
  { key: "status", label: "Status", width: "130px" },
];

const filterOptions: FilterOption[] = [
  { field: "Status", label: "Status", values: ["Pending Review", "In Progress", "Invoice review", "Returned"] },
  { field: "Source", label: "Source", values: ["PDF Upload", "API", "CPQ", "Email"] },
];

function isPendingStatus(status: string): boolean {
  return (
    status === "Pending Review" ||
    status === "In Progress" ||
    status === "Invoice review" ||
    status === "Returned"
  );
}

export function ProspectsIndex() {
  const { queueItems } = useIngestContext();
  const { ref: scrollRef, isScrolled } = useScrolled();
  const [filters, setFilters] = useState<FilterTag[]>([]);

  const prospects = useMemo(() => {
    return queueItems
      .filter(
        (q) =>
          q.scenario === "New Business" &&
          isPendingStatus(q.status)
      )
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
  }, [queueItems]);

  const metrics: MetricCard[] = useMemo(() => {
    const pendingReview = prospects.filter((p) => p.status === "Pending Review").length;
    const inProgress = prospects.filter((p) => p.status === "In Progress").length;
    const invoiceReview = prospects.filter((p) => p.status === "Invoice review").length;
    const totalTcv = prospects.reduce((sum, p) => sum + p.tcv, 0);

    return [
      { label: "Pending prospects", value: prospects.length },
      { label: "Pending review", value: pendingReview, variant: pendingReview > 0 ? "warning" : "default" },
      { label: "In progress", value: inProgress },
      { label: "Invoice review", value: invoiceReview, variant: invoiceReview > 0 ? "warning" : "default" },
      { label: "Pipeline TCV", value: currency(totalTcv) },
    ];
  }, [prospects]);

  const handleRowClick = (item: QueueItem) => {
    openDrawer({
      entityType: "queue_item",
      mode: "ingest",
      entityId: item.id,
      flow: {
        scenario: "ingest_invoice",
        step: "ingest",
        queueItemId: item.id,
        furthestUnlockedStep: "ingest",
        showStepper: true,
      },
    });
  };

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Prospects" />}
      metrics={<MetricStrip metrics={metrics} />}
      filterBar={
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          resultCount={prospects.length}
          resultLabel="prospects"
        />
      }
    >
      <ListTable columns={listColumns}>
        <ListCreateRow
          label="New prospect"
          columnCount={listColumns.length}
          firstColumnWidth={listColumns[0].width}
        />
        {prospects.map((item) => (
          <ListRow key={item.id} onClick={() => handleRowClick(item)}>
            <ListCell width="200px" className="font-medium text-text-primary">
              {item.customerName}
            </ListCell>
            <ListCell width="260px" className="text-text-secondary">
              {item.documentName}
            </ListCell>
            <ListCell width="110px" align="right" className="font-medium">
              {currency(item.tcv)}
            </ListCell>
            <ListCell width="100px">{item.source}</ListCell>
            <ListCell width="110px">
              {shortDate(item.uploadedAt.slice(0, 10))}
            </ListCell>
            <ListCell width="130px">
              <StatusBadge status="Pending Ingestion" />
            </ListCell>
          </ListRow>
        ))}
      </ListTable>
    </IndexPageFrame>
  );
}
