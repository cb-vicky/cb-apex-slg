import type { TimelineEvent } from "@/data/mock-data";
import { getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { RecentActivitySection, type RecentActivityItem } from "../primitives/RecentActivitySection";

interface Props {
  customerId: string;
}

export function CustomerTimelineSection({ customerId }: Props) {
  const customerQuotes = getQuotesForCustomer(customerId);
  const customerContracts = getContractsForCustomer(customerId);

  const events: RecentActivityItem[] = [];

  for (const q of customerQuotes) {
    for (const e of q.timeline) {
      events.push(buildItem(e, `Quote ${q.id}`));
    }
  }
  for (const c of customerContracts) {
    for (const e of c.timeline) {
      events.push(buildItem(e, `Contract ${c.id}`));
    }
  }

  return (
    <div className="mt-6">
      <RecentActivitySection events={events} />
    </div>
  );
}

function buildItem(e: TimelineEvent, source: string): RecentActivityItem {
  return {
    date: e.date,
    action: e.action,
    actor: e.actor,
    detail: e.detail ? `${e.detail} · ${source}` : source,
  };
}
