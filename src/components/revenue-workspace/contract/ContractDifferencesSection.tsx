import type { ContractDifference } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { ArrowRight } from "lucide-react";

export function ContractDifferencesSection({ differences }: { differences: ContractDifference[] }) {
  if (differences.length === 0) return null;

  return (
    <SectionCard title="Quote vs Contract Differences" className="border-amber-200 bg-amber-50/20">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-4 font-medium">Field</th>
              <th className="pb-2 pr-4 font-medium">Quote Value</th>
              <th className="pb-2 pr-4 font-medium" />
              <th className="pb-2 font-medium">Contract Value</th>
            </tr>
          </thead>
          <tbody>
            {differences.map((diff) => (
              <tr key={diff.field} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-4 font-medium text-text-primary">{diff.field}</td>
                <td className="py-2 pr-4 text-text-secondary">{diff.quoteValue}</td>
                <td className="py-2 pr-4 text-text-muted"><ArrowRight size={13} /></td>
                <td className="py-2 font-medium text-text-primary">{diff.contractValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
