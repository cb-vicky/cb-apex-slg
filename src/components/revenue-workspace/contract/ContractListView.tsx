import type { Contract } from "@/data/mock-data";
import type { QueueItem } from "@/data/queue-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { FileText, ArrowRight, ArrowLeft, Upload } from "lucide-react";

export interface PendingIngestionContract {
  queueItemId: string;
  customerId: string;
  contractId?: string;
  documentName: string;
  customerName: string;
  tcv: number;
  uploadedAt: string;
  scenario: QueueItem["scenario"];
  status: QueueItem["status"];
  activeContractId?: string;
}

interface Props {
  contracts: Contract[];
  onSelect: (contract: Contract) => void;
  pendingIngestions?: PendingIngestionContract[];
}

export function ContractListView({ contracts, onSelect, pendingIngestions = [] }: Props) {
  const hasPending = pendingIngestions.length > 0;
  const hasContracts = contracts.length > 0;

  if (!hasContracts && !hasPending) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center">
        <FileText size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">No contracts found for this customer.</p>
      </div>
    );
  }

  // Build a map of id → contract for lineage lookups
  const contractById = new Map(contracts.map((c) => [c.id, c]));

  // Sort: Active/Closing first, then Scheduled, then Closed/Terminated (desc by effectiveDate)
  const sorted = [...contracts].sort((a, b) => {
    const priority = (c: Contract) => {
      if (c.status === "Active") return 0;
      if (c.status === "Extended") return 1;
      if (c.status === "Closing") return 2;
      if (c.status === "Scheduled") return 3;
      return 4;
    };
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
  });

  const handlePendingClick = (item: PendingIngestionContract) => {
    const resolvedContractId = item.contractId ?? item.activeContractId;
    if (resolvedContractId) {
      const resolved = contractById.get(resolvedContractId);
      if (resolved) {
        onSelect(resolved);
        return;
      }
    }
    if (sorted[0]) {
      onSelect(sorted[0]);
      return;
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      {/* Column header */}
      <div className="grid grid-cols-[1fr_100px_100px_110px_100px] items-center gap-3 border-b border-border-subtle bg-white px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <span>Contract</span>
        <span>Effective</span>
        <span>Ends</span>
        <span className="text-right">TCV</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {/* Pending ingestion items appear first */}
        {pendingIngestions.map((item) => (
          <button
            key={item.queueItemId}
            type="button"
            onClick={() => handlePendingClick(item)}
            className="grid w-full grid-cols-[1fr_100px_100px_110px_100px] items-center gap-3 py-3 pl-3 pr-4 text-left transition-colors hover:bg-amber-50/60 bg-amber-50/30"
          >
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 hover:text-cb-orange transition-colors">
                <Upload size={12} className="shrink-0" />
                {item.scenario === "New Business"
                  ? "New Business"
                  : item.scenario === "Early Renewal"
                    ? "Early Renewal"
                    : item.scenario === "Late Renewal"
                      ? "Late Renewal"
                      : "Renewal"}{" "}
                Contract
              </span>
              <span className="text-[12px] text-text-muted truncate max-w-[200px]">
                {item.documentName}
              </span>
              {item.activeContractId && (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                  <ArrowRight size={10} />
                  Renews {item.activeContractId}
                </span>
              )}
            </div>
            <span className="text-[12px] text-text-muted">—</span>
            <span className="text-[12px] text-text-muted">—</span>
            <span className="text-right text-[13px] font-medium text-text-primary">{currency(item.tcv)}</span>
            <StatusBadge status="Pending Ingestion" />
          </button>
        ))}

        {sorted.map((contract) => {
          const replacedBy = contract.replacedByContractId
            ? contractById.get(contract.replacedByContractId)
            : undefined;
          const replaces = contract.replacesContractId
            ? contractById.get(contract.replacesContractId)
            : undefined;

          return (
            <button
              key={contract.id}
              type="button"
              onClick={() => onSelect(contract)}
              className="grid w-full grid-cols-[1fr_100px_100px_110px_100px] items-center gap-3 py-3 pl-3 pr-4 text-left transition-colors hover:bg-surface-muted/60"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-text-primary hover:text-cb-orange transition-colors">
                  {contract.id}
                </span>
                {contract.sourceQuoteId && !contract.sourceQuoteId.startsWith("QI-") ? (
                  <span className="text-[12px] text-text-secondary">From {contract.sourceQuoteId}</span>
                ) : (
                  <span className="text-[12px] text-text-muted">
                    Ingested · {contract.ingestionTimestamp ? shortDate(contract.ingestionTimestamp.slice(0, 10)) : "—"}
                  </span>
                )}
                {/* Lineage annotations */}
                {replacedBy && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                    <ArrowRight size={10} />
                    Renewed by {replacedBy.id}
                    {replacedBy.status === "Scheduled" && (
                      <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-700">Scheduled</span>
                    )}
                  </span>
                )}
                {replaces && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-600">
                    <ArrowLeft size={10} />
                    Replaces {replaces.id}
                    {replaces.status === "Closing" && (
                      <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700">Closing</span>
                    )}
                  </span>
                )}
                {/* Scheduled activation date */}
                {contract.status === "Scheduled" && contract.scheduledStartDate && (
                  <span className="mt-0.5 text-[11px] font-medium text-blue-600">
                    Activates {shortDate(contract.scheduledStartDate)}
                  </span>
                )}
              </div>
              <span className="text-[12px] text-text-secondary">{shortDate(contract.effectiveDate)}</span>
              <span className="text-[12px] text-text-secondary">{shortDate(contract.endDate)}</span>
              <span className="text-right text-[13px] font-medium text-text-primary">{currency(contract.tcv)}</span>
              <StatusBadge status={contract.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
