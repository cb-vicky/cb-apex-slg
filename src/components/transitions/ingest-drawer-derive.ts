import type { ExtractedContract, IngestIssue } from "@/data/ingest-data";
import type { Customer } from "@/data/mock-data";
import { currency } from "@/lib/utils";
import { INGEST_DRAWER_NEW_CUSTOMER_ID } from "./ingest-drawer-constants";

// ---------------------------------------------------------------------------
// Billing / ingest drawer — shared derivation + validation
// ---------------------------------------------------------------------------

export type BillingKind = "prepaid" | "postpaid" | "hybrid";

export type DrawerValidationIssue = {
  id: string;
  severity: "blocking" | "warning";
  message: string;
  source: "extracted" | "business";
};

export type IngestDrawerFlags = {
  hasBlockingErrors: boolean;
  isComplexContract: boolean;
  isHybridDeal: boolean;
};

export type InvoicePlanLine = {
  label: string;
  detail: string;
};

/** Filter static extraction issues when the operator has resolved them in-session. */
export function filterResolvedExtractedIssues(
  extracted: ExtractedContract | null,
  customerId: string,
  customers: Customer[],
  sessionProductSkus: string[],
  opts?: { newCustomerComplete?: boolean; newCustomerAcknowledged?: boolean },
): IngestIssue[] {
  if (!extracted) return [];
  const hasCustomerNotFoundIssue = extracted.issues.some((i) => i.type === "customer_not_found");
  const newCustomerReady =
    Boolean(opts?.newCustomerComplete) &&
    (!hasCustomerNotFoundIssue || Boolean(opts?.newCustomerAcknowledged));
  const customerOk =
    Boolean(customerId) &&
    (customers.some((c) => c.id === customerId) ||
      (customerId === INGEST_DRAWER_NEW_CUSTOMER_ID && newCustomerReady));
  const unmatchedSkus = extracted.products
    .filter((p) => !p.matched)
    .map((p) => p.extractedSku);
  const mappingOk = unmatchedSkus.every((sku) => sessionProductSkus.includes(sku));

  return extracted.issues.filter((issue) => {
    if (issue.type === "customer_not_found" && customerOk) return false;
    if (issue.type === "product_mismatch" && mappingOk) return false;
    return true;
  });
}

export function deriveIngestDrawerValidation(input: {
  customerId: string;
  customers: Customer[];
  extracted: ExtractedContract | null;
  sessionProductSkus: string[];
  billingKind: BillingKind;
  invoiceTiming: "on_approval" | "on_activation";
  startDate: string;
  endDate: string;
  tcv: number;
  lineItemCount: number;
  /** When customerId is INGEST_DRAWER_NEW_CUSTOMER_ID, require all create fields. */
  newCustomerComplete?: boolean;
  /** When extraction includes customer_not_found, operator must Save after filling create fields. */
  newCustomerAcknowledged?: boolean;
}): {
  extractedRemaining: IngestIssue[];
  businessIssues: DrawerValidationIssue[];
  flags: IngestDrawerFlags;
} {
  const extractedRemaining = filterResolvedExtractedIssues(
    input.extracted,
    input.customerId,
    input.customers,
    input.sessionProductSkus,
    {
      newCustomerComplete: input.newCustomerComplete,
      newCustomerAcknowledged: input.newCustomerAcknowledged,
    },
  );

  const businessIssues: DrawerValidationIssue[] = [];

  const hasCustomerNotFoundIssue = Boolean(
    input.extracted?.issues.some((i) => i.type === "customer_not_found"),
  );
  const newCustomerFullyReady =
    Boolean(input.newCustomerComplete) &&
    (!hasCustomerNotFoundIssue || Boolean(input.newCustomerAcknowledged));

  const customerResolved =
    Boolean(input.customerId) &&
    (input.customerId === INGEST_DRAWER_NEW_CUSTOMER_ID
      ? newCustomerFullyReady
      : input.customers.some((c) => c.id === input.customerId));

  if (!input.customerId) {
    businessIssues.push({
      id: "biz-customer",
      severity: "blocking",
      message: "Select a customer before ingesting.",
      source: "business",
    });
  } else if (!customerResolved) {
    const newCustomerMsg =
      input.customerId === INGEST_DRAWER_NEW_CUSTOMER_ID
        ? !input.newCustomerComplete
          ? "Complete company name, billing entity, and domain to create the customer."
          : hasCustomerNotFoundIssue && !input.newCustomerAcknowledged
            ? "Save customer details to confirm and clear the customer validation."
            : "Complete company name, billing entity, and domain to create the customer."
        : "Select a valid customer before ingesting.";
    businessIssues.push({
      id: "biz-customer",
      severity: "blocking",
      message: newCustomerMsg,
      source: "business",
    });
  }

  if (input.lineItemCount === 0) {
    businessIssues.push({
      id: "biz-lines",
      severity: "blocking",
      message: "No line items were extracted from the document.",
      source: "business",
    });
  }

  if (input.endDate < input.startDate) {
    businessIssues.push({
      id: "biz-dates",
      severity: "blocking",
      message: "Contract end date cannot be before the start date.",
      source: "business",
    });
  }

  if (input.billingKind === "prepaid" && input.tcv <= 0) {
    businessIssues.push({
      id: "biz-prepaid-tcv",
      severity: "blocking",
      message: "Prepaid deals require a positive contract value so at least one invoice can be generated.",
      source: "business",
    });
  }

  if (input.billingKind === "hybrid" && input.tcv <= 0) {
    businessIssues.push({
      id: "biz-hybrid-tcv",
      severity: "blocking",
      message: "Hybrid deals require a positive TCV to split commit vs usage.",
      source: "business",
    });
  }

  const highDiscount = (input.extracted?.products ?? []).some((p) => p.discount >= 30);
  if (highDiscount) {
    businessIssues.push({
      id: "warn-discount",
      severity: "warning",
      message: "One or more lines carry ≥30% discount — confirm policy alignment before submitting.",
      source: "business",
    });
  }

  if (input.billingKind === "hybrid") {
    businessIssues.push({
      id: "warn-hybrid",
      severity: "warning",
      message: "Hybrid (commit + usage) increases billing complexity — review invoice plan and usage model.",
      source: "business",
    });
  }

  const blockingCount =
    extractedRemaining.filter((x) => x.severity === "blocking").length +
    businessIssues.filter((x) => x.severity === "blocking").length;

  const tieredDetected = (input.extracted?.products ?? []).some((p) =>
    /tier/i.test(p.billingModel),
  );
  const isComplexContract =
    input.lineItemCount > 5 ||
    tieredDetected ||
    (input.extracted?.issues.filter((i) => i.severity === "blocking").length ?? 0) > 1;

  return {
    extractedRemaining,
    businessIssues,
    flags: {
      hasBlockingErrors: blockingCount > 0,
      isComplexContract,
      isHybridDeal: input.billingKind === "hybrid",
    },
  };
}

export function hybridCommitAmount(tcv: number): number {
  return Math.round(tcv * 0.4);
}

export function firstInvoiceAmount(input: {
  billingKind: BillingKind;
  tcv: number;
  /** Prepaid: full TCV for annual-upfront style first invoice (matches INV-INGEST-002 demo) */
  prepaidFirstInvoice?: number;
}): number {
  if (input.billingKind === "postpaid") return 0;
  if (input.billingKind === "hybrid") return hybridCommitAmount(input.tcv);
  return input.prepaidFirstInvoice ?? input.tcv;
}

export function buildInvoicePlanLines(input: {
  billingKind: BillingKind;
  invoiceTiming: "on_approval" | "on_activation";
  startDate: string;
  billingFrequency: string;
  tcv: number;
}): InvoicePlanLine[] {
  const first = firstInvoiceAmount({
    billingKind: input.billingKind,
    tcv: input.tcv,
    prepaidFirstInvoice: input.billingKind === "prepaid" ? input.tcv : undefined,
  });

  if (input.billingKind === "prepaid") {
    const when =
      input.invoiceTiming === "on_approval"
        ? "Generated on approval, sent after policy checks"
        : `Generated on approval, held until activation (${input.startDate})`;
    return [
      {
        label: "Invoice #1",
        detail: `${currency(first)} — ${when}`,
      },
      { label: "Installments", detail: "None (single upfront invoice for this term slice)" },
    ];
  }

  if (input.billingKind === "hybrid") {
    return [
      {
        label: "Invoice #1 (commit)",
        detail: `${currency(first)} — ${input.invoiceTiming === "on_approval" ? "On approval" : `After activation (${input.startDate})`}`,
      },
      {
        label: "Usage invoices",
        detail: `Monthly in arrears · metered portion of ${currency(input.tcv)} TCV (remainder after commit)`,
      },
    ];
  }

  return [
    {
      label: "Recurring billing",
      detail: `${input.billingFrequency} · invoices after each cycle closes`,
    },
    {
      label: "Invoice lag",
      detail: "5 business days after cycle end (policy default)",
    },
  ];
}

export function monthsBetween(startIso: string, endIso: string): number {
  const a = new Date(startIso + "T12:00:00");
  const b = new Date(endIso + "T12:00:00");
  const diff = (b.getTime() - a.getTime()) / (86400000 * 30.44);
  return Math.max(1, Math.round(diff));
}
