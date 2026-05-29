/** First meaningful token from a company name for customer search prefill. */
export function defaultCustomerSearchTerm(companyName: string): string {
  const first = companyName.trim().split(/\s+/)[0] ?? "";
  const cleaned = first.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned.length >= 2 ? cleaned : "";
}
