import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CollectionComment } from "@/data/collections-comments";
import { setCollectionCommentPinned } from "@/data/collections-comments";
import { PinnedCardStack } from "@/components/notes/PinnedCardStack";
import { cn } from "@/lib/utils";

interface Props {
  comments: CollectionComment[];
  customerId: string;
  onUnpin: () => void;
}

function commentToCard(comment: CollectionComment) {
  return {
    id: comment.id,
    text: comment.body,
    authorName: comment.authorName,
    timestamp: comment.createdAt,
    locationLabel: "Collections",
  };
}

export function PinnedCommentsBar({ comments, customerId, onUnpin }: Props) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const cards = useMemo(() => comments.map(commentToCard), [comments]);

  if (comments.length === 0) {
    return null;
  }

  const handleUnpin = (commentId: string) => {
    setCollectionCommentPinned(customerId, commentId, false);
    onUnpin();
  };

  const handleCommentClick = () => {
    navigate(`/customers/${customerId}?tab=payment`);
  };

  return (
    <div
      className={cn(
        "relative overflow-visible pl-4 pr-8 pb-4",
        isHovered && "z-30",
      )}
      aria-label="Pinned collection comments"
    >
      <PinnedCardStack
        cards={cards}
        onNavigate={handleCommentClick}
        onTogglePin={handleUnpin}
        unpinTitle="Unpin comment"
        overlayOnHover
        onHoverChange={setIsHovered}
      />
    </div>
  );
}
