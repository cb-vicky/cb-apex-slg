import { useId, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Customer } from "@/data/mock-data";
import {
  getCustomerInsightsEnriched,
  getPrimaryCustomerAction,
  type EnrichedCustomerInsight,
} from "@/components/revenue-workspace/derive-stage-data";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronUp, Sparkles } from "lucide-react";

interface Props {
  customer: Customer;
}

const NBA_RX = 12;
const NBA_INSET = 2.5;
/** One full sweep of the animated border, then `NBA_REST_MS` pause; repeats. */
const NBA_SWEEP_MS = 18_000;
const NBA_REST_MS = 10_000;

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

function wrapDist(d: number, perim: number): number {
  if (perim <= 0) return 0;
  let u = d % perim;
  if (u < 0) u += perim;
  return u;
}

function pointAtPathLength(path: SVGPathElement, dist: number): { x: number; y: number } {
  const L = path.getTotalLength();
  if (L <= 0) return { x: 0, y: 0 };
  const p = path.getPointAtLength(wrapDist(dist, L));
  return { x: p.x, y: p.y };
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
  const action = getPrimaryCustomerAction(customer);
  const insights = getCustomerInsightsEnriched(customer);
  const uid = useId().replace(/:/g, "");
  const gradAId = `nba-tail-head-a-${uid}`;
  const gradBId = `nba-tail-head-b-${uid}`;

  const nbaSectionRef = useRef<HTMLElement>(null);
  const nbaPathARef = useRef<SVGPathElement>(null);
  const nbaPathBRef = useRef<SVGPathElement>(null);
  const gradARef = useRef<SVGLinearGradientElement>(null);
  const gradBRef = useRef<SVGLinearGradientElement>(null);
  const metricsRef = useRef<{ perim: number; dashLen: number; d: string } | null>(null);
  const [borderReady, setBorderReady] = useState(false);

  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [aiPhase, setAiPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [workbenchAdded, setWorkbenchAdded] = useState<Set<string>>(() => new Set());

  useLayoutEffect(() => {
    function applyBorderMetrics() {
      const section = nbaSectionRef.current;
      const pathA = nbaPathARef.current;
      const pathB = nbaPathBRef.current;
      if (!section || !pathA || !pathB) return;

      const w = section.clientWidth;
      const h = section.clientHeight;
      if (w <= 0 || h <= 0) return;

      const innerW = Math.max(0, w - 2 * NBA_INSET);
      const innerH = Math.max(0, h - 2 * NBA_INSET);
      const d = buildRoundedRectPathD(NBA_INSET, NBA_INSET, innerW, innerH, NBA_RX);
      pathA.setAttribute("d", d);
      pathB.setAttribute("d", d);

      const perim = pathA.getTotalLength();
      if (perim <= 0) return;

      const half = perim / 2;
      let dashLen = Math.max(200, perim * 0.1);
      if (dashLen >= half - 8) {
        dashLen = Math.max(120, half - 24);
      }
      const gap = perim - dashLen;
      const pattern = gap > 0 ? `${dashLen} ${gap}` : `${dashLen * 0.2} ${perim * 0.8}`;

      pathA.setAttribute("stroke-dasharray", pattern);
      pathB.setAttribute("stroke-dasharray", pattern);
      metricsRef.current = { perim, dashLen, d };
      setBorderReady(true);
    }

    const sectionEl = nbaSectionRef.current;
    if (!sectionEl) return;

    applyBorderMetrics();
    requestAnimationFrame(() => applyBorderMetrics());
    const ro = new ResizeObserver(() => applyBorderMetrics());
    ro.observe(sectionEl);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!borderReady) return;

    let raf = 0;

    function tick() {
      const pA = nbaPathARef.current;
      const gA = gradARef.current;
      const gB = gradBRef.current;
      const m = metricsRef.current;
      if (!pA || !gA || !gB || !m || m.perim <= 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const { perim, dashLen } = m;
      const cycleLen = NBA_SWEEP_MS + NBA_REST_MS;
      const elapsed = performance.now() % cycleLen;
      const sweepT = elapsed < NBA_SWEEP_MS ? elapsed / NBA_SWEEP_MS : 1;
      const offset = -sweepT * perim;
      const offsetB = offset - perim / 2;

      nbaPathBRef.current?.setAttribute("stroke-dashoffset", String(offsetB));
      pA.setAttribute("stroke-dashoffset", String(offset));

      const s = wrapDist(-offset, perim);

      const setGrad = (grad: SVGLinearGradientElement, s0: number) => {
        const tail = pointAtPathLength(pA, s0);
        const head = pointAtPathLength(pA, s0 + dashLen);
        grad.setAttribute("gradientUnits", "userSpaceOnUse");
        grad.setAttribute("x1", String(tail.x));
        grad.setAttribute("y1", String(tail.y));
        grad.setAttribute("x2", String(head.x));
        grad.setAttribute("y2", String(head.y));
      };

      const sB = wrapDist(-offsetB, perim);
      setGrad(gA, s);
      setGrad(gB, sB);

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [borderReady]);

  function runGenerateAnimation() {
    setAiPhase("loading");
    window.setTimeout(() => setAiPhase("ready"), 2400);
  }

  function regenerateInsights() {
    setAiPhase("loading");
    window.setTimeout(() => setAiPhase("ready"), 2400);
  }

  function addToWorkbench(id: string) {
    setWorkbenchAdded((prev) => new Set(prev).add(id));
  }

  const primaryBtnClass =
    "inline-flex items-center justify-center gap-1 rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

  return (
    <div className="flex flex-col gap-4">
      <section
        ref={nbaSectionRef}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border-default bg-white",
        )}
      >
        <svg
          className="pointer-events-none absolute inset-0 block h-full w-full overflow-visible"
          aria-hidden
          shapeRendering="geometricPrecision"
        >
          <defs>
            {/* Tail (0%) → head (100%): transparent → cb-orange, aligned to path motion each frame */}
            <linearGradient id={gradAId} ref={gradARef} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-cb-orange)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-cb-orange)" stopOpacity="1" />
            </linearGradient>
            <linearGradient id={gradBId} ref={gradBRef} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-cb-orange)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-cb-orange)" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Animated orange strokes — sit above the card’s CSS border; gaps show white fill */}
          <path
            ref={nbaPathARef}
            fill="none"
            stroke={`url(#${gradAId})`}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d=""
          />
          <path
            ref={nbaPathBRef}
            fill="none"
            stroke={`url(#${gradBId})`}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            d=""
          />
        </svg>

        <div className="relative z-[1] flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:gap-8">
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

      {aiPhase !== "ready" ? (
        <div className="relative rounded-lg border border-border-default bg-white">
          <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] shadow-sm ring-1 ring-border-default",
                  aiPhase === "loading" && "animate-pulse",
                )}
              >
                <Sparkles className="h-4 w-4 text-[color:var(--color-mature-blue)]" aria-hidden />
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
                "shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors",
                "bg-[color:var(--color-mature-blue)] hover:bg-[#1f2937]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-mature-blue)]",
                "disabled:cursor-wait disabled:opacity-90",
              )}
            >
              {aiPhase === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
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
          <div className="flex items-center justify-between border-b border-border-subtle bg-[#F7F7F8] px-4 py-2.5">
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
