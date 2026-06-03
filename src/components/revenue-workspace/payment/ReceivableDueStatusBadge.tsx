import { cn } from "@/lib/utils";

/** Label for due / overdue relative to a reference date (negative days = past due). */
export function formatDueStatusFromDays(days: number): string {
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return overdueDays === 1 ? "Overdue by 1 day" : `Overdue by ${overdueDays} days`;
  }
  if (days === 0) return "Due today";
  return days === 1 ? "Due in 1 day" : `Due in ${days} days`;
}

export function ReceivableDueStatusBadge({ label }: { label: string }) {
  const isOverdue = label.startsWith("Overdue");
  const isDueIn = label.startsWith("Due");

  if (!isOverdue && !isDueIn) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4",
        isOverdue
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {label}
    </span>
  );
}
