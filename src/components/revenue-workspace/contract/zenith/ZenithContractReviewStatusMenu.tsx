import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import {
  formatZenithContractReviewStatusLabel,
  getZenithContractReviewStatusOption,
  ZENITH_CONTRACT_REVIEW_STATUSES,
  type ZenithContractReviewStatus,
} from "./zenith-contract-review-status";

export function ZenithContractReviewStatusMenu() {
  const chrome = useZenithContractChrome();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const status = chrome?.reviewStatus ?? "in_review";
  const activeOption = getZenithContractReviewStatusOption(status);

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 200),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const listenerTimer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(listenerTimer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!chrome) return null;

  function selectStatus(next: ZenithContractReviewStatus) {
    chrome?.setReviewStatus(next);
    setOpen(false);
  }

  const menuPanel =
    open &&
    menuStyle &&
    createPortal(
      <ul
        ref={menuRef}
        role="listbox"
        aria-label="Contract review status"
        className="fixed z-[200] overflow-hidden rounded-lg border border-border-default bg-white py-1 shadow-lg"
        style={{
          top: menuStyle.top,
          left: menuStyle.left,
          minWidth: menuStyle.width,
        }}
      >
        {ZENITH_CONTRACT_REVIEW_STATUSES.map((option) => {
          const selected = option.id === status;
          return (
            <li key={option.id} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => selectStatus(option.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-gray-50 font-medium text-text-primary"
                    : "text-text-secondary hover:bg-gray-50",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      option.pillClass,
                    )}
                  >
                    {option.label}
                  </span>
                </span>
                {selected ? (
                  <Check size={14} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body,
    );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-8 max-w-[min(100%,240px)] items-center gap-1 rounded-full border px-2.5",
          "text-[12px] font-medium transition-colors",
          activeOption.pillClass,
        )}
      >
        <span className="min-w-0 truncate">{formatZenithContractReviewStatusLabel(status)}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={cn("shrink-0 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {menuPanel}
    </div>
  );
}
