import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, FileText, Minus, PanelRightClose, Plus } from "lucide-react";
import type { ExtractedContract } from "@/data/ingest-data";
import { ContractExtractDocumentBody } from "./ContractExtractDocumentBody";

/**
 * Right pane for queue ingest — mirrors Invoice Approval preview proportions and chrome
 * (pagination on contract, zoom, collapse).
 */
export function IngestDocumentPreviewPane({
  extracted,
  documentTitle,
  onCollapse,
}: {
  extracted: ExtractedContract | null;
  documentTitle: string;
  onCollapse: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const pageCount = 3;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-100">
      <div className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-2 px-2 pb-2">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border-default bg-surface-muted px-2.5 py-1"
          title={documentTitle}
        >
          <FileText
            size={14}
            strokeWidth={2}
            className="shrink-0 text-text-muted"
            aria-label="Document"
          />
          <span className="min-w-0 truncate text-[11px] font-medium text-text-primary">{documentTitle}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[58px] text-center text-[11px] tabular-nums text-text-secondary">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-[36px] text-center text-[11px] tabular-nums text-text-secondary">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            type="button"
            onClick={onCollapse}
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Hide preview"
            title="Hide preview"
          >
            <PanelRightClose size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div
          className="mx-auto rounded-sm border border-border-default bg-white shadow-[0_2px_12px_rgba(17,24,39,0.08)]"
          style={{ zoom: zoom / 100 } as CSSProperties}
        >
          <div className="px-8 py-7 text-[12px]">
            {extracted ? (
              <ContractExtractDocumentBody doc={extracted} />
            ) : (
              <p className="py-12 text-center text-[12px] text-text-muted">No extracted contract body.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Document preview content for use within IngestWorkspaceTabs.
 * Includes controls bar and document body.
 */
export function DocumentPreviewTabContent({
  extracted,
  documentTitle,
}: {
  extracted: ExtractedContract | null;
  documentTitle: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const pageCount = 3;

  return (
    <div className="flex min-h-full flex-col bg-[#F3F4F6]">
      {/* Controls bar */}
      <div className="shrink-0 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex min-w-0 items-center gap-2 rounded-md border border-border-default bg-white px-2.5 py-1.5"
            title={documentTitle}
          >
            <FileText
              size={14}
              strokeWidth={2}
              className="shrink-0 text-text-muted"
              aria-label="Document"
            />
            <span className="min-w-0 truncate text-[11px] font-medium text-text-primary">{documentTitle}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-md border border-border-default bg-white px-2 py-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="rounded p-0.5 text-text-muted transition-colors hover:text-text-primary disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <div className="mx-1 h-3 w-px bg-border-default" />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
              aria-label="Zoom out"
            >
              <Minus size={12} />
            </button>
            <span className="min-w-[32px] text-center text-[10px] tabular-nums text-text-secondary">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
              aria-label="Zoom in"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Document body */}
      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div
          className="mx-auto max-w-3xl rounded-lg border border-border-default bg-white shadow-sm"
          style={{ zoom: zoom / 100 } as CSSProperties}
        >
          <div className="px-8 py-7 text-[12px]">
            {extracted ? (
              <ContractExtractDocumentBody doc={extracted} />
            ) : (
              <p className="py-12 text-center text-[12px] text-text-muted">No document content available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
