import { useEffect, useMemo, useRef } from "react";
import type { Customer } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import {
  getCustomerArSummary,
  getDelayedPaymentsForCustomer,
  getPromiseToPayForCustomer,
  findPromiseToPayLog,
  getPromiseLogAmount,
  getPromiseLogNote,
} from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { ArOverviewSection } from "./ArOverviewSection";
import { PendingPromiseToPaySection } from "./PendingPromiseToPaySection";
import { OpenReceivablesSection } from "./OpenReceivablesSection";
import { DelayedPaymentsSection } from "./DelayedPaymentsSection";
import { EmailActivitySection } from "./EmailActivitySection";
import { getEmailActivityForCustomer } from "@/data/collections-email-activity";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";
import { PaymentCollectionsSubTabs } from "./PaymentCollectionsSubTabs";
import { PaymentCollectionsActionsBar } from "./PaymentCollectionsActionsBar";
import { AddPromiseToPayForm } from "./AddPromiseToPayForm";
import { EditPromiseToPayForm } from "./EditPromiseToPayForm";
import { PromiseToPayListView } from "./PromiseToPayListView";
import { RecentCollectionCommentBanner } from "./RecentCollectionCommentBanner";
import { getLatestUnpinnedComment } from "@/data/collections-comments";
import { usePaymentCollectionsChrome } from "./PaymentCollectionsChromeContext";
import { useCommentsChrome } from "./CommentsChromeContext";
import { cn } from "@/lib/utils";

interface Props {
  customer: Customer;
}

export function PaymentStageContent({ customer }: Props) {
  const { invoiceStatusOverrides } = useIngestContext();
  const chrome = usePaymentCollectionsChrome();
  const commentsChrome = useCommentsChrome();
  const collectionsTab = chrome?.collectionsTab ?? "overview";
  const subTabsDocked = chrome?.subTabsDocked ?? false;
  const subTabsSentinelRef = useRef<HTMLDivElement>(null);
  const subTabsVisibleRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const customerInvoices = useMemo(
    () => mergeInvoiceStatuses(getInvoices(customer.id), invoiceStatusOverrides),
    [customer.id, invoiceStatusOverrides],
  );
  const summary = useMemo(
    () => getCustomerArSummary(customer.id, customerInvoices),
    [customer.id, customerInvoices],
  );
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
    [customer.id, chrome?.promiseToPayRevision],
  );
  const latestUnpinnedComment = useMemo(
    () => getLatestUnpinnedComment(customer.id),
    [customer.id, commentsChrome?.commentsRevision],
  );

  const editPromiseTarget = chrome?.editPromiseTarget ?? null;
  const editPromiseMatch = useMemo(() => {
    if (!editPromiseTarget) return null;
    return findPromiseToPayLog(
      customer.id,
      editPromiseTarget.promiseId,
      editPromiseTarget.logId,
    );
  }, [customer.id, editPromiseTarget, chrome?.promiseToPayRevision]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-main-scroll-container]");
    const target = subTabsSentinelRef.current;
    if (!root || !target || !chrome) return;

    lastScrollTopRef.current = root.scrollTop;

    const observer = new IntersectionObserver(
      ([entry]) => {
        subTabsVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          chrome.setSubTabsDocked(false);
        }
      },
      { root, threshold: 0 },
    );

    observer.observe(target);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const current = root.scrollTop;
        const delta = current - lastScrollTopRef.current;

        if (delta < -1) {
          chrome.setSubTabsDocked(false);
        } else if (delta > 1 && !subTabsVisibleRef.current) {
          chrome.setSubTabsDocked(true);
        }

        lastScrollTopRef.current = current;
      });
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [chrome]);

  const showActionsBar =
    collectionsTab === "overview" || collectionsTab === "promise-to-pay";

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={subTabsSentinelRef}
        className="flex h-11 shrink-0 items-center justify-between gap-4"
      >
        <div
          className={cn(
            "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            subTabsDocked ? "pointer-events-none invisible opacity-0" : "opacity-100",
          )}
        >
          <PaymentCollectionsSubTabs
            active={collectionsTab}
            promiseToPayCount={promiseToPay.length}
            addTabOpen={chrome?.addPromiseTabOpen ?? false}
            editTabOpen={chrome?.editPromiseTarget != null}
            onChange={(tab) => chrome?.setCollectionsTab(tab)}
            onCloseAdd={() => chrome?.closeAddPromiseTab()}
            onCloseEdit={() => chrome?.closeEditPromiseTab()}
          />
        </div>
        {!subTabsDocked && showActionsBar ? (
          <div
            className={cn(
              "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              subTabsDocked ? "pointer-events-none invisible opacity-0" : "opacity-100",
            )}
          >
            <PaymentCollectionsActionsBar
              onAddPromiseToPay={() => chrome?.openAddPromiseTab()}
            />
          </div>
        ) : null}
      </div>

      {collectionsTab === "add-promise-to-pay" ? (
        <AddPromiseToPayForm
          customerId={customer.id}
          loggedByName={customer.billingOwner}
          invoices={customerInvoices}
          onCancel={() => chrome?.closeAddPromiseTab()}
          onSave={() => {
            chrome?.refreshPromiseToPay();
            chrome?.closeAddPromiseTab();
          }}
        />
      ) : collectionsTab === "edit-promise-to-pay" &&
        editPromiseTarget &&
        editPromiseMatch?.log.promisedFor ? (
        <EditPromiseToPayForm
          customerId={customer.id}
          loggedByName={customer.billingOwner}
          promiseId={editPromiseTarget.promiseId}
          logId={editPromiseTarget.logId}
          invoiceIds={editPromiseMatch.record.invoiceIds}
          initialPromisedDate={editPromiseMatch.log.promisedFor}
          initialAmount={getPromiseLogAmount(
            editPromiseMatch.log,
            editPromiseMatch.record.amount,
          )}
          initialNote={getPromiseLogNote(editPromiseMatch.log) ?? ""}
          onCancel={() => chrome?.closeEditPromiseTab()}
          onSave={() => {
            chrome?.refreshPromiseToPay();
            chrome?.closeEditPromiseTab();
          }}
        />
      ) : collectionsTab === "promise-to-pay" ? (
        <PromiseToPayListView
          promises={promiseToPay}
          onEditScheduled={(promiseId, logId) => chrome?.openEditPromiseTab(promiseId, logId)}
        />
      ) : (
        <>
          {latestUnpinnedComment && (
            <RecentCollectionCommentBanner comment={latestUnpinnedComment} />
          )}
          <WorkspaceSectionAnchor id="ws-section-payment-ar">
            <ArOverviewSection customerId={customer.id} summary={summary} />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-ptp-pending">
            <PendingPromiseToPaySection
              promises={promiseToPay}
              onEditScheduled={(promiseId, logId) =>
                chrome?.openEditPromiseTab(promiseId, logId)
              }
            />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-receivables">
            <OpenReceivablesSection invoices={customerInvoices} />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-delayed">
            <DelayedPaymentsSection delayedPayments={delayedPayments} />
          </WorkspaceSectionAnchor>
          <WorkspaceSectionAnchor id="ws-section-payment-email">
            <EmailActivitySection items={emailActivity} />
          </WorkspaceSectionAnchor>
        </>
      )}
    </div>
  );
}
