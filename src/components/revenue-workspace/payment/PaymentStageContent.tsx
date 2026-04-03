import type { Customer } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import { getCustomerArSummary, getPaymentsForCustomer, getCreditNotesForCustomer, getCollectionCasesForCustomer } from "@/data/billing-data";
import { ArOverviewSection } from "./ArOverviewSection";
import { OpenReceivablesSection } from "./OpenReceivablesSection";
import { CollectionsWorkflowSection } from "./CollectionsWorkflowSection";
import { CashApplicationSection } from "./CashApplicationSection";

interface Props {
  customer: Customer;
}

export function PaymentStageContent({ customer }: Props) {
  const summary = getCustomerArSummary(customer.id);
  const customerInvoices = getInvoices(customer.id);
  const payments = getPaymentsForCustomer(customer.id);
  const creditNotes = getCreditNotesForCustomer(customer.id);
  const cases = getCollectionCasesForCustomer(customer.id);
  const primaryCase = cases[0];

  return (
    <div className="flex flex-col gap-4">
      <ArOverviewSection summary={summary} primaryCase={primaryCase} />
      <OpenReceivablesSection invoices={customerInvoices} cases={cases} />
      <CollectionsWorkflowSection cases={cases} />
      <CashApplicationSection payments={payments} creditNotes={creditNotes} cases={cases} invoices={customerInvoices} />
    </div>
  );
}
