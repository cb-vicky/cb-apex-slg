import { Pin, PinOff } from "lucide-react";
import type { CollectionComment } from "@/data/collections-comments";
import { commentTimestamp } from "@/data/collections-comments";
import { cn } from "@/lib/utils";

interface Props {
  comment: CollectionComment;
  onTogglePin: () => void;
}

export function CollectionCommentCard({ comment, onTogglePin }: Props) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border-default bg-white px-4 py-3.5",
        comment.pinned && "bg-gray-50/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Comment
            </span>
            {comment.pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted">
                <Pin className="h-3 w-3" strokeWidth={2.25} aria-hidden />
                Pinned
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-text-primary">{comment.authorName}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">{commentTimestamp(comment.createdAt)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-text-primary">{comment.body}</p>
        </div>
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={comment.pinned ? "Unpin comment" : "Pin comment"}
          className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
        >
          {comment.pinned ? (
            <PinOff className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Pin className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </article>
  );
}
