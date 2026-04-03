import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="flex h-10 shrink-0 items-center border-b border-border-default bg-white px-4">
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <Search size={14} />
        <span>Search anything...</span>
        <kbd className="ml-1 rounded border border-border-default bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">⌘K</kbd>
      </div>
    </div>
  );
}
