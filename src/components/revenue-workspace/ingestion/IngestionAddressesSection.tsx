import { CheckCircle2, AlertCircle, FileText, Building2, MapPin, Mail } from "lucide-react";
import type { ExtractedContract } from "@/data/ingest-data";
import type { IngestionSectionState } from "@/context/ingest-context-core";

interface Props {
  extracted: ExtractedContract;
  sectionState: IngestionSectionState;
  onMarkDone: () => void;
}

export function IngestionAddressesSection({ extracted, sectionState, onMarkDone }: Props) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      {sectionState === "issues" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600" />
            <span>{extracted.sectionIssues.addresses || "Review address details"}</span>
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
            <span>Review customer address information, then mark as done</span>
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
          <span>Addresses reviewed</span>
        </div>
      )}

      {/* Customer info */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Customer information</h3>

        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Building2 size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Legal entity
              </div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {extracted.customerLegalEntity}
              </div>
            </div>
          </div>

          {extracted.primaryContactName && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <MapPin size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Primary contact
                </div>
                <div className="mt-1 text-sm font-medium text-text-primary">
                  {extracted.primaryContactName}
                </div>
              </div>
            </div>
          )}

          {extracted.primaryContactEmail && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Mail size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Email
                </div>
                <div className="mt-1 text-sm font-medium text-text-primary">
                  {extracted.primaryContactEmail}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing address (mock) */}
      <div className="rounded-xl border border-border-default bg-white p-5">
        <h3 className="text-[15px] font-semibold text-text-primary">Billing address</h3>
        <div className="mt-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">{extracted.customerLegalEntity}</p>
          <p className="mt-1">123 Business Center Drive</p>
          <p>Suite 400</p>
          <p>San Francisco, CA 94105</p>
          <p>United States</p>
        </div>
      </div>
    </div>
  );
}
