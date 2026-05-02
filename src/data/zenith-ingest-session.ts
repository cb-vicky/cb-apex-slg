import type { Contract, Customer, Invoice } from "@/data/mock-data";

const ZENITH_ID = "cust_zenith_006";
const CONTRACT_ID = "CON-INGEST-002";
const INVOICE_ID = "INV-INGEST-002";

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildZenithSessionInvoice(input: {
  id?: string;
  customerId: string;
  contractId: string;
  date: string;
  amount: number;
  status: string;
}): Invoice {
  return {
    id: input.id ?? INVOICE_ID,
    customerId: input.customerId,
    contractId: input.contractId,
    date: input.date,
    dueDate: addDaysIso(input.date, 30),
    amount: input.amount,
    status: input.status,
    lineItems: [
      { description: "Apex Analytics Pro – 200 seats × $60/seat (Annual)", amount: 144000 },
      { description: "Premium Support (Annual)", amount: 11000 },
    ],
    owner: "Alex Nguyen",
  };
}

/** Session customer created at ingest (not in seed until operator completes ingest). */
export function buildZenithSessionCustomer(input: {
  name: string;
  billingLegalEntity: string;
  domain: string;
}): Customer {
  return {
    id: ZENITH_ID,
    name: input.name,
    commercialAccount: `${input.name} – North America`,
    billingLegalEntity: input.billingLegalEntity,
    chargebeeEntity: "Chargebee US – Acme Merchant",
    segment: "Mid-Market",
    tier: "Tier 2",
    ae: "Jordan Kim",
    csm: "Rachel Torres",
    billingOwner: "Alex Nguyen",
    arr: 155000,
    tcv: 155000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    openAr: 155000,
    nextRenewalDate: "2027-04-30",
    riskBadges: [],
    createdAt: new Date().toISOString().slice(0, 10),
    domain: input.domain,
    industry: "AI Analytics",
    region: "North America",
    crmAccountId: "",
    crmSyncStatus: "Not synced",
    crmLastSyncedAt: "",
    paymentMethod: "Wire",
    currency: "USD",
    taxRegion: "US – New York",
    poRequired: false,
    activeContractCount: 0,
    openQuoteCount: 0,
  };
}

export function buildZenithScheduledContract(params: {
  contractId?: string;
  customerId?: string;
  invoiceId?: string;
  startDate: string;
  endDate: string;
  billingFrequency: string;
}): Contract {
  const invId = params.invoiceId ?? INVOICE_ID;
  return {
    id: params.contractId ?? CONTRACT_ID,
    customerId: params.customerId ?? ZENITH_ID,
    sourceQuoteId: "",
    status: "Scheduled",
    signedDate: params.startDate,
    effectiveDate: params.startDate,
    term: "12 months",
    endDate: params.endDate,
    tcv: 155000,
    minAnnualCommit: 144000,
    prepaidCreditBalance: 0,
    prepaidCreditTotal: 0,
    renewalDate: params.endDate,
    products: [
      {
        sku: "APEX-ANALYTICS-PRO",
        name: "Apex Analytics Pro",
        type: "recurring",
        quantity: 200,
        unitPrice: 60,
        discountApplied: 0,
        minimumCommit: 144000,
        prepaidCredits: 0,
        overageRate: 0,
        billingCadence: "Annual upfront",
      },
      {
        sku: "APEX-SUPPORT",
        name: "Premium Support",
        type: "recurring",
        quantity: 1,
        unitPrice: 11000,
        discountApplied: 0,
        minimumCommit: 0,
        prepaidCredits: 0,
        overageRate: 0,
        billingCadence: "Annual upfront",
      },
    ],
    enforcement: {
      sourceType: "Ingested PDF (Queue)",
      linkedQuoteId: "",
      saleOrderStatus: "Pending",
      enforcementStatus: "Pending",
      productMappingIssues: [],
      missingFields: [],
      provisioningStatus: "Scheduled — activates after invoice approval",
      entitlementStatus: "Pending activation",
      manualOverrides: [],
      blockingIssues: [],
    },
    billingSchedule: [{ date: params.startDate, amount: 155000, status: "Scheduled", invoiceId: invId }],
    amendments: [],
    invoicesGenerated: 1,
    creditNotes: 0,
    openAr: 155000,
    paymentsReceived: 0,
    unappliedCash: 0,
    revRecSummary: { recognized: 0, deferred: 155000, status: "Not Started" },
    signedDocumentUrl: "#",
    ingestionTimestamp: new Date().toISOString(),
    extractionConfidence: 91,
    quoteMatchConfidence: 0,
    importantClauses: ["Annual billing upfront"],
    comparisonToQuote: [],
    timeline: [
      {
        date: new Date().toISOString().slice(0, 10),
        action: "Contract ingested",
        actor: "Alex Nguyen",
        detail: "Scheduled pending invoice approval",
      },
    ],
    paymentTerms: "Net 30",
    billingFrequency: params.billingFrequency,
    coTermBehavior: "N/A",
    owner: "Alex Nguyen",
  };
}

export function buildZenithActiveContractAfterApproval(
  scheduled: Contract,
): Contract {
  return {
    ...scheduled,
    status: "Active",
    enforcement: {
      ...scheduled.enforcement,
      saleOrderStatus: "Completed",
      enforcementStatus: "Enforced",
      provisioningStatus: "Active",
      entitlementStatus: "Active",
      blockingIssues: [],
    },
    billingSchedule: scheduled.billingSchedule.map((row) => ({
      ...row,
      status: "Paid",
    })),
    openAr: 0,
    paymentsReceived: 155000,
    revRecSummary: { recognized: 38750, deferred: 116250, status: "In progress" },
    timeline: [
      ...scheduled.timeline,
      {
        date: new Date().toISOString().slice(0, 10),
        action: "Invoice approved — contract activated",
        actor: "Sarah Chen, VP Revenue",
        detail: "Payment received (mock)",
      },
    ],
  };
}

export function buildZenithCustomerAfterApproval(c: Customer): Customer {
  return {
    ...c,
    activeContractCount: 1,
    openAr: 0,
  };
}

/**
 * If a session contract is still Scheduled and its billing schedule references this invoice,
 * promote it to Active (first-invoice approval path after queue ingest).
 */
export function activateScheduledContractAfterInvoiceApproval(opts: {
  invoiceId: string;
  invoiceAmount: number;
  sessionContracts: Contract[];
  sessionCustomers: Customer[];
  seedCustomers: Customer[];
  addSessionContract: (c: Contract) => void;
  addSessionCustomer: (c: Customer) => void;
  setInvoicePaid: () => void;
}): boolean {
  const sched = opts.sessionContracts.find(
    (c) =>
      c.status === "Scheduled" &&
      c.billingSchedule.some((b) => b.invoiceId === opts.invoiceId),
  );
  if (!sched) return false;
  opts.addSessionContract(buildZenithActiveContractAfterApproval(sched));
  opts.setInvoicePaid();
  const cid = sched.customerId;
  const cust =
    opts.sessionCustomers.find((c) => c.id === cid) ?? opts.seedCustomers.find((c) => c.id === cid);
  if (cust) {
    if (cust.id === ZENITH_ID) {
      opts.addSessionCustomer(buildZenithCustomerAfterApproval(cust));
    } else {
      opts.addSessionCustomer({
        ...cust,
        activeContractCount: (cust.activeContractCount ?? 0) + 1,
        openAr: Math.max(0, (cust.openAr ?? 0) - opts.invoiceAmount),
      });
    }
  }
  return true;
}

export {
  ZENITH_ID as ZENITH_CUSTOMER_ID,
  CONTRACT_ID as ZENITH_CONTRACT_ID,
  INVOICE_ID as ZENITH_INVOICE_ID,
};
