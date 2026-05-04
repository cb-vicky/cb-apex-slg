import type { Customer } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";
import { EntityChip, MetricPill, RiskBadge } from "@/components/ui/primitives";
import { Building2, Calendar, User } from "lucide-react";

interface Props {
  customer: Customer;
}

export function CustomerWorkspaceHeader({ customer }: Props) {
  const burnPct = Math.round(
    ((customer.prepaidCreditTotal - customer.prepaidCreditBalance) / customer.prepaidCreditTotal) * 100
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* Title row */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-text-primary">{customer.name}</h1>
            <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[12px] font-medium leading-4 text-gray-600">
              {customer.segment} &middot; {customer.tier}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EntityChip label="Account" value={customer.commercialAccount} />
            <EntityChip label="Billing Entity" value={customer.billingLegalEntity} />
            <EntityChip label="CB Entity" value={customer.chargebeeEntity} />
          </div>
        </div>

        {/* Metric ribbon */}
        <div className="flex shrink-0 items-center gap-6">
          <MetricPill label="ARR" value={currency(customer.arr)} />
          <MetricPill label="TCV" value={currency(customer.tcv)} />
          <MetricPill label="Prepaid Credits" value={`${currency(customer.prepaidCreditBalance)} (${burnPct}% used)`} variant={burnPct > 70 ? "warning" : "default"} />
          <MetricPill label="Open AR" value={currency(customer.openAr)} variant={customer.openAr > 0 ? "danger" : "default"} />
          <MetricPill label="Next Renewal" value={shortDate(customer.nextRenewalDate)} />
        </div>
      </div>

      {/* Ownership + risk row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[13px] text-text-secondary">
          <span className="inline-flex items-center gap-1"><User size={13} /> AE: {customer.ae}</span>
          <span className="inline-flex items-center gap-1"><User size={13} /> CSM: {customer.csm}</span>
          <span className="inline-flex items-center gap-1"><Building2 size={13} /> Billing: {customer.billingOwner}</span>
          <span className="inline-flex items-center gap-1"><Calendar size={13} /> Customer since {shortDate(customer.createdAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {customer.riskBadges.map((badge) => (
            <RiskBadge key={badge} label={badge} />
          ))}
        </div>
      </div>
    </div>
  );
}
