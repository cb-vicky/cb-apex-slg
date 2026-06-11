import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/hooks/useNotesStore";
import type { Stage } from "@/components/revenue-workspace/stage";

interface AddNoteCTAProps {
  customerId: string;
  customerName: string;
  tab: Stage;
  subTab?: string;
  className?: string;
}

export function AddNoteCTA({
  customerId,
  customerName,
  tab,
  subTab,
  className,
}: AddNoteCTAProps) {
  const { openDrawer } = useNotesStore();

  const handleClick = () => {
    openDrawer({
      customerId,
      customerName,
      location: { tab, subTab },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 px-4 py-2.5 transition-all",
        "hover:border-blue-300 hover:bg-blue-50/70",
        "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400",
        className,
      )}
    >
      <Plus
        size={14}
        className="text-blue-400 transition-colors group-hover:text-blue-600"
      />
      <span className="text-[13px] font-medium text-blue-500 transition-colors group-hover:text-blue-700">
        Add Notes
      </span>
    </button>
  );
}
