import { useState } from "react";
import { ZoomIn, ZoomOut, Download, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSession } from "@/context/ingest-context-core";

interface Props {
  session: IngestionSession;
  customer: Customer;
  extracted: ExtractedContract;
  onSwitchToContract: () => void;
}

export function IngestionInvoicePreview({ customer, extracted, onSwitchToContract }: Props) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (extracted.terms.paymentTerms === "Net 30" ? 30 : 45));

  const subtotal = extracted.products.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice * (1 - p.discount / 100),
    0
  );
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded bg-emerald-100 p-1.5">
              <Receipt size={14} className="text-emerald-700" />
            </div>
            <span className="text-sm font-medium text-text-primary">Invoice Preview</span>
          </div>
          <button
            onClick={onSwitchToContract}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← View Contract Preview
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded p-1.5 hover:bg-gray-100"
            >
              <ZoomOut size={16} className="text-text-secondary" />
            </button>
            <span className="min-w-[3rem] text-center text-xs text-text-muted">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="rounded p-1.5 hover:bg-gray-100"
            >
              <ZoomIn size={16} className="text-text-secondary" />
            </button>
          </div>
          <button className="rounded p-1.5 hover:bg-gray-100">
            <Download size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Invoice document mock */}
      <div className="flex justify-center overflow-auto rounded-xl border border-border-default bg-gray-100 p-8">
        <div
          className="bg-white shadow-xl"
          style={{
            width: "8.5in",
            minHeight: "11in",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          <div className="p-12">
            {/* Invoice header */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="mt-1 text-sm text-gray-500">Draft • Pending Approval</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(total)}</div>
                <p className="mt-1 text-sm text-gray-500">Amount Due</p>
              </div>
            </div>

            {/* Invoice details */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</h3>
                <p className="mt-2 font-medium text-gray-900">Chargebee Inc.</p>
                <p className="text-sm text-gray-600">340 S Lemon Ave #1111</p>
                <p className="text-sm text-gray-600">Walnut, CA 91789</p>
                <p className="text-sm text-gray-600">billing@chargebee.com</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</h3>
                <p className="mt-2 font-medium text-gray-900">{extracted.customerLegalEntity}</p>
                <p className="text-sm text-gray-600">{customer.name}</p>
                {extracted.primaryContactEmail && (
                  <p className="text-sm text-gray-600">{extracted.primaryContactEmail}</p>
                )}
              </div>
            </div>

            {/* Invoice meta */}
            <div className="mt-8 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Invoice #</div>
                <div className="mt-1 font-medium text-gray-900">INV-DRAFT-001</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Invoice Date</div>
                <div className="mt-1 font-medium text-gray-900">{formatDate(invoiceDate.toISOString())}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Due Date</div>
                <div className="mt-1 font-medium text-gray-900">{formatDate(dueDate.toISOString())}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Terms</div>
                <div className="mt-1 font-medium text-gray-900">{extracted.terms.paymentTerms}</div>
              </div>
            </div>

            {/* Line items */}
            <div className="mt-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 text-left font-semibold text-gray-900">Description</th>
                    <th className="py-3 text-right font-semibold text-gray-900">Qty</th>
                    <th className="py-3 text-right font-semibold text-gray-900">Rate</th>
                    <th className="py-3 text-right font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {extracted.products.map((product, idx) => {
                    const lineTotal = product.quantity * product.unitPrice * (1 - product.discount / 100);
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{product.extractedName}</div>
                          <div className="text-xs text-gray-500">{product.billingModel}</div>
                        </td>
                        <td className="py-3 text-right text-gray-600">{product.quantity}</td>
                        <td className="py-3 text-right text-gray-600">{formatCurrency(product.unitPrice)}</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8.75%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-1">
                Questions? Contact billing@chargebee.com or call 1-800-555-0123
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span className="text-sm text-text-muted">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-text-secondary hover:bg-gray-100 disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
