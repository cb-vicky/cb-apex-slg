// ---------------------------------------------------------------------------
// TYPES — Contract Ingestion + Approvals
// ---------------------------------------------------------------------------

export interface SampleDoc {
  id: "sample2" | "sample3" | "sample4";
  label: string;
  subtitle: string;
  path: "happy" | "exception";
  documentName: string;
}

export interface ExtractedProduct {
  extractedName: string;
  extractedSku: string;
  catalogSku?: string;           // null if not matched
  matched: boolean;
  quantity: number;
  unitPrice: number;
  discount: number;
  billingModel: string;
}

export interface ExtractedTerms {
  term: string;
  startDate: string;
  endDate: string;
  billingFrequency: string;
  paymentTerms: string;
  tcv: number;
  arr: number;
  minCommit: number;
  prepaidCredits: number;
  autoRenew: boolean;
}

export interface IngestIssue {
  id: string;
  type: "customer_not_found" | "product_mismatch" | "missing_field" | "quote_mismatch";
  severity: "blocking" | "warning";
  message: string;
  detail?: string;
}

export interface ExtractedSectionIssues {
  summary?: string;
  items?: string;
  billing?: string;
  addresses?: string;
  additional?: string;
}

export interface ExtractedContract {
  docId: "sample1" | "sample2" | "sample3" | "sample4";
  documentName: string;
  extractedAt: string;
  extractionConfidence: number;
  customerName: string;
  customerLegalEntity: string;
  /** Signatory / billing contact parsed from the agreement (when available). */
  primaryContactName?: string;
  primaryContactEmail?: string;
  customerId?: string;           // set if matched
  customerFound: boolean;
  quoteMatchId?: string;         // set if matched
  quoteMatchConfidence?: number;
  products: ExtractedProduct[];
  terms: ExtractedTerms;
  issues: IngestIssue[];
  /** Per-section issues for workspace ingestion review */
  sectionIssues: ExtractedSectionIssues;
}

export interface CreatedObject {
  type: "contract" | "invoice" | "customer" | "product" | "quote";
  id: string;
  label: string;
  action: "created" | "linked" | "reused";
}

export interface IngestResult {
  docId: "sample1" | "sample2" | "sample3" | "sample4";
  contractId: string;
  customerId: string;
  invoiceId: string;
  linkedQuoteId?: string;
  createdObjects: CreatedObject[];
}

export interface ApprovalComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceAmount: number;
  invoiceDate: string;
  status: "Pending Approval" | "Approved" | "Rejected";
  submittedBy: string;
  submittedAt: string;
  approver: string;
  comments: ApprovalComment[];
  /** Queue item id when this approval was created from a finished ingest (drives `?ingestId=` + policy modal). */
  ingestId?: string;
}

// ---------------------------------------------------------------------------
// SAMPLE DOCUMENTS
// ---------------------------------------------------------------------------

export const sampleDocs: SampleDoc[] = [
  {
    id: "sample2",
    label: "Zenith Analytics — New Business",
    subtitle: "Exception path: new customer + unmapped product",
    path: "exception",
    documentName: "ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
  },
  {
    id: "sample3",
    label: "Verdant Health — Early Renewal",
    subtitle: "Early renewal path: active contract requires closure before ingestion",
    path: "happy",
    documentName: "VerdantHealth_EarlyRenewal_2026.pdf",
  },
];

// ---------------------------------------------------------------------------
// EXTRACTED CONTRACT DATA — Sample 1 (happy path)
// ---------------------------------------------------------------------------

export const extractedSample1: ExtractedContract = {
  docId: "sample1",
  documentName: "EchoCorp_MSA_Renewal_2026_Signed.pdf",
  extractedAt: "2026-04-17T09:15:00Z",
  extractionConfidence: 97,
  customerName: "Echo Corp",
  customerLegalEntity: "Echo Corp Inc.",
  customerId: "cust_echo_001",
  customerFound: true,
  quoteMatchId: "QT-2026-0042",
  quoteMatchConfidence: 94,
  products: [
    {
      extractedName: "Apex Platform – Enterprise",
      extractedSku: "APEX-PLATFORM",
      catalogSku: "APEX-PLATFORM",
      matched: true,
      quantity: 400,
      unitPrice: 45,
      discount: 18,
      billingModel: "Per seat / month",
    },
    {
      extractedName: "AI Agent Credits – Prepaid Block",
      extractedSku: "APEX-AI-CREDITS",
      catalogSku: "APEX-AI-CREDITS",
      matched: true,
      quantity: 1,
      unitPrice: 120000,
      discount: 0,
      billingModel: "Prepaid drawdown",
    },
    {
      extractedName: "AI Agent Credits – Overage",
      extractedSku: "APEX-AI-OVERAGE",
      catalogSku: "APEX-AI-OVERAGE",
      matched: true,
      quantity: 0,
      unitPrice: 0.018,
      discount: 0,
      billingModel: "Per credit consumed",
    },
    {
      extractedName: "Premium Support – 24/7",
      extractedSku: "APEX-SUPPORT",
      catalogSku: "APEX-SUPPORT",
      matched: true,
      quantity: 1,
      unitPrice: 2500,
      discount: 0,
      billingModel: "Flat / month",
    },
  ],
  terms: {
    term: "24 months",
    startDate: "2026-05-01",
    endDate: "2028-04-30",
    billingFrequency: "Annual upfront",
    paymentTerms: "Net 45",
    tcv: 523600,
    arr: 261800,
    minCommit: 120000,
    prepaidCredits: 120000,
    autoRenew: true,
  },
  issues: [],
  sectionIssues: {},
};

// ---------------------------------------------------------------------------
// EXTRACTED CONTRACT DATA — Sample 2 (exception path)
// ---------------------------------------------------------------------------

export const extractedSample2: ExtractedContract = {
  docId: "sample2",
  documentName: "ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
  extractedAt: "2026-04-17T09:22:00Z",
  extractionConfidence: 91,
  customerName: "Zenith Analytics INC",
  customerLegalEntity: "Zenith Analytics INC",
  primaryContactName: "David Chen",
  primaryContactEmail: "d.chen@zenithanalytics.com",
  customerId: undefined,
  customerFound: false,
  quoteMatchId: undefined,
  quoteMatchConfidence: undefined,
  products: [
    {
      extractedName: "Apex Analytics Pro",
      extractedSku: "APEX-ANALYTICS-PRO",
      catalogSku: undefined,
      matched: false,
      quantity: 200,
      unitPrice: 65,
      discount: 10,
      billingModel: "Per seat / month",
    },
    {
      extractedName: "Premium Support",
      extractedSku: "APEX-SUPPORT",
      catalogSku: "APEX-SUPPORT",
      matched: true,
      quantity: 1,
      unitPrice: 2000,
      discount: 0,
      billingModel: "Flat / month",
    },
  ],
  terms: {
    term: "12 months",
    startDate: "2026-05-01",
    endDate: "2027-04-30",
    billingFrequency: "Annual upfront",
    paymentTerms: "Net 30",
    tcv: 155000,
    arr: 155000,
    minCommit: 130000,
    prepaidCredits: 0,
    autoRenew: false,
  },
  issues: [
    {
      id: "issue-customer",
      type: "customer_not_found",
      severity: "blocking",
      message: "Customer not found in system",
      detail: "\"Zenith Analytics INC\" does not match any existing customer record. Create a new customer to proceed.",
    },
    {
      id: "issue-product",
      type: "product_mismatch",
      severity: "blocking",
      message: "Product SKU not in catalog",
      detail: "\"APEX-ANALYTICS-PRO\" is not in the product catalog. Map to an existing plan or create a new one.",
    },
  ],
  sectionIssues: {
    summary: "Customer not found — create or match",
    items: "1 product needs SKU mapping",
  },
};

// ---------------------------------------------------------------------------
// EXTRACTED CONTRACT DATA — Sample 3 (Verdant Health Early Renewal)
// ---------------------------------------------------------------------------

export const extractedSample3: ExtractedContract = {
  docId: "sample3",
  documentName: "VerdantHealth_EarlyRenewal_2026.pdf",
  extractedAt: "2026-04-19T13:55:00Z",
  extractionConfidence: 95,
  customerName: "Verdant Health",
  customerLegalEntity: "Verdant Health Systems LLC",
  customerId: "cust_verdant_005",
  customerFound: true,
  quoteMatchId: undefined,
  quoteMatchConfidence: undefined,
  products: [
    {
      extractedName: "Apex Platform – Enterprise",
      extractedSku: "APEX-PLATFORM",
      catalogSku: "APEX-PLATFORM",
      matched: true,
      quantity: 200,
      unitPrice: 52,
      discount: 8,
      billingModel: "Per seat / month",
    },
    {
      extractedName: "AI Agent Credits – Prepaid Block",
      extractedSku: "APEX-AI-CREDITS",
      catalogSku: "APEX-AI-CREDITS",
      matched: true,
      quantity: 1,
      unitPrice: 40000,
      discount: 0,
      billingModel: "Prepaid drawdown",
    },
  ],
  terms: {
    term: "24 months",
    startDate: "2026-06-01",
    endDate: "2028-05-31",
    billingFrequency: "Annual upfront",
    paymentTerms: "Net 30",
    tcv: 348000,
    arr: 174000,
    minCommit: 160000,
    prepaidCredits: 40000,
    autoRenew: true,
  },
  issues: [],
  sectionIssues: {},
};

// ---------------------------------------------------------------------------
// EXTRACTED CONTRACT DATA — Sample 4 (Northlane Labs Late Renewal)
// ---------------------------------------------------------------------------

export const extractedSample4: ExtractedContract = {
  docId: "sample4",
  documentName: "NorthlaneLabs_LateRenewal_Commercial_2026.pdf",
  extractedAt: "2026-04-20T10:15:00Z",
  extractionConfidence: 96,
  customerName: "Northlane Labs",
  customerLegalEntity: "Northlane Labs Inc.",
  customerId: "cust_northlane_003",
  customerFound: true,
  quoteMatchId: undefined,
  quoteMatchConfidence: undefined,
  products: [
    {
      extractedName: "Apex Platform – Enterprise",
      extractedSku: "APEX-PLATFORM",
      catalogSku: "APEX-PLATFORM",
      matched: true,
      quantity: 350,
      unitPrice: 48,
      discount: 12,
      billingModel: "Per seat / month",
    },
    {
      extractedName: "AI Agent Credits – Prepaid Block",
      extractedSku: "APEX-AI-CREDITS",
      catalogSku: "APEX-AI-CREDITS",
      matched: true,
      quantity: 1,
      unitPrice: 85000,
      discount: 0,
      billingModel: "Prepaid drawdown",
    },
    {
      extractedName: "Premium Support – 24/7",
      extractedSku: "APEX-SUPPORT",
      catalogSku: "APEX-SUPPORT",
      matched: true,
      quantity: 1,
      unitPrice: 2200,
      discount: 0,
      billingModel: "Flat / month",
    },
  ],
  terms: {
    term: "12 months",
    startDate: "2026-06-01",
    endDate: "2027-05-31",
    billingFrequency: "Monthly",
    paymentTerms: "Net 30",
    tcv: 312000,
    arr: 312000,
    minCommit: 140000,
    prepaidCredits: 85000,
    autoRenew: true,
  },
  issues: [],
  sectionIssues: {},
};

// ---------------------------------------------------------------------------
// ANALYSIS LOADING MESSAGES
// ---------------------------------------------------------------------------

export const analysisMessages = [
  "Reading document structure...",
  "Extracting customer name and legal entity...",
  "Detecting contract term and pricing...",
  "Matching quote from system records...",
  "Validating product catalog mapping...",
  "Checking billing readiness...",
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function getExtractedContract(sampleId: "sample1" | "sample2" | "sample3" | "sample4"): ExtractedContract {
  if (sampleId === "sample1") return extractedSample1;
  if (sampleId === "sample3") return extractedSample3;
  if (sampleId === "sample4") return extractedSample4;
  return extractedSample2;
}

export function buildIngestResult(
  docId: "sample1" | "sample2" | "sample3" | "sample4",
  resolvedCustomerId: string,
  meta?: {
    customerLabel?: string;
    contractId?: string;
    invoiceId?: string;
    customerAction?: "created" | "reused";
  },
): IngestResult {
  if (docId === "sample1") {
    return {
      docId,
      contractId: "CON-2026-0190",
      customerId: "cust_echo_001",
      invoiceId: "INV-INGEST-001",
      linkedQuoteId: "QT-2026-0042",
      createdObjects: [
        { type: "contract", id: "CON-2026-0190", label: "Contract CON-2026-0190", action: "created" },
        { type: "quote", id: "QT-2026-0042", label: "Quote QT-2026-0042", action: "linked" },
        { type: "customer", id: "cust_echo_001", label: "Customer: Echo Corp", action: "reused" },
        { type: "product", id: "APEX-PLATFORM", label: "APEX-PLATFORM, APEX-AI-CREDITS, APEX-SUPPORT", action: "reused" },
      ],
    };
  }
  if (docId === "sample3") {
    return {
      docId,
      contractId: "CON-2026-0VH1",
      customerId: "cust_verdant_005",
      invoiceId: "",
      createdObjects: [
        { type: "customer", id: "cust_verdant_005", label: "Customer: Verdant Health", action: "reused" },
        { type: "product", id: "APEX-PLATFORM", label: "APEX-PLATFORM, APEX-AI-CREDITS", action: "reused" },
        { type: "contract", id: "CON-2026-0VH1", label: "Contract CON-2026-0VH1 (Scheduled)", action: "created" },
      ],
    };
  }
  if (docId === "sample4") {
    return {
      docId,
      contractId: "CON-2026-0NL1",
      customerId: "cust_northlane_003",
      invoiceId: "",
      createdObjects: [
        { type: "customer", id: "cust_northlane_003", label: "Customer: Northlane Labs", action: "reused" },
        { type: "product", id: "APEX-PLATFORM", label: "APEX-PLATFORM, APEX-AI-CREDITS, APEX-SUPPORT", action: "reused" },
        { type: "contract", id: "CON-2026-0NL1", label: "Contract CON-2026-0NL1 (Scheduled)", action: "created" },
      ],
    };
  }
  const label = meta?.customerLabel?.trim() || "New account";
  const contractId = meta?.contractId ?? "CON-INGEST-002";
  const invoiceId = meta?.invoiceId ?? "INV-INGEST-002";
  const customerAction = meta?.customerAction ?? "created";
  return {
    docId,
    contractId,
    customerId: resolvedCustomerId,
    invoiceId,
    createdObjects: [
      { type: "customer", id: resolvedCustomerId, label: `Customer: ${label}`, action: customerAction },
      { type: "product", id: "APEX-ANALYTICS-PRO", label: "Plan: APEX-ANALYTICS-PRO", action: "created" },
      { type: "contract", id: contractId, label: `Contract ${contractId}`, action: "created" },
    ],
  };
}

// ---------------------------------------------------------------------------
// SEED APPROVAL COMMENTS (shown in approval workspace by default)
// ---------------------------------------------------------------------------

export const seedApprovalComments: ApprovalComment[] = [
  {
    id: "ac-001",
    author: "Jordan Kim",
    role: "Account Executive",
    text: "Renewal contract ingested from signed MSA. Please review the annual commitment and confirm billing entity.",
    timestamp: "2026-04-17T09:30:00Z",
  },
  {
    id: "ac-002",
    author: "Priya Mehta",
    role: "CSM",
    text: "Customer confirmed the 400 seat expansion. Net 45 terms are non-standard — flagging for @Alex Nguyen to verify billing readiness.",
    timestamp: "2026-04-17T10:05:00Z",
  },
];
