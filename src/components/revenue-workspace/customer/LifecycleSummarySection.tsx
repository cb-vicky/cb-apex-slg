import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getQuotesForCustomer, getContractsForCustomer, getInvoices, getTasks } from "@/data/mock-data";
import { currency, shortDate } from "@/lib/utils";
import { FileText, ScrollText, Receipt, ListChecks } from "lucide-react";

interface Props {
  customerId: string;
}

export function LifecycleSummarySection({ customerId }: Props) {
  const customerQuotes = getQuotesForCustomer(customerId);
  const customerContracts = getContractsForCustomer(customerId);
  const customerInvoices = getInvoices(customerId);
  const customerTasks = getTasks(customerId);

  const pendingInvoices = customerInvoices.filter((i) => i.status === "Pending Review");
  const overdueInvoices = customerInvoices.filter((i) => i.status === "Overdue");
  const openTasks = customerTasks.filter((t) => t.status === "Open");

  return (
    <SectionCard title="Lifecycle Summary">
      <div className="grid grid-cols-2 gap-4">
        {/* Quotes */}
        <div className="rounded-md border border-border-default p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-text-muted" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Quotes</span>
            <span className="text-[11px] text-text-muted">({customerQuotes.length})</span>
          </div>
          {customerQuotes.length === 0 ? (
            <p className="text-[12px] text-text-muted">No quotes</p>
          ) : (
            <div className="space-y-1.5">
              {customerQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{q.id}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <span className="text-text-secondary">{currency(q.tcv)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contracts */}
        <div className="rounded-md border border-border-default p-3">
          <div className="flex items-center gap-2 mb-2">
            <ScrollText size={14} className="text-text-muted" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Contracts</span>
            <span className="text-[11px] text-text-muted">({customerContracts.length})</span>
          </div>
          {customerContracts.length === 0 ? (
            <p className="text-[12px] text-text-muted">No contracts</p>
          ) : (
            <div className="space-y-1.5">
              {customerContracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{c.id}</span>
                    <StatusBadge status={c.enforcement.enforcementStatus} />
                  </div>
                  <span className="text-text-secondary">{shortDate(c.renewalDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="rounded-md border border-border-default p-3">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={14} className="text-text-muted" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Invoices</span>
          </div>
          <div className="space-y-1 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Pending review</span>
              <span className="font-medium text-amber-600">{pendingInvoices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Overdue</span>
              <span className="font-medium text-red-600">{overdueInvoices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Total</span>
              <span className="font-medium text-text-primary">{customerInvoices.length}</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-md border border-border-default p-3">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={14} className="text-text-muted" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary">Open Tasks</span>
            <span className="text-[11px] text-text-muted">({openTasks.length})</span>
          </div>
          {openTasks.length === 0 ? (
            <p className="text-[12px] text-text-muted">No open tasks</p>
          ) : (
            <div className="space-y-1.5">
              {openTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-start gap-2 text-[13px]">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${t.priority === "High" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div>
                    <p className="font-medium text-text-primary">{t.title}</p>
                    <p className="text-[12px] text-text-secondary">{t.assignee} · Due {shortDate(t.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
