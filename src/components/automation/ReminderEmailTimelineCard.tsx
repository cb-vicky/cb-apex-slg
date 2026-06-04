import { useEffect, useRef, useState } from "react";
import { ChevronRight, Copy, Mail, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { ReminderEmailAction } from "@/data/offline-invoice-reminders";
import { formatEmailScheduleLabel } from "@/data/offline-invoice-reminders";
import { cn } from "@/lib/utils";

const CARD_ADD_CHIP =
  "left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity group-hover/card:opacity-100";

interface Props {
  email: ReminderEmailAction;
  selected?: boolean;
  canDelete?: boolean;
  onSelect: () => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const timingAccent: Record<ReminderEmailAction["timing"], string> = {
  "before-due": "text-amber-600",
  "on-due": "text-red-600",
  "after-due": "text-rose-500",
};

export function ReminderEmailTimelineCard({
  email,
  selected = false,
  canDelete = true,
  onSelect,
  onAddBefore,
  onAddAfter,
  onClone,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sendToLabel = email.sendTo.join(", ") || "—";

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
    <div className="group/card relative py-2">
      <div
        className={cn(
          "relative flex w-full min-w-0 items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-[border-color,box-shadow]",
          selected
            ? "border-dashed border-blue-400 shadow-sm ring-2 ring-blue-100"
            : "border-border-default hover:border-gray-300 hover:shadow-sm",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddBefore();
          }}
          className={cn(
            "absolute top-0 flex -translate-y-1/2 items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600 shadow-sm",
            CARD_ADD_CHIP,
          )}
          aria-label="Add email before this step"
        >
          <Plus size={12} strokeWidth={2.5} aria-hidden />
          Add
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50",
              timingAccent[email.timing],
            )}
          >
            <Mail size={16} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-text-primary">{email.title}</p>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Scheduled{" "}
              <span className="font-medium text-text-secondary">
                {formatEmailScheduleLabel(email)}
              </span>
              {" | "}
              Sent to: {sendToLabel}
            </p>
          </div>
        </button>

        <div ref={menuRef} className="relative flex shrink-0 items-center gap-1 text-text-muted">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "rounded-md p-1 transition-colors hover:bg-surface-muted hover:text-text-primary",
              menuOpen && "bg-surface-muted text-text-primary",
            )}
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClone();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
              >
                <Copy size={14} className="shrink-0 text-text-muted" aria-hidden />
                Clone
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canDelete}
                onClick={() => {
                  if (!canDelete) return;
                  setMenuOpen(false);
                  onDelete();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors",
                  canDelete
                    ? "text-red-600 hover:bg-red-50"
                    : "cursor-not-allowed text-text-muted/50",
                )}
              >
                <Trash2 size={14} className="shrink-0" aria-hidden />
                Delete
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onSelect}
            className="rounded-md p-1 transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label={`Edit ${email.title}`}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddAfter();
          }}
          className={cn(
            "absolute bottom-0 flex translate-y-1/2 items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-600 shadow-sm",
            CARD_ADD_CHIP,
          )}
          aria-label="Add email after this step"
        >
          <Plus size={12} strokeWidth={2.5} aria-hidden />
          Add
        </button>
      </div>
    </div>
  );
}
