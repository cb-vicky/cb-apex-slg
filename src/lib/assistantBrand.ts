import type { CSSProperties } from "react";

/**
 * @deprecated Use `<AssistantProfileIcon />` from `@/components/assistant/AssistantProfileIcon`.
 * Legacy conic-gradient CB mark masked through `/cb-mark.svg`.
 */
export const ASSISTANT_CBMARK_GLYPH_STYLE: CSSProperties = {
  background:
    "conic-gradient(from 180deg at 50% 50%, #f472b6, #a78bfa, #60a5fa, #22d3ee, #4ade80, #facc15, #fb923c, #f87171, #f472b6)",
  WebkitMaskImage: "url(/cb-mark.svg)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/cb-mark.svg)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
};
