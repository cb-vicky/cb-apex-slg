import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { Invoice } from "@/data/mock-data";
import {
  formatDueStatusFromDays,
  ReceivableDueStatusBadge,
} from "./ReceivableDueStatusBadge";

/** Days until due (negative = past due). */
function daysUntilDue(dueDate: string): number {
  return Math.round((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function formatReceivableStatus(invoice: Invoice): string {
  const days = daysUntilDue(invoice.dueDate);

  if (invoice.status === "Overdue" || days < 0) {
    return formatDueStatusFromDays(days);
  }

  if (invoice.status === "Pending Review") {
    return formatDueStatusFromDays(days);
  }

  return invoice.status;
}

function ReceivableStatusBadge({ invoice }: { invoice: Invoice }) {
  const label = formatReceivableStatus(invoice);
  const isOverdue = label.startsWith("Overdue");
  const isDueIn = label.startsWith("Due");

  if (isOverdue || isDueIn) {
    return <ReceivableDueStatusBadge label={label} />;
  }

  return <StatusBadge status={label} />;
}

interface Props {
  invoices: Invoice[];
}

export function OpenReceivablesSection({ invoices }: Props) {
  const openInvoices = invoices.filter((i) => i.status !== "Paid");

  if (openInvoices.length === 0) {
    return (
      <SectionCard title="Outstanding Invoice">
        <p className="text-[13px] text-text-muted">No open receivables for this customer.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Outstanding Invoice">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="pb-2 pr-2 font-medium">Invoice</th>
            <th className="pb-2 pr-2 font-medium">Date</th>
            <th className="pb-2 pr-2 font-medium">Due Date</th>
            <th className="pb-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {openInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border-subtle last:border-0">
                <td className="py-1.5 pr-2 font-medium text-text-primary">{inv.id}</td>
                <td className="py-1.5 pr-2 text-text-secondary">{shortDate(inv.date)}</td>
                <td className="py-1.5 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-text-secondary">{shortDate(inv.dueDate)}</span>
                    <ReceivableStatusBadge invoice={inv} />
                  </div>
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium text-text-primary">{currency(inv.amount)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
