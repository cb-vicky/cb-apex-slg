import { useState } from "react";
import type { Quote } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

interface QuoteGroup {
  lineageId: string;
  quoteType: string;
  latestQuote: Quote;
  versions: Quote[];
}

function groupQuotesByLineage(quotes: Quote[]): QuoteGroup[] {
  const map = new Map<string, Quote[]>();
  for (const q of quotes) {
    if (!map.has(q.lineageId)) map.set(q.lineageId, []);
    map.get(q.lineageId)!.push(q);
  }
  return Array.from(map.entries())
    .map(([lineageId, versions]) => {
      const sorted = [...versions].sort((a, b) => b.version - a.version);
      return {
        lineageId,
        quoteType: sorted[0].quoteType,
        latestQuote: sorted[0],
        versions: sorted,
      };
    })
    .sort((a, b) =>
      new Date(b.latestQuote.expiryDate).getTime() - new Date(a.latestQuote.expiryDate).getTime()
    );
}

interface Props {
  quotes: Quote[];
  onSelect: (quote: Quote) => void;
}

export function QuoteListView({ quotes, onSelect }: Props) {
  const groups = groupQuotesByLineage(quotes);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center">
        <FileText size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">No quotes found for this customer.</p>
      </div>
    );
  }

  function toggleGroup(lineageId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lineageId)) next.delete(lineageId);
      else next.add(lineageId);
      return next;
    });
  }

  return (
    <div className="border-y border-border-default bg-white">
      {/* Column header */}
      <div className="grid grid-cols-[auto_1fr_120px_100px_80px_110px] items-center gap-3 border-b border-border-subtle bg-gray-50 py-2 pl-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <span className="w-4" />
        <span>Deal</span>
        <span>Type</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Expires</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {groups.map((group) => {
          const isExpanded = expanded.has(group.lineageId);
          const hasVersions = group.versions.length > 1;
          const olderVersions = group.versions.slice(1);

          return (
            <div key={group.lineageId}>
              {/* Primary row — latest version */}
              <div className="grid grid-cols-[auto_1fr_120px_100px_80px_110px] items-center gap-3 py-3 pl-3 pr-4 transition-colors hover:bg-surface-muted/60">
                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => hasVersions && toggleGroup(group.lineageId)}
                  className={cn(
                    "flex h-5 w-4 items-center justify-center text-text-muted transition-colors",
                    hasVersions ? "hover:text-text-primary cursor-pointer" : "cursor-default",
                  )}
                  aria-label={isExpanded ? "Collapse versions" : "Expand versions"}
                >
                  {hasVersions ? (
                    isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                  ) : null}
                </button>

                {/* Quote identity — clicking opens detail */}
                <button
                  type="button"
                  onClick={() => onSelect(group.latestQuote)}
                  className="flex flex-col items-start gap-0.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary hover:text-cb-orange transition-colors">
                      {group.latestQuote.id}
                    </span>
                    <span className="text-[11px] text-text-muted">v{group.latestQuote.version}</span>
                    {hasVersions && (
                      <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[12px] font-medium leading-4 text-gray-600">
                        {group.versions.length} versions
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-[12px] text-text-secondary">
                    {group.latestQuote.versionSummary}
                  </p>
                </button>

                <span className="text-[12px] text-text-secondary">{group.quoteType}</span>
                <span className="text-right text-[13px] font-medium text-text-primary">
                  {currency(group.latestQuote.amount)}
                </span>
                <span className="text-right text-[12px] text-text-secondary">
                  {shortDate(group.latestQuote.expiryDate)}
                </span>
                <StatusBadge status={group.latestQuote.status} />
              </div>

              {/* Expanded older versions */}
              {isExpanded && hasVersions && (
                <div className="border-t border-border-subtle bg-gray-50">
                  {olderVersions.map((vq) => (
                    <button
                      key={vq.id}
                      type="button"
                      onClick={() => onSelect(vq)}
                      className="grid w-full grid-cols-[auto_1fr_120px_100px_80px_110px] items-center gap-3 border-b border-border-subtle py-2.5 pl-3 pr-4 text-left transition-colors last:border-0 hover:bg-white"
                    >
                      <span className="w-4" />
                      <div className="flex flex-col gap-0.5 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-text-secondary">{vq.id}</span>
                          <span className="text-[11px] text-text-muted">v{vq.version}</span>
                        </div>
                        {vq.rejectionReason && (
                          <p className="line-clamp-1 text-[11px] text-rose-500">{vq.rejectionReason}</p>
                        )}
                      </div>
                      <span className="text-[12px] text-text-muted">{vq.quoteType}</span>
                      <span className="text-right text-[12px] text-text-secondary">{currency(vq.amount)}</span>
                      <span className="text-right text-[12px] text-text-muted">{shortDate(vq.expiryDate)}</span>
                      <StatusBadge status={vq.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
