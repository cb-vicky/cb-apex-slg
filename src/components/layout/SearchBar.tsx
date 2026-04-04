import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkbenchRole } from "@/context/WorkbenchRoleContext";

export function SearchBar() {
  const location = useLocation();
  const showRoleSwitcher = location.pathname === "/" || location.pathname === "/workbench";
  const { role, setRole } = useWorkbenchRole();

  return (
    <div className="flex h-10 shrink-0 items-center bg-[#F0F1F3] px-4">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-text-muted">
          <Search size={14} className="shrink-0" />
          <span>Search anything...</span>
          <kbd className="ml-1 shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            ⌘K
          </kbd>
        </div>
        {showRoleSwitcher ? (
          <div className="inline-flex shrink-0 rounded-lg bg-surface-muted p-0.5">
            <RoleTab label="Billing Manager" active={role === "admin"} onClick={() => setRole("admin")} />
            <RoleTab
              label="Billing Operator"
              active={role === "operator"}
              onClick={() => setRole("operator")}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoleTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
        active ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}
