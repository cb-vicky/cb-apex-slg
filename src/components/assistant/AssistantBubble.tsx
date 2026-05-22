import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, RefreshCw } from "lucide-react";
import { AssistantProfileIcon } from "@/components/assistant/AssistantProfileIcon";

/** Tiny CB-branded glyph rendered as the avatar at the start of an assistant run. */
export function AssistantMark() {
  return <AssistantProfileIcon className="h-4 w-4" />;
}

/**
 * Action row below a completed assistant message: copy to clipboard +
 * regenerate. Hidden while the message is still streaming.
 */
export function AssistantMessageActions({ content }: { content: string }) {
  const iconButtonClass =
    "squircle inline-flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600";
  return (
    <div className="flex items-center gap-0.5 pt-0.5">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(content);
        }}
        className={iconButtonClass}
        aria-label="Copy message"
        title="Copy"
      >
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={iconButtonClass}
        aria-label="Regenerate response"
        title="Regenerate"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

/**
 * User bubble text. Clamps to 2 lines with a "Show more / Show less" toggle
 * when the content overflows. We measure with a `ResizeObserver` so the
 * toggle appears/disappears as the panel resizes.
 */
export function UserBubbleText({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el) return;

    const measure = () => {
      if (expanded) {
        setOverflows(false);
        return;
      }
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [content, expanded]);

  return (
    <div className="min-w-0">
      <p
        ref={pRef}
        className={`break-words whitespace-pre-wrap leading-[1.3rem] ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {content}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-1 text-left text-xs font-medium text-primary-600 underline-offset-2 hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            </>
          ) : (
            <>
              Show more
              <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            </>
          )}
        </button>
      )}
    </div>
  );
}
