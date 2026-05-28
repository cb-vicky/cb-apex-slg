import { cn } from "@/lib/utils";
import type { PaymentCollectionsTab } from "./PaymentCollectionsSubTabs";

const TAB_CORNER_RADIUS =
  "rounded-tl-[4px] rounded-bl-[4px] rounded-tr-[36px] rounded-br-[36px]";

function DockedSubPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-white/20 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px]",
            active ? "bg-white/25" : "bg-white/10",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface Props {
  active: boolean;
  collectionsTab: PaymentCollectionsTab;
  promiseToPayCount: number;
  onSelectCollections: () => void;
  onSubTabChange: (tab: PaymentCollectionsTab) => void;
}

export function PaymentDockedTabButton({
  active,
  collectionsTab,
  promiseToPayCount,
  onSelectCollections,
  onSubTabChange,
}: Props) {
  return (
    <div className="group/tab relative min-w-0 flex-1" style={{ zIndex: active ? 50 : 10 }}>
      <button
        type="button"
        onClick={onSelectCollections}
        className={cn(
          "relative flex w-full min-w-[200px] items-center gap-3 border px-4 py-2.5 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          TAB_CORNER_RADIUS,
          active
            ? "border-blue-600 bg-blue-600 text-white shadow-[0_8px_18px_-4px_rgba(37,99,235,0.5)]"
            : "border-gray-200 bg-white text-text-primary shadow-[0_3px_10px_-2px_rgba(0,0,0,0.14)]",
        )}
      >
        <span className="shrink-0 text-[13px] font-semibold">Collections</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <DockedSubPill
            label="Overview"
            active={collectionsTab === "overview"}
            onClick={() => onSubTabChange("overview")}
          />
          <DockedSubPill
            label="Promise to pay"
            count={promiseToPayCount}
            active={collectionsTab === "promise-to-pay"}
            onClick={() => onSubTabChange("promise-to-pay")}
          />
        </span>
      </button>
    </div>
  );
}
