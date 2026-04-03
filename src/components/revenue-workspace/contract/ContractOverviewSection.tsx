import type { Contract } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";

export function ContractOverviewSection({ contract }: { contract: Contract }) {
  const cards = [
    { label: "Status", value: <StatusBadge status={contract.status} /> },
    { label: "Effective Date", value: shortDate(contract.effectiveDate) },
    { label: "Signed Date", value: shortDate(contract.signedDate) },
    { label: "Term", value: contract.term },
    { label: "TCV", value: currency(contract.tcv) },
    { label: "Min Annual Commit", value: currency(contract.minAnnualCommit) },
    { label: "Prepaid Credit Balance", value: currency(contract.prepaidCreditBalance) },
    { label: "Renewal Date", value: shortDate(contract.renewalDate) },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border-default bg-white px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
