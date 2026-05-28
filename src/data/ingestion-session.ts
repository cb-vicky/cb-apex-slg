import type { Contract, Invoice, ContractProduct, ContractEnforcement, ContractDifference, InvoiceScheduleItem, Amendment } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";

export function buildSessionContractFromIngestion(
  extracted: ExtractedContract,
  customerId: string,
): Contract {
  const timestamp = Date.now().toString().slice(-4);
  const contractId = `CON-2026-${timestamp}`;
  const today = new Date().toISOString().slice(0, 10);

  const products: ContractProduct[] = extracted.products.map((p) => ({
    sku: p.catalogSku || p.extractedSku,
    name: p.extractedName,
    type: (p.billingModel.includes("One-time")
      ? "one-time"
      : p.billingModel.includes("Prepaid")
        ? "usage"
        : "recurring") as "recurring" | "one-time" | "usage",
    quantity: p.quantity,
    unitPrice: p.unitPrice,
    discountApplied: p.discount,
    minimumCommit: 0,
    prepaidCredits: 0,
    overageRate: 0,
    billingCadence: p.billingModel.includes("Annual") ? "Annual" : "Monthly",
  }));

  const enforcement: ContractEnforcement = {
    sourceType: "Ingested",
    linkedQuoteId: extracted.quoteMatchId || "",
    saleOrderStatus: "Pending",
    enforcementStatus: "Active",
    productMappingIssues: [],
    missingFields: [],
    provisioningStatus: "Pending",
    entitlementStatus: "Pending",
    manualOverrides: [],
    blockingIssues: [],
  };

  const billingSchedule: InvoiceScheduleItem[] = [{
    date: extracted.terms.startDate,
    amount: extracted.terms.tcv,
    status: "Draft",
    invoiceId: undefined,
  }];

  const amendments: Amendment[] = [];

  const comparisonToQuote: ContractDifference[] = [];

  const timeline = [{
    date: today,
    action: "Document Ingested",
    actor: "System",
    detail: "Contract document ingested from external source",
  }];

  return {
    id: contractId,
    customerId,
    sourceQuoteId: extracted.quoteMatchId || "",
    status: "Scheduled",
    signedDate: today,
    effectiveDate: extracted.terms.startDate,
    term: extracted.terms.term,
    endDate: extracted.terms.endDate,
    tcv: extracted.terms.tcv,
    minAnnualCommit: extracted.terms.minCommit,
    prepaidCreditBalance: extracted.terms.prepaidCredits,
    prepaidCreditTotal: extracted.terms.prepaidCredits,
    renewalDate: extracted.terms.endDate,
    products,
    enforcement,
    billingSchedule,
    amendments,
    invoicesGenerated: 0,
    creditNotes: 0,
    openAr: 0,
    paymentsReceived: 0,
    unappliedCash: 0,
    revRecSummary: { recognized: 0, deferred: extracted.terms.tcv, status: "Deferred" },
    signedDocumentUrl: `/documents/${extracted.documents[0]?.id || "unknown"}`,
    ingestionTimestamp: new Date().toISOString(),
    extractionConfidence: 0.95,
    quoteMatchConfidence: extracted.quoteMatchId ? 0.92 : 0,
    importantClauses: extracted.additionalInfo.clauses.map(c => c.title),
    comparisonToQuote,
    timeline,
    paymentTerms: extracted.terms.paymentTerms,
    billingFrequency: extracted.terms.billingFrequency,
    coTermBehavior: "Align",
    owner: "System",
  };
}

export function buildSessionInvoiceFromIngestion(
  extracted: ExtractedContract,
  customerId: string,
  contractId: string,
): Invoice {
  const timestamp = Date.now().toString().slice(-4);
  const invoiceId = `INV-2026-${timestamp}`;

  const lineItems = extracted.products.map((p) => ({
    description: `${p.extractedName} (${p.quantity} × $${p.unitPrice.toLocaleString()})`,
    amount: p.quantity * p.unitPrice * (1 - p.discount / 100),
  }));

  const total = lineItems.reduce((sum, line) => sum + line.amount, 0);

  return {
    id: invoiceId,
    customerId,
    contractId,
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "Draft",
    amount: total,
    lineItems,
    owner: "System",
  };
}
