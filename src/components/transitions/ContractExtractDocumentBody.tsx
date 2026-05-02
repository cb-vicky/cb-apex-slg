import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import type { ExtractedContract } from "@/data/ingest-data";

/** Monospace “signed agreement” body — same sample style as Queue ingest + Approval contract tab. */
export function ContractExtractDocumentBody({ doc }: { doc: ExtractedContract }) {
  const isEarlyRenewal = doc.docId === "sample3";
  const products = doc.products;

  return (
    <div className="space-y-4 font-mono text-[12px] leading-relaxed text-text-secondary">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">Master Subscription Agreement</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
          Order Form — {isEarlyRenewal ? "Early renewal" : "New Business"}
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted">Document: {doc.documentName}</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">PARTIES</p>
        <p className="mt-1">
          <span className="text-text-muted">Provider: </span>
          Chargebee US – Acme Merchant ("Provider")
        </p>
        <p className="mt-0.5">
          <span className="text-text-muted">Customer: </span>
          <span className={cn(!doc.customerFound && "text-red-700 underline decoration-dotted")}>
            {doc.customerLegalEntity}
          </span>{" "}
          ("Customer")
        </p>
        {!doc.customerFound && <p className="mt-1 font-medium text-red-700">Customer not found in system</p>}
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">1. TERM</p>
        <p className="mt-1">
          {doc.terms.term} commencing {doc.terms.startDate} and ending {doc.terms.endDate}.
        </p>
        <p className="mt-0.5">
          Auto-renewal: {doc.terms.autoRenew ? "Yes — 60-day cancellation notice required." : "No."}
        </p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">2. SUBSCRIPTION SERVICES</p>
        <table className="mt-2 w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="pb-1 text-left font-semibold text-text-muted">Product / SKU</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Qty</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Unit Price</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Discount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                <td className="py-1 pr-2">
                  <span className={cn(!p.matched && "text-amber-700 underline decoration-dotted")}>{p.extractedName}</span>
                  <span className="ml-1 text-text-muted">({p.extractedSku})</span>
                  {!p.matched && <span className="ml-1 text-amber-600">⚠ unmatched</span>}
                </td>
                <td className="py-1 text-right">{p.quantity || "—"}</td>
                <td className="py-1 text-right">
                  {p.unitPrice < 1 ? `$${p.unitPrice.toFixed(3)}/cr` : `$${p.unitPrice.toLocaleString()}`}
                </td>
                <td className="py-1 text-right">{p.discount > 0 ? `${p.discount}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">3. PRICING AND COMMITMENT</p>
        <div className="mt-1 space-y-0.5">
          <p>
            Total Contract Value (TCV):{" "}
            <span className="font-semibold text-text-primary">{currency(doc.terms.tcv)}</span>
          </p>
          <p>
            Annual Recurring Revenue (ARR):{" "}
            <span className="font-semibold text-text-primary">{currency(doc.terms.arr)}</span>
          </p>
          {doc.terms.minCommit > 0 && (
            <p>
              Minimum Annual Commitment:{" "}
              <span className="font-semibold text-text-primary">{currency(doc.terms.minCommit)}</span>
            </p>
          )}
          {doc.terms.prepaidCredits > 0 && (
            <p>
              Prepaid AI Credits:{" "}
              <span className="font-semibold text-text-primary">{doc.terms.prepaidCredits.toLocaleString()} credits</span>
            </p>
          )}
        </div>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">4. PAYMENT TERMS</p>
        <p className="mt-1">Billing frequency: {doc.terms.billingFrequency}.</p>
        <p className="mt-0.5">Payment due: {doc.terms.paymentTerms} from invoice date.</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">5. GOVERNING LAW</p>
        <p className="mt-1">This Agreement shall be governed by the laws of the State of Delaware.</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">SIGNATURES</p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-muted">For Provider:</p>
            <p className="mt-3 border-b border-border-default pb-1 font-semibold text-text-primary">Sarah Chen</p>
            <p className="text-text-muted">VP Revenue, Chargebee</p>
            <p className="text-text-muted">Date: {shortDate("2026-04-10")}</p>
          </div>
          <div>
            <p className="text-text-muted">For Customer:</p>
            <p className="mt-3 border-b border-border-default pb-1 font-semibold text-text-primary">
              {isEarlyRenewal ? "Sandra Kim" : "David Chen"}
            </p>
            <p className="text-text-muted">CFO, {isEarlyRenewal ? "Verdant Health" : "Zenith Analytics Inc."}</p>
            <p className="text-text-muted">Date: {shortDate(isEarlyRenewal ? "2026-04-19" : "2026-04-12")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
