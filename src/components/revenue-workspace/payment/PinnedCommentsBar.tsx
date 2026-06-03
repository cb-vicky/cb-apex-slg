import { MessageSquare, PinOff } from "lucide-react";
import type { CollectionComment } from "@/data/collections-comments";
import {
  commentDayLabel,
  setCollectionCommentPinned,
} from "@/data/collections-comments";
import { cn } from "@/lib/utils";

interface Props {
  comments: CollectionComment[];
  customerId: string;
  onUnpin: () => void;
}

export function PinnedCommentsBar({ comments, customerId, onUnpin }: Props) {
  if (comments.length === 0) {
    return null;
  }

  const handleUnpin = (commentId: string) => {
    setCollectionCommentPinned(customerId, commentId, false);
    onUnpin();
  };

  return (
    <div
      className={cn(
        "flex h-10 min-h-10 items-stretch gap-3 border-b border-orange-200/70",
        "bg-gradient-to-r from-orange-50 via-amber-50/70 to-orange-50/40 px-4 pr-8",
      )}
      aria-label="Pinned collection comments"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
        {comments.map((comment, index) => (
          <div
            key={comment.id}
            className={cn(
              "flex min-w-0 max-w-full items-center gap-2",
              comments.length === 1 && "flex-1",
              index > 0 && "shrink-0 border-l border-orange-200/80 pl-4",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <MessageSquare
                className="h-3 w-3 shrink-0 text-[color:var(--color-cb-orange)]"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="min-w-0 flex-1 truncate text-[12px] leading-none text-orange-950/90">
                <span className="font-semibold text-orange-950">{comment.authorName}</span>
                <span className="text-orange-900/80"> commented on </span>
                <span className="font-medium text-orange-900/70">
                  {commentDayLabel(comment.createdAt)}
                </span>
                <span className="text-orange-800/50"> · </span>
                <span>{comment.body}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUnpin(comment.id);
              }}
              aria-label={`Unpin comment from ${comment.authorName}`}
              title="Unpin"
              className={cn(
                "relative z-10 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center",
                "rounded-md text-orange-700/80 transition-colors",
                "hover:bg-orange-100 hover:text-orange-900",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-400",
              )}
            >
              <PinOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
