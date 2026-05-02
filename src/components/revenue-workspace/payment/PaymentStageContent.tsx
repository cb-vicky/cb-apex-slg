import { useMemo } from "react";
import type { Customer } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import { getCustomerArSummary, getPaymentsForCustomer, getCreditNotesForCustomer, getCollectionCasesForCustomer } from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { ArOverviewSection } from "./ArOverviewSection";
import { OpenReceivablesSection } from "./OpenReceivablesSection";
import { CollectionsWorkflowSection } from "./CollectionsWorkflowSection";
import { CashApplicationSection } from "./CashApplicationSection";

interface Props {
  customer: Customer;
}

export function PaymentStageContent({ customer }: Props) {
  const { invoiceStatusOverrides, creditNoteStatusOverrides } = useIngestContext();
  const customerInvoices = useMemo(
    () => mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides),
    [customer.id, invoiceStatusOverrides],
  );
  const summary = useMemo(
    () => getCustomerArSummary(customer.id, customerInvoices),
    [customer.id, customerInvoices],
  );
  const payments = getPaymentsForCustomer(customer.id);
  const creditNotes = useMemo(
    () => getCreditNotesForCustomer(customer.id, creditNoteStatusOverrides),
    [customer.id, creditNoteStatusOverrides],
  );
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
