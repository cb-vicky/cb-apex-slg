import { createContext, useContext, type ReactNode } from "react";
import type { AddPromiseToPayDraft } from "./add-promise-draft";
import type { PaymentCollectionsTab } from "./PaymentCollectionsSubTabs";

export type { PaymentCollectionsTab };

export interface EditPromiseTarget {
  promiseId: string;
  logId: string;
}

export interface PaymentCollectionsChromeValue {
  collectionsTab: PaymentCollectionsTab;
  setCollectionsTab: (tab: PaymentCollectionsTab) => void;
  addPromiseTabOpen: boolean;
  editPromiseTarget: EditPromiseTarget | null;
  promiseToPayCount: number;
  promiseToPayRevision: number;
  refreshPromiseToPay: () => void;
  getAddPromiseDraft: () => AddPromiseToPayDraft | null;
  persistAddPromiseDraft: (draft: AddPromiseToPayDraft) => void;
  clearAddPromiseDraft: () => void;
  openAddPromiseTab: () => void;
  closeAddPromiseTab: () => void;
  openEditPromiseTab: (promiseId: string, logId: string) => void;
  closeEditPromiseTab: () => void;
  /** Opens invoice detail in-workspace; closing the invoice tab returns to the prior collections flow. */
  openInvoiceFromCollectionsFlow: (invoiceId: string) => void;
  subTabsDocked: boolean;
  setSubTabsDocked: (docked: boolean) => void;
  expandAllTabs: () => void;
}

const PaymentCollectionsChromeContext = createContext<PaymentCollectionsChromeValue | null>(
  null,
);

export function PaymentCollectionsChromeProvider({
  value,
  children,
}: {
  value: PaymentCollectionsChromeValue;
  children: ReactNode;
}) {
  return (
    <PaymentCollectionsChromeContext.Provider value={value}>
      {children}
    </PaymentCollectionsChromeContext.Provider>
  );
}

export function usePaymentCollectionsChrome() {
  return useContext(PaymentCollectionsChromeContext);
}
