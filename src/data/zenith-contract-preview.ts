import type { Contract } from "@/data/mock-data";
import { ZENITH_ANALYTICS_INC_ID } from "@/data/zenith-analytics-inc-seed";
import {
  zenithContractBillingInfo,
  zenithSummaryLineItems,
} from "@/data/zenith-contract-summary";

function lineItemSku(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

/** Contract document mock aligned with Zenith ingest summary tab extract. */
export function buildZenithIngestPreviewContract(): Contract {
  const tcv = zenithSummaryLineItems.reduce((sum, line) => sum + line.totalPrice, 0);
  const startDate = "2026-07-15";
  const endDate = "2027-07-14";

  return {
    id: "CON-INGEST-ZENITH-NB",
    customerId: ZENITH_ANALYTICS_INC_ID,
    sourceQuoteId: "",
    status: "Pending Review",
    signedDate: "2026-05-28",
    effectiveDate: startDate,
    term: zenithContractBillingInfo.term,
    endDate,
    tcv,
    minAnnualCommit: tcv,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    renewalDate: endDate,
    products: zenithSummaryLineItems.map((line) => ({
      sku: lineItemSku(line.name),
      name: line.name,
      type: line.frequency.toLowerCase().includes("one") ? "one-time" : "recurring",
      quantity: line.quantity || 1,
      unitPrice: line.unitPrice,
      discountApplied: 0,
      minimumCommit: 0,
      prepaidCredits: 0,
      overageRate: 0,
      billingCadence: line.frequency,
    })),
    enforcement: {
      sourceType: "Ingested PDF (Queue)",
      linkedQuoteId: "",
      saleOrderStatus: "Pending",
      enforcementStatus: "Pending",
      productMappingIssues: [],
      missingFields: [],
      provisioningStatus: "Pending activation",
      entitlementStatus: "Pending review",
      manualOverrides: [],
      blockingIssues: [],
    },
    billingSchedule: [{ date: startDate, amount: tcv, status: "Scheduled" }],
    amendments: [],
    invoicesGenerated: 0,
    creditNotes: 0,
    openAr: 0,
    paymentsReceived: 0,
    unappliedCash: 0,
    revRecSummary: { recognized: 0, deferred: tcv, status: "Not Started" },
    signedDocumentUrl: "#",
    ingestionTimestamp: new Date().toISOString(),
    extractionConfidence: 93,
    quoteMatchConfidence: 0,
    importantClauses: ["Annual billing upfront", "Net 30 payment terms"],
    comparisonToQuote: [],
    timeline: [
      {
        date: "2026-05-28",
        action: "Contract ingested",
        actor: "Alex Nguyen",
        detail: "ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
      },
    ],
    paymentTerms: zenithContractBillingInfo.paymentTerms,
    billingFrequency: zenithContractBillingInfo.billingCycle,
    coTermBehavior: "N/A",
    owner: "Alex Nguyen",
  };
}
