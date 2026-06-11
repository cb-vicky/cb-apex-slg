import type { ZenithContractActiveTab } from "@/components/revenue-workspace/contract/zenith/zenith-contract-tabs";

export interface ZenithContractComment {
  id: string;
  tab: ZenithContractActiveTab;
  anchorLabel: string;
  text: string;
  author: string;
  role: string;
  timestamp: string;
  pinned: boolean;
}

export const ZENITH_COMMENT_CURRENT_USER = {
  name: "Alex Nguyen",
  role: "Billing Ops",
} as const;

export function newZenithCommentId(): string {
  return `zenith-comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function zenithCommentTabLabel(tab: ZenithContractActiveTab): string {
  if (tab === "contract-pdf") return "Contract PDF";
  if (tab === "sow-pdf") return "SOW";
  return tab;
}

export function sortZenithComments(comments: ZenithContractComment[]): ZenithContractComment[] {
  return [...comments].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
