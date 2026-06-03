import { cn } from "@/lib/utils";
import type { PaymentCollectionsTab } from "./PaymentCollectionsSubTabs";

const TAB_CORNER_RADIUS =
  "rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[36px] rounded-br-[36px]";
const DOCK_TWEEN_MS = 520;
const DOCK_TWEEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function DockedSubPill({
  label,
  count,
  active,
  onClick,
  visible,
  delayMs,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  visible: boolean;
  delayMs: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-tight transition-[opacity,transform,background-color,color]",
        visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
        active
          ? "bg-white text-blue-600 shadow-sm"
          : "text-blue-100 hover:bg-white/10 hover:text-white",
      )}
      style={{
        transitionDuration: `${DOCK_TWEEN_MS}ms`,
        transitionTimingFunction: DOCK_TWEEN_EASE,
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1 py-px text-[10px] leading-none",
            active ? "bg-blue-600/15 text-blue-700" : "bg-white/10",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function DockedFlowTabsSeparator({
  visible,
  delayMs,
}: {
  visible: boolean;
  delayMs: number;
}) {
  return (
    <span
      className={cn(
        "mx-0.5 mb-0.5 inline-block h-4 w-px shrink-0 bg-white/30 transition-[opacity,transform]",
        visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
      )}
      style={{
        transitionDuration: `${DOCK_TWEEN_MS}ms`,
        transitionTimingFunction: DOCK_TWEEN_EASE,
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
      role="separator"
      aria-orientation="vertical"
      aria-hidden
    />
  );
}

interface Props {
  active: boolean;
  collectionsTab: PaymentCollectionsTab;
  promiseToPayCount: number;
  addTabOpen: boolean;
  editTabOpen: boolean;
  subTabsVisible?: boolean;
  onSelectCollections: () => void;
  onSubTabChange: (tab: PaymentCollectionsTab) => void;
}

export function PaymentDockedTabButton({
  active,
  collectionsTab,
  promiseToPayCount,
  addTabOpen,
  editTabOpen,
  subTabsVisible = true,
  onSelectCollections,
  onSubTabChange,
}: Props) {
  const hasFlowTabs = addTabOpen || editTabOpen;

  return (
    <div className="group/tab relative min-w-0 flex-1" style={{ zIndex: active ? 50 : 10 }}>
      <div
        className={cn(
          "relative flex w-full min-w-[200px] items-end justify-between gap-3 border px-4 py-2.5 transition-[border-color,background-color,box-shadow]",
          TAB_CORNER_RADIUS,
          active
            ? "border-blue-600 bg-blue-600 text-white shadow-[0_8px_18px_-4px_rgba(37,99,235,0.5)]"
            : "border-gray-200 bg-white text-text-primary shadow-[0_3px_10px_-2px_rgba(0,0,0,0.14)]",
        )}
        style={{
          transitionDuration: `${DOCK_TWEEN_MS}ms`,
          transitionTimingFunction: DOCK_TWEEN_EASE,
        }}
      >
        <button
          type="button"
          onClick={onSelectCollections}
          className="shrink-0 pb-0.5 text-left text-[13px] font-semibold leading-tight transition-opacity hover:opacity-90"
        >
          Collections
        </button>
        <span className="flex flex-wrap items-end justify-end gap-1.5 pb-0.5">
          <DockedSubPill
            label="Overview"
            active={collectionsTab === "overview"}
            visible={subTabsVisible}
            delayMs={180}
            onClick={() => onSubTabChange("overview")}
          />
          <DockedSubPill
            label="Promise to pay"
            count={promiseToPayCount}
            active={collectionsTab === "promise-to-pay"}
            visible={subTabsVisible}
            delayMs={230}
            onClick={() => onSubTabChange("promise-to-pay")}
          />
          {hasFlowTabs ? (
            <DockedFlowTabsSeparator visible={subTabsVisible} delayMs={255} />
          ) : null}
          {addTabOpen ? (
            <DockedSubPill
              label="Add"
              active={collectionsTab === "add-promise-to-pay"}
              visible={subTabsVisible}
              delayMs={280}
              onClick={() => onSubTabChange("add-promise-to-pay")}
            />
          ) : null}
          {editTabOpen ? (
            <DockedSubPill
              label="Edit"
              active={collectionsTab === "edit-promise-to-pay"}
              visible={subTabsVisible}
              delayMs={330}
              onClick={() => onSubTabChange("edit-promise-to-pay")}
            />
          ) : null}
        </span>
      </div>
    </div>
  );
}
