import type { ReactNode } from "react";
import type { Customer } from "@/data/mock-data";
import { SectionCard, KV } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";

interface Props {
  customer: Customer;
}

export function CustomerMetricsSection({ customer }: Props) {
  const burnPct =
    customer.prepaidCreditTotal > 0
      ? Math.round(((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100)
      : 0;

  const renewalTs = customer.nextRenewalDate?.trim()
    ? new Date(customer.nextRenewalDate).getTime()
    : NaN;
  const hasRenewal = Number.isFinite(renewalTs);

  const metrics: { label: string; value: ReactNode }[] = [];

  if (customer.arr > 0) metrics.push({ label: "ARR", value: currency(customer.arr) });
  if (customer.tcv > 0) metrics.push({ label: "TCV", value: currency(customer.tcv) });
  if (customer.openAr > 0) metrics.push({ label: "Open AR", value: currency(customer.openAr) });
  if (customer.prepaidCreditTotal > 0) {
    metrics.push({
      label: "Prepaid credits",
      value: `${currency(customer.prepaidCreditBalance)} of ${currency(customer.prepaidCreditTotal)} (${burnPct}% used)`,
    });
  }
  if (hasRenewal) metrics.push({ label: "Next renewal", value: shortDate(customer.nextRenewalDate) });
  if (customer.currency.trim()) metrics.push({ label: "Currency", value: customer.currency });
  if (customer.taxRegion.trim()) metrics.push({ label: "Tax region", value: customer.taxRegion });
  if (customer.paymentMethod.trim()) metrics.push({ label: "Payment method", value: customer.paymentMethod });
  metrics.push({ label: "PO required", value: customer.poRequired ? "Yes" : "No" });
  if (customer.activeContractCount > 0) {
    metrics.push({ label: "Active contracts", value: String(customer.activeContractCount) });
  }
  if (customer.openQuoteCount > 0) {
    metrics.push({ label: "Open quotes", value: String(customer.openQuoteCount) });
  }

  if (metrics.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Commercial snapshot">
      <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        {metrics.map((m) => (
          <KV key={m.label} label={m.label} value={m.value} />
        ))}
      </div>
    </SectionCard>
  );
}
