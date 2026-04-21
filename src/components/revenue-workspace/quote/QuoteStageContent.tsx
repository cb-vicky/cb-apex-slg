import { LayoutList } from "lucide-react";
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
  const approvalTagline =
    approvalStatus !== quote.status && approvalStatus !== "not_required" ? approvalStatus : undefined;
  return (
    <div className="flex flex-col gap-4">
      <RecordHeader
        stickyBar
        showStatusBadge={false}
        id={quote.id}
        status={quote.status}
        tagline={approvalTagline}
        versions={quoteVersions}
        onVersionChange={onQuoteVersionChange}
        leadingAction={
          onBack ? (
            <ActionButton variant="default" icon={LayoutList} label="All quotes" onClick={onBack} />
          ) : undefined
        }
        actions={
          <>
            <ActionButton variant="default" label="Edit quote" />
            <ActionButton variant="default" label="Submit for Approval" />
          </>
        }
      />
      <QuoteOverviewSection quote={quote} />
      <QuoteApprovalsSection
        approval={quote.approval}
        comments={quote.comments}
        teamCommentsUnread={quote.teamCommentsUnread}
      />
      <QuotePricingSection products={quote.products} />
      <QuoteTermsSection terms={quote.commercialTerms} />
      <QuoteCrmSection quote={quote} />
      <QuoteRelatedSection quote={quote} />
      <QuoteTimelineSection timeline={quote.timeline} />
    </div>
  );
}
