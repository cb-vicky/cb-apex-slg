import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";

interface Props {
  open: boolean;
  item: ZenithSummaryLineItem | null;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Pinned below the drawer header — does not scroll with body content. */
  pinnedStrip?: ReactNode;
  headerEyebrow?: string;
  headerTitle?: string;
  closeLabel?: string;
}

export function ZenithLineItemBottomDrawer({
  open,
  item,
  onClose,
  children,
  footer,
  pinnedStrip,
  headerEyebrow,
  headerTitle,
  closeLabel = "Close item panel",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const eyebrow = headerEyebrow ?? "Line item";
  const title = headerTitle ?? (item.name.trim() || "Untitled item");

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-transparent"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zenith-line-item-drawer-title"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61] flex flex-col border-t border-border-default bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.14)]",
          "motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-out",
          expanded ? "h-[90vh]" : "h-[40vh]",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-8 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{eyebrow}</p>
            <h2
              id="zenith-line-item-drawer-title"
              className="truncate font-sora text-[14px] font-bold text-text-primary"
            >
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label={expanded ? "Minimize drawer" : "Expand drawer"}
            >
              {expanded ? (
                <Minimize2 size={18} strokeWidth={2} aria-hidden />
              ) : (
                <Maximize2 size={18} strokeWidth={2} aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </header>
        {pinnedStrip ? <div className="shrink-0">{pinnedStrip}</div> : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8">{children}</div>
        {footer}
      </div>
    </>,
    document.body,
  );
}
