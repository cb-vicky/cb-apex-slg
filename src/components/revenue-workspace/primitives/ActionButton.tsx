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

export function ActionButton({ icon: Icon, label, onClick, variant = "default", pill = true }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 shrink-0 items-center text-[12px] font-medium leading-none transition-colors",
        pill ? "rounded-full px-3" : "rounded-md px-2",
        Icon ? (pill ? "gap-1.5" : "gap-1") : undefined,
        variant === "primary" &&
          "border border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-800",
        (variant === "default" || variant === "muted") &&
          "border border-[#E4E5E8] bg-[#F0F1F3] text-text-secondary hover:border-border-default hover:bg-[#E8E9EC] hover:text-text-primary",
      )}
    >
      {Icon ? <Icon size={12} className="shrink-0" /> : null}
      {label}
    </button>
  );
}
