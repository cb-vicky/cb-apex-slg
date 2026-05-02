import { useEffect } from "react";
import { useDrawerStore } from "@/store/useDrawerStore";
import { IngestDrawer } from "@/components/transitions/IngestDrawer";
import { InvoiceApprovalDrawer } from "@/components/approvals/InvoiceApprovalDrawer";

/**
 * Global overlay drawer — total width ~72vw from `sm` up (ingest + preview together).
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

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close drawer backdrop"
        onClick={closeDrawer}
      />
      <div className="relative flex h-full w-full max-w-[100vw] flex-col border-l border-border-default bg-white shadow-[-12px_0_32px_rgba(0,0,0,0.12)] sm:w-[72vw] sm:max-w-[72vw]">
        {mode === "invoice_approval" && entityType === "invoice" && entityId ? (
          <InvoiceApprovalDrawer
            key={`inv-approval-${entityId}-${context?.queueItemId ?? ""}`}
            invoiceId={entityId}
            queueItemId={context?.queueItemId}
            onClose={closeDrawer}
          />
        ) : (
          <IngestDrawer
            key={`${entityType}-${entityId ?? ""}-${context?.contractId ?? ""}-${mode ?? ""}-${context?.latePhase ?? ""}`}
            entityType={entityType}
            mode={mode}
            entityId={entityId}
            context={context}
            onClose={closeDrawer}
          />
        )}
      </div>
    </div>
  );
}
