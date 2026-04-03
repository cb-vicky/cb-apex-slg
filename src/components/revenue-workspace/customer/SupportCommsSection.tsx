import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getTicketsForCustomer, getEmailsForCustomer } from "@/data/support-data";
import { shortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare } from "lucide-react";

interface Props {
  customerId: string;
}

const sentimentColor: Record<string, string> = {
  positive: "text-emerald-600",
  neutral: "text-text-secondary",
  negative: "text-red-600",
};

const sentimentLabel: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

export function SupportCommsSection({ customerId }: Props) {
  const tickets = getTicketsForCustomer(customerId);
  const emails = getEmailsForCustomer(customerId);
  const openTickets = tickets.filter((t) => t.status !== "Resolved");
  const escalated = tickets.filter((t) => t.status === "Escalated");

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Support Tickets"
        actions={
          <span className="text-[12px] text-text-muted">
            {openTickets.length} open · {escalated.length} escalated
          </span>
        }
      >
        {tickets.length === 0 ? (
          <p className="text-[13px] text-text-muted">No support tickets</p>
        ) : (
          <div className="space-y-2">
            {tickets.slice(0, 4).map((ticket) => (
              <div key={ticket.id} className="flex items-start gap-2.5 rounded-md border border-border-default px-3 py-2">
                <MessageSquare size={14} className="mt-0.5 shrink-0 text-text-muted" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary truncate">{ticket.subject}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-[12px] text-text-secondary">
                    {ticket.category} · {ticket.assignee} · Updated {shortDate(ticket.lastUpdatedAt)}
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                  ticket.priority === "High" ? "border-red-200 bg-red-50 text-red-700"
                    : ticket.priority === "Medium" ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-gray-50 text-gray-600",
                )}>
                  {ticket.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Email Communications"
        actions={<span className="text-[12px] text-text-muted">{emails.length} recent</span>}
      >
        {emails.length === 0 ? (
          <p className="text-[13px] text-text-muted">No email summaries</p>
        ) : (
          <div className="space-y-2">
            {emails.slice(0, 4).map((email) => (
              <div key={email.id} className="flex items-start gap-2.5 rounded-md border border-border-default px-3 py-2">
                <Mail size={14} className="mt-0.5 shrink-0 text-text-muted" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary truncate">{email.subject}</span>
                    <span className={cn("text-[11px] font-medium", sentimentColor[email.sentiment])}>
                      {sentimentLabel[email.sentiment]}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary">
                    {email.from} · {shortDate(email.date)}
                  </p>
                  <p className="mt-1 text-[12px] text-text-muted leading-relaxed">{email.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
