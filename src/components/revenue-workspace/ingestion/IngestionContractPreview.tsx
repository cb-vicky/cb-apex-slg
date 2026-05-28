import { FileText, CheckCircle2 } from "lucide-react";
import type { Customer } from "@/data/mock-data";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSession } from "@/context/ingest-context-core";

interface Props {
  session: IngestionSession;
  customer: Customer;
  extracted: ExtractedContract;
  onSwitchToInvoice: () => void;
}

export function IngestionContractPreview({
  session,
  customer,
  extracted,
  onSwitchToInvoice,
}: Props) {
  const { terms, products } = extracted;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Contract Preview</h2>
          <p className="mt-1 text-sm text-text-secondary">
            This is how the contract will appear in Chargebee after ingestion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToInvoice}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-50"
          >
            View Invoice Preview
          </button>
        </div>
      </div>

      {/* PDF-styled contract preview */}
      <div className="mx-auto max-w-[680px] rounded-xl border-2 border-dashed border-gray-300 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Contract
              </div>
              <div className="mt-1 text-xl font-bold text-text-primary">
                CON-2026-{session.queueItemId.slice(-4)}
              </div>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Draft
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="border-b border-gray-200 px-8 py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Customer
          </div>
          <div className="mt-2">
            <div className="text-[15px] font-semibold text-text-primary">{customer.name}</div>
            <div className="mt-0.5 text-sm text-text-secondary">
              {extracted.customerLegalEntity}
            </div>
          </div>
        </div>

        {/* Contract terms */}
        <div className="border-b border-gray-200 px-8 py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Contract Terms
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-muted">Term</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">{terms.term}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Start Date</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {formatDate(terms.startDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">End Date</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {formatDate(terms.endDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Billing Frequency</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {terms.billingFrequency}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Payment Terms</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {terms.paymentTerms}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Auto-Renew</div>
              <div className="mt-0.5 text-sm font-medium text-text-primary">
                {terms.autoRenew ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="border-b border-gray-200 px-8 py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Subscription Items
          </div>
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-xs font-medium text-text-muted">Item</th>
                  <th className="pb-2 text-right text-xs font-medium text-text-muted">Qty</th>
                  <th className="pb-2 text-right text-xs font-medium text-text-muted">Price</th>
                  <th className="pb-2 text-right text-xs font-medium text-text-muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, idx) => {
                  const total = item.quantity * item.unitPrice * (1 - item.discount / 100);
                  return (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>{item.extractedName}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-text-muted">
                          {item.catalogSku || item.extractedSku}
                        </div>
                      </td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial summary */}
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted">Total Contract Value</div>
              <div className="mt-0.5 text-2xl font-bold text-text-primary">
                {formatCurrency(terms.tcv)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Annual Recurring Revenue</div>
              <div className="mt-0.5 text-lg font-semibold text-text-primary">
                {formatCurrency(terms.arr)}
              </div>
            </div>
          </div>

          {(terms.minCommit > 0 || terms.prepaidCredits > 0) && (
            <div className="mt-4 flex gap-6 border-t border-gray-200 pt-4">
              {terms.minCommit > 0 && (
                <div>
                  <div className="text-xs text-text-muted">Min. Commit</div>
                  <div className="mt-0.5 text-sm font-medium text-text-primary">
                    {formatCurrency(terms.minCommit)}
                  </div>
                </div>
              )}
              {terms.prepaidCredits > 0 && (
                <div>
                  <div className="text-xs text-text-muted">Prepaid Credits</div>
                  <div className="mt-0.5 text-sm font-medium text-text-primary">
                    {formatCurrency(terms.prepaidCredits)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span>Generated from: {extracted.documentName}</span>
            </div>
            <span>Extraction confidence: {extracted.extractionConfidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
