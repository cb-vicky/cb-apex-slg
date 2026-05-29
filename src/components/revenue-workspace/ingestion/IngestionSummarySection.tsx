import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionSummarySection({ extracted, sectionState, onMarkDone }: Props) {
  const { terms, products } = extracted;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const unmappedCount = products.filter((p) => !p.matched).length;

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>{extracted.sectionIssues.summary || "Review required"}</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "review" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <FileText size={16} className="text-blue-600" />
            <span>Review extracted summary, then mark as done</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Summary reviewed</span>
        </div>
      )}

      {/* Line items extracted */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Line items extracted</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Found {products.length} line items in the contract
          {products.length > 0 && `, covering ${products.map((p) => p.extractedName).slice(0, 2).join(", ")}`}
          {products.length > 2 && ` and ${products.length - 2} more`}.
          {unmappedCount > 0 && ` ${unmappedCount} items need mapping.`}
        </p>

        <div className="mt-4 rounded-lg border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-border-default">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  Item
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  Frequency
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Unit Price
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, idx) => {
                const total = item.quantity * item.unitPrice * (1 - item.discount / 100);
                return (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-border-default last:border-0",
                      !item.matched && "bg-red-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.matched ? (
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="shrink-0 text-red-500" />
                        )}
                        <span className={cn("font-medium", !item.matched && "text-red-700")}>
                          {item.extractedName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.billingModel}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PDF preview thumbnail */}
        <div className="mt-4 flex items-start gap-4">
          <div className="flex-1 rounded-lg border border-border-default bg-gray-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              From Contract
            </div>
            <div className="mt-2 text-xs text-text-muted">Click to enlarge</div>
          </div>
        </div>
      </div>

      {/* Billing terms */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Billing cycle
            </div>
            <div className="mt-1 text-sm font-medium text-text-primary">
              {terms.billingFrequency}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Start date
            </div>
            <div className="mt-1 text-sm font-medium text-text-primary">
              {formatDate(terms.startDate)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Payment terms
            </div>
            <div className="mt-1 text-sm font-medium text-text-primary">{terms.paymentTerms}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
