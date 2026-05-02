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
      <div
        className="flex h-[30px] shrink-0 items-center justify-between border-b border-border-subtle px-4"
        style={{ backgroundColor: "#F7F7F8" }}
      >
        <h3 className="text-[11px] font-semibold leading-none text-[#62676D] tabular-nums">
          {title} ({count})
        </h3>
        <button
          type="button"
          onClick={() => navigate(viewAllPath)}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium leading-none text-cb-orange transition-colors hover:text-cb-orange/80"
        >
          View all
          <ChevronRight size={12} strokeWidth={2} />
        </button>
      </div>
      <div className="divide-y divide-border-subtle [&>button:nth-child(even)]:bg-[#F9FAFB]">{children}</div>
    </div>
  );
}
