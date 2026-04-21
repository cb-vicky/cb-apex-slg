import type { Quote } from "@/data/mock-data";
import { contracts } from "@/data/mock-data";
import { RecordIdLink, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";

function statusPair(status: string) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      <span className="text-[12px] text-text-secondary">STATUS:</span>
      <StatusBadge status={status} />
    </span>
  );
}

export function QuoteRelatedSection({ quote }: { quote: Quote }) {
  const linkedContract = quote.relatedContractId
    ? contracts.find((c) => c.id === quote.relatedContractId)
    : undefined;

  const { commercialTerms } = quote;

  return (
    <SectionCard title="Related Records">
      <div className="divide-y divide-border-subtle">
        {linkedContract ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]">
            <RecordIdLink to={`/contracts/${linkedContract.id}`}>{linkedContract.id}</RecordIdLink>
            <span className="text-text-secondary">ACTIVE UNTIL: {shortDate(linkedContract.endDate)}</span>
            {statusPair(linkedContract.status)}
          </div>
        ) : (
          <div className="py-2 text-[12px] text-text-muted">No linked active contract</div>
        )}

        <div className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2 text-[13px]">
          <span className="shrink-0 font-medium text-text-primary">Key changes vs current contract</span>
          <span className="min-w-0 flex-1 break-words text-text-secondary">{quote.versionSummary}</span>
          <span className="ml-auto flex shrink-0 flex-wrap items-baseline justify-end gap-x-1 text-[12px]">
            <span className="text-text-secondary">QUOTE:</span>
            <RecordIdLink to={`/quotes/${quote.id}`}>{quote.id}</RecordIdLink>
            <span className="text-text-secondary">(v{quote.version})</span>
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]">
          <span className="font-medium text-text-primary">Expected new contract</span>
          <span className="text-text-secondary">
            Term ends {shortDate(commercialTerms.endDate)}
            {commercialTerms.coTermTarget ? ` · ${commercialTerms.coTermTarget}` : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]">
          <span className="font-medium text-text-primary">Invoice plan</span>
          <span className="text-text-secondary">{commercialTerms.billingFrequency}</span>
          <span className="text-text-secondary tabular-nums">EFFECTIVE: {shortDate(commercialTerms.startDate)}</span>
        </div>
      </div>
    </SectionCard>
  );
}
