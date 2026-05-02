import type { Customer } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import {
  DrawerNativeSelect,
  DrawerSelectShell,
  DrawerRailIndent,
  DrawerStackedField,
  IngestDrawerIssueCallout,
} from "../DrawerSelectShell";
import { INGEST_DRAWER_NEW_CUSTOMER_ID } from "../ingest-drawer-constants";

export interface NewCustomerFormValues {
  name: string;
  billingLegalEntity: string;
  domain: string;
}

interface Props {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  /** When true, select includes "Create new customer" and shows fields when selected. */
  allowCreateNew?: boolean;
  newCustomer: NewCustomerFormValues;
  onNewCustomerChange: (v: Partial<NewCustomerFormValues>) => void;
  activeContractSummary?: string | null;
  /** Shown when extraction flagged customer_not_found and operator is creating a new customer. */
  createCustomerIssue?: { message: string } | null;
  onConfirmCreateCustomer?: () => void;
  createCustomerConfirmDisabled?: boolean;
  /** After Save on new-customer fields — read-only KV summary (Zenith-style). */
  showNewCustomerKvSummary?: boolean;
  onEditNewCustomer?: () => void;
  className?: string;
}

export function CustomerMappingSection({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  allowCreateNew,
  newCustomer,
  onNewCustomerChange,
  activeContractSummary,
  createCustomerIssue,
  onConfirmCreateCustomer,
  createCustomerConfirmDisabled,
  showNewCustomerKvSummary,
  onEditNewCustomer,
  className,
}: Props) {
  const isCreate = selectedCustomerId === INGEST_DRAWER_NEW_CUSTOMER_ID;

  const inputClass =
    "w-full rounded-md border border-border-default bg-white px-2.5 py-2 text-[13px] text-text-primary outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200/90";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <DrawerSelectShell id="ingest-customer-select" label="Customer details">
        <DrawerNativeSelect
          id="ingest-customer-select"
          value={selectedCustomerId}
          onChange={(e) => onSelectCustomer(e.target.value)}
        >
          {allowCreateNew && (
            <option value={INGEST_DRAWER_NEW_CUSTOMER_ID}>Create new customer</option>
          )}
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </DrawerNativeSelect>
      </DrawerSelectShell>

      {isCreate && (
        <DrawerRailIndent>
          {showNewCustomerKvSummary ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col divide-y divide-border-subtle">
                <KV label="Company name" value={newCustomer.name || "—"} />
                <KV label="Billing legal entity" value={newCustomer.billingLegalEntity || "—"} />
                <KV label="Primary domain" value={newCustomer.domain || "—"} />
              </div>
              {onEditNewCustomer ? (
                <button
                  type="button"
                  onClick={onEditNewCustomer}
                  className={cn(
                    "self-start rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--color-info)] shadow-sm transition-colors",
                    "hover:bg-blue-50/60",
                  )}
                >
                  Edit
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {createCustomerIssue ? <IngestDrawerIssueCallout title={createCustomerIssue.message} /> : null}
              <div className="flex flex-col gap-2.5">
                <DrawerStackedField label="Company name">
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => onNewCustomerChange({ name: e.target.value })}
                    className={inputClass}
                  />
                </DrawerStackedField>
                <DrawerStackedField label="Billing legal entity">
                  <input
                    type="text"
                    value={newCustomer.billingLegalEntity}
                    onChange={(e) => onNewCustomerChange({ billingLegalEntity: e.target.value })}
                    className={inputClass}
                  />
                </DrawerStackedField>
                <DrawerStackedField label="Primary domain">
                  <input
                    type="text"
                    placeholder="e.g. zenithanalytics.io"
                    value={newCustomer.domain}
                    onChange={(e) => onNewCustomerChange({ domain: e.target.value })}
                    className={inputClass}
                  />
                </DrawerStackedField>
              </div>
              {createCustomerIssue && onConfirmCreateCustomer ? (
                <button
                  type="button"
                  onClick={onConfirmCreateCustomer}
                  disabled={createCustomerConfirmDisabled}
                  className={cn(
                    "self-start rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--color-info)] shadow-sm transition-colors",
                    "hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  Save
                </button>
              ) : null}
            </div>
          )}
        </DrawerRailIndent>
      )}

      {activeContractSummary && !isCreate && (
        <p className="text-[11px] leading-snug text-text-secondary">
          Active contract: {activeContractSummary}
        </p>
      )}
    </div>
  );
}
