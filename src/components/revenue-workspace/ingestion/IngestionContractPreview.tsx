import { useState } from "react";
import { ZoomIn, ZoomOut, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSession } from "@/context/ingest-context-core";

interface Props {
  session: IngestionSession;
  customer: Customer;
  extracted: ExtractedContract;
  onSwitchToInvoice: () => void;
}

export function IngestionContractPreview({ customer, extracted, onSwitchToInvoice }: Props) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded bg-blue-100 p-1.5">
              <FileText size={14} className="text-blue-700" />
            </div>
            <span className="text-sm font-medium text-text-primary">Contract Preview</span>
          </div>
          <button
            onClick={onSwitchToInvoice}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View Invoice Preview →
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

      {/* Contract document mock */}
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
            {/* Contract header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">MASTER SERVICE AGREEMENT</h1>
                <p className="mt-2 text-sm text-gray-600">Contract #{extracted.docId.toUpperCase()}</p>
              </div>
            </div>

            {/* Parties */}
            <div className="mt-8 grid grid-cols-2 gap-8 border-b border-gray-200 pb-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Provider</h3>
                <p className="mt-2 font-medium text-gray-900">Chargebee Inc.</p>
                <p className="text-sm text-gray-600">340 S Lemon Ave #1111</p>
                <p className="text-sm text-gray-600">Walnut, CA 91789</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</h3>
                <p className="mt-2 font-medium text-gray-900">{extracted.customerLegalEntity}</p>
                <p className="text-sm text-gray-600">{customer.name}</p>
              </div>
            </div>

            {/* Terms summary */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">1. Contract Terms</h2>
              <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Effective Date:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatDate(extracted.terms.startDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatDate(extracted.terms.endDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Term Length:</span>
                  <span className="ml-2 font-medium text-gray-900">{extracted.terms.term}</span>
                </div>
                <div>
                  <span className="text-gray-500">Auto-Renewal:</span>
                  <span className="ml-2 font-medium text-gray-900">{extracted.terms.autoRenew ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">2. Pricing Schedule</h2>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left font-medium text-gray-600">Product</th>
                    <th className="py-2 text-right font-medium text-gray-600">Qty</th>
                    <th className="py-2 text-right font-medium text-gray-600">Unit Price</th>
                    <th className="py-2 text-right font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {extracted.products.map((product, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900">{product.extractedName}</td>
                      <td className="py-2 text-right text-gray-600">{product.quantity}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(product.unitPrice)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCurrency(product.quantity * product.unitPrice * (1 - product.discount / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="py-3 text-right font-semibold text-gray-900">
                      Total Contract Value:
                    </td>
                    <td className="py-3 text-right text-lg font-bold text-gray-900">
                      {formatCurrency(extracted.terms.tcv)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Billing terms */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">3. Billing Terms</h2>
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Billing Frequency:</span>{" "}
                  {extracted.terms.billingFrequency}
                </p>
                <p className="mt-2">
                  <span className="font-medium text-gray-900">Payment Terms:</span>{" "}
                  {extracted.terms.paymentTerms}
                </p>
              </div>
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
