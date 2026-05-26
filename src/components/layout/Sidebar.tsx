import { useEffect } from "react";
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
import { useAssistantWorkspace } from "@/lib/assistantWorkspace";
import {
  PRODUCT_NAV_COLLAPSED_W,
  PRODUCT_NAV_FULL_W,
  PRODUCT_NAV_PEEK_SHIFT_PX,
  PRODUCT_NAV_PEEK_TRANSFORM_EASE,
  PRODUCT_NAV_PEEK_TRANSFORM_MS,
  useProductNavCollapse,
} from "@/lib/productNavCollapse";
import { useIsMd } from "@/lib/useIsMd";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  showChevron?: boolean;
}

/** Fired when sidebar width changes (collapse toggle). */
export const SIDEBAR_LAYOUT_EVENT = "apex-sidebar-layout";

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
          ? "cursor-not-allowed text-gray-400 opacity-55"
          : active
            ? "bg-gradient-to-r from-cb-orange/25 via-cb-orange/10 to-transparent font-bold text-cb-orange"
            : "text-gray-600 hover:bg-black/[0.06] hover:font-semibold hover:text-gray-900",
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

export function Sidebar() {
  const { mode } = useAssistantWorkspace();
  const productNav = useProductNavCollapse();
  const isMd = useIsMd();
  const collapsed = productNav.collapsed;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(SIDEBAR_LAYOUT_EVENT, { detail: { collapsed } }),
    );
  }, [collapsed]);

  if (mode === "workspace") {
    return null;
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

  const width = collapsed ? PRODUCT_NAV_COLLAPSED_W : PRODUCT_NAV_FULL_W;

  return (
    <aside
      aria-label="Primary navigation"
      style={{
        width,
        viewTransitionName: isMd ? "product-nav" : undefined,
        transform: productNav.peekNudgeActive
          ? `translate3d(-${PRODUCT_NAV_PEEK_SHIFT_PX}px, 0, 0)`
          : undefined,
        transition: productNav.peekNudgeActive
          ? `transform ${PRODUCT_NAV_PEEK_TRANSFORM_MS}ms ${PRODUCT_NAV_PEEK_TRANSFORM_EASE}`
          : undefined,
      }}
      className="group/sidebar relative z-[0] flex h-full shrink-0 flex-col overflow-hidden bg-grey-100 font-sora transition-[width] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col pt-5",
          collapsed
            ? "items-center overflow-hidden"
            : "overflow-y-auto pl-3",
        )}
      >
        <div
          className={cn(
            "flex gap-1.5",
            collapsed ? "w-full flex-col items-center gap-0" : "items-center",
          )}
        >
          <div
            className={cn(
              "rounded-md bg-transparent p-px transition-[background] duration-150 has-[:hover]:bg-gradient-to-r has-[:hover]:from-cb-orange has-[:hover]:to-black/10",
              collapsed ? "w-8 shrink-0" : "min-w-0 flex-1",
            )}
          >
            <button
              type="button"
              aria-label="Go to"
              className={cn(
                "group/goto flex items-center gap-2 rounded-[5px] border border-black/[0.06] bg-white font-sans text-[13px] font-normal text-gray-700 transition-colors hover:bg-white",
                collapsed
                  ? "h-8 w-8 shrink-0 justify-center gap-0 p-0"
                  : "w-full px-2 py-[6px] text-left",
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
              onClick={productNav.requestCollapse}
              className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 opacity-0 transition-[opacity,colors] duration-150 hover:bg-black/[0.06] hover:text-cb-orange group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
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
              onClick={productNav.requestExpand}
              className="pointer-events-none flex h-8 w-full items-center justify-center rounded-md text-gray-600 opacity-0 transition-[opacity,colors] duration-150 hover:bg-black/[0.06] hover:text-cb-orange group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
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
