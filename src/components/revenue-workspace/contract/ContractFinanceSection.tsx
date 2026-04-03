import type { Contract } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";

export function ContractFinanceSection({ contract }: { contract: Contract }) {
  const items = [
    { label: "Invoices Generated", value: contract.invoicesGenerated.toString() },
    { label: "Credit Notes", value: contract.creditNotes.toString() },
    { label: "Open AR", value: currency(contract.openAr), variant: contract.openAr > 0 ? "danger" as const : undefined },
    { label: "Payments Received", value: currency(contract.paymentsReceived) },
    { label: "Unapplied Cash", value: currency(contract.unappliedCash) },
  ];

  return (
    <SectionCard title="Downstream Finance Impact">
      <div className="grid grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-border-default px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{item.label}</p>
            <p className={`mt-1 text-sm font-semibold tabular-nums ${item.variant === "danger" ? "text-red-600" : "text-text-primary"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {/* Rev Rec summary */}
      <div className="mt-3 flex items-center gap-6 border-t border-border-subtle pt-3 text-[13px]">
        <span className="text-text-secondary">
          Recognized: <span className="font-semibold tabular-nums text-text-primary">{currency(contract.revRecSummary.recognized)}</span>
        </span>
        <span className="text-text-secondary">
          Deferred: <span className="font-semibold tabular-nums text-text-primary">{currency(contract.revRecSummary.deferred)}</span>
        </span>
        <StatusBadge status={contract.revRecSummary.status} />
      </div>
    </SectionCard>
  );
}
