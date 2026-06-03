import type { CollectionComment } from "@/data/collections-comments";
import { commentDayLabel } from "@/data/collections-comments";
import { cn } from "@/lib/utils";

interface Props {
  comment: CollectionComment;
}

export function RecentCollectionCommentBanner({ comment }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/80 to-orange-50/40 px-4 py-3",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex items-center rounded px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-cb-orange)]">
          Comment
        </span>
        <span className="text-[12px] font-medium text-orange-900/70">{comment.authorName}</span>
        <span className="text-[11px] text-orange-800/50">·</span>
        <span className="text-[11px] text-orange-800/60">{commentDayLabel(comment.createdAt)}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-orange-950/90">{comment.body}</p>
    </div>
  );
}
