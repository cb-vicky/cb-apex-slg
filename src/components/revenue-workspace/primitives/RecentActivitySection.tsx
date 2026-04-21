import { useState } from "react";
import { TimelineRow } from "@/components/ui/primitives";
import { cn, shortDate } from "@/lib/utils";

export type RecentActivityItem = {
  date: string;
  action: string;
  actor: string;
  detail?: string;
};

const INITIAL = 5;

interface Props {
  events: RecentActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export function RecentActivitySection({ events, emptyMessage = "No activity yet", className }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const display = expanded ? sorted : sorted.slice(0, INITIAL);
  const hasMore = sorted.length > INITIAL;

  if (sorted.length === 0) {
    return (
      <div className={cn(className)}>
        <p className="text-[13px] text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary">Recent Activity</h3>
      <div>
        {display.map((event, idx) => (
          <TimelineRow
            key={`${event.date}-${event.action}-${idx}`}
            date={shortDate(event.date)}
            action={event.action}
            actor={event.actor}
            detail={event.detail}
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
