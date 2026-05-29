import { createContext, useContext, type ReactNode } from "react";
import type { PaymentCollectionsTab } from "./PaymentCollectionsSubTabs";

export type { PaymentCollectionsTab };

export interface PaymentCollectionsChromeValue {
  collectionsTab: PaymentCollectionsTab;
  setCollectionsTab: (tab: PaymentCollectionsTab) => void;
  promiseToPayCount: number;
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
