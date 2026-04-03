import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  backLabel?: string;
  backPath?: string;
  filterLabel?: string;
}

export function PageHeader({ title, backLabel, backPath, filterLabel }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backLabel && backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-cb-orange transition-colors hover:text-cb-orange/80"
          >
            <ArrowLeft size={14} />
            {backLabel}
          </button>
        )}
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {filterLabel && (
          <span className="rounded-md border border-cb-orange/30 bg-cb-orange/5 px-2 py-0.5 text-[11px] font-medium text-cb-orange">
            {filterLabel}
          </span>
        )}
      </div>
    </div>
  );
}
