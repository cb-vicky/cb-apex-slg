import { useIngestContext } from "@/context/IngestContext";

/** Pending approvals + in-flight renewal closures for sidebar / shell indicators. */
export function usePendingWorkbenchCounts() {
  const ctx = useIngestContext();
  const pendingApprovalCount = ctx.approvalRequests.filter(
    (r) => r.status === "Pending Approval",
  ).length;
  const inflightClosures = Object.keys(ctx.pendingRenewalIngestions).length;
  return { pendingApprovalCount, inflightClosures };
}
