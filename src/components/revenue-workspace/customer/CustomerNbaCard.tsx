import { useState } from "react";
import { Link } from "react-router-dom";
import type { PrimaryCustomerAction } from "@/components/revenue-workspace/derive-stage-data";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  action: PrimaryCustomerAction;
}

export function CustomerNbaCard({ action }: Props) {
  const [expanded, setExpanded] = useState(false);

  const primaryBtnClass =
    "inline-flex items-center justify-center gap-1 rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

  if (action.kind === "none") return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white">
      {/* Light orange wash: strong at bottom-right, fading toward upper-center */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(ellipse_110%_85%_at_100%_100%,var(--color-cb-orange-light)_0%,transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(to_top_left,rgba(255,244,239,0.5)_0%,transparent_48%)]"
        aria-hidden
      />

      <div className="relative z-[2] flex flex-col gap-3 px-5 py-4">
        {/* Main row: label + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">Next best action</p>
            <h2 className="mt-1 text-[15px] font-semibold leading-snug text-text-primary">
              {action.label}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setExpanded((o) => !o)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-white/80 px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors",
                "hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              Why this matters
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
            <Link to={action.executeTo} className={primaryBtnClass}>
              {action.executeLabel}
              <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Expandable detail */}
        {expanded && (
          <div className="border-t border-orange-200/60 pt-3">
            <p className="text-[13px] leading-relaxed text-text-secondary">{action.description}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-text-muted">{action.learnMoreBody}</p>
          </div>
        )}
      </div>
    </section>
  );
}
