import type { Customer } from "@/data/mock-data";
import { SectionCard, KV } from "@/components/ui/primitives";

interface Props {
  customer: Customer;
}

export function BillingSetupSection({ customer }: Props) {
  return (
    <SectionCard title="Commercial & Billing Setup">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="min-w-0">
          <KV label="Billing legal entity" value={customer.billingLegalEntity} />
          <KV label="Chargebee entity" value={customer.chargebeeEntity} />
          <KV label="Currency" value={customer.currency} />
          <KV label="Tax region" value={customer.taxRegion} />
        </div>
        <div className="min-w-0 border-l border-border-subtle pl-8">
          <KV label="Payment method" value={customer.paymentMethod} />
          <KV label="PO required" value={customer.poRequired ? "Yes" : "No"} />
          <KV label="Active contracts" value={String(customer.activeContractCount)} />
          <KV label="Open quotes" value={String(customer.openQuoteCount)} />
        </div>
      </div>
    </SectionCard>
  );
}
