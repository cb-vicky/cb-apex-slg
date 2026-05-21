import { cn } from "@/lib/utils";
import { CbLogoGradient } from "./CbLogoGradient";

const ASK_AI_EXPAND_MS = "380ms";
const ASK_AI_EXPAND_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

interface AskAiRailProps {
  active?: boolean;
  onToggle: () => void;
}

/** Right-side collapsed nav unit — mirrors sidebar chrome with an expanding Ask AI trigger. */
export function AskAiRail({ active, onToggle }: AskAiRailProps) {
  return (
    <aside
      aria-label="AI assistant navigation"
      className="relative z-[3] flex w-12 shrink-0 flex-col overflow-visible rounded-tr-[24px] bg-grey-100 pt-6 pb-3 font-sora"
    >
      <div className="flex min-h-0 flex-1 flex-col pl-2 pr-3">
        <div
          className={cn(
            "relative w-full rounded-md bg-transparent p-px transition-[background] duration-150",
            active
              ? "bg-gradient-to-l from-cb-orange to-blue-600"
              : "has-[:hover]:bg-gradient-to-l has-[:hover]:from-cb-orange has-[:hover]:to-blue-600",
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label="Ask AI"
            aria-pressed={active}
            className={cn(
              "group/ask-ai relative flex h-8 w-full items-center overflow-hidden rounded-[5px] bg-grey-100 px-2 py-[6px] text-left font-sans text-[13px] font-normal text-[#2d3940]",
              "transition-[width,box-shadow,transform] ease-[cubic-bezier(0.32,0.72,0,1)] hover:z-[10050] hover:absolute hover:right-0 hover:min-w-[108px] hover:w-max hover:shadow-[0_8px_28px_rgba(15,23,42,0.14)] focus-visible:z-[10050] focus-visible:absolute focus-visible:right-0 focus-visible:min-w-[108px] focus-visible:w-max focus-visible:shadow-[0_8px_28px_rgba(15,23,42,0.14)] focus-visible:outline-none",
              active &&
                "absolute right-0 z-[10050] min-w-[108px] w-max font-semibold shadow-[0_8px_28px_rgba(15,23,42,0.14)]",
            )}
            style={{ transitionDuration: ASK_AI_EXPAND_MS }}
          >
            <CbLogoGradient size={14} />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "ml-1.5 max-w-[4.5rem] opacity-100"
                  : "max-w-0 opacity-0 group-hover/ask-ai:ml-1.5 group-hover/ask-ai:max-w-[4.5rem] group-hover/ask-ai:opacity-100 group-focus-visible/ask-ai:ml-1.5 group-focus-visible/ask-ai:max-w-[4.5rem] group-focus-visible/ask-ai:opacity-100",
              )}
              style={{
                transitionDuration: ASK_AI_EXPAND_MS,
                transitionTimingFunction: ASK_AI_EXPAND_EASE,
              }}
            >
              Ask AI
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
