// ---------------------------------------------------------------------------
// Shared copy for invoice / credit note / termination approval surfaces
// ---------------------------------------------------------------------------

import type { InvoicePreviewVariant } from "@/components/approvals/InvoiceHTMLPreview";

export type ApprovalDocKind = "invoice" | "credit-note" | "termination-invoice";

export function getApprovalDocKind(invoiceId: string | undefined): ApprovalDocKind {
  if (!invoiceId) return "invoice";
  if (invoiceId.startsWith("CN-CLOSE-")) return "credit-note";
  if (invoiceId.startsWith("INV-TERM-")) return "termination-invoice";
  return "invoice";
}

export function approvalPreviewVariant(kind: ApprovalDocKind): InvoicePreviewVariant {
  if (kind === "credit-note") return "credit-note";
  if (kind === "termination-invoice") return "termination";
  return "invoice";
}

export interface ApprovalDocUi {
  kind: ApprovalDocKind;
  previewTab: string;
  amountField: string;
  dateField: string;
  memoPlaceholder: string;
  toastSent: string;
  approvedBanner: string;
  rejectedBanner: string;
  rejectPlaceholder: string;
  notFoundMessage: string;
  rejectCommentPrefix: string;
  summaryRowLabel: string;
  emptyPreviewHint: string;
  finalSuccessDocLabel: string;
  finalSuccessVerb: string;
  finalSuccessClosing: string;
  finalSuccessOpenDocLabel: string;
}

export function getApprovalDocUi(kind: ApprovalDocKind): ApprovalDocUi {
  switch (kind) {
    case "credit-note":
      return {
        kind,
        previewTab: "Credit note",
        amountField: "Credit amount",
        dateField: "Issue date",
        memoPlaceholder: "Add a note that appears on the credit note…",
        toastSent: "Credit note issued",
        approvedBanner: "Credit note approved. Finalising next steps…",
        rejectedBanner: "Credit note cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this credit note…",
        notFoundMessage: "Credit note not found or approval not yet submitted.",
        rejectCommentPrefix: "Credit note rejected",
        summaryRowLabel: "Credit note",
        emptyPreviewHint: "No contract source available for this credit.",
        finalSuccessDocLabel: "Credit note",
        finalSuccessVerb: "issued to",
        finalSuccessClosing:
          ". Credits will post to the customer account per your approval policy.",
        finalSuccessOpenDocLabel: "View credit note",
      };
    case "termination-invoice":
      return {
        kind,
        previewTab: "Invoice",
        amountField: "Invoice amount",
        dateField: "Invoice date",
        memoPlaceholder: "Add a note that appears on the invoice…",
        toastSent: "Termination invoice sent to the customer",
        approvedBanner: "Termination invoice approved. Finalising next steps…",
        rejectedBanner: "Termination invoice cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this termination invoice…",
        notFoundMessage: "Invoice not found or approval not yet submitted.",
        rejectCommentPrefix: "Termination invoice rejected",
        summaryRowLabel: "Termination invoice",
        emptyPreviewHint: "No contract source available for this invoice.",
        finalSuccessDocLabel: "Termination invoice",
        finalSuccessVerb: "sent to",
        finalSuccessClosing: ". Future invoices will follow your approval policy.",
        finalSuccessOpenDocLabel: "Open invoice",
      };
    default:
      return {
        kind: "invoice",
        previewTab: "Invoice",
        amountField: "Invoice amount",
        dateField: "Invoice date",
        memoPlaceholder: "Add a note that appears on the invoice…",
        toastSent: "Invoice sent to the customer",
        approvedBanner: "Invoice approved. Finalising next steps…",
        rejectedBanner: "Invoice cancelled. Redirecting to Approvals…",
        rejectPlaceholder: "Provide a reason for rejecting this invoice…",
        notFoundMessage: "Invoice not found or approval not yet submitted.",
        rejectCommentPrefix: "Invoice rejected",
        summaryRowLabel: "Invoice",
        emptyPreviewHint: "No contract source available for this invoice.",
        finalSuccessDocLabel: "Invoice",
        finalSuccessVerb: "sent to",
        finalSuccessClosing: ". Future invoices will follow your approval policy.",
        finalSuccessOpenDocLabel: "Open Invoice",
      };
  }
}
