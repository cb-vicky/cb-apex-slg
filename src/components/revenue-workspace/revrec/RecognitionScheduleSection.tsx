import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import type { RecognitionScheduleEntry, AmendmentImpact, InvoiceImpact } from "@/data/revrec-data";

interface Props {
  schedule: RecognitionScheduleEntry[];
  amendmentImpacts: AmendmentImpact[];
  invoiceImpacts: InvoiceImpact[];
}

export function RecognitionScheduleSection({ schedule, amendmentImpacts, invoiceImpacts }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Recognition Schedule / Waterfall">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-2 font-medium">Period</th>
              <th className="pb-2 pr-2 font-medium text-right">Recognized</th>
              <th className="pb-2 pr-2 font-medium text-right">Deferred</th>
              <th className="pb-2 pr-2 font-medium text-right">Remaining</th>
              <th className="pb-2 font-medium">Amended</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((entry) => (
              <tr key={entry.period} className={`border-b border-border-subtle last:border-0 ${entry.amended ? "bg-amber-50/50" : ""}`}>
                <td className="py-1.5 pr-2 font-medium text-text-primary">{entry.period}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-emerald-600">{currency(entry.recognized)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-amber-600">{currency(entry.deferred)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-text-primary">{currency(entry.remaining)}</td>
                <td className="py-1.5">
                  {entry.amended ? (
                    <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Modified</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end gap-4 text-[12px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-amber-100 border border-amber-200" />
            Periods affected by amendments
          </span>
        </div>
      </SectionCard>

      {amendmentImpacts.length > 0 && (
        <SectionCard title="Contract Modifications & Amendment Impact">
          <div className="space-y-3">
            {amendmentImpacts.map((ai) => (
              <div key={ai.amendmentId} className="rounded-md border border-border-default px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">{ai.amendmentId}</span>
                    <span className="text-[12px] text-text-secondary">{ai.type}</span>
                  </div>
                  <StatusBadge status={ai.scheduleUpdateState} />
                </div>
                <p className="mt-1 text-[12px] text-text-secondary">{ai.description}</p>
                <p className="mt-1 text-[12px] text-text-muted">Effective: {ai.effectiveDate}</p>
                <p className="mt-1 text-[12px] text-text-secondary">
                  <span className="font-medium">Reallocation:</span> {ai.reallocationEffect}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {invoiceImpacts.length > 0 && (
        <SectionCard title="Invoice / Credit Note Impact">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Invoice</th>
                <th className="pb-2 pr-2 font-medium text-right">Billed</th>
                <th className="pb-2 pr-2 font-medium text-right">Credited</th>
                <th className="pb-2 pr-2 font-medium">Correction</th>
                <th className="pb-2 font-medium">Entries Updated</th>
              </tr>
            </thead>
            <tbody>
              {invoiceImpacts.map((ii) => (
                <tr key={ii.invoiceId} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-text-primary">{ii.invoiceId}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-text-primary">{currency(ii.billedAmount)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-red-600">{ii.creditedAmount > 0 ? `-${currency(ii.creditedAmount)}` : "—"}</td>
                  <td className="py-1.5 pr-2 text-[12px] text-text-secondary">{ii.correction || "—"}</td>
                  <td className="py-1.5">
                    {ii.accountingEntriesUpdated ? (
                      <StatusBadge status="Updated" />
                    ) : (
                      <StatusBadge status="Pending" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}
