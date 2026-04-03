import { useSearchParams, useNavigate } from "react-router-dom";
import { invoices, customers } from "@/data/mock-data";
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

interface InvoiceGroupRow {
  invoiceId: string;
  customerId: string;
  customerName: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: string;
  owner: string;
  holdReason: string;
}

function toRow(inv: typeof invoices[0]): InvoiceGroupRow {
  const c = customers.find((cu) => cu.id === inv.customerId);
  return {
    invoiceId: inv.id,
    customerId: inv.customerId,
    customerName: c?.name ?? "Unknown",
    contractId: inv.contractId || "—",
    amount: inv.amount,
    dueDate: inv.dueDate,
    status: inv.status,
    owner: inv.owner,
    holdReason: inv.holdReason ?? "",
  };
}

function buildGroups() {
  const groups: Record<string, InvoiceGroupRow[]> = {
    "pending-review": [],
    "overdue": [],
    "promise-to-pay": [],
    "disputes": [],
    "blocked-missing-details": [],
  };

  for (const inv of invoices) {
    const row = toRow(inv);

    if (inv.status === "Pending Review") groups["pending-review"].push(row);
    if (inv.status === "Overdue") groups["overdue"].push(row);
    if (inv.promiseToPayDate) {
      const d = new Date(inv.promiseToPayDate).getTime() - Date.now();
      if (d < 14 * 86400000 && d > 0) groups["promise-to-pay"].push(row);
    }
    if (inv.disputeReason) groups["disputes"].push(row);
    if (inv.holdReason) groups["blocked-missing-details"].push(row);
  }

  return groups;
}

const groupMeta = [
  { key: "pending-review", label: "Pending invoice review", slug: "pending-review" },
  { key: "overdue", label: "Overdue invoices", slug: "overdue" },
  { key: "promise-to-pay", label: "Promise-to-pay upcoming", slug: "promise-to-pay" },
  { key: "disputes", label: "Invoice disputes", slug: "disputes" },
  { key: "blocked-missing-details", label: "Blocked by missing PO / tax / billing details", slug: "blocked-missing-details" },
];

const listColumns: Column[] = [
  { key: "id", label: "Invoice ID", width: "130px" },
  { key: "customer", label: "Customer", width: "150px" },
  { key: "contract", label: "Contract", width: "130px" },
  { key: "amount", label: "Amount", width: "100px" },
  { key: "due", label: "Due date", width: "100px" },
  { key: "status", label: "Status", width: "110px" },
  { key: "owner", label: "Owner", width: "110px" },
  { key: "blocker", label: "Blocker", width: "160px" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicesIndex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupFilter = searchParams.get("group");
  const groups = buildGroups();

  const pendingCount = groups["pending-review"].length;
  const overdueCount = groups["overdue"].length;
  const blockedCount = groups["blocked-missing-details"].length;
  const openAr = invoices.filter((i) => i.status === "Overdue" || i.status === "Pending Review").reduce((s, i) => s + i.amount, 0);

  const metrics: MetricCard[] = [
    { label: "Total invoices", value: invoices.length },
    { label: "Pending review", value: pendingCount, variant: pendingCount > 0 ? "warning" : "default" },
    { label: "Overdue", value: overdueCount, variant: overdueCount > 0 ? "danger" : "default" },
    { label: "Open AR", value: currency(openAr), variant: "danger" },
    { label: "Blocked", value: blockedCount, variant: blockedCount > 0 ? "warning" : "default" },
  ];

  function goToShell(row: InvoiceGroupRow) {
    const fromParam = groupFilter ? `invoices:${groupFilter}` : "invoices";
    navigate(`/customers/${row.customerId}?tab=invoicing&invoiceId=${row.invoiceId}&from=${fromParam}`);
  }

  if (groupFilter) {
    const gm = groupMeta.find((g) => g.slug === groupFilter);
    const rows = groups[groupFilter] ?? [];
    const filtered = invoices.filter((inv) => rows.some((r) => r.invoiceId === inv.id));
    return (
      <div className="flex h-full w-full flex-col overflow-auto">
        <div className="flex flex-col gap-5 px-6 py-5">
          <PageHeader title="Invoices" backLabel="Back to overview" backPath="/invoices" filterLabel={gm?.label} />
          <MetricStrip metrics={metrics} />
          <ListTable columns={listColumns}>
            {filtered.map((inv) => {
              const c = customers.find((cu) => cu.id === inv.customerId);
              return (
                <ListRow key={inv.id} onClick={() => goToShell(toRow(inv))}>
                  <ListCell width="130px" className="font-medium text-blue-600">{inv.id}</ListCell>
                  <ListCell width="150px" className="font-medium">{c?.name ?? "—"}</ListCell>
                  <ListCell width="130px">{inv.contractId || "—"}</ListCell>
                  <ListCell width="100px" className="tabular-nums">{currency(inv.amount)}</ListCell>
                  <ListCell width="100px">{shortDate(inv.dueDate)}</ListCell>
                  <ListCell width="110px"><StatusBadge status={inv.status} /></ListCell>
                  <ListCell width="110px" className="text-text-secondary">{inv.owner}</ListCell>
                  <ListCell width="160px" className="text-text-muted">{inv.holdReason || "—"}</ListCell>
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
        <PageHeader title="Invoices" />
        <MetricStrip metrics={metrics} />
        {groupMeta.map((gm) => {
          const rows = groups[gm.key] ?? [];
          return (
            <GroupedSection key={gm.key} title={gm.label} count={rows.length} viewAllPath={`/invoices?group=${gm.slug}`}>
              {rows.slice(0, 5).map((row, idx) => (
                <GroupedRow key={`${row.invoiceId}-${idx}`} onClick={() => goToShell(row)}>
                  <RowCell width="120px" className="font-medium text-blue-600">{row.invoiceId}</RowCell>
                  <RowCell width="140px" className="font-medium text-text-primary">{row.customerName}</RowCell>
                  <RowCell width="100px" className="tabular-nums">{currency(row.amount)}</RowCell>
                  <RowCell width="100px" className="text-text-secondary">{shortDate(row.dueDate)}</RowCell>
                  <RowCell width="100px"><StatusBadge status={row.status} /></RowCell>
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
