import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  ChartLine,
  ChevronDown,
  Receipt,
  Coins,
  Command,
  File,
  FileSignature,
  Home,
  List,
  Mail,
  MinusCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
  Tag,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Stub / parent routes — chevron appears inline on hover. */
  showChevron?: boolean;
}

const SIDEBAR_COLLAPSED_KEY = "apex-sidebar-collapsed";

/** Fired when sidebar width changes (collapse toggle). */
export const SIDEBAR_LAYOUT_EVENT = "apex-sidebar-layout";

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

const DISABLED_NAV_PATHS = new Set([
  "/credit-notes",
  "/product-catalog",
  "/entitlements",
  "/usages",
  "/revenuestory",
  "/signals",
]);

const navItems: NavItem[] = [
  { label: "My Workbench", path: "/", icon: Home },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Prospects", path: "/prospects", icon: UserPlus },
  { label: "Quotes", path: "/quotes", icon: File },
  { label: "Contracts", path: "/contracts", icon: FileSignature },
  { label: "Invoices", path: "/invoices", icon: Receipt },
  {
    label: "Credit notes",
    path: "/credit-notes",
    icon: MinusCircle,
    showChevron: true,
  },
  { label: "Collections", path: "/collections", icon: Coins },
  { label: "RevRec", path: "/revrec", icon: ChartLine },
  { label: "Communications", path: "/communications", icon: Mail },
  { label: "Tasks", path: "/workbench", icon: List },
  {
    label: "Product Catalog",
    path: "/product-catalog",
    icon: Tag,
    showChevron: true,
  },
  {
    label: "Entitlements",
    path: "/entitlements",
    icon: Shield,
    showChevron: true,
  },
  { label: "Usages", path: "/usages", icon: Activity, showChevron: true },
  {
    label: "RevenueStory",
    path: "/revenuestory",
    icon: BarChart3,
    showChevron: true,
  },
  { label: "Signals", path: "/signals", icon: Zap, showChevron: true },
];

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function NavRow({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
  showChevron,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group/navrow relative flex w-full items-center gap-1.5 overflow-hidden rounded-md px-2 py-[6px] text-left font-sans text-[13px] font-normal leading-tight transition-[colors,font-weight] duration-150",
        disabled
          ? "cursor-not-allowed text-text-muted opacity-55"
          : active
            ? "bg-gradient-to-r from-cb-orange/[0.16] via-cb-orange/[0.06] to-transparent font-bold text-cb-orange"
            : "text-[#2d3940] hover:bg-black/[0.04] hover:font-semibold",
      )}
    >
      <Icon
        size={14}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
        className="shrink-0"
      />
      <span className="flex min-w-0 flex-1 items-center gap-0.5">
        <span className="truncate">{label}</span>
        {showChevron && (
          <ChevronDown
            size={11}
            strokeWidth={2.25}
            aria-hidden
            className="shrink-0 text-current opacity-0 transition-opacity duration-150 group-hover/navrow:opacity-55"
          />
        )}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const location = useLocation();
  const navigate = useNavigate();

  function setCollapsedPersist(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_LAYOUT_EVENT, { detail: { collapsed: next } }));
  }
  function isActive(path: string) {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/workbench") {
      const tab = new URLSearchParams(location.search).get("tab");
      return (
        location.pathname === "/workbench" &&
        tab !== "queue" &&
        tab !== "approvals"
      );
    }
    return location.pathname.startsWith(path);
  }

  return (
    <aside
      className={cn(
        "group/sidebar relative z-[0] flex shrink-0 flex-col overflow-hidden rounded-tl-[24px] bg-grey-100 pt-6 pb-3 font-sora transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-[220px]",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col pl-3 pr-2",
          collapsed ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {/* Search + collapse (expanded) */}
        <div
          className={cn(
            "flex items-center gap-1.5",
            collapsed && "flex-col gap-0",
          )}
        >
          <div className="min-w-0 flex-1 rounded-md bg-transparent p-px transition-[background] duration-150 has-[:hover]:bg-gradient-to-r has-[:hover]:from-cb-orange has-[:hover]:to-grey-300">
            <button
              type="button"
              aria-label="Go to"
              className={cn(
                "group/goto flex w-full items-center gap-2 rounded-[5px] bg-grey-100 px-2 py-[6px] text-left font-sans text-[13px] font-normal text-[#2d3940] transition-colors",
                collapsed && "gap-0",
              )}
            >
              <Search
                size={14}
                strokeWidth={2}
                className="shrink-0 transition-colors group-hover/goto:text-cb-orange"
                aria-hidden
              />
              {!collapsed && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">Go to</span>
                  <span className="flex shrink-0 items-center gap-px rounded border border-black/[0.1] px-1 py-0.5 text-[11px] font-normal leading-none text-[#9aa5ad]">
                    <Command size={11} strokeWidth={2} aria-hidden />
                    <span>K</span>
                  </span>
                </span>
              )}
            </button>
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsedPersist(true)}
              className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 transition-[opacity,colors] duration-150 hover:bg-black/[0.06] hover:text-cb-orange group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
              aria-expanded={true}
              aria-controls="app-sidebar-nav"
              title="Collapse navigation"
              aria-label="Collapse navigation"
            >
              <PanelLeftClose size={16} strokeWidth={2.25} aria-hidden />
            </button>
          )}
        </div>

        {collapsed ? (
          <div className="mt-3 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setCollapsedPersist(false)}
              className="pointer-events-none flex h-8 w-full items-center justify-center rounded-md text-[#2d3940] opacity-0 transition-[opacity,colors] duration-150 hover:bg-black/[0.06] hover:text-cb-orange group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
              title="Expand navigation"
              aria-label="Expand navigation"
            >
              <PanelLeftOpen size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ) : (
          <div id="app-sidebar-nav" className="mt-1 flex min-h-0 flex-1 flex-col font-sans">
            <div className="flex flex-col">
              {navItems.map((item) => {
                const disabled = DISABLED_NAV_PATHS.has(item.path);
                const active = !disabled && isActive(item.path);
                return (
                  <NavRow
                    key={item.path}
                    label={item.label}
                    icon={item.icon}
                    active={active}
                    disabled={disabled}
                    onClick={() => navigate(item.path)}
                    showChevron={item.showChevron}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
