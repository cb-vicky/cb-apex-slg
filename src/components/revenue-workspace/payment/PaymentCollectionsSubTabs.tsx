import { cn } from "@/lib/utils";

export type PaymentCollectionsTab = "overview" | "promise-to-pay";

function SubTabPill({
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
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-text-secondary shadow-sm ring-1 ring-border-default hover:bg-gray-50",
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px]",
            active ? "bg-white/20" : "bg-gray-100",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface Props {
  active: PaymentCollectionsTab;
  promiseToPayCount: number;
  onChange: (tab: PaymentCollectionsTab) => void;
}

export function PaymentCollectionsSubTabs({ active, promiseToPayCount, onChange }: Props) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
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
      </div>
    </div>
  );
}
