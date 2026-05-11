import { useState } from "react";
import { Link } from "react-router-dom";
import type { EnrichedCustomerInsight } from "@/components/revenue-workspace/derive-stage-data";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronUp, Sparkles } from "lucide-react";

interface Props {
  insights: EnrichedCustomerInsight[];
}

const AI_INSIGHTS_LOADING_MS = 2_600;

function insightDotClass(severity: EnrichedCustomerInsight["severity"]) {
  return cn(
    "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
    severity === "warning" && "group-hover:bg-amber-500",
    severity === "info" && "group-hover:bg-blue-500",
    severity === "success" && "group-hover:bg-emerald-500",
  );
}

export function AiInsightsCard({ insights }: Props) {
  const [aiPhase, setAiPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [workbenchAdded, setWorkbenchAdded] = useState<Set<string>>(() => new Set());

  function runGenerateAnimation() {
    setAiPhase("loading");
    window.setTimeout(() => setAiPhase("ready"), AI_INSIGHTS_LOADING_MS);
  }

  function regenerateInsights() {
    setAiPhase("loading");
    window.setTimeout(() => setAiPhase("ready"), AI_INSIGHTS_LOADING_MS);
  }

  function addToWorkbench(id: string) {
    setWorkbenchAdded((prev) => new Set(prev).add(id));
  }

  if (aiPhase !== "ready") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border-default bg-white",
          aiPhase === "loading" && "ai-insights-loading-sheen",
        )}
      >
        <div className="relative z-[1] flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] ring-1 ring-border-default",
                aiPhase === "loading" && "shadow-sm",
              )}
            >
              <Sparkles
                className={cn(
                  "h-4 w-4 text-text-muted",
                  aiPhase === "loading" && "text-orange-600/70",
                )}
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">AI Insights</p>
              <p className="mt-0.5 text-[12px] leading-snug text-text-muted">
                Summarize risk, billing posture, and suggested follow-ups for this account.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={aiPhase === "loading"}
            onClick={runGenerateAnimation}
            className={cn(
              "shrink-0 rounded-lg border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors",
              "hover:border-gray-300 hover:bg-surface-muted hover:text-text-primary",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-default",
              "disabled:cursor-wait disabled:border-border-default disabled:opacity-75",
            )}
          >
            {aiPhase === "loading" ? (
              <span className="inline-flex items-center gap-2 text-text-secondary">
                <Sparkles className="h-4 w-4 shrink-0 text-orange-600/80" aria-hidden />
                Generating…
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div className="flex items-center justify-between border-b border-border-subtle bg-gray-50 px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">AI Insights</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={regenerateInsights}
            className="rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--color-cb-orange)] transition-colors hover:bg-orange-50/80"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => setAiPhase("idle")}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-black/[0.04] hover:text-text-secondary"
            aria-label="Collapse AI insights"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="divide-y divide-border-subtle px-4 py-1">
        {insights.map((insight) => (
          <div key={insight.id} className="group flex gap-2.5 py-3 first:pt-2 last:pb-3">
            <span className={insightDotClass(insight.severity)} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p className="min-w-0 flex-1 text-left text-[13px] leading-snug text-text-primary">{insight.text}</p>
              {(insight.ctas.length > 0 || (insight.showAddToWorkbench && insight.workbenchPreviewTitle)) && (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:max-w-[min(100%,22rem)] sm:justify-end sm:pl-2">
                  {insight.showAddToWorkbench && insight.workbenchPreviewTitle && !workbenchAdded.has(insight.id) && (
                    <button
                      type="button"
                      onClick={() => addToWorkbench(insight.id)}
                      className="text-[12px] font-medium text-text-secondary underline decoration-dotted underline-offset-2 hover:text-text-primary"
                    >
                      Add to workbench
                    </button>
                  )}
                  {workbenchAdded.has(insight.id) && (
                    <span className="text-[11px] font-medium text-emerald-600">Added to workbench</span>
                  )}
                  {insight.ctas.map((cta) => (
                    <Link
                      key={`${insight.id}-${cta.label}`}
                      to={cta.to}
                      className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {cta.label}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
