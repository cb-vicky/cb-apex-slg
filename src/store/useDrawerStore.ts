import { useCallback, useSyncExternalStore } from "react";
import type { DrawerState } from "@/data/contract-transition";
import {
  closeDrawer,
  getDrawerState,
  openDrawer as openDrawerInternal,
  patchFlowSession as patchFlowSessionInternal,
  setFlowStep as setFlowStepInternal,
  subscribeDrawer,
} from "./drawer-store";

export function useDrawerStore() {
  const snap = useSyncExternalStore(subscribeDrawer, getDrawerState, getDrawerState);

  const openDrawer = useCallback((next: Parameters<typeof openDrawerInternal>[0]) => {
    openDrawerInternal(next);
  }, []);

  const close = useCallback(() => {
    closeDrawer();
  }, []);

  const patchFlowSession = useCallback((partial: Parameters<typeof patchFlowSessionInternal>[0]) => {
    patchFlowSessionInternal(partial);
  }, []);

  const setFlowStep = useCallback((step: Parameters<typeof setFlowStepInternal>[0]) => {
    setFlowStepInternal(step);
  }, []);

  return {
    ...(snap as DrawerState),
    openDrawer,
    closeDrawer: close,
    patchFlowSession,
    setFlowStep,
  };
}
