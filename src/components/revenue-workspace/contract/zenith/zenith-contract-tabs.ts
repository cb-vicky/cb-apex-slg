export const ZENITH_CONTRACT_CONTENT_TABS = [
  "Summary",
  "Items",
  "Billing info",
  "Addresses",
] as const;

export type ZenithContractContentTab = (typeof ZENITH_CONTRACT_CONTENT_TABS)[number];

export const ZENITH_CONTRACT_DOCUMENT_TABS = [
  {
    id: "contract-pdf",
    label: "ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
  },
  { id: "sow-pdf", label: "Sow.pdf" },
] as const;

export type ZenithContractDocumentTabId = (typeof ZENITH_CONTRACT_DOCUMENT_TABS)[number]["id"];

export type ZenithContractActiveTab = ZenithContractContentTab | ZenithContractDocumentTabId;

export function isZenithContractContentTab(tab: ZenithContractActiveTab): tab is ZenithContractContentTab {
  return (ZENITH_CONTRACT_CONTENT_TABS as readonly string[]).includes(tab);
}

/** Scroll past this (px) to condense Zenith contract chrome. */
export const ZENITH_CONTRACT_SCROLL_COLLAPSE_AT = 80;
/** Scroll above this (px) to expand again. Near-zero so expansion only happens at true top. */
export const ZENITH_CONTRACT_SCROLL_EXPAND_AT = 8;
