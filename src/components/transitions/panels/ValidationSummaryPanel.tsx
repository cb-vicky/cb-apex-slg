import type { IngestIssue } from "@/data/ingest-data";
import type { DrawerValidationIssue } from "@/components/transitions/ingest-drawer-derive";
import { cn } from "@/lib/utils";

interface Props {
  issues: IngestIssue[];
  drawerIssues?: DrawerValidationIssue[];
  className?: string;
}

export function ValidationSummaryPanel({ issues, drawerIssues = [], className }: Props) {
  const fromExtracted = issues.map((i) => ({
    id: i.id,
    severity: i.severity,
    message: i.message,
    tag: "extract" as const,
  }));
  const fromDrawer = drawerIssues.map((i) => ({
    id: i.id,
    severity: i.severity,
    message: i.message,
    tag: i.source === "business" ? ("rule" as const) : ("extract" as const),
  }));
  const merged = [...fromExtracted, ...fromDrawer];
  const blocking = merged.filter((i) => i.severity === "blocking");
  const warnings = merged.filter((i) => i.severity === "warning");

  return (
    <div className={cn("rounded-lg border border-border-default bg-white", className)}>
      <div className="border-b border-border-subtle px-2.5 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Validation</p>
      </div>
      <ul className="max-h-[220px] space-y-1.5 overflow-y-auto p-2.5 text-[11px]">
        {blocking.length === 0 && warnings.length === 0 && (
          <li className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All checks passed
          </li>
        )}
        {blocking.map((i) => (
          <li key={i.id} className="flex gap-1.5 text-red-700">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" title="Blocking" />
            <span>
              {i.tag === "rule" && (
                <span className="mr-1 rounded bg-red-100 px-1 py-px text-[9px] font-semibold uppercase text-red-800">
                  Rule
                </span>
              )}
              {i.message}
            </span>
          </li>
        ))}
        {warnings.map((i) => (
          <li key={i.id} className="flex gap-1.5 text-amber-700">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Warning" />
            <span>
              {i.tag === "rule" && (
                <span className="mr-1 rounded bg-amber-100 px-1 py-px text-[9px] font-semibold uppercase text-amber-900">
                  Rule
                </span>
              )}
              {i.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
