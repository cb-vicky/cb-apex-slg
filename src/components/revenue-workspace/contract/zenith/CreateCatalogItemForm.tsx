import { cn } from "@/lib/utils";
import {
  FieldGrid,
  FieldStack,
  FormField,
  Input,
  PrefixInput,
  Select,
  Textarea,
  formHintClass,
} from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/primitives";
import type { CreateCatalogItemFormState } from "./create-catalog-item-form";

const checkboxClass =
  "h-4 w-4 shrink-0 rounded border-border-default text-blue-600 focus:ring-2 focus:ring-blue-100";

const FORM_FIELD = "w-fit max-w-full";
const FORM_INPUT_WIDTH = "w-[360px] max-w-full";
const FORM_INPUT_WIDTH_SHORT = "w-[280px] max-w-full";
const FORM_GRID = "w-fit max-w-full sm:grid-cols-[280px_280px]";
const SECTION_CARD = "w-fit max-w-full";

interface Props {
  value: CreateCatalogItemFormState;
  onChange: (next: CreateCatalogItemFormState) => void;
  className?: string;
}

function patch(
  value: CreateCatalogItemFormState,
  onChange: (next: CreateCatalogItemFormState) => void,
  partial: Partial<CreateCatalogItemFormState>,
) {
  onChange({ ...value, ...partial });
}

export function CreateCatalogItemForm({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      <SectionCard title="General information" className={SECTION_CARD}>
        <FieldStack>
          <FormField
            label="External name"
            htmlFor="create-item-external-name"
            optional
            className={FORM_FIELD}
            hint="This will be used in invoices, quotes, Checkout, and Self-Serve Portal."
          >
            <Input
              id="create-item-external-name"
              value={value.externalName}
              onChange={(e) => patch(value, onChange, { externalName: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField
            label="Internal name"
            htmlFor="create-item-internal-name"
            required
            className={FORM_FIELD}
            hint="Add a name that helps you identify this item internally."
          >
            <Input
              id="create-item-internal-name"
              value={value.internalName}
              onChange={(e) => patch(value, onChange, { internalName: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField
            label="Item ID"
            htmlFor="create-item-id"
            required
            className={FORM_FIELD}
            hint="Reference used by Chargebee to identify this item."
          >
            <Input
              id="create-item-id"
              value={value.itemId}
              onChange={(e) =>
                patch(value, onChange, { itemId: e.target.value.toUpperCase() })
              }
              className={cn(FORM_INPUT_WIDTH, "font-mono")}
            />
          </FormField>

          <label className="flex w-fit max-w-xl items-start gap-2.5 text-[13px] text-text-primary">
            <input
              type="checkbox"
              className={cn(checkboxClass, "mt-0.5")}
              checked={value.hasTrialPeriod}
              onChange={(e) => patch(value, onChange, { hasTrialPeriod: e.target.checked })}
            />
            <span className="font-medium">This item has a trial period</span>
          </label>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Pricing" className={SECTION_CARD}>
        <p className={cn(formHintClass, "mb-4 max-w-xl")}>
          Define how the recurring charges for this item are calculated.
        </p>
        <FieldStack>
          <FormField
            label="Billing frequency"
            htmlFor="create-item-billing-frequency"
            className={FORM_FIELD}
            hint="Choose how often your customer will be billed for this item."
          >
            <Select
              id="create-item-billing-frequency"
              value={value.billingFrequency}
              onChange={(e) =>
                patch(value, onChange, {
                  billingFrequency: e.target.value as CreateCatalogItemFormState["billingFrequency"],
                })
              }
              className={FORM_INPUT_WIDTH}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One-time</option>
            </Select>
          </FormField>

          <FormField
            label="Pricing model"
            htmlFor="create-item-pricing-model"
            className={FORM_FIELD}
            hint="Define how the recurring charges for the subscription are calculated."
          >
            <Select
              id="create-item-pricing-model"
              value={value.pricingModel}
              onChange={(e) =>
                patch(value, onChange, {
                  pricingModel: e.target.value as CreateCatalogItemFormState["pricingModel"],
                })
              }
              className={FORM_INPUT_WIDTH}
            >
              <option value="flat_fee">Flat fee</option>
              <option value="per_unit">Per unit</option>
              <option value="tiered">Tiered</option>
            </Select>
          </FormField>

          <FieldGrid className={FORM_GRID}>
            <FormField label="Price" htmlFor="create-item-price" required className={FORM_FIELD}>
              <PrefixInput
                id="create-item-price"
                prefix={value.currency}
                inputMode="decimal"
                value={value.price}
                onChange={(e) => patch(value, onChange, { price: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
            <FormField label="Currency" htmlFor="create-item-currency" className={FORM_FIELD}>
              <Select
                id="create-item-currency"
                value={value.currency}
                disabled
                onChange={(e) => patch(value, onChange, { currency: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              >
                <option value="USD">USD</option>
              </Select>
            </FormField>
          </FieldGrid>

          <FormField
            label="Billing cycles"
            htmlFor="create-item-billing-cycles"
            className={FORM_FIELD}
            hint="Choose if you'd like this item to be billed forever or for a fixed period."
          >
            <Select
              id="create-item-billing-cycles"
              value={value.billingCycles}
              onChange={(e) =>
                patch(value, onChange, {
                  billingCycles: e.target.value as CreateCatalogItemFormState["billingCycles"],
                })
              }
              className={FORM_INPUT_WIDTH}
            >
              <option value="forever">Forever</option>
              <option value="fixed">Fixed</option>
            </Select>
          </FormField>

          <FormField
            label="Price variant"
            htmlFor="create-item-price-variant"
            optional
            className={FORM_FIELD}
            hint="Price variants help differentiate between price points of the same currency and frequency."
          >
            <Select
              id="create-item-price-variant"
              value={value.priceVariant}
              onChange={(e) => patch(value, onChange, { priceVariant: e.target.value })}
              className={FORM_INPUT_WIDTH}
            >
              <option value="">Select price variant</option>
              <option value="standard">Standard</option>
              <option value="promotional">Promotional</option>
            </Select>
          </FormField>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Customer-Facing Info" className={SECTION_CARD}>
        <FieldStack>
          <FormField
            label="Description"
            htmlFor="create-item-description"
            optional
            className={FORM_FIELD}
            hint="Appears on customer-facing essentials such as invoices, quotes, Checkout, and Self-Serve Portal."
          >
            <Textarea
              id="create-item-description"
              rows={4}
              value={value.description}
              onChange={(e) => patch(value, onChange, { description: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <div className="flex w-fit flex-col gap-2.5">
            <label className="flex items-start gap-2.5 text-[13px] text-text-primary">
              <input
                type="checkbox"
                className={cn(checkboxClass, "mt-0.5")}
                checked={value.showDescriptionOnInvoices}
                onChange={(e) =>
                  patch(value, onChange, { showDescriptionOnInvoices: e.target.checked })
                }
              />
              <span className="font-medium">Show description on invoices</span>
            </label>
            <label className="flex items-start gap-2.5 text-[13px] text-text-primary">
              <input
                type="checkbox"
                className={cn(checkboxClass, "mt-0.5")}
                checked={value.showDescriptionOnQuotes}
                onChange={(e) =>
                  patch(value, onChange, { showDescriptionOnQuotes: e.target.checked })
                }
              />
              <span className="font-medium">Show description on quotes</span>
            </label>
          </div>

          <FormField
            label="Invoice notes"
            htmlFor="create-item-invoice-notes"
            optional
            className={FORM_FIELD}
            hint="Standard note that appears on all invoices this item creates."
          >
            <Textarea
              id="create-item-invoice-notes"
              rows={3}
              value={value.invoiceNotes}
              onChange={(e) => patch(value, onChange, { invoiceNotes: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Tax" className={SECTION_CARD}>
        <label className="flex w-fit items-start gap-2.5 text-[13px] text-text-primary">
          <input
            type="checkbox"
            className={cn(checkboxClass, "mt-0.5")}
            checked={value.subjectToTax}
            onChange={(e) => patch(value, onChange, { subjectToTax: e.target.checked })}
          />
          <span className="font-medium">This charge is subject to taxes</span>
        </label>
      </SectionCard>
    </div>
  );
}
