import { ArrowLeft, Edit, ExternalLink, GitCompare, Send } from "lucide-react";
import type { Quote } from "@/data/mock-data";
import { RecordHeader } from "../RecordHeader";
import { ActionButton } from "../primitives/ActionButton";
import { QuoteOverviewSection } from "./QuoteOverviewSection";
import { QuotePricingSection } from "./QuotePricingSection";
import { QuoteTermsSection } from "./QuoteTermsSection";
import { QuoteApprovalsSection } from "./QuoteApprovalsSection";
import { QuoteCrmSection } from "./QuoteCrmSection";
import { QuoteRelatedSection } from "./QuoteRelatedSection";
import { QuoteTimelineSection } from "./QuoteTimelineSection";

interface Props {
  quote: Quote;
  quoteVersions?: Quote[];
  onQuoteVersionChange?: (q: Quote) => void;
  onBack?: () => void;
}

export function QuoteStageContent({ quote, quoteVersions, onQuoteVersionChange, onBack }: Props) {
  const approvalStatus = quote.approval.status === "pending" ? "Pending Approval" : quote.approval.status;
  return (
    <div className="flex flex-col gap-4">
      <RecordHeader
        id={quote.id}
        status={quote.status}
        tagline={approvalStatus !== quote.status ? approvalStatus : undefined}
        versions={quoteVersions}
        onVersionChange={onQuoteVersionChange}
        actions={
          <>
            {onBack && <ActionButton icon={ArrowLeft} label="All quotes" onClick={onBack} />}
            <ActionButton icon={Edit} label="Edit" />
            <ActionButton icon={Send} label="Submit for Approval" />
            <ActionButton icon={ExternalLink} label="Send" />
            <ActionButton icon={GitCompare} label="Compare" />
          </>
        }
      />
      <QuoteApprovalsSection approval={quote.approval} comments={quote.comments} />
      <QuoteOverviewSection quote={quote} />
      <QuotePricingSection products={quote.products} />
      <QuoteTermsSection terms={quote.commercialTerms} />
      <QuoteCrmSection quote={quote} />
      <QuoteRelatedSection quote={quote} />
      <QuoteTimelineSection timeline={quote.timeline} />
    </div>
  );
}
