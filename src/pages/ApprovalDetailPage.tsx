import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { InvoiceApprovalDrawer } from "@/components/approvals/InvoiceApprovalDrawer";

/**
 * Full-page invoice approval view: `/approvals/invoices/:invoiceId?ingestId=…`
 */
export function ApprovalDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ingestId = searchParams.get("ingestId") ?? undefined;

  if (!invoiceId) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        <p>Invoice ID not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <InvoiceApprovalDrawer
        invoiceId={invoiceId}
        queueItemId={ingestId}
        onClose={() => navigate("/?tab=approvals")}
      />
    </div>
  );
}
