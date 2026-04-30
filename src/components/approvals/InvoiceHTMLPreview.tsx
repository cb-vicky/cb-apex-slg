import type { Invoice } from "@/data/mock-data";
import type { InvoiceEnrichment } from "@/data/billing-data";
import { cn, currency, shortDate } from "@/lib/utils";

export type InvoicePreviewVariant = "invoice" | "credit-note" | "termination";

interface Props {
  invoice: Invoice;
  customerName: string;
  enrichment?: InvoiceEnrichment;
  /** Closure-generated documents use credit-note / termination styling instead of a standard invoice. */
  variant?: InvoicePreviewVariant;
}

export function InvoiceHTMLPreview({
  invoice,
  customerName,
  enrichment,
  variant = "invoice",
}: Props) {
  const lineItems = enrichment?.detailedLineItems
    ? enrichment.detailedLineItems.map((l) => ({ description: l.name, amount: l.netAmount }))
    : invoice.lineItems;

  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
  const tax = enrichment?.taxTotal ?? Math.round(subtotal * 0.08);
  const total = invoice.amount;
  const billTo = enrichment?.billToContact ?? `${customerName}\nFinance / Accounts Payable`;

  const isCreditNote = variant === "credit-note";
  const docTitle =
    variant === "credit-note"
      ? "Credit note"
      : variant === "termination"
        ? "Termination invoice"
        : "Invoice";
  const idLabel =
    variant === "credit-note" ? "Credit note #" : variant === "termination" ? "Invoice #" : "Invoice #";

  return (
    <div className="min-h-[640px] rounded-lg border border-border-default bg-white p-8 shadow-sm font-sans text-[13px] leading-relaxed text-text-primary">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border-default pb-5 mb-5">
        <div>
          <p className="text-[18px] font-bold tracking-tight text-[#012A38]">APEX</p>
          <p className="mt-0.5 text-[11px] text-text-muted">Chargebee US – Acme Merchant</p>
          <p className="text-[11px] text-text-muted">250 Montgomery St, Suite 900</p>
          <p className="text-[11px] text-text-muted">San Francisco, CA 94104</p>
          <p className="text-[11px] text-text-muted">billing@chargebee.com</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold uppercase tracking-widest text-text-muted">{docTitle}</p>
          <div className="mt-2 inline-block rounded-lg border border-border-default bg-surface-muted px-4 py-2 text-left">
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              <span className="text-[11px] text-text-muted">{idLabel}</span>
              <span className="text-[11px] font-semibold text-text-primary">{invoice.id}</span>
              <span className="text-[11px] text-text-muted">{isCreditNote ? "Issue date" : "Date"}</span>
              <span className="text-[11px] font-semibold">{shortDate(invoice.date)}</span>
              {!isCreditNote && (
                <>
                  <span className="text-[11px] text-text-muted">Due Date</span>
                  <span className="text-[11px] font-semibold text-amber-700">{shortDate(invoice.dueDate)}</span>
                </>
              )}
              {isCreditNote && (
                <>
                  <span className="text-[11px] text-text-muted">Status</span>
                  <span className="text-[11px] font-semibold text-amber-600">{invoice.status}</span>
                </>
              )}
              {!isCreditNote && (
                <>
                  <span className="text-[11px] text-text-muted">Status</span>
                  <span className={`text-[11px] font-semibold ${
                    invoice.status === "Paid" ? "text-emerald-600"
                      : invoice.status === "Overdue" ? "text-red-600"
                      : "text-amber-600"
                  }`}>{invoice.status}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 grid grid-cols-2 gap-8">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {isCreditNote ? "Credit to" : "Bill To"}
          </p>
          <p className="font-semibold text-text-primary">{customerName}</p>
          {billTo.split("\n").map((line, i) => (
            <p key={i} className="text-[12px] text-text-secondary">{line}</p>
          ))}
        </div>
        {invoice.contractId && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Reference</p>
            <p className="text-[12px] text-text-secondary">
              Contract: <span className="font-medium text-text-primary">{invoice.contractId}</span>
            </p>
            {enrichment?.poNumber && (
              <p className="text-[12px] text-text-secondary">
                PO #: <span className="font-medium text-text-primary">{enrichment.poNumber}</span>
              </p>
            )}
            {enrichment?.paymentTerms && (
              <p className="text-[12px] text-text-secondary">
                Terms: <span className="font-medium text-text-primary">{enrichment.paymentTerms}</span>
              </p>
            )}
            {enrichment?.billingPeriodStart && (
              <p className="text-[12px] text-text-secondary">
                Period: <span className="font-medium text-text-primary">
                  {shortDate(enrichment.billingPeriodStart)} – {shortDate(enrichment.billingPeriodEnd)}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Line Items */}
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b-2 border-[#012A38]">
            <th className="pb-2 text-left font-semibold text-text-secondary">Description</th>
            <th className="pb-2 text-right font-semibold text-text-secondary">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((line, i) => (
            <tr key={i} className="border-b border-border-subtle">
              <td className="py-2.5 pr-4 text-text-primary">{line.description}</td>
              <td className={cn(
                "py-2.5 text-right tabular-nums font-medium",
                isCreditNote ? "text-emerald-700" : "text-text-primary",
              )}>
                {isCreditNote ? `(${currency(line.amount)})` : currency(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex flex-col items-end gap-1 border-t border-border-default pt-4">
        {!isCreditNote && (
          <>
            <div className="flex w-56 items-center justify-between text-[12px]">
              <span className="text-text-secondary">Subtotal</span>
              <span className="tabular-nums font-medium">{currency(subtotal)}</span>
            </div>
            <div className="flex w-56 items-center justify-between text-[12px]">
              <span className="text-text-secondary">Tax (8%)</span>
              <span className="tabular-nums font-medium">{currency(tax)}</span>
            </div>
          </>
        )}
        <div className="flex w-56 items-center justify-between border-t border-border-default pt-2 text-[14px]">
          <span className="font-bold text-text-primary">
            {isCreditNote ? "Total credit" : "Total Due"}
          </span>
          <span className={cn(
            "tabular-nums font-bold",
            isCreditNote ? "text-emerald-700" : "text-[#012A38]",
          )}>
            {isCreditNote ? `(${currency(total)})` : currency(total)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-lg border border-border-default bg-surface-muted px-4 py-3 text-[11px] text-text-muted">
        {isCreditNote ? (
          <>
            <p className="font-medium text-text-secondary">Credit memo</p>
            <p className="mt-0.5">
              This credit reduces open balance on your account. Refunds, if applicable, follow your merchant&apos;s
              standard timeline.
            </p>
            <p className="mt-1">Questions? Contact <span className="text-blue-600">billing@chargebee.com</span></p>
          </>
        ) : (
          <>
            <p className="font-medium text-text-secondary">Payment Instructions</p>
            <p className="mt-0.5">Please make payment via ACH or Wire transfer to the account details provided in your billing onboarding.</p>
            <p className="mt-1">Questions? Contact <span className="text-blue-600">billing@chargebee.com</span></p>
          </>
        )}
      </div>
    </div>
  );
}
