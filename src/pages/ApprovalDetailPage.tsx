import { WorkbenchHome } from "@/pages/workbench/WorkbenchHome";
import { useApprovalUrlDrawerSync } from "@/hooks/useApprovalUrlDrawerSync";

/**
 * Deep link host: `/approvals/invoices/:invoiceId?ingestId=…&step=…`
 * renders Workbench with the global approval / ingest drawer opened from the URL.
 */
export function ApprovalDetailPage() {
  useApprovalUrlDrawerSync();
  return <WorkbenchHome />;
}
