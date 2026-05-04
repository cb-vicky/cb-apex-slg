import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  /** default/muted: light grey surface, bordered secondary actions; primary: blue emphasis. */
  variant?: "default" | "primary" | "muted";
  /** Fully rounded ends (pill). Default true for record header / toolbar actions. */
  pill?: boolean;
}

export function ActionButton({ icon: Icon, label, onClick, variant = "default", pill = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center text-[12px] font-medium leading-4 transition-colors",
        pill ? "rounded-full px-3 py-1.5" : "rounded-md px-2 py-0.5",
        Icon ? "gap-1" : undefined,
        variant === "primary" &&
          "border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800",
        (variant === "default" || variant === "muted") &&
          "border border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-200 hover:text-text-primary",
      )}
    >
      {Icon ? <Icon size={12} className="shrink-0" /> : null}
      {label}
    </button>
  );
}
