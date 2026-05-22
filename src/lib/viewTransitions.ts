/**
 * Thin wrapper around the View Transitions API.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 *
 *  - When the browser supports `document.startViewTransition`, the wrapper
 *    snapshots the page, runs the synchronous DOM update, and lets the
 *    browser interpolate any element tagged with `view-transition-name`
 *    between the before / after states. We pair this with `flushSync`
 *    inside the callback so React commits before the second snapshot.
 *
 *  - When the browser does not support it (current Firefox, Safari < 18),
 *    the wrapper just runs the callback inline and returns `null`. Callers
 *    use the return value to decide whether to fall back to manual
 *    width-flight orchestration.
 *
 * The wrapper also flips a `data-vt-running` attribute on the document
 * root for the duration of the transition. Components can opt out of their
 * own live transitions during a view transition by reading that attribute
 * (avoids double-tweens stacking on top of the browser's snapshots).
 */

import { flushSync } from "react-dom";

type ViewTransition = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => ViewTransition;
};

export function supportsViewTransitions(): boolean {
  if (typeof document === "undefined") return false;
  return typeof (document as ViewTransitionDocument).startViewTransition ===
    "function";
}

const VT_RUNNING_ATTR = "data-vt-running";

export function startViewTransition(
  updateCallback: () => void,
): ViewTransition | null {
  if (typeof document === "undefined") {
    updateCallback();
    return null;
  }
  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition !== "function") {
    updateCallback();
    return null;
  }

  doc.documentElement.setAttribute(VT_RUNNING_ATTR, "true");
  const transition = doc.startViewTransition(updateCallback);

  const clear = () => {
    doc.documentElement.removeAttribute(VT_RUNNING_ATTR);
  };
  transition.finished.then(clear, clear);

  return transition;
}

const VT_KIND_ATTR = "data-vt-kind";

/**
 * Run a React state commit inside a view transition, with a `skip` escape
 * hatch for reduced-motion / compact-viewport / non-VT browsers.
 *
 * `flushSync` is wrapped around the commit so React's render lands before
 * the browser captures the second snapshot — without it, React may batch
 * the update beyond the VT capture window and the crossfade falls back to
 * a hard cut.
 *
 * `kind` sets `data-vt-kind=<kind>` on `<html>` for the transition's
 * duration so CSS keyframes can be scoped per intent. The four kinds
 * used in this app are:
 *
 *   - `"workspace"`        — sidebar ↔ workspace mode flip. Animates
 *                            `assistant-column`, `main-content`,
 *                            `product-nav` (unmounts) and
 *                            `sessions-rail` (mounts).
 *   - `"product-nav"`      — left product-nav dock (260↔32). Animates
 *                            only the `product-nav` pseudos.
 *   - `"sessions-rail"`    — sessions sub-rail dock inside the
 *                            assistant workspace. Animates only the
 *                            `sessions-rail` pseudos.
 *   - `"assistant-dock"`   — right assistant-column dock (panelWidth
 *                            ↔ 32). Animates only the
 *                            `assistant-column` pseudos.
 *
 * Scoping each rail/dock to its own `kind` is what prevents cross-talk
 * between sibling rails — collapsing one never animates another.
 *
 * Returns the `ViewTransition` when one was started, or `null` when we
 * fell through to a plain synchronous commit (skip or no VT support).
 */
export function flipWithVT(
  commit: () => void,
  options?: { skip?: boolean; kind?: string },
): ViewTransition | null {
  if (options?.skip || !supportsViewTransitions()) {
    commit();
    return null;
  }
  if (options?.kind && typeof document !== "undefined") {
    document.documentElement.setAttribute(VT_KIND_ATTR, options.kind);
  }
  const transition = startViewTransition(() => flushSync(commit));
  if (options?.kind && transition && typeof document !== "undefined") {
    const clear = () => {
      document.documentElement.removeAttribute(VT_KIND_ATTR);
    };
    transition.finished.then(clear, clear);
  }
  return transition;
}
