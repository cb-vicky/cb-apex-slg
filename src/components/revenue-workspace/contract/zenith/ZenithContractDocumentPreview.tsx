import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { ContractPDFTabContent } from "@/components/approvals/approval-document-preview";
import { buildZenithIngestPreviewContract } from "@/data/zenith-contract-preview";
import { zenithAnalyticsIncCustomer } from "@/data/zenith-analytics-inc-seed";
import { shortDate } from "@/lib/utils";
import type { ZenithContractDocumentTabId } from "./zenith-contract-tabs";

const previewContract = buildZenithIngestPreviewContract();
const previewCustomer = zenithAnalyticsIncCustomer;

function SowDocumentBody() {
  return (
    <div className="space-y-5 font-mono text-[11px] leading-relaxed text-text-secondary">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          Statement of Work
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
          Zenith Analytics INC — New Business
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted">Effective {shortDate(previewContract.effectiveDate)}</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">1. SCOPE</p>
        <p className="mt-1">
          Provider will deliver onboarding, workspace configuration, and admin training for Customer&apos;s
          deployment of Growth CRM and Premium Support services under the Master Subscription Agreement.
        </p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">2. DELIVERABLES</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Kickoff workshop and success plan (Week 1)</li>
          <li>Catalog mapping and billing configuration (Weeks 2–3)</li>
          <li>Admin training sessions — up to 2 virtual workshops</li>
          <li>Go-live readiness review and handoff documentation</li>
        </ul>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">3. FEES</p>
        <p className="mt-1">
          Onboarding &amp; Training — one-time fee of $2,500 as listed in the Order Form. Expenses
          pre-approved in writing by Customer will be reimbursed at cost.
        </p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">SIGNATURES</p>
        <div className="mt-2 grid grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted">For Provider:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">Sarah Chen</p>
            <p className="text-text-muted">VP Revenue, Chargebee</p>
          </div>
          <div>
            <p className="text-text-muted">For Customer:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">
              Authorized Signatory
            </p>
            <p className="text-text-muted">{previewCustomer.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SowPDFPreview({ zoom }: { zoom: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F3F4F6]">
      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        <div
          className="mx-auto max-w-3xl rounded-lg border border-border-default bg-white shadow-sm"
          style={{ zoom: zoom / 100 }}
        >
          <div className="px-8 py-7">
            <SowDocumentBody />
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  documentTabId: ZenithContractDocumentTabId;
}

/**
 * Document controls bar — page navigation and zoom controls only.
 * Document switching is now handled by the CustomerContextBar.
 */
function DocumentControlsBar({
  documentTabId,
  zoom,
  onZoomChange,
  page,
  onPageChange,
}: {
  documentTabId: ZenithContractDocumentTabId;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = documentTabId === "contract-pdf" ? 3 : 2;

  return (
    <div className="shrink-0 border-b border-border-default bg-white">
      <div className="flex items-center justify-end px-5 py-2">
        {/* Document controls */}
        <div className="flex shrink-0 items-center gap-1 rounded-md border border-border-default bg-gray-50 px-2 py-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded p-0.5 text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[52px] text-center text-[10px] tabular-nums text-text-secondary">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page === pageCount}
            className="rounded p-0.5 text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <div className="mx-1 h-3 w-px bg-border-default" />
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
            className="rounded p-0.5 text-text-muted hover:text-text-primary"
            aria-label="Zoom out"
          >
            <Minus size={12} />
          </button>
          <span className="min-w-[32px] text-center text-[10px] tabular-nums text-text-secondary">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            className="rounded p-0.5 text-text-muted hover:text-text-primary"
            aria-label="Zoom in"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ZenithContractDocumentPreview({ documentTabId }: Props) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <DocumentControlsBar
        documentTabId={documentTabId}
        zoom={zoom}
        onZoomChange={setZoom}
        page={page}
        onPageChange={setPage}
      />

      <div className="flex min-h-[min(680px,calc(100vh-320px))] flex-col overflow-hidden">
        {documentTabId === "contract-pdf" ? (
          <ContractPDFTabContent
            contract={previewContract}
            customer={previewCustomer}
            hideControls
            zoom={zoom}
          />
        ) : (
          <SowPDFPreview zoom={zoom} />
        )}
      </div>
    </div>
  );
}
