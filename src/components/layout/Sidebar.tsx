import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const DISABLED_NAV_PATHS = new Set([
  "/credit-notes",
  "/inbox",
  "/product-catalog",
  "/entitlements",
  "/usages",
  "/revenuestory",
]);

const navGroups: NavGroup[] = [
  {
    label: "Desk",
    items: [
      { label: "My Workbench", path: "/" },
      { label: "Inbox", path: "/inbox" },
      { label: "Approvals", path: "/approvals" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Customers", path: "/customers" },
      { label: "Quotes", path: "/quotes" },
      { label: "Contracts", path: "/contracts" },
      { label: "Invoices", path: "/invoices" },
      { label: "Credit notes", path: "/credit-notes" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Product Catalog", path: "/product-catalog" },
      { label: "Entitlements", path: "/entitlements" },
      { label: "Usages", path: "/usages" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "RevenueStory", path: "/revenuestory" },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/workbench";
    }
    return location.pathname.startsWith(path);
  }

  return (
    <aside className="relative z-[1] flex w-[168px] shrink-0 flex-col overflow-hidden rounded-tl-[24px] bg-[#F0F1F3] pt-8 pb-4">
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2">
        {navGroups.map((group, idx) => (
          <div key={group.label ?? `group-${idx}`} className="flex flex-col">
            {group.label && (
              <p className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const disabled = DISABLED_NAV_PATHS.has(item.path);
              const active = !disabled && isActive(item.path);
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-md px-2.5 py-[3px] text-left text-[13px] transition-colors duration-150",
                    disabled
                      ? "cursor-not-allowed text-text-muted opacity-55"
                      : active
                      ? "bg-[rgba(1,42,56,1)] font-semibold text-white"
                      : "font-medium text-[#012A38] hover:bg-white/60 hover:text-cb-orange",
                  )}
                >
                  {/* Always-rendered active accent — opacity swap keeps the
                      element in the tree so there's no layout/paint flicker
                      as the router re-renders on navigation. Light peach tint
                      on the active pill reads as a subtle highlight. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-r-full bg-cb-orange-light transition-opacity duration-150",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {/* Generic chevron anchor — inherits text color via
                      currentColor. Faint by default; fully opaque on active
                      so the chevron pops against the active background. */}
                  <ChevronRight
                    size={11}
                    strokeWidth={2.25}
                    aria-hidden
                    className={cn(
                      "shrink-0",
                      active ? "opacity-100" : "opacity-30 group-hover:opacity-70",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* AI assistant footer */}
      <button
        type="button"
        className="mx-2 mt-2 flex items-center gap-2 rounded-md border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-2 py-2 text-left text-[12px] font-medium text-blue-700 transition-colors hover:from-blue-100 hover:to-blue-50"
      >
        <Sparkles size={13} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Ask APEX AI</span>
      </button>
    </aside>
  );
}
