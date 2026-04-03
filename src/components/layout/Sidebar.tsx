import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const DISABLED_NAV_PATHS = new Set([
  "/credit-notes",
  "/inbox",
  "/product-catalog",
  "/entitlements",
  "/approvals",
  "/usages",
  "/revenuestory",
]);

const navItems = [
  { label: "Customers", path: "/customers" },
  { label: "Quotes", path: "/quotes" },
  { label: "Contracts", path: "/contracts" },
  { label: "Invoices", path: "/invoices" },
  { label: "Credit notes", path: "/credit-notes" },
  { label: "Inbox", path: "/inbox" },
  { label: "Product Catalog", path: "/product-catalog" },
  { label: "Entitlements", path: "/entitlements" },
  { label: "Approvals", path: "/approvals" },
  { label: "Usages", path: "/usages" },
  { label: "RevenueStory", path: "/revenuestory" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  const workbenchActive = location.pathname === "/" || location.pathname === "/workbench";

  return (
    <aside className="flex w-[160px] shrink-0 flex-col bg-white pt-3">
      <button
        onClick={() => navigate("/")}
        className={cn(
          "mx-2 mb-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors",
          workbenchActive ? "text-cb-orange" : "text-text-primary hover:text-cb-orange",
        )}
      >
        My Workbench
        <ChevronRight size={14} strokeWidth={2.2} />
      </button>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const disabled = DISABLED_NAV_PATHS.has(item.path);
          const active = !disabled && isActive(item.path);
          return (
            <button
              key={item.label}
              type="button"
              disabled={disabled}
              onClick={() => navigate(item.path)}
              className={cn(
                "rounded-md px-2 py-1 text-left text-[13px] transition-colors",
                disabled
                  ? "cursor-not-allowed text-text-muted opacity-60"
                  : active
                    ? "font-medium text-cb-orange"
                    : "text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
