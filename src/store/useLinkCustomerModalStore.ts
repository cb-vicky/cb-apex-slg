import { useSyncExternalStore } from "react";
import {
  getLinkCustomerModalState,
  subscribeLinkCustomerModal,
} from "./link-customer-modal-store";

export function useLinkCustomerModal() {
  return useSyncExternalStore(subscribeLinkCustomerModal, getLinkCustomerModalState);
}
