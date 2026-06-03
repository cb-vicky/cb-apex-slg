import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentCollectionsTab =
  | "overview"
  | "promise-to-pay"
  | "add-promise-to-pay"
  | "edit-promise-to-pay";

function SubTabPill({
  label,
  count,
  active,
  closable,
  onClick,
  onClose,
}: {
  label: string;
  count?: number;
  active: boolean;
  closable?: boolean;
  onClick: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full transition-[colors,box-shadow] duration-150",
        active
          ? "bg-surface shadow-sm ring-1 ring-border-default"
          : "bg-transparent shadow-sm ring-1 ring-border-default hover:bg-gray-50",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full py-1.5 text-[13px] leading-tight transition-[font-weight] duration-150",
          closable ? "pl-3 pr-1" : "px-3",
          active ? "font-bold text-[#2F333D]" : "font-medium text-[#3E4C60]",
        )}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px]",
              active ? "bg-blue-600/15 font-semibold text-blue-700" : "bg-gray-100",
            )}
          >
            {count}
          </span>
        )}
      </button>
      {closable && onClose ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={`Close ${label}`}
          className={cn(
            "mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors",
            active
              ? "text-blue-600/70 hover:bg-blue-100 hover:text-blue-800"
              : "text-text-muted hover:bg-gray-100 hover:text-text-primary",
          )}
        >
          <X size={12} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function FlowTabsSeparator() {
  return (
    <div
      className="mx-1 h-6 w-px shrink-0 self-center bg-border-default"
      role="separator"
      aria-orientation="vertical"
      aria-hidden
    />
  );
}

interface Props {
  active: PaymentCollectionsTab;
  promiseToPayCount: number;
  addTabOpen: boolean;
  editTabOpen: boolean;
  onChange: (tab: PaymentCollectionsTab) => void;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
}

export function PaymentCollectionsSubTabs({
  active,
  promiseToPayCount,
  addTabOpen,
  editTabOpen,
  onChange,
  onCloseAdd,
  onCloseEdit,
}: Props) {
  const hasFlowTabs = addTabOpen || editTabOpen;

  return (
    <div className="flex justify-start">
      <div className="flex flex-wrap items-center justify-start gap-2">
        <SubTabPill
          label="Overview"
          active={active === "overview"}
          onClick={() => onChange("overview")}
        />
        <SubTabPill
          label="Promise to pay"
          count={promiseToPayCount}
          active={active === "promise-to-pay"}
          onClick={() => onChange("promise-to-pay")}
        />
        {hasFlowTabs ? <FlowTabsSeparator /> : null}
        {addTabOpen ? (
          <SubTabPill
            label="Add Promise to pay"
            active={active === "add-promise-to-pay"}
            closable
            onClick={() => onChange("add-promise-to-pay")}
            onClose={onCloseAdd}
          />
        ) : null}
        {editTabOpen ? (
          <SubTabPill
            label="Edit Promise to pay"
            active={active === "edit-promise-to-pay"}
            closable
            onClick={() => onChange("edit-promise-to-pay")}
            onClose={onCloseEdit}
          />
        ) : null}
      </div>
    </div>
  );
}
