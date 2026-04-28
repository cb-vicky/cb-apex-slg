import { CalendarClock } from "lucide-react";
import { shortDate } from "@/lib/utils";

interface Props {
  scheduledStartDate: string;
  replacesContractId?: string;
}

export function ScheduledBanner({ scheduledStartDate, replacesContractId }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <CalendarClock size={15} className="mt-0.5 shrink-0 text-blue-600" />
      <div>
        <p className="text-[13px] font-semibold text-blue-800">
          Contract scheduled — activates {shortDate(scheduledStartDate)}
        </p>
        <p className="mt-0.5 text-[12px] text-blue-700">
          This contract will become active once the prior contract
          {replacesContractId ? ` (${replacesContractId})` : ""} is formally closed.
          Billing and entitlement provisioning will begin on the activation date.
        </p>
      </div>
    </div>
  );
}
