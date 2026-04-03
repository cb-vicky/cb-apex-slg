import { SectionCard, StatusBadge, TimelineRow } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { InvoiceScheduleEntry, InvoiceEnrichment } from "@/data/billing-data";
import type { Invoice } from "@/data/mock-data";

interface Props {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
  schedule: InvoiceScheduleEntry[];
}

export function InvoicingScheduleSection({ invoice, enrichment, schedule }: Props) {
  const timelineEvents = buildTimeline(invoice, enrichment);

  return (
    <div className="flex flex-col gap-4">
      {schedule.length > 0 && (
        <SectionCard title="Upcoming Invoice Schedule">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium">Type</th>
                <th className="pb-2 pr-2 font-medium text-right">Est. Amount</th>
                <th className="pb-2 pr-2 font-medium">Hold</th>
                <th className="pb-2 font-medium">Dependency</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((entry, idx) => (
                <tr key={idx} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 text-text-secondary">{shortDate(entry.date)}</td>
                  <td className="py-1.5 pr-2 text-text-primary">{entry.type}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-medium text-text-primary">{currency(entry.estimatedAmount)}</td>
                  <td className="py-1.5 pr-2">
                    {entry.holdState !== "None" ? (
                      <StatusBadge status={entry.holdState} />
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-1.5 text-[12px] text-text-muted">{entry.dependency || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <SectionCard title="Invoice Activity / Audit Trail">
        <div className="py-1">
          {timelineEvents.map((event, idx) => (
            <TimelineRow
              key={idx}
              date={event.date}
              action={event.action}
              actor={event.actor}
              detail={event.detail}
              isLast={idx === timelineEvents.length - 1}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function buildTimeline(invoice: Invoice, enrichment?: InvoiceEnrichment) {
  const events: { date: string; action: string; actor: string; detail?: string }[] = [];

  events.push({ date: invoice.date, action: "Invoice generated", actor: "System", detail: `Amount: $${invoice.amount.toLocaleString()}` });

  if (enrichment?.reviewChecklist.some((c) => c.status === "fail")) {
    events.push({ date: invoice.date, action: "Validation issue detected", actor: "System", detail: enrichment.reviewChecklist.filter((c) => c.status === "fail").map((c) => c.label).join(", ") });
  }

  if (invoice.holdReason) {
    events.push({ date: invoice.date, action: "Invoice put on hold", actor: "System", detail: invoice.holdReason });
  }

  if (enrichment?.deliveryHistory) {
    for (const d of enrichment.deliveryHistory) {
      events.push({ date: d.date, action: d.status, actor: "System", detail: `via ${d.method} to ${d.recipient}` });
    }
  }

  if (invoice.status === "Overdue") {
    events.push({ date: invoice.dueDate, action: "Invoice overdue", actor: "System", detail: `Past due date: ${invoice.dueDate}` });
  }

  if (invoice.status === "Paid") {
    events.push({ date: invoice.dueDate, action: "Payment received", actor: "System" });
  }

  return events;
}
