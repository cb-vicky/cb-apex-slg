import { useEffect, useMemo, useRef } from "react";
import type { Customer } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import {
  getCustomerArSummary,
  getPaymentsForCustomer,
  getCreditNotesForCustomer,
  getCollectionCasesForCustomer,
  getDelayedPaymentsForCustomer,
  getPromiseToPayForCustomer,
} from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { ArOverviewSection } from "./ArOverviewSection";
import { OpenReceivablesSection } from "./OpenReceivablesSection";
import { DelayedPaymentsSection } from "./DelayedPaymentsSection";
import { EmailActivitySection } from "./EmailActivitySection";
import { getEmailActivityForCustomer } from "@/data/collections-email-activity";
import { CollectionsWorkflowSection } from "./CollectionsWorkflowSection";
import { CashApplicationSection } from "./CashApplicationSection";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";
import { PaymentCollectionsSubTabs } from "./PaymentCollectionsSubTabs";
import { PromiseToPayListView } from "./PromiseToPayListView";
import { usePaymentCollectionsChrome } from "./PaymentCollectionsChromeContext";
import { cn } from "@/lib/utils";

interface Props {
  customer: Customer;
}

export function PaymentStageContent({ customer }: Props) {
  const { invoiceStatusOverrides, creditNoteStatusOverrides } = useIngestContext();
  const chrome = usePaymentCollectionsChrome();
  const collectionsTab = chrome?.collectionsTab ?? "overview";
  const subTabsDocked = chrome?.subTabsDocked ?? false;
  const subTabsSentinelRef = useRef<HTMLDivElement>(null);

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
  const delayedPayments = useMemo(
    () => getDelayedPaymentsForCustomer(customer.id, customerInvoices),
    [customer.id, customerInvoices],
  );
  const emailActivity = useMemo(
    () => getEmailActivityForCustomer(customer.id),
    [customer.id],
  );
  const promiseToPay = useMemo(
    () => getPromiseToPayForCustomer(customer.id),
    [customer.id],
  );

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-main-scroll-container]");
    const target = subTabsSentinelRef.current;
    if (!root || !target || !chrome) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        chrome.setSubTabsDocked(!entry.isIntersecting);
      },
      { root, threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [chrome]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={subTabsSentinelRef}
        className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          subTabsDocked
            ? "pointer-events-none h-0 overflow-hidden opacity-0"
            : "opacity-100",
        )}
      >
        <PaymentCollectionsSubTabs
          active={collectionsTab}
          promiseToPayCount={promiseToPay.length}
          onChange={(tab) => chrome?.setCollectionsTab(tab)}
        />
      </div>

      {collectionsTab === "promise-to-pay" ? (
        <PromiseToPayListView groups={promiseToPay} />
      ) : (
        <>
          <WorkspaceSectionAnchor id="ws-section-payment-ar">
            <ArOverviewSection
              customerId={customer.id}
              summary={summary}
              fallbackOwnerName={primaryCase?.owner}
            />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-receivables">
            <div className="flex flex-col gap-3">
              <OpenReceivablesSection invoices={customerInvoices} />
              <DelayedPaymentsSection delayedPayments={delayedPayments} />
              <EmailActivitySection items={emailActivity} />
            </div>
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-collections">
            <CollectionsWorkflowSection cases={cases} />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-cash">
            <CashApplicationSection
              payments={payments}
              creditNotes={creditNotes}
              cases={cases}
              invoices={customerInvoices}
            />
          </WorkspaceSectionAnchor>
        </>
      )}
    </div>
  );
}
