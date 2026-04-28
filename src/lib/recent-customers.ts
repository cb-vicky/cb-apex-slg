import { useEffect, useState } from "react";

// Tracks the most recently visited customers for the sidebar "Recent" rail.
// Persisted in localStorage so the list survives reloads. A custom event is
// dispatched on every write so consumers in the same tab refresh in real time.

const STORAGE_KEY = "apex.recent-customers";
const UPDATE_EVENT = "apex:recent-customers-updated";
const MAX_ENTRIES = 3;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // ignore quota / privacy mode errors
  }
}

export function recordCustomerVisit(customerId: string) {
  if (!customerId) return;
  const next = [customerId, ...readIds().filter((id) => id !== customerId)].slice(0, MAX_ENTRIES);
  writeIds(next);
}

export function useRecentCustomerIds(): string[] {
  const [ids, setIds] = useState<string[]>(() => readIds());

  useEffect(() => {
    function refresh() {
      setIds(readIds());
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    // Cross-tab sync — `storage` only fires in *other* tabs, so combined with
    // the custom event above we cover both same-tab and cross-tab updates.
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) refresh();
    });
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
    };
  }, []);

  return ids;
}
