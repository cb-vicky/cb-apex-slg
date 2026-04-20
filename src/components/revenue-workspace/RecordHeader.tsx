import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import type { Quote } from "@/data/mock-data";

interface Props {
  id: string;
  status: string;
  // Optional secondary info shown to the right of the status (e.g. "v3")
  tagline?: string;
  // Quote version dropdown
  versions?: Quote[];
  onVersionChange?: (q: Quote) => void;
  // Action buttons (already composed) displayed on the right
  actions?: React.ReactNode;
}

export function RecordHeader({ id, status, tagline, versions, onVersionChange, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {versions && onVersionChange ? (
          <VersionMenu id={id} versions={versions} onVersionChange={onVersionChange} />
        ) : (
          <span className="text-[15px] font-semibold text-text-primary">{id}</span>
        )}
        {tagline && <span className="text-[12px] text-text-muted">{tagline}</span>}
        <StatusBadge status={status} />
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

function VersionMenu({
  id,
  versions,
  onVersionChange,
}: {
  id: string;
  versions: Quote[];
  onVersionChange: (q: Quote) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = versions.find((v) => v.id === id);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-border-default bg-white px-2.5 py-1 text-[13px] transition-colors hover:bg-surface-muted"
      >
        <span className="font-semibold text-text-primary">{id}</span>
        {current && <span className="text-text-muted">v{current.version}</span>}
        <ChevronDown size={13} className="text-text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[420px] rounded-lg border border-border-default bg-white p-2 shadow-lg">
          <div className="mb-1 px-2 py-1 text-[11px] uppercase tracking-wider text-text-muted">Quote versions</div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {versions.map((v) => {
              const selected = v.id === id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    onVersionChange(v);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                    selected
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-transparent hover:border-border-default hover:bg-surface-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{v.id}</span>
                    <span className="text-text-muted">v{v.version}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  {v.versionSummary && (
                    <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{v.versionSummary}</p>
                  )}
                  {v.status === "Rejected" && v.rejectionReason && (
                    <p className="mt-1 text-[11px] text-rose-600">Rejection reason: {v.rejectionReason}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
