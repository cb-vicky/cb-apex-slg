import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  title: string;
  count: number;
  viewAllPath: string;
  children: ReactNode;
}

export function GroupedSection({ title, count, viewAllPath, children }: Props) {
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <div className="rounded-lg border border-border-default bg-white">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
            {count}
          </span>
        </div>
        <button
          onClick={() => navigate(viewAllPath)}
          className="inline-flex items-center gap-0.5 text-[12px] font-medium text-cb-orange transition-colors hover:text-cb-orange/80"
        >
          View all
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-border-subtle">{children}</div>
    </div>
  );
}
