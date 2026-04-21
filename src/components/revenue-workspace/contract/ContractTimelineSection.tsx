import type { TimelineEvent } from "@/data/mock-data";
import { RecentActivitySection, type RecentActivityItem } from "../primitives/RecentActivitySection";

export function ContractTimelineSection({ timeline }: { timeline: TimelineEvent[] }) {
  const events: RecentActivityItem[] = timeline.map((e) => ({
    date: e.date,
    action: e.action,
    actor: e.actor,
    detail: e.detail,
  }));

  return <RecentActivitySection events={events} />;
}
