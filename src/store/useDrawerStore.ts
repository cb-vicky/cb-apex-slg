import { useCallback, useSyncExternalStore } from "react";
import type { DrawerState } from "@/data/contract-transition";
import {
  closeDrawer,
  getDrawerState,
  openDrawer as openDrawerInternal,
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

  return {
    ...(snap as DrawerState),
    openDrawer,
    closeDrawer: close,
  };
}
