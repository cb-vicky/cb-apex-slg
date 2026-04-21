import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { RecentActivitySection, type RecentActivityItem } from "../primitives/RecentActivitySection";
import { currency, shortDate } from "@/lib/utils";
import type { Payment, CreditNote, CollectionCase } from "@/data/billing-data";
import type { Invoice } from "@/data/mock-data";

interface Props {
  payments: Payment[];
  creditNotes: CreditNote[];
  cases: CollectionCase[];
  invoices: Invoice[];
}

export function CashApplicationSection({ payments, creditNotes, cases, invoices }: Props) {
  const timeline = buildCollectionsTimeline(invoices, payments, cases);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Cash Application & Reconciliation">
        {payments.length === 0 ? (
          <p className="text-[13px] text-text-muted">No payments recorded for this customer.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Payment</th>
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium">Method</th>
                <th className="pb-2 pr-2 font-medium text-right">Amount</th>
                <th className="pb-2 pr-2 font-medium">Bank Ref</th>
                <th className="pb-2 pr-2 font-medium">Match Status</th>
                <th className="pb-2 font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pmt) => (
                <tr key={pmt.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-text-primary">{pmt.id}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{shortDate(pmt.receiptDate)}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{pmt.method}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-medium text-text-primary">{currency(pmt.amount)}</td>
                  <td className="py-1.5 pr-2 text-[11px] text-text-muted">{pmt.bankReference}</td>
                  <td className="py-1.5 pr-2"><StatusBadge status={pmt.matchStatus === "matched" ? "Matched" : pmt.matchStatus === "partial" ? "Partial" : pmt.matchStatus === "unapplied" ? "Unapplied" : "Reversed"} /></td>
                  <td className="py-1.5 text-[12px] text-text-secondary">
                    {pmt.allocations.length > 0
                      ? pmt.allocations.map((a) => `${a.invoiceId} (${currency(a.amount)})`).join(", ")
                      : <span className="text-amber-600">Pending match</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {payments.some((p) => p.matchStatus === "unapplied") && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <span className="font-semibold">Unapplied cash:</span> {currency(payments.filter((p) => p.matchStatus === "unapplied").reduce((s, p) => s + p.amount, 0))} received but not yet matched to an invoice. Review bank references for possible match.
          </div>
        )}
      </SectionCard>

      {creditNotes.length > 0 && (
        <SectionCard title="Credits / Write-offs / Offsets">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Credit Note</th>
                <th className="pb-2 pr-2 font-medium text-right">Amount</th>
                <th className="pb-2 pr-2 font-medium">Applied To</th>
                <th className="pb-2 pr-2 font-medium">Reason</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((cn) => (
                <tr key={cn.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-text-primary">{cn.id}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-red-600">-{currency(cn.amount)}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{cn.invoiceId}</td>
                  <td className="py-1.5 pr-2 text-[12px] text-text-secondary">{cn.reason}</td>
                  <td className="py-1.5"><StatusBadge status={cn.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <RecentActivitySection events={timeline} />
    </div>
  );
}

function buildCollectionsTimeline(
  invoices: Invoice[],
  payments: Payment[],
  cases: CollectionCase[],
): RecentActivityItem[] {
  const events: RecentActivityItem[] = [];

  for (const inv of invoices.filter((i) => i.status !== "Paid")) {
    events.push({ date: inv.dueDate, action: `Invoice ${inv.id} due`, actor: "System", detail: `Amount: ${inv.amount.toLocaleString()}` });
  }

  for (const c of cases) {
    for (const f of c.followUpHistory) {
      events.push({ date: f.date, action: f.action, actor: c.owner, detail: f.note });
    }
  }

  for (const pmt of payments) {
    events.push({
      date: pmt.receiptDate,
      action: `Payment received: $${pmt.amount.toLocaleString()}`,
      actor: "System",
      detail: `${pmt.method} – Ref: ${pmt.bankReference} – ${pmt.matchStatus}`,
    });
  }

  return events;
}
