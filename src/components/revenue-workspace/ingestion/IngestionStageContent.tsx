import { useMemo } from "react";
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
import { IngestionPdfPreview } from "./IngestionPdfPreview";
import { IngestionContractPreview } from "./IngestionContractPreview";
import { IngestionInvoicePreview } from "./IngestionInvoicePreview";

interface Props {
  session: IngestionSession;
  customer: Customer;
}

type Frame1Sub = "summary" | "items" | "billing" | "addresses" | "additional" | `pdf-${string}`;
type Frame2Sub = "contract-preview" | "invoice-preview";

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
    !!s && (s.startsWith("pdf-") || (VALID_FRAME1_SECTIONS as string[]).includes(s));
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

  function handleMarkSectionDone(section: IngestionSectionId) {
    setIngestionSectionState(session.queueItemId, section, "done");
  }

  function navigateToSub(newSub: string, newFrame?: "1" | "2") {
    const params = new URLSearchParams(searchParams);
    params.set("sub", newSub);
    if (newFrame) params.set("frame", newFrame);
    setSearchParams(params);
  }

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

  if (frame1Sub.startsWith("pdf-")) {
    const docId = frame1Sub.replace("pdf-", "");
    const doc = extracted.documents.find((d) => d.id === docId);
    if (doc) {
      return (
        <>
          <IngestionActions session={session} customerId={customer.id} />
          <IngestionPdfPreview
            document={doc}
            onBack={() => navigateToSub("summary")}
          />
        </>
      );
    }
  }

  return (
    <div className="space-y-6">
      <IngestionActions session={session} customerId={customer.id} />

      {frame1Sub === "summary" && (
        <IngestionSummarySection
          extracted={extracted}
          sectionState={session.sections.summary}
          onMarkDone={() => handleMarkSectionDone("summary")}
        />
      )}

      {frame1Sub === "items" && (
        <IngestionItemsSection
          extracted={extracted}
          sectionState={session.sections.items}
          onMarkDone={() => handleMarkSectionDone("items")}
        />
      )}

      {frame1Sub === "billing" && (
        <IngestionBillingSection
          extracted={extracted}
          sectionState={session.sections.billing}
          onMarkDone={() => handleMarkSectionDone("billing")}
        />
      )}

      {frame1Sub === "addresses" && (
        <IngestionAddressesSection
          extracted={extracted}
          sectionState={session.sections.addresses}
          onMarkDone={() => handleMarkSectionDone("addresses")}
        />
      )}

      {frame1Sub === "additional" && (
        <IngestionAdditionalInfoSection
          extracted={extracted}
          sectionState={session.sections.additional}
          onMarkDone={() => handleMarkSectionDone("additional")}
        />
      )}
    </div>
  );
}
