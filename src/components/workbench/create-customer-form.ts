import { suggestDomainFromCompanyName } from "@/lib/new-deal-customer-link";

export interface CreateCustomerFormState {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  language: string;
  currency: string;
  doNotSyncInvoices: boolean;
  autoCollection: "on" | "off" | "";
  paymentTerms: string;
  billingCountry: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingCompany: string;
  billingPhone: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  postalCode: string;
  taxExempt: boolean;
}

function splitContactName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim();
  if (!trimmed || trimmed === "—") return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function domainFromEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(at + 1).trim() : "";
}

export function buildInitialCreateCustomerForm(input: {
  company: string;
  billingLegalEntity: string;
  domain: string;
  contactName: string;
  contactEmail: string;
}): CreateCustomerFormState {
  const { firstName, lastName } = splitContactName(input.contactName);
  const email =
    input.contactEmail && input.contactEmail !== "—"
      ? input.contactEmail
      : firstName && input.domain
        ? `${firstName.toLowerCase()}@${input.domain.replace(/^@/, "")}`
        : "";

  return {
    customerId: "",
    email,
    firstName,
    lastName,
    company: input.company,
    phone: "",
    language: "en",
    currency: "USD",
    doNotSyncInvoices: false,
    autoCollection: "",
    paymentTerms: "net_30",
    billingCountry: "US",
    billingFirstName: firstName,
    billingLastName: lastName,
    billingEmail: email,
    billingCompany: input.billingLegalEntity || input.company,
    billingPhone: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    city: "",
    postalCode: "",
    taxExempt: false,
  };
}

export function isCreateCustomerFormComplete(state: CreateCustomerFormState): boolean {
  return state.company.trim().length > 0 && state.email.trim().length > 0;
}

export function toSessionCustomerInput(state: CreateCustomerFormState): {
  name: string;
  billingLegalEntity: string;
  domain: string;
} {
  const name = state.company.trim();
  const billingLegalEntity = state.billingCompany.trim() || name;
  const domain =
    domainFromEmail(state.email) ||
    domainFromEmail(state.billingEmail) ||
    suggestDomainFromCompanyName(name);

  return { name, billingLegalEntity, domain };
}
