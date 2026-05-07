import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { quotes, customers } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countExpiringSoon() {
  const now = Date.now();
  const twoWeeks = 14 * 86400000;
  return quotes.filter(
    (q) => new Date(q.expiryDate).getTime() - now < twoWeeks && new Date(q.expiryDate).getTime() > now && q.status !== "Accepted"
  ).length;
}

const listColumns: Column[] = [
  { key: "id", label: "Quote ID", width: "130px", sortable: true },
  { key: "customer", label: "Customer", width: "150px", sortable: true },
  { key: "type", label: "Type", width: "100px" },
  { key: "source", label: "Source", width: "90px" },
  { key: "tcv", label: "TCV", width: "100px", align: "right" },
  { key: "discount", label: "Discount", width: "80px", align: "right" },
  { key: "approval", label: "Approval", width: "120px" },
  { key: "expiry", label: "Expiry", width: "100px", sortable: true },
  { key: "owner", label: "Owner", width: "110px" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotesIndex() {
  const navigate = useNavigate();
  const { ref: scrollRef, isScrolled } = useScrolled();

  const pending = quotes.filter((q) => q.approval.status === "pending").length;
  const expiringSoon = countExpiringSoon();

  const metrics: MetricCard[] = [
    { label: "Active quotes", value: quotes.length },
    { label: "Pending approval", value: pending, variant: pending > 0 ? "warning" : "default" },
    { label: "Expiring in 14 days", value: expiringSoon, variant: expiringSoon > 0 ? "danger" : "default" },
    { label: "Pipeline TCV", value: currency(quotes.reduce((s, q) => s + q.tcv, 0)) },
    { label: "Avg discount", value: `${Math.round(quotes.reduce((s, q) => s + q.discountPct, 0) / quotes.length)}%` },
  ];

  return (
    <div className="flex flex-1 w-full flex-col">
      <div ref={scrollRef} className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-gray-100 transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""}`}>
        <PageHeader title="Quotes" createLabel="Create" />
      </div>
      <div className="flex flex-col gap-5 px-6 pt-5 pb-7">
        <MetricStrip metrics={metrics} />
        <ListTable columns={listColumns} resultCount={quotes.length}>
          {quotes.map((q) => {
            const c = customers.find((cu) => cu.id === q.customerId);
            return (
              <ListRow key={q.id} onClick={() => navigate(`/customers/${q.customerId}?tab=quote&quoteId=${q.id}&from=quotes`)}>
                <ListCell width="130px" className="font-medium text-blue-600">{q.id}</ListCell>
                <ListCell width="150px" className="font-medium">{c?.name ?? "—"}</ListCell>
                <ListCell width="100px">{q.quoteType}</ListCell>
                <ListCell width="90px">{q.source}</ListCell>
                <ListCell width="100px" align="right" className="tabular-nums">
                  {currency(q.tcv)}
                </ListCell>
                <ListCell width="80px" align="right">
                  {q.discountPct}%
                </ListCell>
                <ListCell width="120px" noTruncate>
                  <StatusBadge status={q.status} />
                </ListCell>
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
