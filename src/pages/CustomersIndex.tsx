import { useSearchParams, useNavigate } from "react-router-dom";
import { customers, quotes, contracts, invoices } from "@/data/mock-data";
import { supportTickets } from "@/data/support-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { GroupedSection } from "@/components/index-page/GroupedSection";
import { GroupedRow, RowCell } from "@/components/index-page/GroupedRow";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";

// ---------------------------------------------------------------------------
// Group definitions
// ---------------------------------------------------------------------------

interface CustomerGroupRow {
  customerId: string;
  customerName: string;
  reason: string;
  relatedRecord: string;
  value: string;
  owner: string;
  dueDate: string;
  status: string;
  targetTab: string;
  targetParam: string;
}

function buildGroups() {
  const groups: Record<string, CustomerGroupRow[]> = {
    "renewals-30d": [],
    "quotes-pending": [],
    "burn-down-risk": [],
    "overdue-invoices": [],
    "enforcement-mismatch": [],
    "support-escalations": [],
    "expansion-opportunity": [],
  };

  for (const c of customers) {
    if (c.nextRenewalDate) {
      const days = Math.round((new Date(c.nextRenewalDate).getTime() - Date.now()) / 86400000);
      if (days <= 30 && days > 0) {
        const con = contracts.find((ct) => ct.customerId === c.id);
        groups["renewals-30d"].push({
          customerId: c.id, customerName: c.name,
          reason: `Renewal in ${days} days`,
          relatedRecord: con?.id ?? "—", value: currency(c.arr),
          owner: c.csm, dueDate: shortDate(c.nextRenewalDate),
          status: "Upcoming", targetTab: "contract",
          targetParam: con ? `contractId=${con.id}` : "",
        });
      }
    }

    const pendingQuotes = quotes.filter((q) => q.customerId === c.id && q.approval.status === "pending");
    for (const q of pendingQuotes) {
      groups["quotes-pending"].push({
        customerId: c.id, customerName: c.name,
        reason: "Quote pending approval",
        relatedRecord: q.id, value: currency(q.tcv),
        owner: q.owner, dueDate: shortDate(q.expiryDate),
        status: q.status, targetTab: "quote",
        targetParam: `quoteId=${q.id}`,
      });
    }

    if (c.prepaidCreditTotal > 0 && (c.prepaidCreditBalance / c.prepaidCreditTotal) < 0.3) {
      groups["burn-down-risk"].push({
        customerId: c.id, customerName: c.name,
        reason: `Credits ${Math.round(((c.prepaidCreditTotal - c.prepaidCreditBalance) / c.prepaidCreditTotal) * 100)}% consumed`,
        relatedRecord: "—", value: currency(c.prepaidCreditBalance),
        owner: c.csm, dueDate: "—",
        status: "At risk", targetTab: "customer",
        targetParam: "",
      });
    }

    const overdueInvs = invoices.filter((i) => i.customerId === c.id && i.status === "Overdue");
    for (const inv of overdueInvs) {
      groups["overdue-invoices"].push({
        customerId: c.id, customerName: c.name,
        reason: "Overdue invoice",
        relatedRecord: inv.id, value: currency(inv.amount),
        owner: inv.owner, dueDate: shortDate(inv.dueDate),
        status: "Overdue", targetTab: "invoicing",
        targetParam: `invoiceId=${inv.id}`,
      });
    }

    const enfContracts = contracts.filter((ct) => ct.customerId === c.id && ct.enforcement.enforcementStatus !== "Enforced");
    for (const con of enfContracts) {
      groups["enforcement-mismatch"].push({
        customerId: c.id, customerName: c.name,
        reason: "Enforcement incomplete",
        relatedRecord: con.id, value: currency(con.tcv),
        owner: con.owner, dueDate: shortDate(con.effectiveDate),
        status: con.enforcement.enforcementStatus, targetTab: "contract",
        targetParam: `contractId=${con.id}`,
      });
    }

    const escalatedTickets = supportTickets.filter((t) => t.customerId === c.id && t.status === "Escalated");
    if (escalatedTickets.length > 0) {
      groups["support-escalations"].push({
        customerId: c.id, customerName: c.name,
        reason: `${escalatedTickets.length} escalation${escalatedTickets.length > 1 ? "s" : ""}`,
        relatedRecord: escalatedTickets[0].id, value: "—",
        owner: escalatedTickets[0].assignee, dueDate: shortDate(escalatedTickets[0].lastUpdatedAt),
        status: "Escalated", targetTab: "customer",
        targetParam: "",
      });
    }

    const amendmentQuotes = quotes.filter((q) => q.customerId === c.id && q.quoteType === "Amendment");
    for (const q of amendmentQuotes) {
      groups["expansion-opportunity"].push({
        customerId: c.id, customerName: c.name,
        reason: "Amendment in progress",
        relatedRecord: q.id, value: currency(q.tcv),
        owner: q.owner, dueDate: shortDate(q.expiryDate),
        status: q.status, targetTab: "quote",
        targetParam: `quoteId=${q.id}`,
      });
    }
  }

  return groups;
}

const groupMeta: { key: string; label: string; slug: string }[] = [
  { key: "renewals-30d", label: "Renewals coming up in 30 days", slug: "renewals-30d" },
  { key: "quotes-pending", label: "Quotes pending approval", slug: "quotes-pending" },
  { key: "burn-down-risk", label: "Prepaid credit burn-down risk", slug: "burn-down-risk" },
  { key: "overdue-invoices", label: "Overdue invoices", slug: "overdue-invoices" },
  { key: "enforcement-mismatch", label: "Contract enforcement mismatches", slug: "enforcement-mismatch" },
  { key: "support-escalations", label: "Support escalations impacting billing", slug: "support-escalations" },
  { key: "expansion-opportunity", label: "Expansion / amendment opportunity", slug: "expansion-opportunity" },
];

const listColumns: Column[] = [
  { key: "customer", label: "Customer", width: "180px" },
  { key: "arr", label: "ARR", width: "100px" },
  { key: "openAr", label: "Open AR", width: "100px" },
  { key: "contracts", label: "Contracts", width: "80px" },
  { key: "quotes", label: "Quotes", width: "80px" },
  { key: "renewal", label: "Renewal", width: "110px" },
  { key: "risk", label: "Risk", width: "120px" },
  { key: "owner", label: "Owner", width: "120px" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomersIndex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupFilter = searchParams.get("group");
  const groups = buildGroups();

  const metrics: MetricCard[] = [
    { label: "Active customers", value: customers.length },
    { label: "Renewals in 30 days", value: groups["renewals-30d"].length, variant: groups["renewals-30d"].length > 0 ? "warning" : "default" },
    { label: "Open AR total", value: currency(customers.reduce((s, c) => s + c.openAr, 0)), variant: "danger" },
    { label: "Quotes pending", value: groups["quotes-pending"].length, variant: groups["quotes-pending"].length > 0 ? "warning" : "default" },
    { label: "At-risk customers", value: customers.filter((c) => c.riskBadges.length > 0).length, variant: "danger" },
  ];

  function navigateToShell(row: CustomerGroupRow) {
    const fromParam = groupFilter ? `customers:${groupFilter}` : "customers";
    navigate(`/customers/${row.customerId}?tab=customer&from=${fromParam}`);
  }

  // Filtered list mode
  if (groupFilter) {
    const gm = groupMeta.find((g) => g.slug === groupFilter);
    const rows = groups[groupFilter] ?? [];
    return (
      <div className="flex h-full w-full flex-col overflow-auto">
        <div className="flex flex-col gap-5 px-6 py-5">
          <PageHeader title="Customers" backLabel="Back to overview" backPath="/customers" filterLabel={gm?.label} />
          <MetricStrip metrics={metrics} />
          <ListTable columns={listColumns}>
            {customers
              .filter((c) => rows.some((r) => r.customerId === c.id))
              .map((c) => {
                const matchRow = rows.find((r) => r.customerId === c.id)!;
                return (
                  <ListRow key={c.id} onClick={() => navigateToShell(matchRow)}>
                    <ListCell width="180px" className="font-medium text-text-primary">{c.name}</ListCell>
                    <ListCell width="100px">{currency(c.arr)}</ListCell>
                    <ListCell width="100px" className={c.openAr > 0 ? "text-red-600 font-medium" : ""}>{currency(c.openAr)}</ListCell>
                    <ListCell width="80px">{c.activeContractCount}</ListCell>
                    <ListCell width="80px">{c.openQuoteCount}</ListCell>
                    <ListCell width="110px">{c.nextRenewalDate ? shortDate(c.nextRenewalDate) : "—"}</ListCell>
                    <ListCell width="120px">
                      {c.riskBadges.length > 0 ? <StatusBadge status={`${c.riskBadges.length} flags`} /> : <span className="text-emerald-600 text-[12px]">Healthy</span>}
                    </ListCell>
                    <ListCell width="120px">{c.billingOwner}</ListCell>
                  </ListRow>
                );
              })}
          </ListTable>
        </div>
      </div>
    );
  }

  // Grouped landing
  return (
    <div className="flex h-full w-full flex-col overflow-auto">
      <div className="flex flex-col gap-5 px-6 py-5">
        <PageHeader title="Customers" />
        <MetricStrip metrics={metrics} />
        {groupMeta.map((gm) => {
          const rows = groups[gm.key] ?? [];
          return (
            <GroupedSection key={gm.key} title={gm.label} count={rows.length} viewAllPath={`/customers?group=${gm.slug}`}>
              {rows.slice(0, 5).map((row, idx) => (
                <GroupedRow key={`${row.customerId}-${idx}`} onClick={() => navigateToShell(row)}>
                  <RowCell width="160px" className="font-medium text-text-primary">{row.customerName}</RowCell>
                  <RowCell width="200px" className="text-text-secondary">{row.reason}</RowCell>
                  <RowCell width="130px" className="font-medium text-blue-600">{row.relatedRecord}</RowCell>
                  <RowCell width="100px" className="tabular-nums">{row.value}</RowCell>
                  <RowCell width="110px" className="text-text-secondary">{row.owner}</RowCell>
                  <RowCell width="100px" className="text-text-secondary">{row.dueDate}</RowCell>
                  <RowCell width="100px"><StatusBadge status={row.status} /></RowCell>
                </GroupedRow>
              ))}
            </GroupedSection>
          );
        })}
      </div>
    </div>
  );
}
