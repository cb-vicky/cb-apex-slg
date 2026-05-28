import { FileText, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ExtractedDocument } from "@/data/ingest-data";

interface Props {
  document: ExtractedDocument;
  onBack: () => void;
}

export function IngestionPdfPreview({ document, onBack }: Props) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const totalPages = 3; // Mock

  return (
    <div className="flex min-h-[78vh] flex-col overflow-hidden rounded-xl border border-border-default bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-default bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-gray-100"
          >
            <ChevronLeft size={16} />
            Back to review
          </button>
          <div className="h-5 w-px bg-border-default" />
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-text-muted" />
            <span className="text-sm font-medium text-text-primary">{document.name}</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-text-muted">
              {document.kind}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border-default">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1.5 text-text-muted transition-colors hover:bg-gray-50"
            >
              <ZoomOut size={16} />
            </button>
            <span className="w-12 text-center text-xs text-text-secondary">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1.5 text-text-muted transition-colors hover:bg-gray-50"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-gray-50">
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* PDF content area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-8">
        <div
          className="mx-auto bg-white shadow-lg"
          style={{
            width: `${(612 * zoom) / 100}px`,
            minHeight: `${(792 * zoom) / 100}px`,
          }}
        >
          {/* Mock PDF page with dashed paper aesthetic */}
          <div className="relative h-full w-full border-2 border-dashed border-gray-300 p-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-gray-300" />
                <p className="mt-4 text-sm text-gray-400">
                  PDF Preview
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {document.name}
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Page {page} of {totalPages}
                </p>
              </div>
            </div>

            {/* Mock content lines */}
            <div className="relative z-10 space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-5/6 rounded bg-gray-100" />
              <div className="mt-8 h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
              <div className="mt-8 h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-4 border-t border-border-default bg-white py-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-text-secondary">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
