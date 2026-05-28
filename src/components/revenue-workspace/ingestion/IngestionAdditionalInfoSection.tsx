import { CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionAdditionalInfoSection({ extracted, sectionState, onMarkDone }: Props) {
  const { additionalInfo } = extracted;
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  function toggleClause(idx: number) {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>{extracted.sectionIssues.additional || "Review additional information"}</span>
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
            <span>Review additional info and clauses</span>
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
          <span>Additional info reviewed</span>
        </div>
      )}

      {/* Notes */}
      {additionalInfo.notes.length > 0 && (
        <div className="rounded-xl border border-border-default bg-white p-5">
          <h3 className="text-[15px] font-semibold text-text-primary">Notes</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Key observations extracted from the contract document.
          </p>

          <div className="mt-4 space-y-2">
            {additionalInfo.notes.map((note, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border-default bg-gray-50 px-4 py-3 text-sm text-text-secondary"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clauses */}
      {additionalInfo.clauses.length > 0 && (
        <div className="rounded-xl border border-border-default bg-white p-5">
          <h3 className="text-[15px] font-semibold text-text-primary">Contract clauses</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Special terms and conditions extracted from the agreement.
          </p>

          <div className="mt-4 space-y-3">
            {additionalInfo.clauses.map((clause, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border-default overflow-hidden"
              >
                <button
                  onClick={() => toggleClause(idx)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-text-primary">{clause.title}</span>
                  {expandedClauses.has(idx) ? (
                    <ChevronUp size={16} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-text-muted" />
                  )}
                </button>
                {expandedClauses.has(idx) && (
                  <div className="border-t border-border-default bg-gray-50 px-4 py-3">
                    <p className="text-sm text-text-secondary">{clause.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {additionalInfo.notes.length === 0 && additionalInfo.clauses.length === 0 && (
        <div className="rounded-xl border border-border-default bg-white p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100">
            <FileText size={24} className="text-text-muted" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-text-primary">No additional info</h3>
          <p className="mt-1 text-sm text-text-muted">
            No special clauses or notes were extracted from this contract.
          </p>
        </div>
      )}
    </div>
  );
}
