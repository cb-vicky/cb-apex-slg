import { AlertCircle, Calendar, Eye, MailX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { EmailActivityItem, EmailActivityStatus } from "@/data/collections-email-activity";

function formatActivityDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

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

function ActivityItem({ item }: { item: EmailActivityItem }) {
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;

  return (
    <div className="flex min-w-[76px] flex-col items-center gap-1.5 text-center">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          meta.circle,
        )}
      >
        <Icon className={cn("h-4 w-4", meta.iconColor)} aria-hidden />
      </div>
      <span className="text-[11px] text-text-muted">{formatActivityDate(item.date)}</span>
      <span className="text-[12px] font-semibold text-text-primary">{meta.label}</span>
    </div>
  );
}

interface Props {
  items: EmailActivityItem[];
}

export function EmailActivitySection({ items }: Props) {
  if (items.length === 0) {
    return (
      <SectionCard title="Email activity">
        <p className="text-[13px] text-text-muted">No collection emails for this customer.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Email activity" bodyClassName="pt-0">
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-min items-start justify-between gap-4 px-1">
          {items.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
