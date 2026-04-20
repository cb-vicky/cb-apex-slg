import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getQuotesForCustomer, getContractsForCustomer, getInvoices } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";

interface Props {
  customerId: string;
}

function statusPair(status: string) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      <span className="text-[12px] text-text-secondary">STATUS:</span>
      <StatusBadge status={status} />
    </span>
  );
}

export function LifecycleSummarySection({ customerId }: Props) {
  const customerQuotes = getQuotesForCustomer(customerId);
  const customerContracts = getContractsForCustomer(customerId);
  const customerInvoices = getInvoices(customerId);

  const attentionInvoices = customerInvoices.filter(
    (i) => i.status === "Pending Review" || i.status === "Overdue",
  );
  const sortedAttention = [...attentionInvoices].sort((a, b) => {
    if (a.status !== b.status) return a.status === "Overdue" ? -1 : 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="flex flex-col gap-3">
      <SectionCard title="Quotes">
        {customerQuotes.length === 0 ? (
          <p className="text-[12px] text-text-muted">No quotes</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {customerQuotes.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]"
              >
                <span className="font-medium text-text-primary">{q.id}</span>
                <span className="text-text-secondary tabular-nums">TCV: {currency(q.tcv)}</span>
                {statusPair(q.status)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Contracts">
        {customerContracts.length === 0 ? (
          <p className="text-[12px] text-text-muted">No contracts</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {customerContracts.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]"
              >
                <span className="font-medium text-text-primary">{c.id}</span>
                <span className="text-text-secondary tabular-nums">RENEWAL: {shortDate(c.renewalDate)}</span>
                {statusPair(c.enforcement.enforcementStatus)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Invoices">
        {sortedAttention.length === 0 ? (
          <p className="text-[12px] text-text-muted">No pending or overdue invoices</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {sortedAttention.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-[13px]"
              >
                <span className="font-medium text-text-primary">{inv.id}</span>
                <span className="text-text-secondary">CONTRACT: {inv.contractId}</span>
                <span className="text-text-secondary tabular-nums">AMOUNT: {currency(inv.amount)}</span>
                <span className="text-text-secondary tabular-nums">DUE: {shortDate(inv.dueDate)}</span>
                {statusPair(inv.status)}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
