import { createPortal } from "react-dom";
import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

type Align = "start" | "end";

export function ArAnchoredPanel({
  open,
  anchorRef,
  onClose,
  children,
  width = 320,
  align = "start",
  blockBackdrop = false,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  align?: Align;
  blockBackdrop?: boolean;
}) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      const gap = 4;
      const panelWidth = Math.min(width, window.innerWidth - margin * 2);
      const maxHeight = Math.min(320, window.innerHeight - margin * 2);

      let left =
        align === "end" ? rect.right - panelWidth : rect.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const placeAbove = spaceBelow < 160 && spaceAbove > spaceBelow;

      const top = placeAbove ? rect.top - gap : rect.bottom + gap;

      setStyle({
        position: "fixed",
        left,
        top,
        width: panelWidth,
        maxHeight,
        zIndex: 300,
        visibility: "visible",
        transform: placeAbove ? "translateY(-100%)" : undefined,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, width, align]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className={cn("fixed inset-0 z-[299]", blockBackdrop && "pointer-events-none")}
        aria-hidden
        onMouseDown={blockBackdrop ? undefined : onClose}
      />
      <div
        style={style}
        className="z-[300] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export function ArPopoverShell({
  title,
  headerAction,
  onClose,
  showClose = true,
  children,
}: {
  title: string;
  headerAction?: ReactNode;
  onClose: () => void;
  showClose?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border-default bg-white shadow-lg">
      <div className="flex shrink-0 items-center justify-between border-b border-border-default px-3 py-2">
        <p className="text-[12px] font-semibold text-text-primary">{title}</p>
        {headerAction}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{children}</div>
      {showClose ? (
        <div className="shrink-0 border-t border-border-default px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
