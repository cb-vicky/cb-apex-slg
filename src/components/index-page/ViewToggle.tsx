import { Layers, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "groups" | "all";

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  /** Plural resource title, e.g. "Customers" → label "All Customers". */
  resourcePlural: string;
}

export function ViewToggle({ value, onChange, resourcePlural }: Props) {
  const allLabel = `All ${resourcePlural}`;

  return (
    <div className="flex items-center rounded border border-border-default bg-surface-muted p-px">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium leading-tight transition-colors",
          value === "all"
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <List size={10} strokeWidth={2} />
        <span>{allLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("groups")}
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium leading-tight transition-colors",
          value === "groups"
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        <Layers size={10} strokeWidth={2} />
        <span>Focus</span>
      </button>
    </div>
  );
}
