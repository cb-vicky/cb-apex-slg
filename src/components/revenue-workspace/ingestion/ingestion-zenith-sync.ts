import type { IngestionSectionId } from "@/context/ingest-context-core";
import type { ExtractedDocument } from "@/data/ingest-data";
import type {
  ZenithContractActiveTab,
  ZenithContractContentTab,
  ZenithContractDocumentTabId,
} from "../contract/zenith/zenith-contract-tabs";

export type IngestionSubTab =
  | IngestionSectionId
  | `pdf-${string}`
  | "contract-preview"
  | "invoice-preview";

const CONTENT_TO_ZENITH: Record<IngestionSectionId, ZenithContractContentTab> = {
  summary: "Summary",
  items: "Items",
  billing: "Billing info",
  addresses: "Addresses",
  additional: "Addresses",
};

const ZENITH_TO_INGESTION_SUB: Partial<Record<ZenithContractActiveTab, IngestionSubTab>> = {
  Summary: "summary",
  Items: "items",
  "Billing info": "billing",
  Addresses: "addresses",
  "Invoice Preview": "invoice-preview",
};

/** Zenith document tab IDs — first doc is contract-pdf, second is sow-pdf */
const ZENITH_DOC_TABS: ZenithContractDocumentTabId[] = ["contract-pdf", "sow-pdf"];

/**
 * Map a document ID from ExtractedContract.documents to a Zenith document tab ID.
 * Uses index-based mapping: first document → contract-pdf, second → sow-pdf.
 */
export function docIdToZenithDocTab(
  docId: string,
  documents: ExtractedDocument[],
): ZenithContractDocumentTabId {
  const idx = documents.findIndex((d) => d.id === docId);
  if (idx >= 0 && idx < ZENITH_DOC_TABS.length) {
    return ZENITH_DOC_TABS[idx];
  }
  return "contract-pdf";
}

/**
 * Map a Zenith document tab ID back to the corresponding document ID.
 */
export function zenithDocTabToDocId(
  zenithTab: ZenithContractDocumentTabId,
  documents: ExtractedDocument[],
): string | undefined {
  const idx = ZENITH_DOC_TABS.indexOf(zenithTab);
  if (idx >= 0 && idx < documents.length) {
    return documents[idx].id;
  }
  return documents[0]?.id;
}

export function ingestionSubToZenithTab(
  sub: IngestionSubTab,
  documents?: ExtractedDocument[],
): ZenithContractActiveTab {
  if (sub === "contract-preview") return "contract-pdf";
  if (sub === "invoice-preview") return "Invoice Preview";
  if (sub.startsWith("pdf-")) {
    const docId = sub.slice(4);
    if (documents) {
      return docIdToZenithDocTab(docId, documents);
    }
    return "contract-pdf";
  }
  return CONTENT_TO_ZENITH[sub as IngestionSectionId] ?? "Summary";
}

export function zenithTabToIngestionSub(
  tab: ZenithContractActiveTab,
  documents?: ExtractedDocument[],
): IngestionSubTab {
  const staticMapping = ZENITH_TO_INGESTION_SUB[tab];
  if (staticMapping) return staticMapping;
  
  // Handle document tabs
  if (tab === "contract-pdf" || tab === "sow-pdf") {
    if (documents) {
      const docId = zenithDocTabToDocId(tab, documents);
      if (docId) return `pdf-${docId}`;
    }
    return "pdf-doc-1";
  }
  
  return "summary";
}

export function isZenithBackedIngestionSub(sub: IngestionSubTab): boolean {
  return sub !== "additional";
}

export function zenithContentTabForIngestionSub(
  sub: IngestionSubTab,
): ZenithContractContentTab | null {
  if (sub === "invoice-preview") return "Invoice Preview";
  if (sub.startsWith("pdf-") || sub === "contract-preview") return null;
  if (sub === "additional") return null;
  return CONTENT_TO_ZENITH[sub as IngestionSectionId] ?? null;
}

export function zenithContentTabForIngestionSection(
  section: IngestionSectionId,
): ZenithContractContentTab | null {
  if (section === "additional") return null;
  return CONTENT_TO_ZENITH[section];
}

export function ingestionFrameForSub(sub: IngestionSubTab): "1" | "2" {
  if (sub === "contract-preview") return "2";
  return "1";
}
