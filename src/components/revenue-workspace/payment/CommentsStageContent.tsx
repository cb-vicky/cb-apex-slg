import { useMemo } from "react";
import type { Customer } from "@/data/mock-data";
import { getCollectionCommentsForCustomer } from "@/data/collections-comments";
import { AddCollectionCommentForm } from "./AddCollectionCommentForm";
import { CommentsListView } from "./CommentsListView";
import { CommentsActionsBar } from "./CommentsActionsBar";
import { useCommentsChrome } from "./CommentsChromeContext";

interface Props {
  customer: Customer;
  addCommentFlowOpen?: boolean;
}

export function CommentsStageContent({ customer, addCommentFlowOpen = false }: Props) {
  const chrome = useCommentsChrome();

  const comments = useMemo(
    () => getCollectionCommentsForCustomer(customer.id),
    [customer.id, chrome?.commentsRevision],
  );

  if (addCommentFlowOpen) {
    return (
      <AddCollectionCommentForm
        customerId={customer.id}
        authorName={customer.billingOwner}
        defaultPinned={chrome?.addCommentPinByDefault ?? false}
        onCancel={() => chrome?.closeAddCommentTab()}
        onSave={() => {
          chrome?.refreshComments();
          chrome?.closeAddCommentTab();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-11 shrink-0 items-center justify-end">
        <CommentsActionsBar onAddComment={() => chrome?.openAddCommentTab()} />
      </div>
      <CommentsListView
        comments={comments}
        customerId={customer.id}
        onRefresh={() => chrome?.refreshComments()}
      />
    </div>
  );
}
