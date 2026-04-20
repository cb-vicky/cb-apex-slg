import type { Contract } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Props {
  contracts: Contract[];
  onSelect: (contract: Contract) => void;
}

export function ContractListView({ contracts, onSelect }: Props) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center">
        <FileText size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">No contracts found for this customer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-white">
      {/* Column header */}
      <div className="grid grid-cols-[1fr_100px_100px_110px_120px_100px] items-center gap-3 border-b border-border-subtle bg-surface-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <span>Contract</span>
        <span>Effective</span>
        <span>Ends</span>
        <span className="text-right">TCV</span>
        <span>Enforcement</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {contracts.map((contract) => (
          <button
            key={contract.id}
            type="button"
            onClick={() => onSelect(contract)}
            className="grid w-full grid-cols-[1fr_100px_100px_110px_120px_100px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-text-primary hover:text-cb-orange transition-colors">
                {contract.id}
              </span>
              {contract.sourceQuoteId ? (
                <span className="text-[12px] text-text-secondary">From {contract.sourceQuoteId}</span>
              ) : (
                <span className="text-[12px] text-text-muted">
                  Ingested · {contract.ingestionTimestamp ? shortDate(contract.ingestionTimestamp.slice(0, 10)) : "—"}
                </span>
              )}
            </div>
            <span className="text-[12px] text-text-secondary">{shortDate(contract.effectiveDate)}</span>
            <span className="text-[12px] text-text-secondary">{shortDate(contract.endDate)}</span>
            <span className="text-right text-[13px] font-medium text-text-primary">{currency(contract.tcv)}</span>
            <StatusBadge status={contract.enforcement.enforcementStatus} />
            <StatusBadge status={contract.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
