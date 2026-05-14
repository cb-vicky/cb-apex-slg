import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Quote } from "@/data/mock-data";
import { RecordHeader, type OverflowItem } from "../RecordHeader";
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
}

export function QuoteStageContent({ quote, quoteVersions }: Props) {
  const navigate = useNavigate();

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

  const overflowItems = useMemo<OverflowItem[]>(() => {
    const items: OverflowItem[] = [];
    if (quoteVersions && quoteVersions.length > 1) {
      items.push({ label: "Compare versions" });
    }
    items.push({ label: "Duplicate quote" });
    items.push({ label: "Download PDF" });
    if (quote.status !== "Cancelled" && quote.status !== "Accepted") {
      items.push({ label: "Cancel quote", destructive: true });
    }
    return items;
  }, [quote.status, quoteVersions]);

  return (
    <div className="flex flex-col gap-3">
      <RecordHeader actions={headerActions} overflowItems={overflowItems} />
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
