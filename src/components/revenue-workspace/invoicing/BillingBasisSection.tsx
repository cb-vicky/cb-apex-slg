import { SectionCard, KV } from "@/components/ui/primitives";
import type { InvoiceEnrichment, ReviewCheck } from "@/data/billing-data";
import type { Invoice, Contract } from "@/data/mock-data";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const checkIcon: Record<ReviewCheck["status"], React.ReactNode> = {
  pass: <CheckCircle2 size={14} className="text-emerald-500" />,
  warn: <AlertTriangle size={14} className="text-amber-500" />,
  fail: <XCircle size={14} className="text-red-500" />,
};

interface Props {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
  contract?: Contract;
}

export function BillingBasisSection({ invoice, enrichment, contract }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Billing Basis & Traceability">
        <div className="grid grid-cols-2 gap-x-8 gap-y-0">
          <KV label="Source Contract" value={invoice.contractId || "—"} />
          {contract && <KV label="Contract Term" value={contract.term} />}
          {contract && <KV label="Billing Frequency" value={contract.billingFrequency} />}
          {contract && <KV label="Co-term Behavior" value={contract.coTermBehavior} />}
          {contract && <KV label="Min Annual Commit" value={`$${contract.minAnnualCommit.toLocaleString()}`} />}
          {contract && <KV label="Prepaid Credit Balance" value={`$${contract.prepaidCreditBalance.toLocaleString()} / $${contract.prepaidCreditTotal.toLocaleString()}`} />}
          {enrichment && <KV label="Billing Period" value={`${enrichment.billingPeriodStart} – ${enrichment.billingPeriodEnd}`} />}
          {invoice.holdReason && <KV label="Hold Reason" value={<span className="text-red-600 font-medium">{invoice.holdReason}</span>} />}
        </div>
        {contract && contract.amendments.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <span className="font-semibold">Amendment impact:</span> {contract.amendments.length} amendment(s) may affect this invoice period.
            Latest: {contract.amendments[contract.amendments.length - 1].description}
          </div>
        )}
      </SectionCard>

      {enrichment && enrichment.reviewChecklist.length > 0 && (
        <SectionCard title="Review Checklist / Validation">
          <div className="grid grid-cols-2 gap-2">
            {enrichment.reviewChecklist.map((check) => (
              <div key={check.label} className="flex items-center gap-2 py-1 text-[13px]">
                {checkIcon[check.status]}
                <span className={check.status === "fail" ? "font-medium text-red-700" : check.status === "warn" ? "text-amber-700" : "text-text-primary"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          {enrichment.reviewChecklist.some((c) => c.status === "fail") && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              <span className="font-semibold">Blocked:</span> One or more validation checks have failed. Resolve before sending.
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
