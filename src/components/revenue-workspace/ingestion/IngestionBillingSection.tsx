import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

const BILLING_FREQUENCIES = ["Monthly", "Quarterly", "Annual, billed upfront", "Annual, billed monthly"];
const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on receipt"];

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
            <span>{extracted.sectionIssues.billing || "Review billing information"}</span>
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
            <span>Review billing configuration and confirm</span>
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
          <span>Billing configuration confirmed</span>
        </div>
      )}

      {/* Contract term */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Contract term</h3>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Term length
            </label>
            <div className="rounded-lg border border-border-default bg-gray-50 px-4 py-2.5 text-sm text-text-primary">
              {terms.term}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Auto-renew
            </label>
            <div className="rounded-lg border border-border-default bg-gray-50 px-4 py-2.5 text-sm text-text-primary">
              {terms.autoRenew ? "Yes" : "No"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Start date
            </label>
            <div className="rounded-lg border border-border-default bg-gray-50 px-4 py-2.5 text-sm text-text-primary">
              {formatDate(terms.startDate)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              End date
            </label>
            <div className="rounded-lg border border-border-default bg-gray-50 px-4 py-2.5 text-sm text-text-primary">
              {formatDate(terms.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Billing frequency */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Billing frequency</h3>
        <p className="mt-1 text-sm text-text-secondary">
          How often will the customer be invoiced?
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {BILLING_FREQUENCIES.map((freq) => (
            <div
              key={freq}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm transition-colors",
                terms.billingFrequency.toLowerCase().includes(freq.toLowerCase().split(",")[0])
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-border-default text-text-secondary"
              )}
            >
              {freq}
            </div>
          ))}
        </div>
      </div>

      {/* Payment terms */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Payment terms</h3>
        <p className="mt-1 text-sm text-text-secondary">
          When is payment due after invoice date?
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {PAYMENT_TERMS.map((term) => (
            <div
              key={term}
              className={cn(
                "rounded-lg border px-4 py-3 text-center text-sm transition-colors",
                terms.paymentTerms === term
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-border-default text-text-secondary"
              )}
            >
              {term}
            </div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Financial summary</h3>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Total Contract Value (TCV)
            </div>
            <div className="mt-1 text-2xl font-semibold text-text-primary">
              {formatCurrency(terms.tcv)}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Annual Recurring Revenue (ARR)
            </div>
            <div className="mt-1 text-2xl font-semibold text-text-primary">
              {formatCurrency(terms.arr)}
            </div>
          </div>
          {terms.minCommit > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Minimum Commit
              </div>
              <div className="mt-1 text-2xl font-semibold text-text-primary">
                {formatCurrency(terms.minCommit)}
              </div>
            </div>
          )}
          {terms.prepaidCredits > 0 && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Prepaid Credits
              </div>
              <div className="mt-1 text-2xl font-semibold text-text-primary">
                {formatCurrency(terms.prepaidCredits)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
