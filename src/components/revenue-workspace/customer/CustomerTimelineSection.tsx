import { SectionCard } from "@/components/ui/primitives";
import { TimelineRow } from "@/components/ui/primitives";
import type { TimelineEvent } from "@/data/mock-data";
import { getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";

interface Props {
  customerId: string;
}

export function CustomerTimelineSection({ customerId }: Props) {
  const customerQuotes = getQuotesForCustomer(customerId);
  const customerContracts = getContractsForCustomer(customerId);

  const allEvents: (TimelineEvent & { source: string })[] = [];

  for (const q of customerQuotes) {
    for (const e of q.timeline) {
      allEvents.push({ ...e, source: `Quote ${q.id}` });
    }
  }
  for (const c of customerContracts) {
    for (const e of c.timeline) {
      allEvents.push({ ...e, source: `Contract ${c.id}` });
    }
  }

  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const display = allEvents.slice(0, 15);

  return (
    <SectionCard title="Recent Activity">
      {display.length === 0 ? (
        <p className="text-[13px] text-text-muted">No activity yet</p>
      ) : (
        <div>
          {display.map((event, idx) => (
            <TimelineRow
              key={`${event.date}-${event.action}-${idx}`}
              date={event.date}
              action={event.action}
              actor={event.actor}
              detail={event.detail ? `${event.detail} · ${event.source}` : event.source}
              isLast={idx === display.length - 1}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
