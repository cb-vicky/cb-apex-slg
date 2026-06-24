import { cn } from "@/lib/utils";

export type CollectionsEntityTab = "customers" | "invoices";

interface Props {
  active: CollectionsEntityTab;
  onChange: (tab: CollectionsEntityTab) => void;
}

const TABS: { id: CollectionsEntityTab; label: string }[] = [
  { id: "customers", label: "Customers" },
  { id: "invoices", label: "Invoices" },
];

export function CollectionsEntityTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Collections entity"
      className="inline-flex h-8 items-center gap-0 rounded bg-[#E2E3E7] p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[2px] px-4 text-[12px] font-medium leading-4 transition-colors",
              selected
                ? "bg-white text-[#1A212D] shadow-[0_2px_3px_rgba(0,0,0,0.11)]"
                : "h-6 bg-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
