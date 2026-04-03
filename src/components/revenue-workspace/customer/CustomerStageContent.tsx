import type { Customer } from "@/data/mock-data";
import { CustomerOverviewSection } from "./CustomerOverviewSection";
import { BillingSetupSection } from "./BillingSetupSection";
import { CrmSnapshotSection } from "./CrmSnapshotSection";
import { SupportCommsSection } from "./SupportCommsSection";
import { LifecycleSummarySection } from "./LifecycleSummarySection";
import { CustomerTimelineSection } from "./CustomerTimelineSection";

interface Props {
  customer: Customer;
}

export function CustomerStageContent({ customer }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <CustomerOverviewSection customer={customer} />
      <BillingSetupSection customer={customer} />
      <CrmSnapshotSection customer={customer} />
      <SupportCommsSection customerId={customer.id} />
      <LifecycleSummarySection customerId={customer.id} />
      <CustomerTimelineSection customerId={customer.id} />
    </div>
  );
}
