import { useState } from "react";
import { AlertCircle, Calendar, Eye, MailX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, shortDate } from "@/lib/utils";
import type { EmailActivityItem, EmailActivityStatus } from "@/data/collections-email-activity";

const INITIAL = 5;

const STATUS_META: Record<
  EmailActivityStatus,
  { label: string; icon: LucideIcon; circle: string; iconColor: string }
> = {
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    circle: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  not_seen: {
    label: "Not seen",
    icon: AlertCircle,
    circle: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  seen: {
    label: "Seen",
    icon: Eye,
    circle: "bg-gray-100",
    iconColor: "text-gray-500",
  },
  bounced: {
    label: "Bounced",
    icon: MailX,
    circle: "bg-red-50",
    iconColor: "text-red-600",
  },
};

function EmailActivityRow({
  item,
  isLast,
}: {
  item: EmailActivityItem;
  isLast?: boolean;
}) {
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            meta.circle,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", meta.iconColor)} strokeWidth={2.25} aria-hidden />
        </div>
        {!isLast ? <div className="w-px flex-1 bg-border-default" /> : null}
      </div>
      <div className="min-w-0 pb-5 pt-0.5">
        <p className="text-[14px] font-medium leading-snug text-text-primary">
          {meta.label}
          <span className="font-normal text-text-secondary"> · {shortDate(item.date)}</span>
        </p>
      </div>
    </div>
  );
}

interface Props {
  items: EmailActivityItem[];
  className?: string;
}

export function EmailActivitySection({ items, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const display = expanded ? sorted : sorted.slice(0, INITIAL);
  const hasMore = sorted.length > INITIAL;

  if (sorted.length === 0) {
    return (
      <div className={cn("my-5", className)}>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary">
          Email activity
        </h3>
        <p className="text-[13px] text-text-muted">No collection emails for this customer.</p>
      </div>
    );
  }

  return (
    <div className={cn("my-5", className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary">
        Email activity
      </h3>
      <div>
        {display.map((item, idx) => (
          <EmailActivityRow
            key={item.id}
            item={item}
            isLast={idx === display.length - 1}
          />
        ))}
      </div>
      {hasMore && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          View more
        </button>
      ) : null}
    </div>
  );
}
