import type { ContractEnforcement } from "@/data/mock-data";
import { KV, SectionCard, StatusBadge } from "@/components/ui/primitives";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function ContractEnforcementSection({ enforcement }: { enforcement: ContractEnforcement }) {
  const hasIssues = enforcement.blockingIssues.length > 0 || enforcement.productMappingIssues.length > 0;

  return (
    <SectionCard title="Enforcement & Activation" className={hasIssues ? "border-red-200" : ""}>
      <div className="grid grid-cols-2 gap-x-8">
        <div className="min-w-0 divide-y divide-border-subtle">
          <KV label="Source" value={enforcement.sourceType} />
          <KV label="Sale order" value={<StatusBadge status={enforcement.saleOrderStatus} />} />
          <KV label="Enforcement" value={<StatusBadge status={enforcement.enforcementStatus} />} />
          <KV label="Provisioning" value={<StatusBadge status={enforcement.provisioningStatus} />} />
          <KV label="Entitlements" value={enforcement.entitlementStatus} />
        </div>
        <div className="flex min-w-0 flex-col gap-3 pt-1">
          {enforcement.missingFields.length > 0 && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Missing Fields</span>
              {enforcement.missingFields.map((f) => (
                <div key={f} className="mt-1 flex items-center gap-2 text-[13px] text-amber-600">
                  <Info size={13} /> {f}
                </div>
              ))}
            </div>
          )}
          {enforcement.manualOverrides.length > 0 && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Manual Overrides</span>
              {enforcement.manualOverrides.map((o) => (
                <div key={o} className="mt-1 flex items-center gap-2 text-[13px] text-blue-600">
                  <AlertCircle size={13} /> {o}
                </div>
              ))}
            </div>
          )}
          {enforcement.blockingIssues.length === 0 && enforcement.productMappingIssues.length === 0 && (
            <div className="flex items-center gap-2 text-[13px] text-emerald-600">
              <CheckCircle2 size={14} /> No blocking issues
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
