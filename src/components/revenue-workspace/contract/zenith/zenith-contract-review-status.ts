export const ZENITH_CONTRACT_REVIEW_STATUSES = [
  {
    id: "in_review",
    label: "In review",
    pillClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    id: "awaiting_data",
    label: "Awaiting data",
    pillClass: "border-blue-200 bg-blue-50 text-blue-800",
  },
  {
    id: "need_clarification",
    label: "Need clarification",
    pillClass: "border-orange-200 bg-orange-50 text-orange-900",
  },
  {
    id: "on_hold",
    label: "On hold",
    pillClass: "border-gray-200 bg-gray-100 text-gray-700",
  },
] as const;

export type ZenithContractReviewStatus = (typeof ZENITH_CONTRACT_REVIEW_STATUSES)[number]["id"];

export const DEFAULT_ZENITH_CONTRACT_REVIEW_STATUS: ZenithContractReviewStatus = "in_review";

export function getZenithContractReviewStatusOption(status: ZenithContractReviewStatus) {
  return (
    ZENITH_CONTRACT_REVIEW_STATUSES.find((option) => option.id === status) ??
    ZENITH_CONTRACT_REVIEW_STATUSES[0]
  );
}

const ZENITH_REVIEW_BASE_LABEL =
  ZENITH_CONTRACT_REVIEW_STATUSES.find((o) => o.id === "in_review")!.label;

/** Pill + workspace tab: base "In review", or "In review - {sub-status}" when narrowed. */
export function formatZenithContractReviewStatusLabel(status: ZenithContractReviewStatus): string {
  const option = getZenithContractReviewStatusOption(status);
  if (status === "in_review") return option.label;
  return `${ZENITH_REVIEW_BASE_LABEL} - ${option.label}`;
}
