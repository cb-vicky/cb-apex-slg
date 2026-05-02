import type { BillingKind } from "../ingest-drawer-derive";
import { DrawerNativeSelect, DrawerSelectShell } from "../DrawerSelectShell";

interface Props {
  kind: BillingKind;
  onKindChange: (k: BillingKind) => void;
  className?: string;
}

/** Queue ingest: billing model as a single native select; only Prepaid is selectable. */
export function PrepaidOnlyBillingSelect({ kind, onKindChange, className }: Props) {
  return (
    <div className={className}>
      <DrawerSelectShell id="ingest-billing-kind" label="Billing model">
        <DrawerNativeSelect
          id="ingest-billing-kind"
          value={kind}
          onChange={(e) => onKindChange(e.target.value as BillingKind)}
        >
          <option value="prepaid">Prepaid</option>
          <option value="postpaid" disabled>
            Postpaid
          </option>
          <option value="hybrid" disabled>
            Hybrid (commit + usage)
          </option>
        </DrawerNativeSelect>
      </DrawerSelectShell>
    </div>
  );
}
