import { useState, type ReactNode } from "react";
import {
  zenithContractAddressesDefaults,
  zenithContractBillingAddress,
  type ZenithContractAddressFields,
} from "@/data/zenith-contract-summary";
import { Input } from "@/components/ui/form-field";
import { ZenithContractSectionCard } from "./ZenithContractSectionCard";

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-wider text-text-muted";

const checkboxClass =
  "h-4 w-4 rounded border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100";

function AddressField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function AddressFields({
  idPrefix,
  value,
  disabled,
  onChange,
}: {
  idPrefix: string;
  value: ZenithContractAddressFields;
  disabled?: boolean;
  onChange: (next: ZenithContractAddressFields) => void;
}) {
  function patch(partial: Partial<ZenithContractAddressFields>) {
    onChange({ ...value, ...partial });
  }

  return (
    <>
      <AddressField label="Address line 1" htmlFor={`${idPrefix}-line1`}>
        <Input
          id={`${idPrefix}-line1`}
          value={value.line1}
          disabled={disabled}
          onChange={(e) => patch({ line1: e.target.value })}
        />
      </AddressField>
      <AddressField label="Address line 2" htmlFor={`${idPrefix}-line2`}>
        <Input
          id={`${idPrefix}-line2`}
          value={value.line2}
          disabled={disabled}
          onChange={(e) => patch({ line2: e.target.value })}
        />
      </AddressField>
      <AddressField label="City" htmlFor={`${idPrefix}-city`}>
        <Input
          id={`${idPrefix}-city`}
          value={value.city}
          disabled={disabled}
          onChange={(e) => patch({ city: e.target.value })}
        />
      </AddressField>
      <div className="grid grid-cols-2 gap-4">
        <AddressField label="State" htmlFor={`${idPrefix}-state`}>
          <Input
            id={`${idPrefix}-state`}
            value={value.state}
            disabled={disabled}
            onChange={(e) => patch({ state: e.target.value })}
          />
        </AddressField>
        <AddressField label="Postal code" htmlFor={`${idPrefix}-postal`}>
          <Input
            id={`${idPrefix}-postal`}
            value={value.postalCode}
            disabled={disabled}
            onChange={(e) => patch({ postalCode: e.target.value })}
          />
        </AddressField>
      </div>
      <AddressField label="Country" htmlFor={`${idPrefix}-country`}>
        <Input
          id={`${idPrefix}-country`}
          value={value.country}
          disabled={disabled}
          onChange={(e) => patch({ country: e.target.value })}
        />
      </AddressField>
    </>
  );
}

export function ZenithContractAddressesTab() {
  const [billing, setBilling] = useState<ZenithContractAddressFields>(() => ({
    ...zenithContractBillingAddress,
  }));
  const [shipping, setShipping] = useState<ZenithContractAddressFields>(() => ({
    ...zenithContractBillingAddress,
  }));
  const [sameAsBilling, setSameAsBilling] = useState(
    zenithContractAddressesDefaults.shippingSameAsBilling,
  );

  const shippingValue = sameAsBilling ? billing : shipping;

  function handleSameAsBillingChange(checked: boolean) {
    setSameAsBilling(checked);
    setShipping({ ...billing });
  }

  function handleShippingChange(next: ZenithContractAddressFields) {
    setSameAsBilling(false);
    setShipping(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ZenithContractSectionCard title="Billing address">
        <AddressFields
          idPrefix="zenith-billing-address"
          value={billing}
          onChange={setBilling}
        />
      </ZenithContractSectionCard>
      </div>

      <ZenithContractSectionCard title="Shipping address">
        <label className="flex items-center gap-2.5 text-[13px] font-medium text-text-primary">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={sameAsBilling}
            onChange={(e) => handleSameAsBillingChange(e.target.checked)}
          />
          Same as billing address
        </label>
        <AddressFields
          idPrefix="zenith-shipping-address"
          value={shippingValue}
          disabled={sameAsBilling}
          onChange={handleShippingChange}
        />
      </ZenithContractSectionCard>
    </div>
  );
}
