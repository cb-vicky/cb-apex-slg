import { useState } from "react";
import { TimelineRow } from "@/components/ui/primitives";
import type { TimelineEvent } from "@/data/mock-data";
import { getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";

interface Props {
  customerId: string;
}

const INITIAL = 5;

export function CustomerTimelineSection({ customerId }: Props) {
  const [expanded, setExpanded] = useState(false);
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
  const display = expanded ? allEvents : allEvents.slice(0, INITIAL);
  const hasMore = allEvents.length > INITIAL;

  if (allEvents.length === 0) {
    return (
      <p className="mt-6 text-[13px] text-text-muted">No activity yet</p>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary">Recent Activity</h3>
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
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View more
        </button>
      )}
    </div>
  );
}
