import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";
import type { CollectionCase } from "@/data/billing-data";

interface Props {
  cases: CollectionCase[];
}

export function CollectionsWorkflowSection({ cases }: Props) {
  if (cases.length === 0) {
    return (
      <SectionCard title="Collections Workflow">
        <p className="text-[13px] text-text-muted">No active collection cases for this customer.</p>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {cases.map((c) => (
        <SectionCard key={c.id} title={`Collections Case: ${c.id}`}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-0">
            <KV label="Invoice" value={c.invoiceId} />
            <KV label="Stage" value={<StatusBadge status={c.stage} />} />
            <KV label="Owner" value={c.owner} />
            <KV label="Days Overdue" value={<span className={c.daysOverdue > 30 ? "text-red-600" : "text-amber-600"}>{c.daysOverdue}d</span>} />
            {c.ptpDate && <KV label="Promise to Pay" value={c.ptpDate} />}
            <KV label="Escalated" value={c.escalated ? "Yes" : "No"} />
            <KV label="Next Step" value={c.nextStep} />
            {c.expectedResolutionDate && <KV label="Expected Resolution" value={c.expectedResolutionDate} />}
          </div>

          {c.lastContactSummary && (
            <div className="mt-3 rounded-md border border-border-default bg-surface-muted px-3 py-2 text-[12px] text-text-secondary">
              <span className="font-semibold text-text-primary">Last contact:</span> {c.lastContactSummary}
            </div>
          )}

          {c.disputeReason && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px]">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-red-800">Dispute:</span>
                <span className="text-red-700">{c.disputeReason}</span>
              </div>
              {c.billingOwner && (
                <div className="mt-1 flex gap-4 text-red-600">
                  <span>Billing Owner: {c.billingOwner}</span>
                  {c.issueCategory && <span>Category: {c.issueCategory}</span>}
                </div>
              )}
            </div>
          )}

          {c.followUpHistory.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Follow-up History</p>
              <div className="space-y-1.5">
                {c.followUpHistory.map((entry, idx) => (
                  <div key={idx} className="flex gap-3 text-[12px]">
                    <span className="w-20 shrink-0 text-text-muted">{shortDate(entry.date)}</span>
                    <span className="font-medium text-text-primary">{entry.action}</span>
                    <span className="text-text-secondary">{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
