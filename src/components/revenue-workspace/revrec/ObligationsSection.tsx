import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import type { PerformanceObligation } from "@/data/revrec-data";

const obligationTypeBg: Record<string, string> = {
  "over-time": "bg-blue-50 text-blue-700 border-blue-200",
  "point-in-time": "bg-purple-50 text-purple-700 border-purple-200",
  "usage-based": "bg-amber-50 text-amber-700 border-amber-200",
};

interface Props {
  obligations: PerformanceObligation[];
}

export function ObligationsSection({ obligations }: Props) {
  return (
    <SectionCard title="Performance Obligations / Revenue Buckets">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="pb-2 pr-2 font-medium">Product / Service</th>
            <th className="pb-2 pr-2 font-medium">Type</th>
            <th className="pb-2 pr-2 font-medium">Basis</th>
            <th className="pb-2 pr-2 font-medium text-right">Allocated</th>
            <th className="pb-2 pr-2 font-medium text-right">Recognized</th>
            <th className="pb-2 pr-2 font-medium text-right">Deferred</th>
            <th className="pb-2 font-medium">Method</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((ob, idx) => {
            const pct = Math.round((ob.recognizedToDate / ob.allocatedAmount) * 100);
            const typeColors = obligationTypeBg[ob.obligationType] ?? "bg-gray-100 text-gray-600 border-gray-200";
            return (
              <tr key={idx} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-2 font-medium text-text-primary">{ob.product}</td>
                <td className="py-2 pr-2">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 ${typeColors}`}>
                    {ob.obligationType}
                  </span>
                </td>
                <td className="py-2 pr-2 text-[12px] text-text-secondary">{ob.allocationBasis}</td>
                <td className="py-2 pr-2 text-right tabular-nums text-text-primary">{currency(ob.allocatedAmount)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  <span className="text-emerald-600">{currency(ob.recognizedToDate)}</span>
                  <span className="ml-1 text-[10px] text-text-muted">({pct}%)</span>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-amber-600">{currency(ob.deferredRemaining)}</td>
                <td className="py-2 text-[12px] text-text-secondary">{ob.method}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionCard>
  );
}
