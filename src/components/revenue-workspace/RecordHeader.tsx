import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordSlot } from "./RecordSlot";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** An action surfaced under the `…` overflow menu. */
export interface OverflowItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
}

interface Props {
  /**
   * Action buttons (already composed). Each direct child is treated as a
   * separate action and rendered as a flat text button separated by vertical
   * dividers. Caller is responsible for keeping this to two items at most;
   * additional actions belong in `overflowItems`.
   */
  actions?: ReactNode;
  /** Additional actions surfaced under a `…` overflow menu (after a divider). */
  overflowItems?: OverflowItem[];
}

// ---------------------------------------------------------------------------
// Public component — portals into the sticky shell slot.
// ---------------------------------------------------------------------------

export function RecordHeader(props: Props) {
  const slot = useRecordSlot();
  if (!slot) return null;
  return createPortal(<RecordCard {...props} />, slot);
}

// ---------------------------------------------------------------------------
// Compact action bar — slim glass pill with primary actions + overflow menu
// ---------------------------------------------------------------------------

function RecordCard({ actions, overflowItems }: Props) {
  if (!actions && (!overflowItems || overflowItems.length === 0)) return null;

  // Render actions inline — the parent ActionsPillWrapper provides the trapezoidal container
  return (
    <div className="inline-flex items-center">
      <ActionRow overflowItems={overflowItems}>{actions}</ActionRow>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action row — flat text buttons with vertical-line separators, optional
// overflow menu pinned to the right.
// ---------------------------------------------------------------------------

function ActionRow({
  children,
  overflowItems,
}: {
  children: ReactNode;
  overflowItems?: OverflowItem[];
}) {
  const items = Children.toArray(children).filter((c) => c !== null && c !== undefined);
  const showOverflow = !!overflowItems && overflowItems.length > 0;
  return (
    <div className="ml-auto flex shrink-0 items-center">
      {items.map((child, idx) => (
        <div key={idx} className="flex items-center">
          {idx > 0 && <Divider />}
          <FlatAction>{child}</FlatAction>
        </div>
      ))}
      {showOverflow && (
        <>
          {items.length > 0 && <Divider />}
          <OverflowMenu items={overflowItems!} />
        </>
      )}
    </div>
  );
}

function Divider() {
  return <span className="mx-2.5 inline-block h-4 w-px bg-gray-300" aria-hidden />;
}

function FlatAction({ children }: { children: ReactNode }) {
  if (
    isValidElement<{ label?: ReactNode; onClick?: () => void; disabled?: boolean }>(children)
  ) {
    const { label, onClick, disabled } = children.props;
    if (label !== undefined && label !== "") {
      return (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center text-sm font-semibold leading-tight transition-colors",
            disabled
              ? "cursor-not-allowed text-text-muted/60"
              : "text-blue-600 hover:text-blue-700",
          )}
        >
          {label}
        </button>
      );
    }
  }
  return <span className="inline-flex items-center">{children}</span>;
}

// ---------------------------------------------------------------------------
// Overflow menu — `…` trigger that pops a small action list. Shared across
// quote / contract / invoice stage content to keep the look consistent.
// ---------------------------------------------------------------------------

function OverflowMenu({ items }: { items: OverflowItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        className={cn(
          "inline-flex items-center leading-none transition-colors",
          open ? "text-blue-700" : "text-blue-600 hover:text-blue-700",
        )}
      >
        <MoreHorizontal size={16} strokeWidth={2.2} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-xl">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.disabled) return;
                  setOpen(false);
                  item.onClick?.();
                }}
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors",
                  item.disabled
                    ? "cursor-not-allowed text-text-muted/60"
                    : item.destructive
                      ? "text-red-600 hover:bg-red-50"
                      : "text-text-primary hover:bg-surface-muted",
                )}
              >
                {Icon && <Icon size={14} className="shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
