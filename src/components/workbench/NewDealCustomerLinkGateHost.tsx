import { useNewDealCustomerLinkGate } from "@/hooks/useNewDealCustomerLinkGate";

/** Global host so Import / upload can open the new-deal customer link modal outside Workbench tabs. */
export function NewDealCustomerLinkGateHost() {
  const { modal } = useNewDealCustomerLinkGate();
  return modal;
}
