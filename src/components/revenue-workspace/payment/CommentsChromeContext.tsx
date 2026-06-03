import { createContext, useContext, type ReactNode } from "react";

export interface CommentsChromeValue {
  commentsCount: number;
  commentsRevision: number;
  addCommentPinByDefault: boolean;
  refreshComments: () => void;
  openAddCommentTab: (options?: { pinByDefault?: boolean }) => void;
  closeAddCommentTab: () => void;
}

const CommentsChromeContext = createContext<CommentsChromeValue | null>(null);

export function CommentsChromeProvider({
  value,
  children,
}: {
  value: CommentsChromeValue;
  children: ReactNode;
}) {
  return (
    <CommentsChromeContext.Provider value={value}>{children}</CommentsChromeContext.Provider>
  );
}

export function useCommentsChrome() {
  return useContext(CommentsChromeContext);
}
