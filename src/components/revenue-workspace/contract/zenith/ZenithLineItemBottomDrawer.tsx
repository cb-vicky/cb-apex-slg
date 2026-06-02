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
  /** Compact height after line item is resolved (success summary). */
  compact?: boolean;
  /** Override scroll body padding (e.g. flush success layout). */
  contentClassName?: string;
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
  compact = false,
  contentClassName,
  headerEyebrow,
  headerTitle,
  closeLabel = "Close item panel",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [persistedTitle, setPersistedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPersistedTitle(null);
      return;
    }
    if (!item) return;
    setPersistedTitle(headerTitle ?? (item.name.trim() || "Untitled item"));
  }, [open, item?.id, headerTitle]);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  useEffect(() => {
    if (compact) setExpanded(false);
  }, [compact]);

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
  const title = persistedTitle ?? headerTitle ?? (item.name.trim() || "Untitled item");

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
          "fixed z-[61] flex flex-col bg-white",
          "motion-safe:transition-[height,box-shadow,inset] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded
            ? "inset-0 shadow-none"
            : compact
              ? "inset-x-0 bottom-0 h-[20vh] min-h-[168px] max-h-[220px] border-t border-emerald-200/60 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
              : "inset-x-0 bottom-0 h-[80vh] border-t border-border-default shadow-[0_-10px_40px_rgba(15,23,42,0.14)]",
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
              aria-label={expanded ? "Exit full page view" : "Expand to full page"}
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
        {pinnedStrip ? (
          <div className="shrink-0 w-full motion-safe:transition-opacity motion-safe:duration-200">
            {pinnedStrip}
          </div>
        ) : null}
        <div
          className={cn(
            "min-h-0 flex-1 overscroll-contain",
            compact ? "overflow-hidden" : "overflow-y-auto",
            contentClassName ?? "px-8",
          )}
        >
          {children}
        </div>
        {footer}
      </div>
    </>,
    document.body,
  );
}
