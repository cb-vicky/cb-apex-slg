import { CheckCircle2, AlertCircle, FileText, FileCheck2, Shield, Info } from "lucide-react";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionAdditionalInfoSection({ extracted, sectionState, onMarkDone }: Props) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

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
            <span>Review additional contract details, then mark as done</span>
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

      {/* Extraction metadata */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Extraction details</h3>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <FileCheck2 size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Document name
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {extracted.documentName}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Info size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Extracted at
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {formatDate(extracted.extractedAt)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Shield size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Extraction confidence
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {extracted.extractionConfidence}%
              </div>
            </div>
          </div>

          {extracted.quoteMatchId && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <FileText size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Matched quote
                </div>
                <div className="mt-1 text-sm font-medium text-text-primary">
                  {extracted.quoteMatchId}
                </div>
                {extracted.quoteMatchConfidence && (
                  <div className="text-xs text-text-secondary">
                    {extracted.quoteMatchConfidence}% confidence
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Issues summary */}
      {extracted.issues.length > 0 && (
        <div className="rounded-xl border border-border-default bg-white p-5">
          <h3 className="text-[15px] font-semibold text-text-primary">Detected issues</h3>
          <div className="mt-4 space-y-3">
            {extracted.issues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-lg border p-3 ${
                  issue.severity === "blocking"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle
                    size={14}
                    className={issue.severity === "blocking" ? "text-red-600" : "text-amber-600"}
                  />
                  <span
                    className={`text-sm font-medium ${
                      issue.severity === "blocking" ? "text-red-800" : "text-amber-800"
                    }`}
                  >
                    {issue.message}
                  </span>
                </div>
                {issue.detail && (
                  <p
                    className={`mt-1 text-xs ${
                      issue.severity === "blocking" ? "text-red-700" : "text-amber-700"
                    }`}
                  >
                    {issue.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
