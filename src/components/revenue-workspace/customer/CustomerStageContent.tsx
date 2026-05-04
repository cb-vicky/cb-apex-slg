import type { Customer } from "@/data/mock-data";
import { CustomerNbaAiRow } from "./CustomerNbaAiRow";
import { CustomerMetricsSection } from "./CustomerMetricsSection";
import { SupportCommsSection } from "./SupportCommsSection";
import { LifecycleSummarySection } from "./LifecycleSummarySection";
import { CustomerTimelineSection } from "./CustomerTimelineSection";

interface Props {
  customer: Customer;
}

export function CustomerStageContent({ customer }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <CustomerNbaAiRow customer={customer} />
      <CustomerMetricsSection customer={customer} />
      <SupportCommsSection customerId={customer.id} />
      <LifecycleSummarySection customerId={customer.id} />
      <CustomerTimelineSection customerId={customer.id} />
    </div>
  );
}
