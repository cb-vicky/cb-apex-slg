import type { Amendment } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { shortDate } from "@/lib/utils";
import { Calendar, GitBranch } from "lucide-react";

interface Props {
  amendments: Amendment[];
  renewalDate: string;
  coTermBehavior: string;
}

export function ContractAmendmentsSection({ amendments, renewalDate, coTermBehavior }: Props) {
  return (
    <SectionCard title="Amendments & Lifecycle">
      <div className="flex flex-col gap-3">
        {/* Amendment list */}
        <div className="space-y-2">
          {amendments.map((amd) => (
            <div key={amd.id} className="flex items-center justify-between rounded-md border border-border-default px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                  <GitBranch size={13} className="text-text-secondary" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{amd.type}</p>
                  <p className="text-[12px] text-text-secondary">{amd.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-muted">{shortDate(amd.effectiveDate)}</span>
                <StatusBadge status={amd.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Lifecycle info */}
        <div className="flex items-center gap-6 border-t border-border-subtle pt-3 text-[13px]">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Calendar size={13} />
            Next renewal: <span className="font-medium text-text-primary">{shortDate(renewalDate)}</span>
          </span>
          <span className="text-text-secondary">
            Co-term: <span className="font-medium text-text-primary">{coTermBehavior}</span>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
