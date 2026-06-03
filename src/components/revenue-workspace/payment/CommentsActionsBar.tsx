import { ChevronRight } from "lucide-react";

const PRIMARY_BTN_CLASS =
  "inline-flex items-center justify-center gap-1 rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

interface Props {
  onAddComment: () => void;
}

export function CommentsActionsBar({ onAddComment }: Props) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <button type="button" onClick={onAddComment} className={PRIMARY_BTN_CLASS}>
        Add comment
        <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
      </button>
    </div>
  );
}
