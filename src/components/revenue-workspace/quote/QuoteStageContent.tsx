import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const approvalStatus = quote.approval.status === "pending" ? "Pending Approval" : quote.approval.status;
  const approvalTagline =
    approvalStatus !== quote.status && approvalStatus !== "not_required" ? approvalStatus : undefined;

  const headerActions = useMemo(() => {
    const approvalPending = quote.approval.status === "pending" || quote.status === "Pending Approval";
    const rejected = quote.approval.status === "rejected" || quote.status === "Rejected";
    const accepted = quote.status === "Accepted";
    const sent = quote.status === "Sent";
    const draftLike = quote.status === "Draft" || quote.status === "In Progress";

    if (approvalPending) {
      return (
        <>
          <ActionButton label="Edit quote" />
          <ActionButton label="View in Approvals" onClick={() => navigate("/approvals")} />
        </>
      );
    }
    if (rejected) {
      return (
        <>
          <ActionButton label="Edit quote" />
          <ActionButton label="Resubmit for approval" />
        </>
      );
    }
    if (accepted) {
      return (
        <>
          <ActionButton label="Edit quote" />
          {quote.relatedContractId ? (
            <ActionButton
              label="Open contract"
              onClick={() => navigate(`/contracts/${quote.relatedContractId}`)}
            />
          ) : (
            <ActionButton label="Create contract" />
          )}
        </>
      );
    }
    if (sent) {
      return (
        <>
          <ActionButton label="Edit quote" />
          <ActionButton label="Send reminder" />
        </>
      );
    }
    if (draftLike) {
      return (
        <>
          <ActionButton label="Edit quote" />
          <ActionButton label="Submit for approval" />
        </>
      );
    }
    return (
      <>
        <ActionButton label="Edit quote" />
        <ActionButton label="Submit for approval" />
      </>
    );
  }, [navigate, quote]);

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
            <ActionButton icon={LayoutList} label="All quotes" onClick={onBack} />
          ) : undefined
        }
        actions={headerActions}
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
