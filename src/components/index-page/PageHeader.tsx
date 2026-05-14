import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  title: string;
  backLabel?: string;
  backPath?: string;
  filterLabel?: string;
  createLabel?: string;
  onCreateClick?: () => void;
  viewToggle?: ReactNode;
  /**
   * Optional secondary action buttons rendered to the LEFT of the primary
   * createLabel button. Use for tertiary actions like "Connect" / "Import".
   */
  secondaryActions?: ReactNode;
}

export function PageHeader({
  title,
  backLabel,
  backPath,
  filterLabel,
  createLabel,
  onCreateClick = () => {},
  viewToggle,
  secondaryActions,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex h-[48px] items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backLabel && backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-1 font-sora text-[14px] font-medium text-cb-orange transition-colors hover:text-cb-orange/80"
          >
            <ArrowLeft size={15} />
            {backLabel}
          </button>
        )}
        <h1 className="text-[24px] font-semibold leading-none tracking-tight text-text-primary">{title}</h1>
        {filterLabel && (
          <span className="rounded-md border border-cb-orange/30 bg-cb-orange/10 px-2 py-0.5 text-[12px] font-medium leading-4 text-cb-orange">
            {filterLabel}
          </span>
        )}
        {viewToggle}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {secondaryActions}
        {createLabel ? (
          <button
            type="button"
            onClick={onCreateClick}
            className="shrink-0 rounded-md bg-blue-600 px-3.5 py-2 font-sora text-[14px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
