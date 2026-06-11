import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  /** default/muted: light grey surface, bordered secondary actions; primary: blue emphasis. */
  variant?: "default" | "primary" | "muted";
  /** Fully rounded ends (pill). Default true for record header / toolbar actions. */
  pill?: boolean;
  /** Show a right arrow after the label. Default true. */
  showArrow?: boolean;
  /** Disable the button (visual + non-interactive). */
  disabled?: boolean;
}

export function ActionButton({ icon: Icon, label, onClick, variant = "default", pill = false, showArrow = true, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group/action inline-flex shrink-0 items-center text-[13px] font-medium leading-tight transition-colors",
        pill ? "rounded-full px-3 py-1.5" : "rounded-md px-2 py-0.5",
        "gap-0.5",
        disabled && "cursor-not-allowed text-text-muted/60",
        !disabled && variant === "primary" &&
          "cursor-pointer border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800",
        !disabled && (variant === "default" || variant === "muted") &&
          "cursor-pointer text-slate-600 hover:text-blue-600",
      )}
    >
      {Icon ? <Icon size={13} className="shrink-0" /> : null}
      <span>{label}</span>
      {showArrow && (
        <ChevronRight 
          size={13} 
          strokeWidth={2.5}
          className={cn(
            "shrink-0 transition-transform duration-150",
            "group-hover/action:translate-x-0.5"
          )} 
        />
      )}
    </button>
  );
}
