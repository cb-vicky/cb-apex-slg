/**
 * Simulated "thinking" stream that runs while we mock the assistant generating
 * a reply. The reducer keeps a sliding window of the latest visible lines so
 * older entries fade off the top while the user watches new ones appear.
 *
 * Used exclusively by `AIAgentSidebar` to drive the reasoning placeholder UI
 * between the user message being sent and the assistant reply starting to
 * stream.
 */

/** Lines emitted one-by-one to mimic the agent narrating its plan. */
export const REASONING_SCRIPT = [
  "Fetching real-time MRR data from the Billing API...",
  "Identifying active dunning attempts for the current billing cycle...",
  "Calculating churn probability based on historical payment failure patterns...",
  "Cross-referencing customer health scores with recent support ticket volume...",
  "Querying subscription metadata for legacy vs. current plan distributions...",
  "Analyzing revenue leakage from expired credit cards in the EMEA region...",
  "Scanning tax configuration logs for recent Nexus compliance updates...",
  "Comparing current month-to-date growth against previous quarter benchmarks...",
  "Evaluating the impact of the 'WINTER24' coupon on long-term LTV...",
  "Retrieving webhook event logs for failed subscription_created notifications...",
  "Simulating revenue impact for proposed tiered pricing adjustments...",
  "Synthesizing multi-currency reporting data into a unified base currency...",
] as const;

/** Max lines visible at once; older entries are dropped from `lines`. */
export const REASONING_MAX_VISIBLE_LINES = 4;

/** Total window before the assistant reply starts streaming. */
export const REASONING_TOTAL_MS = 15_000;

/**
 * Cadence between successive reasoning lines. We spread the script across most
 * of the window (leaving a short tail before the answer), with a minimum so
 * lines never spam in faster than the eye can read.
 */
export const REASONING_LINE_INTERVAL_MS = Math.max(
  320,
  Math.floor((REASONING_TOTAL_MS - 1200) / Math.max(1, REASONING_SCRIPT.length - 1)),
);

export type ReasoningEntry = { id: string; text: string };

export type ReasoningState = {
  lines: ReasoningEntry[];
  /** Total lines emitted across the run; used to decide when to show the top fade. */
  totalEmitted: number;
};

export type ReasoningAction =
  | { type: "reset" }
  | { type: "append"; text: string };

export const REASONING_INITIAL_STATE: ReasoningState = {
  lines: [],
  totalEmitted: 0,
};

export function reasoningReducer(
  state: ReasoningState,
  action: ReasoningAction,
): ReasoningState {
  switch (action.type) {
    case "reset":
      return REASONING_INITIAL_STATE;
    case "append": {
      const entry: ReasoningEntry = {
        id: crypto.randomUUID(),
        text: action.text,
      };
      return {
        lines: [...state.lines, entry].slice(-REASONING_MAX_VISIBLE_LINES),
        totalEmitted: state.totalEmitted + 1,
      };
    }
    default:
      return state;
  }
}
