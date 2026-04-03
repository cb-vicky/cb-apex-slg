import type { QuoteCommercialTerms } from "@/data/mock-data";
import { KV, SectionCard } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";

export function QuoteTermsSection({ terms }: { terms: QuoteCommercialTerms }) {
  return (
    <SectionCard title="Commercial Terms">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="divide-y divide-border-subtle">
          <KV label="Contract term" value={terms.contractTerm} />
          <KV label="Billing frequency" value={terms.billingFrequency} />
          <KV label="Payment terms" value={terms.paymentTerms} />
          <KV label="Start date" value={shortDate(terms.startDate)} />
          <KV label="End date" value={shortDate(terms.endDate)} />
        </div>
        <div className="divide-y divide-border-subtle">
          <KV label="Auto-renew" value={terms.autoRenew ? "Yes" : "No"} />
          <KV label="Trial period" value={terms.trialPeriod} />
          <KV label="Co-term target" value={terms.coTermTarget} />
          <KV label="AI usage drawdown" value={terms.aiUsageDrawdown} />
          <KV label="Prepaid credit logic" value={terms.prepaidCreditLogic} />
        </div>
      </div>
    </SectionCard>
  );
}
