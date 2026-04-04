import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorkbenchRole } from "@/context/WorkbenchRoleContext";

export function SearchBar() {
  const location = useLocation();
  const showRoleSwitcher = location.pathname === "/" || location.pathname === "/workbench";
  const { role, setRole } = useWorkbenchRole();

  return (
    <div className="flex h-[32px] shrink-0 items-center bg-[#F0F1F3] px-4">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-text-muted">
          <span>Search anything...</span>
          <kbd className="inline-flex shrink-0 items-center gap-0.5 rounded bg-surface-muted px-1.5 py-0.5 font-medium text-text-muted">
            <span className="text-[14px] leading-none">⌘</span>
            <span className="text-[10px] leading-none">K</span>
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
