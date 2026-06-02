import type { Customer } from "@/data/mock-data";

export function primaryContactName(customer: Customer): string {
  return customer.csm || customer.billingOwner || customer.ae;
}

export function primaryContactEmail(customer: Customer): string {
  const name = primaryContactName(customer);
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const domain = customer.domain.replace(/^@/, "");
  if (!domain) return "—";
  if (parts.length >= 2) {
    return `${parts[0][0]}.${parts[parts.length - 1]}@${domain}`;
  }
  if (parts.length === 1) return `${parts[0]}@${domain}`;
  return `billing@${domain}`;
}

export function formatCustomerCreatedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function customerLinkStatus(customer: Customer): string {
  const hash = customer.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 10 === 0 ? "Inactive" : "Active";
}

export function customerNetPaymentTerms(customer: Customer): string {
  if (customer.poRequired) return "Net 45";
  return customer.paymentMethod === "Wire" ? "Net 30" : "Net 30";
}

export function customerBillingAddress(customer: Customer): string {
  const regionLine = customer.taxRegion.replace(" – ", ", ").replace(" - ", ", ");
  return `${customer.billingLegalEntity}, ${regionLine}`;
}

export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
