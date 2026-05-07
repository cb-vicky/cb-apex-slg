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
import { ArrowLeft, ChevronDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { useRecordSlot } from "./RecordSlot";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A switchable record (quote version, sibling contract, sibling invoice…) shown in the dropdown. */
export interface RecordHeaderOption {
  id: string;
  /** Small subtle tag rendered alongside the ID in the trigger pill and row (e.g. "v3"). */
  pillTag?: string;
  /** Optional status badge rendered in the dropdown row (NOT in the pill). */
  status?: string;
  /** Primary descriptor line below the ID row in the dropdown. */
  description?: string;
  /** Optional red error/warning line below the description (e.g. rejection reason). */
  errorLine?: string;
}

/** An action surfaced under the `…` overflow menu. */
export interface OverflowItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
}

interface Props {
  id: string;
  /** Subtle pill tag rendered inside the trigger pill itself (e.g. "v3" for quotes). */
  pillTag?: string;
  /**
   * When provided the ID pill becomes a dropdown to switch between sibling
   * records (quote versions, customer contracts, customer invoices, …).
   */
  recordOptions?: RecordHeaderOption[];
  onRecordSelect?: (id: string) => void;
  /** Optional dropdown title (e.g. "Quote versions", "All contracts"). */
  recordMenuTitle?: string;
  /**
   * Back / list navigation slot — rendered as a flat text link with a left arrow.
   */
  leadingAction?: ReactNode;
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
// Glass card — slim white pill with a soft blur on the content scrolling beneath
// ---------------------------------------------------------------------------

function RecordCard({
  id,
  pillTag,
  recordOptions,
  onRecordSelect,
  recordMenuTitle,
  leadingAction,
  actions,
  overflowItems,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/65 px-5 py-2.5",
        "shadow-[0_8px_24px_-12px_rgba(17,24,39,0.18)] backdrop-blur-md backdrop-saturate-150",
      )}
    >
      {/* LEFT — back link + ID pill (status / tagline live in Overview, not here) */}
      <div className="flex min-w-0 items-center gap-3">
        {leadingAction && <BackLink>{leadingAction}</BackLink>}
        {recordOptions && recordOptions.length > 0 && onRecordSelect ? (
          <RecordMenu
            id={id}
            pillTag={pillTag}
            options={recordOptions}
            menuTitle={recordMenuTitle}
            onSelect={onRecordSelect}
          />
        ) : (
          <IdPill id={id} pillTag={pillTag} />
        )}
      </div>

      {/* RIGHT — text actions separated by vertical dividers */}
      {(actions || (overflowItems && overflowItems.length > 0)) && (
        <ActionRow overflowItems={overflowItems}>{actions}</ActionRow>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back link — render as a flat text link with a left arrow icon. Accepts the
// existing leadingAction node (typically an ActionButton) but ignores its
// chrome and just extracts the label/onClick.
// ---------------------------------------------------------------------------

function BackLink({ children }: { children: ReactNode }) {
  if (isValidElement<{ label?: ReactNode; onClick?: () => void }>(children)) {
    const { label, onClick } = children.props;
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={14} className="opacity-80" />
        <span>{label}</span>
      </button>
    );
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// ID pill — solid blue bordered chip
// ---------------------------------------------------------------------------

function IdPill({ id, pillTag }: { id: string; pillTag?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[13px]",
        "border-blue-300 bg-blue-50",
      )}
    >
      <span className="font-bold tracking-tight text-blue-700">{id}</span>
      {pillTag && <span className="text-[11px] font-medium text-blue-500/80">{pillTag}</span>}
    </span>
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
  return <span className="mx-3 inline-block h-4 w-px bg-gray-300" aria-hidden />;
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
            "inline-flex items-center text-[13px] font-medium leading-none transition-colors",
            disabled
              ? "cursor-not-allowed text-text-muted/60"
              : "text-text-secondary hover:text-blue-600",
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
          "inline-flex items-center text-[13px] leading-none transition-colors",
          open ? "text-text-primary" : "text-text-secondary hover:text-blue-600",
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

// ---------------------------------------------------------------------------
// Record menu — generalized version of the previous quote-version dropdown.
// Used for quote versions, contracts under a customer, invoices under a
// customer, etc. The trigger keeps the blue ID-pill aesthetic.
// ---------------------------------------------------------------------------

function RecordMenu({
  id,
  pillTag,
  options,
  menuTitle,
  onSelect,
}: {
  id: string;
  pillTag?: string;
  options: RecordHeaderOption[];
  menuTitle?: string;
  onSelect: (id: string) => void;
}) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] transition-colors",
          "border-blue-300 bg-blue-50 hover:bg-blue-100",
        )}
      >
        <span className="font-bold tracking-tight text-blue-700">{id}</span>
        {pillTag && <span className="text-[11px] font-medium text-blue-500/80">{pillTag}</span>}
        <ChevronDown size={14} strokeWidth={2.4} className="text-blue-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[420px] rounded-xl border border-border-default bg-white p-2 shadow-xl">
          {menuTitle && (
            <div className="mb-1 px-2 py-1 text-[11px] uppercase tracking-wider text-text-muted">
              {menuTitle}
            </div>
          )}
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {options.map((opt) => {
              const selected = opt.id === id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelect(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                    selected
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-transparent hover:border-border-default hover:bg-surface-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{opt.id}</span>
                    {opt.pillTag && (
                      <span className="text-[12px] text-text-muted">{opt.pillTag}</span>
                    )}
                    {opt.status && <StatusBadge status={opt.status} />}
                  </div>
                  {opt.description && (
                    <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
                      {opt.description}
                    </p>
                  )}
                  {opt.errorLine && (
                    <p className="mt-1 text-[11px] text-rose-600">{opt.errorLine}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
