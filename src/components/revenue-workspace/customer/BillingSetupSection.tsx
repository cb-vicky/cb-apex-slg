import type { Customer } from "@/data/mock-data";
import { SectionCard, KV } from "@/components/ui/primitives";

interface Props {
  customer: Customer;
}

export function BillingSetupSection({ customer }: Props) {
  return (
    <SectionCard title="Commercial & Billing Setup">
      <div className="grid grid-cols-2 gap-x-8 divide-x divide-border-subtle">
        <div>
          <KV label="Billing legal entity" value={customer.billingLegalEntity} />
          <KV label="Chargebee entity" value={customer.chargebeeEntity} />
          <KV label="Currency" value={customer.currency} />
          <KV label="Tax region" value={customer.taxRegion} />
        </div>
        <div className="pl-8">
          <KV label="Payment method" value={customer.paymentMethod} />
          <KV label="PO required" value={customer.poRequired ? "Yes" : "No"} />
          <KV label="Active contracts" value={String(customer.activeContractCount)} />
          <KV label="Open quotes" value={String(customer.openQuoteCount)} />
        </div>
      </div>
    </SectionCard>
  );
}
