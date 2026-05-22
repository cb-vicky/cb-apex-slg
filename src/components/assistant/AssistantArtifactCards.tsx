import { useEffect, useState, type CSSProperties } from "react";
import { ChevronRight, Users, X } from "lucide-react";
import {
  INLINE_ARTIFACT_PREVIEW_ROWS,
  PRO_RISK_CUSTOMERS,
  RISK_REASON_DOT_CLASS,
  RISK_REASON_LABEL,
  type AssistantArtifact,
} from "@/lib/assistantArtifacts";

/**
 * Bordered preview card that hangs underneath an assistant message and opens
 * the full artifact in the workspace's right column on click.
 *
 *   - `isActive` matches a tab open in the workspace artifact column (gives
 *     the card a subtle primary highlight + accent chevron).
 *   - `muted` is the panel-inactive look used when the assistant aside isn't
 *     focused/hovered — transparent background and softened text/border so
 *     the card recedes into the page chrome instead of competing with it.
 */
export function InlineArtifactCard({
  artifact,
  onOpen,
  isActive = false,
  muted = false,
}: {
  artifact: AssistantArtifact;
  onOpen: (artifact: AssistantArtifact) => void;
  isActive?: boolean;
  muted?: boolean;
}) {
  if (artifact.type !== "pro-risk-customers") return null;
  const previewRows = PRO_RISK_CUSTOMERS.slice(0, INLINE_ARTIFACT_PREVIEW_ROWS);
  const moreCount = Math.max(0, PRO_RISK_CUSTOMERS.length - previewRows.length);

  /** Outer card surface: muted > active > default (mutually exclusive looks). */
  const surfaceClass = muted
    ? "border-slate-200/70 bg-transparent hover:border-slate-300"
    : isActive
      ? "border-primary-200/90 bg-primary-25/70 shadow-sm ring-1 ring-primary-500/15 hover:border-primary-300 hover:shadow-md"
      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm";

  /** Tween color tokens between active/muted with a consistent 150ms ease-out. */
  const fade = "transition-colors duration-150 ease-out";

  return (
    <button
      type="button"
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onOpen(artifact)}
      className={`group mt-1 flex w-full max-w-[22rem] flex-row items-stretch gap-2 squircle rounded-3xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500/40 ${surfaceClass}`}
      aria-label={`Open artifact: ${artifact.title}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2.5">
          <span
            className={`squircle mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${fade} ${muted ? "bg-rose-50/60 text-rose-500" : "bg-rose-50 text-rose-600"}`}
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.85} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[13px] font-semibold leading-tight ${fade} ${muted ? "text-slate-700" : "text-slate-900"}`}
            >
              {artifact.title}
            </p>
            {artifact.subtitle && (
              <p className={`mt-0.5 text-[11px] text-slate-500 ${fade}`}>
                {artifact.subtitle}
              </p>
            )}
          </div>
        </div>
        <ul
          className={`mt-2.5 space-y-1.5 border-t pt-2.5 ${fade} ${muted ? "border-slate-100/70" : "border-slate-100"}`}
        >
          {previewRows.map((c) => (
            <li
              key={c.id}
              className={`flex items-center gap-2 text-[13px] ${fade} ${muted ? "text-slate-600" : "text-slate-700"}`}
            >
              <span
                aria-hidden
                className={`squircle h-1.5 w-1.5 shrink-0 rounded-full transition-opacity duration-150 ease-out ${RISK_REASON_DOT_CLASS[c.reason]} ${muted ? "opacity-60" : ""}`}
              />
              <span className="truncate">{c.name}</span>
            </li>
          ))}
        </ul>
        {moreCount > 0 && (
          <p className={`mt-2 text-[11px] text-slate-400 ${fade}`}>
            +{moreCount} more customers inside
          </p>
        )}
      </div>
      <span
        className="flex shrink-0 flex-col items-center justify-center self-center pl-0.5"
        aria-hidden
      >
        <ChevronRight
          className={
            isActive && !muted
              ? "h-3.5 w-3.5 shrink-0 text-primary-600 transition group-hover:translate-x-px"
              : "h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
          }
          strokeWidth={2}
        />
      </span>
    </button>
  );
}

/** Skeleton rows shown for ~300ms while the artifact table "loads". */
function ProRiskArtifactTableSkeleton() {
  return (
    <div className="min-w-[640px] px-4 py-3" aria-hidden>
      <div className="flex gap-3 border-b border-slate-100 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="squircle h-3 flex-1 animate-pulse rounded-md bg-slate-100/90"
          />
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`r-${i}`} className="flex gap-3 py-1.5">
            <div className="squircle h-4 w-[38%] animate-pulse rounded-md bg-slate-50" />
            <div className="squircle h-4 w-[28%] animate-pulse rounded-md bg-slate-50" />
            <div className="squircle h-4 w-8 animate-pulse rounded-md bg-slate-50" />
            <div className="squircle h-4 w-14 shrink-0 animate-pulse rounded-md bg-slate-50" />
            <div className="squircle h-4 w-12 shrink-0 animate-pulse rounded-md bg-slate-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rounded top cap on both sides; `corner-shape` where supported (e.g. Chrome). */
const ARTIFACT_TAB_SHAPE_STYLE: CSSProperties & { cornerShape?: string } = {
  borderRadius: "24px 24px 0 0",
  cornerShape: "squircle",
};

/**
 * Workspace artifact column: tab strip (one tab per open artifact) + body.
 * Close control lives on each tab. Title/subtitle for the active artifact
 * sit in the table header area below the tabs (not in a separate aside
 * header).
 */
export function WorkspaceArtifactColumn({
  openTabs,
  activeId,
  onSelectTab,
  onCloseTab,
  activeArtifact,
  prefersReducedMotion,
}: {
  openTabs: AssistantArtifact[];
  activeId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  activeArtifact: AssistantArtifact | null;
  prefersReducedMotion: boolean;
}) {
  /** Briefly show a skeleton on tab/artifact switch so the table feels "loaded". */
  const [showArtifactTable, setShowArtifactTable] = useState(
    () => prefersReducedMotion,
  );

  useEffect(() => {
    if (activeArtifact?.type !== "pro-risk-customers") return;
    if (prefersReducedMotion) {
      setShowArtifactTable(true);
      return;
    }
    setShowArtifactTable(false);
    const timer = window.setTimeout(() => setShowArtifactTable(true), 300);
    return () => window.clearTimeout(timer);
  }, [activeId, activeArtifact?.id, activeArtifact?.type, prefersReducedMotion]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex min-h-8 shrink-0 items-end gap-1 overflow-x-auto [scrollbar-gutter:stable] bg-neutral-100/80 px-2 pt-1.5"
        role="tablist"
        aria-label="Open artifacts"
      >
        {openTabs.map((a) => {
          const isActive = a.id === activeId;
          return (
            <div
              key={a.id}
              className={[
                "squircle group inline-flex h-7 min-h-7 max-w-[min(12rem,40vw)] shrink-0 items-stretch overflow-hidden font-sora text-[13px] leading-none tracking-tight transition",
                isActive
                  ? "relative z-[1] bg-white text-neutral-900"
                  : "bg-neutral-50/90 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              ].join(" ")}
              style={ARTIFACT_TAB_SHAPE_STYLE}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(a.id)}
                className="inline-flex h-full min-w-0 flex-1 items-center gap-1.5 pl-3.5 pr-0 text-left font-medium text-inherit"
              >
                <Users
                  className="h-3.5 w-3.5 shrink-0 text-neutral-500 group-hover:text-neutral-600"
                  strokeWidth={1.85}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{a.title}</span>
              </button>
              <button
                type="button"
                className="squircle inline-flex h-full w-7 shrink-0 items-center justify-center rounded-md pr-1 text-neutral-500 transition hover:bg-neutral-100/80 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500/40"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(a.id);
                }}
                title={`Close ${a.title}`}
                aria-label={`Close tab: ${a.title}`}
              >
                <X className="h-3 w-3" strokeWidth={2} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>

      {activeArtifact?.type === "pro-risk-customers" && (
        <div
          className="min-h-0 flex-1 overflow-auto bg-white"
          aria-busy={!showArtifactTable}
        >
          <div className="border-b border-slate-100 px-4 py-2.5 bg-white">
            <h2 className="text-[13px] font-semibold leading-tight text-slate-900">
              {activeArtifact.title}
            </h2>
            {activeArtifact.subtitle && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {activeArtifact.subtitle}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-slate-500">
              <span className="tabular-nums">({PRO_RISK_CUSTOMERS.length})</span>{" "}
              <span>customers</span>
            </p>
          </div>
          <div className="min-w-[640px]">
            {!showArtifactTable ? (
              <>
                <span className="sr-only">Loading table</span>
                <ProRiskArtifactTableSkeleton />
              </>
            ) : (
              <table
                key={activeId ?? "artifact-table"}
                className={`w-full border-collapse text-[12px] text-slate-700 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
                  prefersReducedMotion
                    ? ""
                    : "motion-safe:animate-artifact-table-reveal"
                }`}
              >
                <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2 text-left font-semibold">Customer</th>
                    <th className="px-4 py-2 text-left font-semibold">Risk</th>
                    <th className="px-4 py-2 text-right font-semibold">Seat util</th>
                    <th className="px-4 py-2 text-right font-semibold">Integrations off</th>
                    <th className="px-4 py-2 text-right font-semibold">MRR</th>
                    <th className="px-4 py-2 text-right font-semibold">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {PRO_RISK_CUSTOMERS.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={`squircle h-1.5 w-1.5 shrink-0 rounded-full ${RISK_REASON_DOT_CLASS[c.reason]}`}
                          />
                          <span className="truncate font-medium text-slate-900">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                        {RISK_REASON_LABEL[c.reason]}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {c.seatUtilizationPct}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {c.integrationsDisabled}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        ${c.mrrUsd.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-500">
                        {c.lastActiveDaysAgo}d ago
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
