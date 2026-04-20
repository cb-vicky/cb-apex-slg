import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { contracts, customers } from "@/data/mock-data";
import { UploadModal } from "@/components/contracts/UploadModal";
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

interface ContractGroupRow {
  contractId: string;
  customerId: string;
  customerName: string;
  tcv: number;
  term: string;
  status: string;
  renewalDate: string;
  enforcementStatus: string;
  owner: string;
}

function toRow(c: typeof contracts[0]): ContractGroupRow {
  const cu = customers.find((x) => x.id === c.customerId);
  return {
    contractId: c.id,
    customerId: c.customerId,
    customerName: cu?.name ?? "Unknown",
    tcv: c.tcv,
    term: c.term,
    status: c.status,
    renewalDate: c.renewalDate,
    enforcementStatus: c.enforcement.enforcementStatus,
    owner: c.owner,
  };
}

function buildGroups() {
  const now = Date.now();
  const sixtyDays = 60 * 86400000;

  const groups: Record<string, ContractGroupRow[]> = {
    "pending-enforcement": [],
    "invoice-review-pending": [],
    "approaching-renewal": [],
    "provisioning-issues": [],
    "quote-mismatch": [],
    "min-commit-risk": [],
    "amendments-in-progress": [],
  };

  for (const c of contracts) {
    const row = toRow(c);

    if (c.enforcement.enforcementStatus !== "Enforced") groups["pending-enforcement"].push(row);
    if (c.billingSchedule.some((b) => b.status === "Pending Review")) groups["invoice-review-pending"].push(row);
    if (c.renewalDate && new Date(c.renewalDate).getTime() - now < sixtyDays && new Date(c.renewalDate).getTime() > now)
      groups["approaching-renewal"].push(row);
    if (c.enforcement.blockingIssues.length > 0 || c.enforcement.productMappingIssues.length > 0)
      groups["provisioning-issues"].push(row);
    if (c.comparisonToQuote.length > 0) groups["quote-mismatch"].push(row);
    if (c.prepaidCreditTotal > 0 && (c.prepaidCreditBalance / c.prepaidCreditTotal) < 0.3)
      groups["min-commit-risk"].push(row);
    if (c.amendments.some((a) => a.status !== "Applied")) groups["amendments-in-progress"].push(row);
  }

  return groups;
}

const groupMeta = [
  { key: "pending-enforcement", label: "Pending enforcement", slug: "pending-enforcement" },
  { key: "invoice-review-pending", label: "Invoice review pending", slug: "invoice-review-pending" },
  { key: "approaching-renewal", label: "Approaching renewal", slug: "approaching-renewal" },
  { key: "provisioning-issues", label: "Entitlement / provisioning issues", slug: "provisioning-issues" },
  { key: "quote-mismatch", label: "Quote-to-contract mismatch", slug: "quote-mismatch" },
  { key: "min-commit-risk", label: "Min-commit exhaustion risk", slug: "min-commit-risk" },
  { key: "amendments-in-progress", label: "Amendments in progress", slug: "amendments-in-progress" },
];

const listColumns: Column[] = [
  { key: "id", label: "Contract ID", width: "140px" },
  { key: "customer", label: "Customer", width: "150px" },
  { key: "tcv", label: "TCV", width: "100px" },
  { key: "term", label: "Term", width: "90px" },
  { key: "renewal", label: "Renewal", width: "110px" },
  { key: "enforcement", label: "Enforcement", width: "110px" },
  { key: "status", label: "Status", width: "90px" },
  { key: "owner", label: "Owner", width: "110px" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContractsIndex() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupFilter = searchParams.get("group");
  const groups = buildGroups();
  const { ref: scrollRef, isScrolled } = useScrolled();
  const [uploadOpen, setUploadOpen] = useState(false);

  const renewalCount = groups["approaching-renewal"].length;
  const pendingEnf = groups["pending-enforcement"].length;

  const metrics: MetricCard[] = [
    { label: "Active contracts", value: contracts.length },
    { label: "Pending enforcement", value: pendingEnf, variant: pendingEnf > 0 ? "warning" : "default" },
    { label: "Renewals in 60 days", value: renewalCount, variant: renewalCount > 0 ? "warning" : "default" },
    { label: "Active TCV", value: currency(contracts.reduce((s, c) => s + c.tcv, 0)) },
    { label: "Amendments in progress", value: groups["amendments-in-progress"].length },
  ];

  function goToShell(row: ContractGroupRow) {
    const fromParam = groupFilter ? `contracts:${groupFilter}` : "contracts";
    navigate(`/customers/${row.customerId}?tab=contract&contractId=${row.contractId}&from=${fromParam}`);
  }

  const modal = uploadOpen ? <UploadModal onClose={() => setUploadOpen(false)} /> : null;

  if (groupFilter) {
    const gm = groupMeta.find((g) => g.slug === groupFilter);
    const rows = groups[groupFilter] ?? [];
    const filtered = contracts.filter((c) => rows.some((r) => r.contractId === c.id));
    return (
      <>
        {modal}
        <div className="flex flex-1 w-full flex-col">
          <div ref={scrollRef} className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-[#F0F1F3] transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""}`}>
            <PageHeader
              title="Contracts"
              backLabel="Back to overview"
              backPath="/contracts"
              filterLabel={gm?.label}
              createLabel="Upload"
              onCreateClick={() => setUploadOpen(true)}
            />
          </div>
          <div className="flex flex-col gap-3 px-6 pt-3 pb-5">
            <MetricStrip metrics={metrics} />
            <ListTable columns={listColumns}>
              {filtered.map((c) => {
                const cu = customers.find((x) => x.id === c.customerId);
                return (
                  <ListRow key={c.id} onClick={() => goToShell(toRow(c))}>
                    <ListCell width="140px" className="font-medium text-blue-600">{c.id}</ListCell>
                    <ListCell width="150px" className="font-medium">{cu?.name ?? "—"}</ListCell>
                    <ListCell width="100px" className="tabular-nums">{currency(c.tcv)}</ListCell>
                    <ListCell width="90px">{c.term}</ListCell>
                    <ListCell width="110px">{c.renewalDate ? shortDate(c.renewalDate) : "—"}</ListCell>
                    <ListCell width="110px"><StatusBadge status={c.enforcement.enforcementStatus} /></ListCell>
                    <ListCell width="90px"><StatusBadge status={c.status} /></ListCell>
                    <ListCell width="110px" className="text-text-secondary">{c.owner}</ListCell>
                  </ListRow>
                );
              })}
            </ListTable>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {modal}
      <div className="flex flex-1 w-full flex-col">
        <div ref={scrollRef} className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-[#F0F1F3] transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""}`}>
          <PageHeader title="Contracts" createLabel="Upload" onCreateClick={() => setUploadOpen(true)} />
        </div>
        <div className="flex flex-col gap-3 px-6 pt-3 pb-5">
          <MetricStrip metrics={metrics} />
          {groupMeta.map((gm) => {
            const rows = groups[gm.key] ?? [];
            return (
              <GroupedSection key={gm.key} title={gm.label} count={rows.length} viewAllPath={`/contracts?group=${gm.slug}`}>
                {rows.slice(0, 5).map((row, idx) => (
                  <GroupedRow key={`${row.contractId}-${idx}`} onClick={() => goToShell(row)}>
                    <RowCell width="130px" className="font-medium text-blue-600">{row.contractId}</RowCell>
                    <RowCell width="140px" className="font-medium text-text-primary">{row.customerName}</RowCell>
                    <RowCell width="100px" className="tabular-nums">{currency(row.tcv)}</RowCell>
                    <RowCell width="90px">{row.term}</RowCell>
                    <RowCell width="100px"><StatusBadge status={row.enforcementStatus} /></RowCell>
                    <RowCell width="100px" className="text-text-secondary">{row.renewalDate ? shortDate(row.renewalDate) : "—"}</RowCell>
                    <RowCell width="110px" className="text-text-secondary">{row.owner}</RowCell>
                  </GroupedRow>
                ))}
              </GroupedSection>
            );
          })}
        </div>
      </div>
    </>
  );
}
