import type { TimelineEvent } from "@/data/mock-data";
import { SectionCard, TimelineRow } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";

export function ContractTimelineSection({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <SectionCard title="Activity / Audit Timeline">
      <div className="max-h-64 overflow-y-auto">
        {timeline.map((event, idx) => (
          <TimelineRow
            key={`${event.date}-${event.action}`}
            date={shortDate(event.date)}
            action={event.action}
            actor={event.actor}
            detail={event.detail}
            isLast={idx === timeline.length - 1}
          />
        ))}
      </div>
    </SectionCard>
  );
}
