import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";
import { CatalogItemActiveTag } from "./ZenithItemMapToExistingPanel";

function formatMatchUnitPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  item: ZenithSummaryLineItem;
  onExpandMatch?: () => void;
  className?: string;
}

export function MatchedItemCondensedStrip({
  item,
  onExpandMatch,
  className,
}: Props) {
  const frequency = item.frequency.trim() || "—";
  const price = formatMatchUnitPrice(item.unitPrice);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-emerald-200/80 bg-emerald-50 py-2.5",
        "border-l-[3px] border-l-emerald-500",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
        <span className="shrink-0 font-semibold text-emerald-700">Match found</span>
        <span className="text-text-muted" aria-hidden>
          ·
        </span>
        <span className="truncate font-semibold text-text-primary">{item.name.trim() || "Untitled item"}</span>
        <CatalogItemActiveTag className="shrink-0" />
        <span className="text-text-muted" aria-hidden>
          ·
        </span>
        <span className="text-text-secondary">{frequency}</span>
        <span className="text-text-muted" aria-hidden>
          ·
        </span>
        <span className="tabular-nums text-text-secondary">{price}</span>
      </div>
      {onExpandMatch ? (
        <button
          type="button"
          onClick={onExpandMatch}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-emerald-300/80 bg-white px-2.5 text-[11px] font-medium text-emerald-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50/80"
          aria-expanded="false"
        >
          <ChevronDown size={14} strokeWidth={2} aria-hidden />
          View match
        </button>
      ) : null}
    </div>
  );
}
