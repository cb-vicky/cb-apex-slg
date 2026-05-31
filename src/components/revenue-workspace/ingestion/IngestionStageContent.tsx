import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { Customer } from "@/data/mock-data";
import { getExtractedContract } from "@/data/ingest-data";
import type { IngestionSession, IngestionSectionId } from "@/context/ingest-context-core";
import { useIngestContext } from "@/context/IngestContext";
import { IngestionActions } from "./IngestionActions";
import { IngestionSummarySection } from "./IngestionSummarySection";
import { IngestionItemsSection } from "./IngestionItemsSection";
import { IngestionBillingSection } from "./IngestionBillingSection";
import { IngestionAddressesSection } from "./IngestionAddressesSection";
import { IngestionAdditionalInfoSection } from "./IngestionAdditionalInfoSection";
import { IngestionContractPreview } from "./IngestionContractPreview";
import { IngestionInvoicePreview } from "./IngestionInvoicePreview";

interface Props {
  session: IngestionSession;
  customer: Customer;
}

type Frame1Sub = "summary" | "items" | "billing" | "addresses" | "additional";
type Frame2Sub = "contract-preview" | "invoice-preview";

const SECTION_ORDER: IngestionSectionId[] = ["summary", "items", "billing", "addresses", "additional"];

export function IngestionStageContent({ session, customer }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setIngestionSectionState } = useIngestContext();

  const frame = (searchParams.get("frame") || "1") as "1" | "2";
  const rawSub = searchParams.get("sub");

  // Normalize sub for the active frame so transitions never land on an out-of-frame
  // value (e.g. switching from `?frame=2&sub=contract-preview` back to frame 1).
  const VALID_FRAME1_SECTIONS: IngestionSectionId[] = [
    "summary",
    "items",
    "billing",
    "addresses",
    "additional",
  ];
  const isValidFrame1 = (s: string | null) =>
    !!s && (VALID_FRAME1_SECTIONS as string[]).includes(s);
  const isValidFrame2 = (s: string | null) =>
    s === "contract-preview" || s === "invoice-preview";

  const sub =
    frame === "1"
      ? isValidFrame1(rawSub)
        ? rawSub!
        : "summary"
      : isValidFrame2(rawSub)
        ? rawSub!
        : "contract-preview";

  const extracted = useMemo(() => getExtractedContract(session.sampleId), [session.sampleId]);

  function navigateToSub(newSub: string, newFrame?: "1" | "2") {
    const params = new URLSearchParams(searchParams);
    params.set("sub", newSub);
    if (newFrame) params.set("frame", newFrame);
    setSearchParams(params);
  }

  const handleMarkSectionDoneAndNavigate = useCallback(
    (section: IngestionSectionId) => {
      setIngestionSectionState(session.queueItemId, section, "done");
      
      const currentIndex = SECTION_ORDER.indexOf(section);
      if (currentIndex === -1) return;

      if (currentIndex < SECTION_ORDER.length - 1) {
        const nextSection = SECTION_ORDER[currentIndex + 1];
        const params = new URLSearchParams(searchParams);
        params.set("sub", nextSection);
        setSearchParams(params);
      } else {
        const params = new URLSearchParams(searchParams);
        params.set("frame", "2");
        params.set("sub", "invoice-preview");
        setSearchParams(params);
      }
    },
    [session.queueItemId, searchParams, setSearchParams, setIngestionSectionState]
  );

  if (frame === "2") {
    const frame2Sub = sub as Frame2Sub;
    
    if (frame2Sub === "contract-preview") {
      return (
        <>
          <IngestionActions session={session} customerId={customer.id} />
          <IngestionContractPreview
            session={session}
            customer={customer}
            extracted={extracted}
            onSwitchToInvoice={() => navigateToSub("invoice-preview")}
          />
        </>
      );
    }

    if (frame2Sub === "invoice-preview") {
      return (
        <>
          <IngestionActions session={session} customerId={customer.id} />
          <IngestionInvoicePreview
            session={session}
            customer={customer}
            extracted={extracted}
            onSwitchToContract={() => navigateToSub("contract-preview")}
          />
        </>
      );
    }
  }

  const frame1Sub = sub as Frame1Sub;

  return (
    <div className="space-y-6">
      <IngestionActions session={session} customerId={customer.id} />

      {frame1Sub === "summary" && (
        <IngestionSummarySection
          extracted={extracted}
          sectionState={session.sections.summary}
          onMarkDone={() => handleMarkSectionDoneAndNavigate("summary")}
        />
      )}

      {frame1Sub === "items" && (
        <IngestionItemsSection
          extracted={extracted}
          sectionState={session.sections.items}
          onMarkDone={() => handleMarkSectionDoneAndNavigate("items")}
        />
      )}

      {frame1Sub === "billing" && (
        <IngestionBillingSection
          extracted={extracted}
          sectionState={session.sections.billing}
          onMarkDone={() => handleMarkSectionDoneAndNavigate("billing")}
        />
      )}

      {frame1Sub === "addresses" && (
        <IngestionAddressesSection
          extracted={extracted}
          sectionState={session.sections.addresses}
          onMarkDone={() => handleMarkSectionDoneAndNavigate("addresses")}
        />
      )}

      {frame1Sub === "additional" && (
        <IngestionAdditionalInfoSection
          extracted={extracted}
          sectionState={session.sections.additional}
          onMarkDone={() => handleMarkSectionDoneAndNavigate("additional")}
        />
      )}
    </div>
  );
}
