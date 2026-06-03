import type { CollectionComment } from "@/data/collections-comments";
import { setCollectionCommentPinned } from "@/data/collections-comments";
import { CollectionCommentCard } from "./CollectionCommentCard";

interface Props {
  comments: CollectionComment[];
  customerId: string;
  onRefresh: () => void;
}

export function CommentsListView({ comments, customerId, onRefresh }: Props) {
  if (comments.length === 0) {
    return (
      <div className="rounded-3xl border border-border-default bg-white px-6 py-12 text-center">
        <p className="text-[13px] text-text-muted">No comments for this customer yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.map((comment) => (
        <CollectionCommentCard
          key={comment.id}
          comment={comment}
          onTogglePin={() => {
            setCollectionCommentPinned(customerId, comment.id, !comment.pinned);
            onRefresh();
          }}
        />
      ))}
    </div>
  );
}
