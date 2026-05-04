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
    <div className="border-y border-border-default bg-white">
      <div className="flex h-[36px] shrink-0 items-center justify-between border-b border-border-subtle bg-gray-50 pl-3 pr-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider leading-none text-text-muted tabular-nums">
          {title} ({count})
        </h3>
        <button
          type="button"
          onClick={() => navigate(viewAllPath)}
          className="inline-flex items-center gap-0.5 text-[12px] font-medium leading-none text-cb-orange transition-colors hover:text-cb-orange/80"
        >
          View all
          <ChevronRight size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="divide-y divide-border-subtle">{children}</div>
    </div>
  );
}
