import { useEffect, useId, useState } from "react";

/**
 * Rounded frame with chevron + thin edge bar (masked). Matches `icon-minimize4.svg`;
 * `currentColor` for stroke/fill.
 *
 * - `flipHorizontal`: mirrored via `scaleX(-1)` with a eased transition when toggled.
 * - `mountCross`: one-shot entrance when swapping between dock strip and full chrome
 *   (left rail + assistant), so the mirror direction animates instead of popping.
 */
export function AssistantMinimizeGlyph({
  className,
  flipHorizontal,
  mountCross,
}: {
  className?: string;
  flipHorizontal?: boolean;
  mountCross?: "from-mirror" | "to-mirror";
}) {
  const maskId = `amg-mask-${useId().replace(/:/g, "")}`;
  const flipped = Boolean(flipHorizontal);
  const [mountDone, setMountDone] = useState(() => !mountCross);

  useEffect(() => {
    if (!mountCross) setMountDone(true);
    else setMountDone(false);
  }, [mountCross]);

  useEffect(() => {
    if (!mountCross) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setMountDone(true);
  }, [mountCross]);

  const showMountAnim = Boolean(mountCross) && !mountDone;

  const onAnimEnd = (e: { animationName: string }) => {
    if (
      e.animationName === "assistant-minimize-from-mirror" ||
      e.animationName === "assistant-minimize-to-mirror"
    ) {
      setMountDone(true);
    }
  };

  const scaleTransitionClass = showMountAnim
    ? ""
    : [
        "transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-0",
        flipped ? "-scale-x-100" : "scale-x-100",
      ].join(" ");

  const mountAnimClass = showMountAnim
    ? mountCross === "from-mirror"
      ? "motion-safe:animate-assistant-minimize-from-mirror motion-reduce:animate-none"
      : "motion-safe:animate-assistant-minimize-to-mirror motion-reduce:animate-none"
    : "";

  return (
    <span
      className={[
        "flex shrink-0 origin-center items-center justify-center [contain:paint]",
        scaleTransitionClass,
        mountAnimClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onAnimationEnd={showMountAnim ? onAnimEnd : undefined}
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={13}
        height={13}
        viewBox="0 0 13 13"
        fill="none"
        className="block h-full w-full max-h-[13px] max-w-[13px]"
      >
        <defs>
          <mask
            id={maskId}
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={13}
            height={13}
          >
            <rect width={13} height={13} rx={3} fill="black" />
          </mask>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="12"
          height="12"
          rx="2.5"
          stroke="currentColor"
          fill="none"
        />
        <g mask={`url(#${maskId})`}>
          <path
            d="M4.78485 9.68481L4.05187 8.95814L5.97595 7.03406H2.46747V5.96618H5.97595L4.05187 4.04525L4.78485 3.31543L7.96954 6.50012L4.78485 9.68481Z"
            fill="currentColor"
          />
          <rect x="9" y="0" width="1" height="13" fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}
