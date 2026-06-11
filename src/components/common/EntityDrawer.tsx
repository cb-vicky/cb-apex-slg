import { useEffect } from "react";
import { useDrawerStore } from "@/store/useDrawerStore";
import { InvoiceApprovalDrawer } from "@/components/approvals/InvoiceApprovalDrawer";

/**
 * Global full-page overlay for invoice approval drawer.
 * Note: Contract ingestion is now handled via the Customer 360 Ingestion tab.
 */
export function EntityDrawer() {
  const { isOpen, closeDrawer, entityType, mode, entityId, context } = useDrawerStore();

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  // Only render for invoice approval mode
  if (mode !== "invoice_approval" || entityType !== "invoice" || !entityId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div
        className="h-full w-[25%] shrink-0 bg-black/30"
        onClick={closeDrawer}
        aria-hidden
      />
      {/* Drawer panel - 75% width */}
      <div className="relative flex h-full min-h-0 w-[75%] flex-col overflow-hidden rounded-l-[24px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)]">
        <InvoiceApprovalDrawer
          key={`inv-approval-${entityId}-${context?.queueItemId ?? ""}`}
          invoiceId={entityId}
          queueItemId={context?.queueItemId}
          onClose={closeDrawer}
        />
      </div>
    </div>
  );
}
