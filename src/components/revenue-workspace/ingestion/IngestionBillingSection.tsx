import { CheckCircle2, AlertCircle, FileText, Calendar, CreditCard, Clock } from "lucide-react";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionBillingSection({ extracted, sectionState, onMarkDone }: Props) {
  const { terms } = extracted;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>{extracted.sectionIssues.billing || "Review billing terms"}</span>
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
            <span>Review billing terms and schedule, then mark as done</span>
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
          <span>Billing terms reviewed</span>
        </div>
      )}

      {/* Billing terms */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Contract terms</h3>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Calendar size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Contract term
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">{terms.term}</div>
              <div className="text-xs text-text-secondary">
                {formatDate(terms.startDate)} — {formatDate(terms.endDate)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <CreditCard size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Billing frequency
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">{terms.billingFrequency}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Clock size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Payment terms
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">{terms.paymentTerms}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <CheckCircle2 size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Auto-renew
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {terms.autoRenew ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Financial summary</h3>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border-default bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Total contract value
            </div>
            <div className="mt-1 text-xl font-semibold text-text-primary">
              {formatCurrency(terms.tcv)}
            </div>
          </div>
          <div className="rounded-lg border border-border-default bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Annual recurring revenue
            </div>
            <div className="mt-1 text-xl font-semibold text-text-primary">
              {formatCurrency(terms.arr)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
