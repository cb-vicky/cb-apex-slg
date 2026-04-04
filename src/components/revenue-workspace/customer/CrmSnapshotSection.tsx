import type { Customer } from "@/data/mock-data";
import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface Props {
  customer: Customer;
}

export function CrmSnapshotSection({ customer }: Props) {
  return (
    <SectionCard title="CRM / Integration Snapshot">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="min-w-0">
          <KV label="CRM Account ID" value={
            <span className="inline-flex items-center gap-1">
              {customer.crmAccountId}
              <ExternalLink size={11} className="text-blue-500" />
            </span>
          } />
          <KV label="CRM sync status" value={<StatusBadge status={customer.crmSyncStatus} />} />
          <KV label="Last synced" value={shortDate(customer.crmLastSyncedAt)} />
        </div>
        <div className="min-w-0 border-l border-border-subtle pl-8">
          <KV label="Account Executive" value={customer.ae} />
          <KV label="CSM" value={customer.csm} />
          <KV label="Billing Owner" value={customer.billingOwner} />
        </div>
      </div>
    </SectionCard>
  );
}
