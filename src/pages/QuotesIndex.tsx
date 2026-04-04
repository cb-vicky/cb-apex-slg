import { useSearchParams, useNavigate } from "react-router-dom";
import { quotes, customers } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { GroupedSection } from "@/components/index-page/GroupedSection";
import { GroupedRow, RowCell } from "@/components/index-page/GroupedRow";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";

// ---------------------------------------------------------------------------
// Group logic
// ---------------------------------------------------------------------------

interface QuoteGroupRow {
  quoteId: string;
  customerId: string;
  customerName: string;
  quoteType: string;
  tcv: number;
  discountPct: number;
  status: string;
  expiryDate: string;
  owner: string;
}

function toRow(q: typeof quotes[0]): QuoteGroupRow {
  const c = customers.find((cu) => cu.id === q.customerId);
  return {
    quoteId: q.id,
    customerId: q.customerId,
    customerName: c?.name ?? "Unknown",
    quoteType: q.quoteType,
    tcv: q.tcv,
    discountPct: q.discountPct,
    status: q.status,
    expiryDate: q.expiryDate,
    owner: q.owner,
  };
}

function buildGroups() {
  const now = Date.now();
  const twoWeeks = 14 * 86400000;

  const groups: Record<string, QuoteGroupRow[]> = {
    "pending-approval": [],
    "expiring-soon": [],
    "accepted-no-contract": [],
    "amendment-in-progress": [],
    "crm-mismatch": [],
    "non-standard-terms": [],
  };

  for (const q of quotes) {
    const row = toRow(q);

    if (q.approval.status === "pending") groups["pending-approval"].push(row);
    if (new Date(q.expiryDate).getTime() - now < twoWeeks && new Date(q.expiryDate).getTime() > now && q.status !== "Accepted")
      groups["expiring-soon"].push(row);
    if (q.status === "Accepted" && !q.relatedContractId) groups["accepted-no-contract"].push(row);
    if (q.quoteType === "Amendment" && q.status !== "Accepted") groups["amendment-in-progress"].push(row);
    if (q.crmSyncStatus === "Mismatch") groups["crm-mismatch"].push(row);
    if (q.approval.triggeredRules.length > 0 && q.approval.status !== "pending") groups["non-standard-terms"].push(row);
  }

  return groups;
}

const groupMeta = [
  { key: "pending-approval", label: "Pending approval", slug: "pending-approval" },
  { key: "expiring-soon", label: "Expiring soon", slug: "expiring-soon" },
  { key: "accepted-no-contract", label: "Accepted, contract not ingested", slug: "accepted-no-contract" },
  { key: "amendment-in-progress", label: "Amendment quotes in progress", slug: "amendment-in-progress" },
  { key: "crm-mismatch", label: "CRM sync mismatch", slug: "crm-mismatch" },
  { key: "non-standard-terms", label: "Non-standard terms", slug: "non-standard-terms" },
];

const listColumns: Column[] = [
  { key: "id", label: "Quote ID", width: "130px" },
  { key: "customer", label: "Customer", width: "150px" },
  { key: "type", label: "Type", width: "100px" },
  { key: "source", label: "Source", width: "90px" },
  { key: "tcv", label: "TCV", width: "100px" },
  { key: "discount", label: "Discount", width: "80px" },
  { key: "approval", label: "Approval", width: "120px" },
  { key: "expiry", label: "Expiry", width: "100px" },
  { key: "owner", label: "Owner", width: "110px" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotesIndex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupFilter = searchParams.get("group");
  const groups = buildGroups();

  const pending = quotes.filter((q) => q.approval.status === "pending").length;
  const expiringSoon = groups["expiring-soon"].length;

  const metrics: MetricCard[] = [
    { label: "Active quotes", value: quotes.length },
    { label: "Pending approval", value: pending, variant: pending > 0 ? "warning" : "default" },
    { label: "Expiring in 14 days", value: expiringSoon, variant: expiringSoon > 0 ? "danger" : "default" },
    { label: "Pipeline TCV", value: currency(quotes.reduce((s, q) => s + q.tcv, 0)) },
    { label: "Avg discount", value: `${Math.round(quotes.reduce((s, q) => s + q.discountPct, 0) / quotes.length)}%` },
  ];

  function goToShell(row: QuoteGroupRow) {
    const fromParam = groupFilter ? `quotes:${groupFilter}` : "quotes";
    navigate(`/customers/${row.customerId}?tab=quote&quoteId=${row.quoteId}&from=${fromParam}`);
  }

  if (groupFilter) {
    const gm = groupMeta.find((g) => g.slug === groupFilter);
    const rows = groups[groupFilter] ?? [];
    const filtered = quotes.filter((q) => rows.some((r) => r.quoteId === q.id));
    return (
      <div className="flex h-full w-full flex-col overflow-auto">
        <div className="flex flex-col gap-5 px-6 py-5">
          <PageHeader
            title="Quotes"
            backLabel="Back to overview"
            backPath="/quotes"
            filterLabel={gm?.label}
            createLabel="Create"
          />
          <MetricStrip metrics={metrics} />
          <ListTable columns={listColumns}>
            {filtered.map((q) => {
              const c = customers.find((cu) => cu.id === q.customerId);
              return (
                <ListRow key={q.id} onClick={() => goToShell(toRow(q))}>
                  <ListCell width="130px" className="font-medium text-blue-600">{q.id}</ListCell>
                  <ListCell width="150px" className="font-medium">{c?.name ?? "—"}</ListCell>
                  <ListCell width="100px">{q.quoteType}</ListCell>
                  <ListCell width="90px">{q.source}</ListCell>
                  <ListCell width="100px" className="tabular-nums">{currency(q.tcv)}</ListCell>
                  <ListCell width="80px">{q.discountPct}%</ListCell>
                  <ListCell width="120px"><StatusBadge status={q.status} /></ListCell>
                  <ListCell width="100px">{shortDate(q.expiryDate)}</ListCell>
                  <ListCell width="110px" className="text-text-secondary">{q.owner}</ListCell>
                </ListRow>
              );
            })}
          </ListTable>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto">
      <div className="flex flex-col gap-5 px-6 py-5">
        <PageHeader title="Quotes" createLabel="Create" />
        <MetricStrip metrics={metrics} />
        {groupMeta.map((gm) => {
          const rows = groups[gm.key] ?? [];
          return (
            <GroupedSection key={gm.key} title={gm.label} count={rows.length} viewAllPath={`/quotes?group=${gm.slug}`}>
              {rows.slice(0, 5).map((row, idx) => (
                <GroupedRow key={`${row.quoteId}-${idx}`} onClick={() => goToShell(row)}>
                  <RowCell width="120px" className="font-medium text-blue-600">{row.quoteId}</RowCell>
                  <RowCell width="140px" className="font-medium text-text-primary">{row.customerName}</RowCell>
                  <RowCell width="100px" className="tabular-nums">{currency(row.tcv)}</RowCell>
                  <RowCell width="80px">{row.discountPct}%</RowCell>
                  <RowCell width="120px"><StatusBadge status={row.status} /></RowCell>
                  <RowCell width="100px" className="text-text-secondary">{shortDate(row.expiryDate)}</RowCell>
                  <RowCell width="110px" className="text-text-secondary">{row.owner}</RowCell>
                </GroupedRow>
              ))}
            </GroupedSection>
          );
        })}
      </div>
    </div>
  );
}
