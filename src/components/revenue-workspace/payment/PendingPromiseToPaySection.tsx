import { SectionCard } from "@/components/ui/primitives";
import { isPromiseOpen, type PromiseToPayRecord } from "@/data/billing-data";
import { PromiseToPayListView } from "./PromiseToPayListView";

interface Props {
  promises: PromiseToPayRecord[];
  onEditScheduled?: (promiseId: string, logId: string) => void;
}

export function PendingPromiseToPaySection({ promises, onEditScheduled }: Props) {
  const pending = promises.filter(isPromiseOpen);

  if (pending.length === 0) return null;

  return (
    <SectionCard title="Promise to pay" bodyClassName="p-0">
      <PromiseToPayListView
        promises={pending}
        onEditScheduled={onEditScheduled}
        embedded
      />
    </SectionCard>
  );
}
