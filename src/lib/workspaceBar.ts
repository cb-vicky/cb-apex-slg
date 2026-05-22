/** Default suite chrome (billing / sidebar mode). */
export const SUITE_BAR_BG = "#001F24";

/**
 * Workspace header base — ~25% darker than the icon’s `#0a0a14` outer fill,
 * shifted cooler so the bar reads as deep blue-black.
 */
export const WORKSPACE_BAR_BG = "#05060c";

/**
 * Cool, dark washes for workspace mode. Blues / indigos / cyans lead; red and
 * orange from the icon palette sit underneath as subtle warmth (not dominant).
 */
export const WORKSPACE_BAR_GRADIENT = [
  "radial-gradient(ellipse 80% 260% at 46% -18%, rgba(82, 196, 241, 0.3) 0%, transparent 54%)",
  "radial-gradient(ellipse 85% 250% at -6% 52%, rgba(23, 58, 212, 0.36) 0%, transparent 60%)",
  "radial-gradient(ellipse 72% 230% at 76% 18%, rgba(109, 135, 255, 0.28) 0%, transparent 57%)",
  "radial-gradient(ellipse 90% 280% at 8% 88%, rgba(18, 40, 126, 0.53) 0%, transparent 62%)",
  "radial-gradient(ellipse 75% 240% at 92% 98%, rgba(14, 28, 74, 0.28) 0%, transparent 58%)",
  "radial-gradient(ellipse 70% 220% at 60% 6%, rgba(75,95,175,0.26) 0%, transparent 55%)",
  "radial-gradient(ellipse 88% 270% at 7% 92%, rgba(255, 47, 89, 0.61) 0%, transparent 60%)",
  "radial-gradient(ellipse 72% 230% at 91% 96%, rgba(255, 111, 0, 0.63) 0%, transparent 56%)",
  "radial-gradient(ellipse 68% 210% at 57% 12%, rgba(255, 60, 0, 0.42) 0%, transparent 54%)",
  "radial-gradient(ellipse 65% 200% at 30% 108%, rgba(255,64,129,0.11) 0%, transparent 56%)",
  "linear-gradient(112deg, #070a12 0%, #161d38 42%, #0e1324 70%, #05060c 100%)",
].join(", ");
