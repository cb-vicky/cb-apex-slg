import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { getTicketsForCustomer, getEmailsForCustomer } from "@/data/support-data";
import { shortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

function ticketPriorityHover(priority: "High" | "Medium" | "Low") {
  if (priority === "High") return "group-hover:bg-red-400";
  if (priority === "Medium") return "group-hover:bg-amber-400";
  return "group-hover:bg-gray-400";
}

function emailSentimentHover(sentiment: "positive" | "neutral" | "negative") {
  if (sentiment === "positive") return "group-hover:bg-emerald-500";
  if (sentiment === "negative") return "group-hover:bg-red-500";
  return "group-hover:bg-gray-400";
}

export function SupportCommsSection({ customerId }: Props) {
  const tickets = getTicketsForCustomer(customerId);
  const emails = getEmailsForCustomer(customerId);
  const openTickets = tickets.filter((t) => t.status !== "Resolved");
  const escalated = tickets.filter((t) => t.status === "Escalated");

  return (
    <div id="support-comms-anchor" className="flex flex-col gap-4">
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
          <div className="divide-y divide-border-subtle">
            {tickets.slice(0, 4).map((ticket) => (
              <div
                key={ticket.id}
                className="group py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-surface-muted/50 -mx-1 rounded px-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
                      ticketPriorityHover(ticket.priority),
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-text-primary">
                    {ticket.subject}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="mt-0.5 flex gap-2">
                  <span className="inline-block w-2 shrink-0" aria-hidden />
                  <span className="text-[12px] leading-snug text-text-secondary">
                    {ticket.category} · {ticket.assignee} · Updated {shortDate(ticket.lastUpdatedAt)}
                  </span>
                </div>
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
          <div className="divide-y divide-border-subtle">
            {emails.slice(0, 4).map((email) => (
              <div
                key={email.id}
                className="group py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-surface-muted/50 -mx-1 rounded px-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full bg-gray-200 transition-colors",
                      emailSentimentHover(email.sentiment),
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-text-primary">
                    {email.subject}
                  </span>
                  <span className={cn("shrink-0 text-[11px] font-medium", sentimentColor[email.sentiment])}>
                    {sentimentLabel[email.sentiment]}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-2">
                  <span className="inline-block w-2 shrink-0" aria-hidden />
                  <span className="text-[12px] leading-snug text-text-secondary">
                    {email.from} · {shortDate(email.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
