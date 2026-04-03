import type { Customer } from "@/data/mock-data";
import { SectionCard, KV } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";

interface Props {
  customer: Customer;
}

export function CustomerOverviewSection({ customer }: Props) {
  const burnPct = customer.prepaidCreditTotal > 0
    ? Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100)
    : 0;

  return (
    <SectionCard title="Customer Overview">
      <div className="grid grid-cols-2 gap-x-8 gap-y-0 divide-x divide-border-subtle">
        <div>
          <KV label="Company" value={customer.name} />
          <KV label="Domain" value={customer.domain} />
          <KV label="Industry" value={customer.industry} />
          <KV label="Segment" value={`${customer.segment} · ${customer.tier}`} />
          <KV label="Region" value={customer.region} />
          <KV label="Customer since" value={shortDate(customer.createdAt)} />
        </div>
        <div className="pl-8">
          <KV label="ARR" value={currency(customer.arr)} />
          <KV label="TCV" value={currency(customer.tcv)} />
          <KV label="Open AR" value={currency(customer.openAr)} />
          <KV label="Prepaid credits" value={`${currency(customer.prepaidCreditBalance)} of ${currency(customer.prepaidCreditTotal)} (${burnPct}% used)`} />
          <KV label="Next renewal" value={customer.nextRenewalDate ? shortDate(customer.nextRenewalDate) : "—"} />
          <div className="flex flex-wrap gap-1 pt-2">
            {customer.riskBadges.map((b) => (
              <span key={b} className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                {b}
              </span>
            ))}
            {customer.riskBadges.length === 0 && (
              <span className="text-[12px] text-emerald-600 font-medium">Healthy</span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
