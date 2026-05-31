import type { Contract, Invoice, ContractProduct } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildSessionContractFromIngestion(
  extracted: ExtractedContract,
  customerId: string
): Contract {
  const now = new Date().toISOString();
  const contractId = generateId("CTR-INGEST");

  const products: ContractProduct[] = extracted.products.map((p) => ({
    sku: p.catalogSku || p.extractedSku,
    name: p.extractedName,
    type: p.billingModel.includes("Prepaid") ? "one-time" : "recurring",
    quantity: p.quantity,
    unitPrice: p.unitPrice,
    discountApplied: p.discount,
    minimumCommit: 0,
    prepaidCredits: 0,
    overageRate: 0,
    billingCadence: p.billingModel,
  }));

  return {
    id: contractId,
    customerId,
    sourceQuoteId: extracted.quoteMatchId || "",
    status: "Scheduled",
    signedDate: now.slice(0, 10),
    effectiveDate: extracted.terms.startDate,
    term: extracted.terms.term,
    endDate: extracted.terms.endDate,
    tcv: extracted.terms.tcv,
    minAnnualCommit: extracted.terms.minCommit,
    prepaidCreditBalance: extracted.terms.prepaidCredits,
    prepaidCreditTotal: extracted.terms.prepaidCredits,
    renewalDate: extracted.terms.endDate,
    products,
    enforcement: {
      sourceType: "Contract Ingestion",
      linkedQuoteId: extracted.quoteMatchId || "",
      saleOrderStatus: "Pending",
      enforcementStatus: "Pending",
      productMappingIssues: [],
      missingFields: [],
      provisioningStatus: "Not Started",
      entitlementStatus: "Pending",
      manualOverrides: [],
      blockingIssues: [],
    },
    billingSchedule: [],
    amendments: [],
    invoicesGenerated: 0,
    creditNotes: 0,
    openAr: 0,
    paymentsReceived: 0,
    unappliedCash: 0,
    revRecSummary: { recognized: 0, deferred: extracted.terms.tcv, status: "Not Started" },
    signedDocumentUrl: "",
    ingestionTimestamp: now,
    extractionConfidence: extracted.extractionConfidence,
    quoteMatchConfidence: extracted.quoteMatchConfidence || 0,
    importantClauses: [],
    comparisonToQuote: [],
    timeline: [
      {
        date: now,
        action: "Contract ingested",
        actor: "System",
        detail: `Created from ${extracted.documentName}`,
      },
    ],
    paymentTerms: extracted.terms.paymentTerms,
    billingFrequency: extracted.terms.billingFrequency,
    coTermBehavior: "Standard",
    owner: "Alex Nguyen",
  };
}

export function buildSessionInvoiceFromIngestion(
  extracted: ExtractedContract,
  customerId: string,
  contractId: string
): Invoice {
  const invoiceId = generateId("INV-INGEST");
  const now = new Date();
  const dueDate = new Date(now);

  const paymentDays = extracted.terms.paymentTerms === "Net 30" ? 30 : 45;
  dueDate.setDate(dueDate.getDate() + paymentDays);

  const lineItems = extracted.products.map((p) => ({
    description: p.extractedName,
    amount: p.quantity * p.unitPrice * (1 - p.discount / 100),
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  return {
    id: invoiceId,
    customerId,
    contractId,
    date: now.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    amount: total,
    status: "Draft",
    lineItems,
    owner: "Alex Nguyen",
  };
}
