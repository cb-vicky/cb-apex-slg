import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Customer } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import {
  getCustomerInsightsEnriched,
  getPrimaryCustomerAction,
  type CustomerWorkspaceSession,
  type EnrichedCustomerInsight,
} from "@/components/revenue-workspace/derive-stage-data";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronUp, Sparkles } from "lucide-react";

interface Props {
  customer: Customer;
}

/** Matches `rounded-xl` outer radius; 1px border → inner (padding-box) radius = outer − border. */
const NBA_OUTER_RADIUS = 12;
const NBA_CSS_BORDER = 1;
const NBA_INNER_RADIUS = NBA_OUTER_RADIUS - NBA_CSS_BORDER;
/** Same as Tailwind `border` (1px) — animated stroke matches final card border thickness. */
const NBA_STROKE = 1;
/** Half-stroke inset so the stroke centerline matches the inner edge of the 1px CSS border. */
const NBA_PATH_INSET = NBA_STROKE / 2;
/** Corner radius along the stroke centerline (parallel offset inside the inner rounded rect). */
const NBA_PATH_RADIUS = Math.max(0, NBA_INNER_RADIUS - NBA_PATH_INSET);
/** One-time border “draw” on load; orange CSS border appears only after (SVG reveals, then unmounts). */
const NBA_INTRO_MS = 2_200;

/** Collapsed AI Insights: total sweep time (3× L→R in `index.css` — keep in sync with `calc(2600ms / 3)` there). */
const AI_INSIGHTS_LOADING_MS = 2_600;

function buildRoundedRectPathD(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + rr} ${y}`,
    `H ${x + w - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
    `V ${y + h - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
    `H ${x + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
    `V ${y + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    "Z",
  ].join(" ");
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function insightDotClass(severity: EnrichedCustomerInsight["severity"]) {
  return cn(
    "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
    severity === "warning" && "group-hover:bg-amber-500",
    severity === "info" && "group-hover:bg-blue-500",
    severity === "success" && "group-hover:bg-emerald-500",
  );
}

export function CustomerNbaAiRow({ customer }: Props) {
  const {
    queueItems,
    contractClosures,
    contractGraceExtensions,
    invoiceStatusOverrides,
    sessionContracts,
    approvalRequests,
  } = useIngestContext();
  const workspaceSession = useMemo<CustomerWorkspaceSession>(
    () => ({
      queueItems,
      contractClosures,
      contractGraceExtensions,
      invoiceStatusOverrides,
      sessionContracts,
      approvalRequests,
    }),
    [queueItems, contractClosures, contractGraceExtensions, invoiceStatusOverrides, sessionContracts, approvalRequests],
  );
  const action = getPrimaryCustomerAction(customer, workspaceSession);
  const insights = getCustomerInsightsEnriched(customer, workspaceSession);
  const nbaSectionRef = useRef<HTMLElement>(null);
  const nbaPathDrawRef = useRef<SVGPathElement>(null);
  const metricsRef = useRef<{ perim: number; d: string } | null>(null);
  const nbaIntroDoneRef = useRef(false);
  const [borderReady, setBorderReady] = useState(false);
  const [nbaIntroComplete, setNbaIntroComplete] = useState(false);

  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [aiPhase, setAiPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [workbenchAdded, setWorkbenchAdded] = useState<Set<string>>(() => new Set());

  useLayoutEffect(() => {
    function applyBorderMetrics() {
      const section = nbaSectionRef.current;
      const pathDraw = nbaPathDrawRef.current;
      if (!section || !pathDraw) return;

      const w = section.clientWidth;
      const h = section.clientHeight;
      if (w <= 0 || h <= 0) return;

      const innerW = Math.max(0, w - 2 * NBA_PATH_INSET);
      const innerH = Math.max(0, h - 2 * NBA_PATH_INSET);
      const d = buildRoundedRectPathD(NBA_PATH_INSET, NBA_PATH_INSET, innerW, innerH, NBA_PATH_RADIUS);
      pathDraw.setAttribute("d", d);

      const perim = pathDraw.getTotalLength();
      if (perim <= 0) return;

      // Full-length dash: offset animates perim → 0 to trace the border once
      pathDraw.setAttribute("stroke-dasharray", String(perim));
      if (!nbaIntroDoneRef.current) {
        pathDraw.setAttribute("stroke-dashoffset", String(perim));
      }
      metricsRef.current = { perim, d };
      setBorderReady(true);
    }

    const sectionEl = nbaSectionRef.current;
    if (!sectionEl) {
      setBorderReady(false);
      return;
    }

    applyBorderMetrics();
    requestAnimationFrame(() => applyBorderMetrics());
    const ro = new ResizeObserver(() => applyBorderMetrics());
    ro.observe(sectionEl);
    return () => ro.disconnect();
  }, [action.kind]);

  useEffect(() => {
    if (!borderReady || nbaIntroComplete) return;

    const pathDraw = nbaPathDrawRef.current;
    const m = metricsRef.current;
    if (!pathDraw || !m || m.perim <= 0) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nbaIntroDoneRef.current = true;
      setNbaIntroComplete(true);
      return;
    }

    const perim = m.perim;
    const t0 = performance.now();
    let rafId = 0;

    function tick(now: number) {
      if (nbaIntroDoneRef.current) return;
      const path = nbaPathDrawRef.current;
      if (!path) return;

      const elapsed = now - t0;
      const t = Math.min(1, elapsed / NBA_INTRO_MS);
      const eased = easeOutCubic(t);
      const offset = perim * (1 - eased);
      path.setAttribute("stroke-dashoffset", String(offset));

      if (t >= 1) {
        nbaIntroDoneRef.current = true;
        setNbaIntroComplete(true);
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [borderReady, nbaIntroComplete, action.kind]);

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

  const primaryBtnClass =
    "inline-flex items-center justify-center gap-1 rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

  return (
    <div className="flex flex-col gap-4">
      {action.kind !== "none" && (
      <section
        ref={nbaSectionRef}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-white",
          nbaIntroComplete ? "border-cb-orange" : "border-transparent",
        )}
      >
        {/* Light orange wash: strong at bottom-right, fading toward upper-center */}
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(ellipse_110%_85%_at_100%_100%,var(--color-cb-orange-light)_0%,transparent_52%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(to_top_left,rgba(255,244,239,0.5)_0%,transparent_48%)]"
          aria-hidden
        />

        {!nbaIntroComplete && (
          <svg
            className="pointer-events-none absolute inset-0 z-[1] block h-full w-full overflow-visible"
            aria-hidden
            shapeRendering="geometricPrecision"
          >
            <path
              ref={nbaPathDrawRef}
              fill="none"
              stroke="var(--color-cb-orange)"
              strokeWidth={NBA_STROKE}
              strokeLinecap="butt"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              d=""
            />
          </svg>
        )}

        <div className="relative z-[2] flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">Next best action</p>
            <h2 className="mt-1.5 text-lg font-semibold leading-snug text-text-primary">{action.label}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{action.description}</p>
            {learnMoreOpen && (
              <p className="mt-4 border-l-2 border-orange-200/80 pl-3 text-[13px] leading-relaxed text-text-secondary">
                {action.learnMoreBody}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-start md:flex-col md:items-stretch lg:flex-row">
            <button
              type="button"
              onClick={() => setLearnMoreOpen((o) => !o)}
              className={cn(
                "rounded-lg border border-border-subtle bg-white/80 px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors",
                "hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              {learnMoreOpen ? "Hide details" : action.learnMoreLabel}
            </button>
            <Link to={action.executeTo} className={primaryBtnClass}>
              {action.executeLabel}
              <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      )}

      {aiPhase !== "ready" ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border-default bg-white",
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
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-white">
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
                      {/* Secondary (workbench) left of primary links; primary link CTAs follow — last link sits at the row’s right edge */}
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
      )}
    </div>
  );
}
