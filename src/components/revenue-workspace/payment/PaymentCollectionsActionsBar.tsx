import { useEffect, useRef, useState } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_BTN_CLASS =
  "inline-flex items-center justify-center gap-1 rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

const MORE_BTN_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-border-subtle bg-white/80 px-2.5 py-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary";

const MORE_MENU_ITEMS = [
  "Share Statement to Customer",
  "Add Task",
  "Manage Credits",
  "Record an Offline Payment",
  "Change Billing Alignment",
  "Request Payment Method Update",
  "Update Billing Info",
] as const;

interface Props {
  onAddPromiseToPay: () => void;
}

export function PaymentCollectionsActionsBar({ onAddPromiseToPay }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="More actions"
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(MORE_BTN_CLASS, menuOpen && "bg-surface-muted text-text-primary")}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-64 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-xl">
            {MORE_MENU_ITEMS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex w-full px-3 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-gray-50"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" onClick={onAddPromiseToPay} className={PRIMARY_BTN_CLASS}>
        Add Promise to pay
        <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
      </button>
    </div>
  );
}
