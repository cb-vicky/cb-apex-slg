import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { Invoice } from "@/data/mock-data";
import type { CollectionCase } from "@/data/billing-data";

function ageBucket(dueDate: string): string {
  const days = Math.round((Date.now() - new Date(dueDate).getTime()) / 86400000);
  if (days < 0) return "Not yet due";
  if (days <= 30) return "0–30d";
  if (days <= 60) return "31–60d";
  if (days <= 90) return "61–90d";
  return "90+d";
}

interface Props {
  invoices: Invoice[];
  cases: CollectionCase[];
}

export function OpenReceivablesSection({ invoices, cases }: Props) {
  const caseMap = new Map(cases.map((c) => [c.invoiceId, c]));
  const openInvoices = invoices.filter((i) => i.status !== "Paid");

  if (openInvoices.length === 0) {
    return (
      <SectionCard title="Open Receivables Ledger">
        <p className="text-[13px] text-text-muted">No open receivables for this customer.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Open Receivables Ledger">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="pb-2 pr-2 font-medium">Invoice</th>
            <th className="pb-2 pr-2 font-medium">Date</th>
            <th className="pb-2 pr-2 font-medium">Due Date</th>
            <th className="pb-2 pr-2 font-medium text-right">Amount</th>
            <th className="pb-2 pr-2 font-medium">Age</th>
            <th className="pb-2 pr-2 font-medium">Status</th>
            <th className="pb-2 pr-2 font-medium">Dispute</th>
            <th className="pb-2 font-medium">Owner</th>
          </tr>
        </thead>
        <tbody>
          {openInvoices.map((inv) => {
            const c = caseMap.get(inv.id);
            return (
              <tr key={inv.id} className="border-b border-border-subtle last:border-0">
                <td className="py-1.5 pr-2 font-medium text-text-primary">{inv.id}</td>
                <td className="py-1.5 pr-2 text-text-secondary">{shortDate(inv.date)}</td>
                <td className="py-1.5 pr-2 text-text-secondary">{shortDate(inv.dueDate)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums font-medium text-text-primary">{currency(inv.amount)}</td>
                <td className="py-1.5 pr-2">
                  <span className={inv.status === "Overdue" ? "font-medium text-red-600" : "text-text-secondary"}>
                    {ageBucket(inv.dueDate)}
                  </span>
                </td>
                <td className="py-1.5 pr-2"><StatusBadge status={c?.stage ?? inv.status} /></td>
                <td className="py-1.5 pr-2 text-[12px] text-text-muted">{inv.disputeReason || "—"}</td>
                <td className="py-1.5 text-text-secondary">{c?.owner ?? inv.owner}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionCard>
  );
}
