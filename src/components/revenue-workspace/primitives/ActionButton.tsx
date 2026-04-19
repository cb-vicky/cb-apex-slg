import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function ActionButton({ icon: Icon, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border-default bg-white px-2 text-[11px] font-medium leading-none text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
    >
      <Icon size={12} className="shrink-0" />
      {label}
    </button>
  );
}
