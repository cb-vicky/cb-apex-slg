import type { IngestionSectionId } from "@/context/ingest-context-core";
import type {
  ZenithContractActiveTab,
  ZenithContractContentTab,
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
  "contract-pdf": "contract-preview",
  "sow-pdf": "pdf-doc-zenith-2",
};

/** Map ingestion PDF sub-tab ids to Zenith document tab ids. */
const PDF_DOC_TO_ZENITH: Record<string, ZenithContractActiveTab> = {
  "doc-zenith-1": "contract-pdf",
  "doc-zenith-2": "sow-pdf",
};

export function ingestionSubToZenithTab(sub: IngestionSubTab): ZenithContractActiveTab {
  if (sub === "contract-preview") return "contract-pdf";
  if (sub === "invoice-preview") return "Invoice Preview";
  if (sub.startsWith("pdf-")) {
    const docId = sub.slice(4);
    return PDF_DOC_TO_ZENITH[docId] ?? "contract-pdf";
  }
  return CONTENT_TO_ZENITH[sub as IngestionSectionId] ?? "Summary";
}

export function zenithTabToIngestionSub(tab: ZenithContractActiveTab): IngestionSubTab {
  return ZENITH_TO_INGESTION_SUB[tab] ?? "summary";
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
