export interface CollectionComment {
  id: string;
  customerId: string;
  body: string;
  authorName: string;
  createdAt: string;
  pinned: boolean;
}

const SEEDED_COMMENTS: CollectionComment[] = [
  {
    id: "comment-seed-echo-1",
    customerId: "cust_echo_001",
    body: "AP team confirmed they are restructuring payment runs in Q2. Coordinate with CSM before escalating.",
    authorName: "Emma Collins",
    createdAt: "2026-05-04T10:30:00Z",
    pinned: true,
  },
];

const runtimeComments: CollectionComment[] = [];
let runtimeCommentCounter = 0;

function sortCommentsNewestFirst(comments: CollectionComment[]): CollectionComment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getCollectionCommentsForCustomer(customerId: string): CollectionComment[] {
  const merged = [
    ...SEEDED_COMMENTS.filter((c) => c.customerId === customerId),
    ...runtimeComments.filter((c) => c.customerId === customerId),
  ];
  return sortCommentsNewestFirst(merged);
}

export function getPinnedCollectionComments(customerId: string): CollectionComment[] {
  return getCollectionCommentsForCustomer(customerId).filter((c) => c.pinned);
}

export function getLatestUnpinnedComment(customerId: string): CollectionComment | null {
  return getCollectionCommentsForCustomer(customerId).find((c) => !c.pinned) ?? null;
}

export function addCollectionComment(params: {
  customerId: string;
  body: string;
  authorName: string;
  pinned: boolean;
}): CollectionComment {
  const entry: CollectionComment = {
    id: `comment-runtime-${++runtimeCommentCounter}`,
    customerId: params.customerId,
    body: params.body.trim(),
    authorName: params.authorName,
    createdAt: new Date().toISOString(),
    pinned: params.pinned,
  };
  runtimeComments.push(entry);
  return entry;
}

export function setCollectionCommentPinned(
  customerId: string,
  commentId: string,
  pinned: boolean,
): void {
  const seeded = SEEDED_COMMENTS.find((c) => c.id === commentId && c.customerId === customerId);
  if (seeded) {
    seeded.pinned = pinned;
    return;
  }
  const runtime = runtimeComments.find((c) => c.id === commentId && c.customerId === customerId);
  if (runtime) runtime.pinned = pinned;
}

export function commentDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function commentTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
