/**
 * Tiny typed wrapper around `localStorage` for app preferences that
 * should survive a refresh (workspace mode, active suite product, rail
 * collapse states, sidebar width, …).
 *
 * Each helper is SSR-safe (`typeof window` guard) and tolerates a
 * disabled or full storage by silently falling back to the default.
 * Keys live under the `cb-apex-board:` namespace so they're easy to spot
 * in DevTools and unlikely to collide with future additions.
 *
 * Conventions:
 *   - One key per concept. Don't pack multiple values into one entry.
 *   - Always provide a `fallback` to the reader so callers don't need
 *     extra null-checks at the consumer.
 *   - Booleans / strings only (the underlying API stores strings).
 *     Anything richer should serialise to JSON and validate on read.
 */

const NS = "cb-apex-board:";

export const PERSIST_KEYS = {
  /** "sidebar" | "workspace" — last assistant mode. */
  assistantMode: `${NS}assistant-mode`,
  /** Suite product id (e.g. `"billing"`, `"growth"`). */
  activeSuiteProduct: `${NS}active-suite-product`,
  /** Product (left) nav dock state. */
  productNavCollapsed: `${NS}product-nav-collapsed`,
  /** Sessions sub-rail dock state inside the assistant workspace. */
  sessionsRailCollapsed: `${NS}sessions-rail-collapsed`,
} as const;

function safeRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / disabled / private mode — non-fatal */
  }
}

export function readStringSetting<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = safeRead(key);
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function writeStringSetting(key: string, value: string) {
  safeWrite(key, value);
}

export function readBooleanSetting(key: string, fallback: boolean): boolean {
  const raw = safeRead(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

export function writeBooleanSetting(key: string, value: boolean) {
  safeWrite(key, value ? "true" : "false");
}
