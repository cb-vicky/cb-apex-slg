import { CloseContractPane } from "@/components/contracts/CloseContractPane";
import type { IncomingRenewalPreview } from "@/components/contracts/CloseContractPane";
import { useIngestContext } from "@/context/IngestContext";
import { extractedSample3 } from "@/data/ingest-data";
import { contracts, customers } from "@/data/mock-data";
import type { ContractClosure } from "@/data/mock-data";
import { patchFlowSession } from "@/store/drawer-store";

interface EarlyRenewalClosePriorStepProps {
  queueItemId: string;
}

/**
 * In-drawer step: close the prior active contract before renewal invoice review.
 * Same CloseContractPane as customer workspace, wired into the unified ingest flow.
 */
export function EarlyRenewalClosePriorStep({ queueItemId }: EarlyRenewalClosePriorStepProps) {
  const {
    queueItems,
    applyContractClosure,
    submitInvoiceForApproval,
    showClosureToast,
    pendingRenewalIngestions,
    applyQueueItemOverride,
    addSessionInvoice,
  } = useIngestContext();

  const q = queueItems.find((x) => x.id === queueItemId);
  const contract = q?.activeContractId ? contracts.find((c) => c.id === q.activeContractId) : undefined;
  const customer = q?.customerId ? customers.find((c) => c.id === q.customerId) : undefined;

  const incomingRenewal: IncomingRenewalPreview | undefined =
    q && q.customerId
      ? {
          queueItemId: q.id,
          tcv: extractedSample3.terms.tcv,
          startDate: extractedSample3.terms.startDate,
          endDate: extractedSample3.terms.endDate,
          term: extractedSample3.terms.term,
          minCommit: extractedSample3.terms.minCommit,
          prepaidCredits: extractedSample3.terms.prepaidCredits,
          products: extractedSample3.products.map((p) => ({
            name: p.extractedName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            discount: p.discount,
          })),
        }
      : undefined;

  function goBackToMap() {
    patchFlowSession({ step: "ingest", furthestUnlockedStep: "ingest", ingestReadOnly: false });
  }

  function advanceToInvoiceReview(invoiceId: string) {
    if (!q?.customerId) return;
    patchFlowSession({
      step: "invoice_review",
      furthestUnlockedStep: "invoice_review",
      invoiceId,
      queueItemId: q.id,
      contractId: q.contractId,
      customerId: q.customerId,
      ingestReadOnly: false,
    });
  }

  function handleConfirm(closure: ContractClosure) {
    if (!q || !contract || !customer) return;

    const timestamp = Date.now().toString().slice(-4);
    let approvalDocumentId: string | undefined;

    const updatedClosure: ContractClosure =
      closure.settlementType === "credit_note"
        ? (() => {
            const creditNoteId = `CN-CLOSE-${timestamp}`;
            approvalDocumentId = creditNoteId;
            submitInvoiceForApproval(creditNoteId, {
              customerId: customer.id,
              customerName: customer.name,
              invoiceAmount: closure.finalAmount,
              invoiceDate: new Date().toISOString().slice(0, 10),
              ingestId: q.id,
            });
            return { ...closure, creditNoteId };
          })()
        : closure.settlementType === "termination_charge"
          ? (() => {
              const invId = `INV-TERM-${timestamp}`;
              approvalDocumentId = invId;
              submitInvoiceForApproval(invId, {
                customerId: customer.id,
                customerName: customer.name,
                invoiceAmount: closure.finalAmount,
                invoiceDate: new Date().toISOString().slice(0, 10),
                ingestId: q.id,
              });
              return { ...closure, invoiceId: invId };
            })()
          : { ...closure };

    applyContractClosure(contract.id, updatedClosure);

    if (approvalDocumentId) {
      advanceToInvoiceReview(approvalDocumentId);
      return;
    }

    const pending = q.activeContractId ? pendingRenewalIngestions[q.activeContractId] : undefined;
    const renewalInv = `INV-EARLY-${timestamp}`;
    const renewalContractId = pending?.pendingContractId ?? "CON-2026-0VH1";

    applyQueueItemOverride(q.id, {
      status: "Invoice review",
      contractId: renewalContractId,
      invoiceId: renewalInv,
      customerId: q.customerId,
    });

    const amt = pending?.renewalTcv ?? q.tcv;
    const invDate = new Date().toISOString().slice(0, 10);
    addSessionInvoice({
      id: renewalInv,
      customerId: customer.id,
      contractId: renewalContractId,
      date: invDate,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      amount: amt,
      status: "Pending Review",
      lineItems: [{ description: "Early renewal — first invoice (prototype)", amount: amt }],
      owner: "Alex Nguyen",
    });

    submitInvoiceForApproval(renewalInv, {
      customerId: customer.id,
      customerName: customer.name,
      invoiceAmount: pending?.renewalTcv ?? q.tcv,
      ingestId: q.id,
    });

    advanceToInvoiceReview(renewalInv);

    const settlementText =
      closure.settlementType === "credit_note"
        ? `Credit note for $${closure.finalAmount.toLocaleString()}`
        : closure.settlementType === "termination_charge"
          ? `Termination charge of $${closure.finalAmount.toLocaleString()}`
          : "No financial impact";
    showClosureToast(`Prior contract closed. ${settlementText}`, contract.id);
  }

  if (!q || !contract) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-[13px] text-text-muted">
        Queue item or prior contract not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <CloseContractPane
          contract={contract}
          onDiscard={goBackToMap}
          onConfirm={handleConfirm}
          incomingRenewal={incomingRenewal}
          fromQueueItemId={queueItemId}
        />
      </div>
    </div>
  );
}
