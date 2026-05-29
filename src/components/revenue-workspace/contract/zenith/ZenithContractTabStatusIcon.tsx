import { CircleCheck, Info } from "lucide-react";
import type { ZenithTabCompletionStatus } from "./zenith-contract-tab-status";

export function ZenithContractTabStatusIcon({
  status,
  className,
}: {
  status: ZenithTabCompletionStatus;
  className?: string;
}) {
  if (status === "complete") {
    return (
      <CircleCheck
        size={14}
        strokeWidth={2.25}
        className={className ?? "shrink-0 text-emerald-600"}
        aria-hidden
      />
    );
  }

  return (
    <Info
      size={14}
      strokeWidth={2.25}
      className={className ?? "shrink-0 text-amber-500"}
      aria-hidden
    />
  );
}
