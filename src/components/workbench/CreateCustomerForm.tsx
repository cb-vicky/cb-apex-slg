import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FieldGrid,
  FieldStack,
  FormField,
  Input,
  Select,
  formHintClass,
} from "@/components/ui/form-field";
import { SectionCard } from "@/components/ui/primitives";
import type { CreateCustomerFormState } from "./create-customer-form";

const checkboxClass =
  "h-4 w-4 shrink-0 rounded border-border-default text-blue-600 focus:ring-2 focus:ring-blue-100";

/** Fixed field widths — inputs do not stretch edge-to-edge within section cards. */
const FORM_FIELD = "w-fit max-w-full";
const FORM_INPUT_WIDTH = "w-[360px] max-w-full";
const FORM_INPUT_WIDTH_SHORT = "w-[280px] max-w-full";
const FORM_GRID = "w-fit max-w-full sm:grid-cols-[280px_280px]";
const SECTION_CARD = "w-fit max-w-full";

interface Props {
  value: CreateCustomerFormState;
  onChange: (next: CreateCustomerFormState) => void;
  className?: string;
}

function patch(
  value: CreateCustomerFormState,
  onChange: (next: CreateCustomerFormState) => void,
  partial: Partial<CreateCustomerFormState>,
) {
  onChange({ ...value, ...partial });
}

export function CreateCustomerForm({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      <SectionCard title="Customer info" className={SECTION_CARD}>
        <FieldStack>
          <FormField
            label="Customer ID"
            htmlFor="create-customer-id"
            optional
            className={FORM_FIELD}
            hint="ID used to uniquely identify the customer. Customer ID will be auto-generated if not provided."
          >
            <Input
              id="create-customer-id"
              value={value.customerId}
              onChange={(e) => patch(value, onChange, { customerId: e.target.value })}
              placeholder="Auto-generated if left blank"
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField label="Email ID" htmlFor="create-customer-email" required className={FORM_FIELD}>
            <Input
              id="create-customer-email"
              type="email"
              value={value.email}
              onChange={(e) => patch(value, onChange, { email: e.target.value })}
              placeholder="name@company.com"
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FieldGrid className={FORM_GRID}>
            <FormField label="First name" htmlFor="create-customer-first-name" className={FORM_FIELD}>
              <Input
                id="create-customer-first-name"
                value={value.firstName}
                onChange={(e) => patch(value, onChange, { firstName: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
            <FormField label="Last name" htmlFor="create-customer-last-name" className={FORM_FIELD}>
              <Input
                id="create-customer-last-name"
                value={value.lastName}
                onChange={(e) => patch(value, onChange, { lastName: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
          </FieldGrid>

          <FormField label="Company" htmlFor="create-customer-company" required className={FORM_FIELD}>
            <Input
              id="create-customer-company"
              value={value.company}
              onChange={(e) => patch(value, onChange, { company: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField label="Phone" htmlFor="create-customer-phone" className={FORM_FIELD}>
            <Input
              id="create-customer-phone"
              type="tel"
              value={value.phone}
              onChange={(e) => patch(value, onChange, { phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className={FORM_INPUT_WIDTH_SHORT}
            />
          </FormField>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Additional contacts" className={SECTION_CARD}>
        <div className="w-fit max-w-full rounded-xl border border-dashed border-border-default bg-gray-50/80 px-4 py-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-white px-3 py-1.5 text-[13px] font-medium text-text-secondary shadow-sm transition-colors hover:border-gray-300 hover:text-text-primary"
          >
            <Plus size={14} strokeWidth={2} aria-hidden />
            Add new contact
          </button>
          <p className={cn(formHintClass, "mt-3 max-w-xl")}>
            Add team members whom you&apos;d like to send invoice, payment, and other product-related
            emails.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Essentials" className={SECTION_CARD}>
        <FieldStack>
          <FormField
            label="Language"
            htmlFor="create-customer-language"
            className={FORM_FIELD}
            hint="Used for the language of your checkout, Self-Serve Portal, invoices and emails."
          >
            <Select
              id="create-customer-language"
              value={value.language}
              onChange={(e) => patch(value, onChange, { language: e.target.value })}
              className={FORM_INPUT_WIDTH}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </Select>
          </FormField>

          <FormField
            label="Preferred currency"
            htmlFor="create-customer-currency"
            className={FORM_FIELD}
            hint="Chargebee will use this currency to determine the gateway to use for payments made by this customer."
          >
            <Select
              id="create-customer-currency"
              value={value.currency}
              onChange={(e) => patch(value, onChange, { currency: e.target.value })}
              className={FORM_INPUT_WIDTH}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="INR">INR — Indian Rupee</option>
            </Select>
          </FormField>

          <label className="flex w-fit max-w-xl items-start gap-2.5 text-[13px] text-text-primary">
            <input
              type="checkbox"
              className={cn(checkboxClass, "mt-0.5")}
              checked={value.doNotSyncInvoices}
              onChange={(e) => patch(value, onChange, { doNotSyncInvoices: e.target.checked })}
            />
            <span>
              <span className="font-medium">Do not sync these invoices</span>
              <span className={cn(formHintClass, "mt-0.5 block")}>
                Check this to avoid syncing invoices for manually managed accounts.
              </span>
            </span>
          </label>

          <fieldset className="w-fit max-w-xl">
            <legend className={cn("mb-2", "text-[13px] font-medium text-text-secondary")}>
              Auto-collection
            </legend>
            <p className={cn(formHintClass, "mb-3")}>
              Auto-collection lets you automatically attempt to charge a customer&apos;s payment method
              whenever an invoice is created.
            </p>
            <div className="flex flex-wrap gap-4">
              {(["on", "off"] as const).map((option) => (
                <label
                  key={option}
                  className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-text-primary"
                >
                  <input
                    type="radio"
                    name="create-customer-auto-collection"
                    className="h-4 w-4 accent-blue-600"
                    checked={value.autoCollection === option}
                    onChange={() => patch(value, onChange, { autoCollection: option })}
                  />
                  {option === "on" ? "ON" : "OFF"}
                </label>
              ))}
            </div>
          </fieldset>

          <FormField label="Payment terms" htmlFor="create-customer-payment-terms" className={FORM_FIELD}>
            <Select
              id="create-customer-payment-terms"
              value={value.paymentTerms}
              onChange={(e) => patch(value, onChange, { paymentTerms: e.target.value })}
              className={FORM_INPUT_WIDTH}
            >
              <option value="net_30">Net 30 (Site Default)</option>
              <option value="net_15">Net 15</option>
              <option value="net_45">Net 45</option>
              <option value="due_on_receipt">Due on receipt</option>
            </Select>
          </FormField>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Billing address" className={SECTION_CARD}>
        <FieldStack>
          <FormField label="Country" htmlFor="create-customer-billing-country" className={FORM_FIELD}>
            <Select
              id="create-customer-billing-country"
              value={value.billingCountry}
              onChange={(e) => patch(value, onChange, { billingCountry: e.target.value })}
              className={FORM_INPUT_WIDTH}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="IN">India</option>
            </Select>
          </FormField>

          <FieldGrid className={FORM_GRID}>
            <FormField label="First name" htmlFor="create-customer-billing-first-name" className={FORM_FIELD}>
              <Input
                id="create-customer-billing-first-name"
                value={value.billingFirstName}
                onChange={(e) => patch(value, onChange, { billingFirstName: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
            <FormField label="Last name" htmlFor="create-customer-billing-last-name" className={FORM_FIELD}>
              <Input
                id="create-customer-billing-last-name"
                value={value.billingLastName}
                onChange={(e) => patch(value, onChange, { billingLastName: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
          </FieldGrid>

          <FormField label="Email ID" htmlFor="create-customer-billing-email" className={FORM_FIELD}>
            <Input
              id="create-customer-billing-email"
              type="email"
              value={value.billingEmail}
              onChange={(e) => patch(value, onChange, { billingEmail: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField label="Company" htmlFor="create-customer-billing-company" className={FORM_FIELD}>
            <Input
              id="create-customer-billing-company"
              value={value.billingCompany}
              onChange={(e) => patch(value, onChange, { billingCompany: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FormField label="Phone" htmlFor="create-customer-billing-phone" className={FORM_FIELD}>
            <Input
              id="create-customer-billing-phone"
              type="tel"
              value={value.billingPhone}
              onChange={(e) => patch(value, onChange, { billingPhone: e.target.value })}
              className={FORM_INPUT_WIDTH_SHORT}
            />
          </FormField>

          <FormField label="Address line 1" htmlFor="create-customer-address-1" className={FORM_FIELD}>
            <Input
              id="create-customer-address-1"
              value={value.addressLine1}
              onChange={(e) => patch(value, onChange, { addressLine1: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>
          <FormField label="Address line 2" htmlFor="create-customer-address-2" optional className={FORM_FIELD}>
            <Input
              id="create-customer-address-2"
              value={value.addressLine2}
              onChange={(e) => patch(value, onChange, { addressLine2: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>
          <FormField label="Address line 3" htmlFor="create-customer-address-3" optional className={FORM_FIELD}>
            <Input
              id="create-customer-address-3"
              value={value.addressLine3}
              onChange={(e) => patch(value, onChange, { addressLine3: e.target.value })}
              className={FORM_INPUT_WIDTH}
            />
          </FormField>

          <FieldGrid className={FORM_GRID}>
            <FormField label="City" htmlFor="create-customer-city" className={FORM_FIELD}>
              <Input
                id="create-customer-city"
                value={value.city}
                onChange={(e) => patch(value, onChange, { city: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
            <FormField label="Postal / Zip code" htmlFor="create-customer-postal" className={FORM_FIELD}>
              <Input
                id="create-customer-postal"
                value={value.postalCode}
                onChange={(e) => patch(value, onChange, { postalCode: e.target.value })}
                className={FORM_INPUT_WIDTH_SHORT}
              />
            </FormField>
          </FieldGrid>
        </FieldStack>
      </SectionCard>

      <SectionCard title="Tax details" className={SECTION_CARD}>
        <label className="flex w-fit items-start gap-2.5 text-[13px] text-text-primary">
          <input
            type="checkbox"
            className={cn(checkboxClass, "mt-0.5")}
            checked={value.taxExempt}
            onChange={(e) => patch(value, onChange, { taxExempt: e.target.checked })}
          />
          <span className="font-medium">This customer is tax exempt</span>
        </label>
      </SectionCard>
    </div>
  );
}
