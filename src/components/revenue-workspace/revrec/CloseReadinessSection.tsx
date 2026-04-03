import { SectionCard, StatusBadge, TimelineRow } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";
import type { CloseBlocker, JournalExport, RevRecAdjustment, RevenueArrangement } from "@/data/revrec-data";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  blockers: CloseBlocker[];
  journalExports: JournalExport[];
  adjustments: RevRecAdjustment[];
  arrangement: RevenueArrangement;
}

export function CloseReadinessSection({ blockers, journalExports, adjustments, arrangement }: Props) {
  const unresolved = blockers.filter((b) => !b.resolved);
  const resolved = blockers.filter((b) => b.resolved);
  const timeline = buildAuditTrail(arrangement);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Close Readiness / Controls">
        {unresolved.length > 0 && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            <span className="font-semibold">{unresolved.length} unresolved blocker{unresolved.length > 1 ? "s" : ""}</span> preventing period close.
          </div>
        )}
        <div className="space-y-2">
          {unresolved.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2 rounded-md border border-border-default px-3 py-2">
              <AlertTriangle size={14} className={b.severity === "critical" ? "mt-0.5 shrink-0 text-red-500" : "mt-0.5 shrink-0 text-amber-500"} />
              <div>
                <p className="text-[13px] font-medium text-text-primary">{b.description}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                  <span>Category: {b.category}</span>
                  <span>·</span>
                  <span className={b.severity === "critical" ? "text-red-600" : "text-amber-600"}>{b.severity}</span>
                </div>
              </div>
            </div>
          ))}
          {resolved.map((b, idx) => (
            <div key={`r-${idx}`} className="flex items-start gap-2 rounded-md border border-border-default bg-surface-muted px-3 py-2 opacity-60">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-[13px] text-text-secondary line-through">{b.description}</p>
                <span className="text-[11px] text-text-muted">Resolved</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {adjustments.length > 0 && (
        <SectionCard title="Manual Adjustments">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">ID</th>
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium">Type</th>
                <th className="pb-2 pr-2 font-medium text-right">Amount</th>
                <th className="pb-2 pr-2 font-medium">Reason</th>
                <th className="pb-2 pr-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Approver</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj) => (
                <tr key={adj.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-text-primary">{adj.id}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{shortDate(adj.date)}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{adj.type}</td>
                  <td className={`py-1.5 pr-2 text-right tabular-nums font-medium ${adj.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {adj.amount >= 0 ? `+$${adj.amount.toLocaleString()}` : `-$${Math.abs(adj.amount).toLocaleString()}`}
                  </td>
                  <td className="py-1.5 pr-2 text-[12px] text-text-secondary">{adj.reason}</td>
                  <td className="py-1.5 pr-2"><StatusBadge status={adj.status === "applied" ? "Applied" : adj.status === "pending_approval" ? "Pending Approval" : "Rejected"} /></td>
                  <td className="py-1.5 text-text-secondary">{adj.approver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <SectionCard title="Journal / Export Traceability">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-2 font-medium">Period</th>
              <th className="pb-2 pr-2 font-medium">Journal ID</th>
              <th className="pb-2 pr-2 font-medium">Status</th>
              <th className="pb-2 pr-2 font-medium">ERP Reference</th>
              <th className="pb-2 pr-2 font-medium">Export Date</th>
              <th className="pb-2 font-medium">Failure Reason</th>
            </tr>
          </thead>
          <tbody>
            {journalExports.map((je) => (
              <tr key={je.id} className="border-b border-border-subtle last:border-0">
                <td className="py-1.5 pr-2 font-medium text-text-primary">{je.period}</td>
                <td className="py-1.5 pr-2 text-text-secondary">{je.id}</td>
                <td className="py-1.5 pr-2">
                  <StatusBadge status={je.status === "posted" ? "Posted" : je.status === "pending" ? "Pending" : je.status === "failed" ? "Failed" : "Re-exported"} />
                </td>
                <td className="py-1.5 pr-2 text-[11px] text-text-muted">{je.erpReference || "—"}</td>
                <td className="py-1.5 pr-2 text-text-secondary">{je.exportDate ? shortDate(je.exportDate) : "—"}</td>
                <td className="py-1.5 text-[12px] text-red-600">{je.failReason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {journalExports.some((je) => je.status === "failed" || (je.status === "pending" && je.failReason)) && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            <span className="font-semibold">Export blocked:</span> Resolve close blockers before journal entries can be exported to ERP.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Revenue Audit Trail">
        <div className="py-1">
          {timeline.map((event, idx) => (
            <TimelineRow
              key={idx}
              date={event.date}
              action={event.action}
              actor={event.actor}
              detail={event.detail}
              isLast={idx === timeline.length - 1}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function buildAuditTrail(arrangement: RevenueArrangement) {
  const events: { date: string; action: string; actor: string; detail?: string }[] = [];

  events.push({ date: arrangement.startDate, action: "Revenue arrangement created", actor: "System", detail: `From contract ${arrangement.contractId}` });

  for (const ai of arrangement.amendmentImpacts) {
    events.push({
      date: ai.effectiveDate,
      action: `Amendment ${ai.amendmentId}: ${ai.type}`,
      actor: "System",
      detail: `${ai.description}. Schedule state: ${ai.scheduleUpdateState}`,
    });
  }

  for (const adj of arrangement.adjustments) {
    events.push({
      date: adj.date,
      action: `Manual adjustment: ${adj.type}`,
      actor: adj.approver,
      detail: `${adj.reason} (${adj.status})`,
    });
  }

  for (const je of arrangement.journalExports) {
    if (je.exportDate) {
      events.push({
        date: je.exportDate,
        action: `Journal exported: ${je.period}`,
        actor: "System",
        detail: je.status === "posted" ? `ERP ref: ${je.erpReference}` : `Status: ${je.status}`,
      });
    }
  }

  events.push({ date: arrangement.lastRecalculated, action: "Schedule last recalculated", actor: "System" });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return events;
}
