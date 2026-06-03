import {
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import type {
  SubscriptionDetailGroup,
  SubscriptionStatusItem,
} from "@/data/collections-ar-profile";
import { ArAnchoredPanel, ArPopoverShell } from "./ArAnchoredPanel";

export const SUBSCRIPTION_DOT: Record<SubscriptionStatusItem["tone"], string> = {
  active: "bg-emerald-500",
  paused: "bg-amber-500",
  past_due: "bg-red-500",
  scheduled: "bg-blue-500",
};

export function getSubscriptionHeaderSummary(items: SubscriptionStatusItem[]) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const paused = items.find((item) => item.tone === "paused");
  return { total, paused };
}

export function SubscriptionsPopoverContent({
  groups,
  onClose,
}: {
  groups: SubscriptionDetailGroup[];
  onClose: () => void;
}) {
  return (
    <ArPopoverShell title="Subscriptions" onClose={onClose} showClose={false}>
      {groups.map((group, groupIdx) => (
        <div
          key={group.groupLabel}
          className={groupIdx > 0 ? "mt-3 border-t border-border-default pt-3" : ""}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {group.groupLabel}
          </p>
          <ul className="mt-2 space-y-2.5">
            {group.items.map((sub) => (
              <li key={sub.id} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    SUBSCRIPTION_DOT[sub.tone],
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text-primary">{sub.name}</p>
                  <p className="text-[12px] text-text-muted">{sub.plan}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-text-primary">
                    {sub.id} · {sub.statusLabel}
                  </p>
                  {sub.meta && (
                    <p className="mt-0.5 text-[11px] text-text-muted">{sub.meta}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ArPopoverShell>
  );
}

function useHoverPanel() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return { open, show, hide };
}

export function SubscriptionHoverPanel({
  groups,
  anchorRef,
  children,
  className,
  width = 360,
  align = "start",
}: {
  groups: SubscriptionDetailGroup[];
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  width?: number;
  align?: "start" | "end";
}) {
  const { open, show, hide } = useHoverPanel();

  return (
    <>
      <div
        ref={anchorRef as RefObject<HTMLDivElement>}
        className={className}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      <ArAnchoredPanel
        open={open}
        anchorRef={anchorRef}
        onClose={hide}
        width={width}
        align={align}
        blockBackdrop
      >
        <div onMouseEnter={show} onMouseLeave={hide}>
          <SubscriptionsPopoverContent groups={groups} onClose={hide} />
        </div>
      </ArAnchoredPanel>
    </>
  );
}

const SUBSCRIPTION_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wide text-text-muted";

const SUBSCRIPTION_LABEL_TYPO = "text-[11px] font-medium uppercase tracking-wide";

export function SubscriptionHeaderHint({
  items,
  groups,
  collapsed,
}: {
  items: SubscriptionStatusItem[];
  groups: SubscriptionDetailGroup[];
  collapsed?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { total, paused } = getSubscriptionHeaderSummary(items);

  if (total === 0) return null;

  return (
    <SubscriptionHoverPanel
      groups={groups}
      anchorRef={anchorRef}
      align="end"
      className={cn(
        "min-w-0 shrink-0 text-right transition-all duration-300 ease-out",
        collapsed && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex items-center gap-x-3 whitespace-nowrap rounded-lg py-0.5 transition-colors hover:bg-gray-50">
        <span className={SUBSCRIPTION_LABEL_CLASS}>{total} Subscription</span>
        {paused ? (
          <span
            className={cn(
              SUBSCRIPTION_LABEL_TYPO,
              "inline-flex items-center gap-1.5 text-amber-700",
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
            {paused.count} paused{paused.detail ? ` ${paused.detail}` : ""}
          </span>
        ) : (
          <span
            className={cn(
              SUBSCRIPTION_LABEL_TYPO,
              "inline-flex items-center gap-1.5 text-emerald-700",
            )}
          >
            active
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          </span>
        )}
      </div>
    </SubscriptionHoverPanel>
  );
}

export function SubscriptionOverviewField({
  items,
  groups,
  className,
}: {
  items: SubscriptionStatusItem[];
  groups: SubscriptionDetailGroup[];
  className?: string;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <SubscriptionHoverPanel
      groups={groups}
      anchorRef={anchorRef}
      className={cn("min-w-0", className)}
    >
      <p className={SUBSCRIPTION_LABEL_CLASS}>Subscription</p>
      <div className="mt-1.5 flex w-full max-w-lg flex-wrap items-center gap-x-4 gap-y-1 rounded-lg py-0.5 transition-colors hover:bg-gray-50">
        {items.map((item) => (
          <span
            key={`${item.tone}-${item.label}-${item.count}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-text-primary"
          >
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", SUBSCRIPTION_DOT[item.tone])}
              aria-hidden
            />
            <span>
              {item.count} {item.label}
              {item.detail ? <span> {item.detail}</span> : null}
            </span>
          </span>
        ))}
      </div>
    </SubscriptionHoverPanel>
  );
}
