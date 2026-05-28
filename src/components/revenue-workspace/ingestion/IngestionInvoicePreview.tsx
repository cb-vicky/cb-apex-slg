import { FileText, Building2 } from "lucide-react";
import type { Customer } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSession } from "@/context/ingest-context-core";

interface Props {
  session: IngestionSession;
  customer: Customer;
  extracted: ExtractedContract;
  onSwitchToContract: () => void;
}

export function IngestionInvoicePreview({
  session,
  customer,
  extracted,
  onSwitchToContract,
}: Props) {
  const { terms, products, addresses } = extracted;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const invoiceNumber = `INV-2026-${session.queueItemId.slice(-4)}`;
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const subtotal = products.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice * (1 - item.discount / 100);
  }, 0);
  const tax = subtotal * 0; // No tax for this demo
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Invoice Preview</h2>
          <p className="mt-1 text-sm text-text-secondary">
            This invoice will be generated and sent for approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToContract}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-50"
          >
            View Contract Preview
          </button>
        </div>
      </div>

      {/* HTML Invoice preview */}
      <div className="mx-auto max-w-[680px] rounded-xl border border-border-default bg-white shadow-lg">
        {/* Invoice header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#012A38]">
                  <span className="text-lg font-bold text-white">C</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary">Chargebee Inc.</div>
                  <div className="text-xs text-text-muted">340 S Lemon Ave #1234</div>
                  <div className="text-xs text-text-muted">Walnut, CA 91789</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-text-primary">INVOICE</div>
              <div className="mt-1 text-sm text-text-muted">{invoiceNumber}</div>
              <div className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                Pending Approval
              </div>
            </div>
          </div>
        </div>

        {/* Bill to / Invoice details */}
        <div className="grid grid-cols-2 gap-8 border-b border-gray-200 px-8 py-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Bill To
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-text-muted" />
                <span className="font-semibold text-text-primary">{customer.name}</span>
              </div>
              <div className="mt-1 text-sm text-text-secondary">
                {addresses.billing.line1}
                {addresses.billing.line2 && <>, {addresses.billing.line2}</>}
              </div>
              <div className="text-sm text-text-secondary">
                {addresses.billing.city}, {addresses.billing.state} {addresses.billing.postalCode}
              </div>
              <div className="text-sm text-text-secondary">{addresses.billing.country}</div>
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Invoice Date</span>
                <span className="text-sm text-text-primary">{formatDate(invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Due Date</span>
                <span className="text-sm text-text-primary">{formatDate(dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Payment Terms</span>
                <span className="text-sm text-text-primary">{terms.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Contract</span>
                <span className="text-sm font-medium text-blue-600">
                  CON-2026-{session.queueItemId.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  Description
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Qty
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Unit Price
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, idx) => {
                const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="font-medium text-text-primary">{item.extractedName}</div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {item.billingModel}
                        {item.discount > 0 && ` · ${item.discount}% discount`}
                      </div>
                    </td>
                    <td className="py-3 text-right text-text-secondary">{item.quantity}</td>
                    <td className="py-3 text-right text-text-secondary">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-medium text-text-primary">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 px-8 py-5">
          <div className="ml-auto w-64">
            <div className="flex justify-between py-1">
              <span className="text-sm text-text-muted">Subtotal</span>
              <span className="text-sm text-text-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-text-muted">Tax (0%)</span>
              <span className="text-sm text-text-primary">{formatCurrency(tax)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
              <span className="text-base font-semibold text-text-primary">Total Due</span>
              <span className="text-base font-bold text-text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span>Service period: {formatDate(terms.startDate)} - {formatDate(terms.endDate)}</span>
            </div>
            <span>Currency: USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
