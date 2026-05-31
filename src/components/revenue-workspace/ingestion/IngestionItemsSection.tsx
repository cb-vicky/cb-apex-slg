import { useState } from "react";
import { CheckCircle2, AlertCircle, FileText, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedContract, ExtractedProduct } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionItemsSection({ extracted, sectionState, onMarkDone }: Props) {
  const { products } = extracted;
  const [resolvedSkus, setResolvedSkus] = useState<Set<string>>(new Set());

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const isItemResolved = (item: ExtractedProduct) => 
    item.matched || resolvedSkus.has(item.extractedSku);

  const unresolvedCount = products.filter((p) => !isItemResolved(p)).length;
  const allItemsResolved = unresolvedCount === 0;

  const handleResolveItem = (sku: string) => {
    setResolvedSkus((prev) => new Set([...prev, sku]));
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && !allItemsResolved && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>{unresolvedCount} item(s) need SKU mapping — resolve below</span>
          </div>
        </div>
      )}

      {sectionState === "issues" && allItemsResolved && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>All items resolved</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "review" && !allItemsResolved && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <FileText size={16} className="text-blue-600" />
            <span>Review line items — {unresolvedCount} need attention</span>
          </div>
        </div>
      )}

      {sectionState === "review" && allItemsResolved && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>All items reviewed</span>
          </div>
          <button
            onClick={onMarkDone}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Mark as done
          </button>
        </div>
      )}

      {sectionState === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Line items reviewed</span>
        </div>
      )}

      {/* Line items table */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Product line items</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Map extracted products to your catalog SKUs
        </p>

        <div className="mt-4 rounded-lg border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-border-default">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  Extracted name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  Catalog mapping
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Unit price
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, idx) => {
                const total = item.quantity * item.unitPrice * (1 - item.discount / 100);
                const resolved = isItemResolved(item);
                return (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-border-default last:border-0",
                      !resolved && "bg-red-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {resolved ? (
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                        ) : (
                          <AlertCircle size={14} className="shrink-0 text-red-500" />
                        )}
                        <span className={cn("font-medium", !resolved && "text-red-700")}>
                          {item.extractedName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {resolved ? (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <span className="text-xs text-text-muted">{item.extractedSku}</span>
                          <ArrowRight size={12} className="text-text-muted" />
                          <span className="font-medium text-emerald-700">{item.catalogSku || "APEX-ANALYTICS-PRO"}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleResolveItem(item.extractedSku)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                        >
                          <Check size={12} />
                          Map to catalog
                        </button>
                      )}
                    </td>
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
      </div>

      {/* Pricing summary */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Pricing summary</h3>
        <div className="mt-4 grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              TCV
            </div>
            <div className="mt-1 text-lg font-semibold text-text-primary">
              {formatCurrency(extracted.terms.tcv)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              ARR
            </div>
            <div className="mt-1 text-lg font-semibold text-text-primary">
              {formatCurrency(extracted.terms.arr)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Min commit
            </div>
            <div className="mt-1 text-lg font-semibold text-text-primary">
              {formatCurrency(extracted.terms.minCommit)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Prepaid credits
            </div>
            <div className="mt-1 text-lg font-semibold text-text-primary">
              {formatCurrency(extracted.terms.prepaidCredits)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
