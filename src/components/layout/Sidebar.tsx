import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, Search, Command } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { deriveWorkbenchTasks } from "@/data/workbench-tasks";

interface NavItem {
  label: string;
  path: string;
}

interface NavSection {
  items: NavItem[];
}

const SIDEBAR_COLLAPSED_KEY = "apex-sidebar-collapsed";

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

const navSections: NavSection[] = [
  {
    items: [{ label: "My Workbench", path: "/" }],
  },
  {
    items: [
      { label: "Customers", path: "/customers" },
      { label: "Prospects", path: "/prospects" },
      { label: "Quotes", path: "/quotes" },
      { label: "Contracts", path: "/contracts" },
      { label: "Invoices", path: "/invoices" },
      { label: "Credit notes", path: "/credit-notes" },
      { label: "Collections", path: "/collections" },
      { label: "RevRec", path: "/revrec" },
      { label: "Communications", path: "/communications" },
      { label: "Tasks", path: "/workbench" },
    ],
  },
  {
    items: [
      { label: "Product Catalog", path: "/product-catalog" },
      { label: "Entitlements", path: "/entitlements" },
      { label: "Usages", path: "/usages" },
    ],
  },
  {
    items: [
      { label: "RevenueStory", path: "/revenuestory" },
      { label: "Signals", path: "/signals" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function NavRow({
  label,
  active,
  disabled,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-[3px] text-left text-[13px] transition-colors duration-150",
        disabled
          ? "cursor-not-allowed text-text-muted opacity-55"
          : active
            ? "bg-gradient-to-r from-cb-orange/[0.18] to-transparent font-semibold text-cb-orange"
            : "font-medium text-[#012A38] hover:bg-black/[0.04] hover:text-cb-orange",
      )}
    >
      {/* Left active accent — kept mounted to avoid paint flicker on route changes. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-r-full bg-cb-orange transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {dot && (
        <span
          aria-label="has pending items"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-cb-orange"
        />
      )}
      <ChevronRight
        size={12}
        strokeWidth={2.25}
        aria-hidden
        className={cn(
          "shrink-0",
          active ? "opacity-100" : "opacity-30 group-hover:opacity-70",
        )}
      />
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
  }
  const {
    approvalRequests,
    pendingRenewalIngestions,
    queueItems,
    contractClosures,
    contractGraceExtensions,
  } = useIngestContext();
  const { persona } = useDemoPersona();

  const taskContext = useMemo(
    () => ({
      queueItems,
      approvalRequests,
      contractClosures,
      pendingRenewalIngestions,
      contractGraceExtensions,
    }),
    [
      queueItems,
      approvalRequests,
      contractClosures,
      pendingRenewalIngestions,
      contractGraceExtensions,
    ],
  );

  const pendingApprovalCount = approvalRequests.filter(
    (r) => r.status === "Pending Approval",
  ).length;
  const inflightClosures = Object.keys(pendingRenewalIngestions).length;

  const workbenchTaskCount = useMemo(
    () => deriveWorkbenchTasks(taskContext, { persona }).length,
    [taskContext, persona],
  );

  /** Persona-scoped: Operator = queue/lifecycle work + renewal pipeline; Approver = items in their task list. */
  const workbenchHasDot =
    workbenchTaskCount > 0 ||
    (persona === "operator" && inflightClosures > 0) ||
    (persona === "approver" && pendingApprovalCount > 0);

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
        "relative z-[0] flex shrink-0 flex-col overflow-hidden rounded-tl-[24px] bg-grey-100 pt-6 pb-3 font-sora transition-[width] duration-200 ease-out",
        collapsed ? "w-12" : "w-[200px]",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col px-2",
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
          <div className="min-w-0 flex-1 rounded-md bg-gradient-to-r from-cb-orange to-transparent p-px">
            <button
              type="button"
              title="Search (⌘K)"
              className={cn(
                "group/search flex w-full items-center gap-2 rounded-[5px] bg-grey-100 px-2 py-[5px] text-left text-[13px] font-medium text-[#012A38] transition-colors hover:bg-cb-orange hover:text-white",
                collapsed && "gap-0",
              )}
            >
              <Search
                size={14}
                strokeWidth={2}
                className="shrink-0 text-cb-orange transition-colors group-hover/search:text-white"
                aria-hidden
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">Search</span>
                  <span className="flex shrink-0 items-center gap-px text-text-muted transition-colors group-hover/search:text-white/70">
                    <Command size={12} strokeWidth={2.25} aria-hidden />
                    <span className="text-[11px] font-semibold leading-none">K</span>
                  </span>
                </>
              )}
            </button>
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsedPersist(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-black/[0.06] hover:text-cb-orange"
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
              className="flex h-8 w-full items-center justify-center rounded-md text-[#012A38] transition-colors hover:bg-black/[0.06] hover:text-cb-orange"
              title="Expand navigation"
              aria-label="Expand navigation"
            >
              <PanelLeftOpen size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        ) : (
          <div id="app-sidebar-nav" className="mt-5 flex min-h-0 flex-1 flex-col">
            {navSections.map((section, si) => (
              <div key={si}>
                {si > 0 && (
                  <div
                    className="my-4 border-0 border-t border-black/[0.06]"
                    aria-hidden
                  />
                )}
                <div className="flex flex-col">
                  {section.items.map((item) => {
                    const disabled = DISABLED_NAV_PATHS.has(item.path);
                    const active = !disabled && isActive(item.path);
                    const dot = item.path === "/" && workbenchHasDot;
                    return (
                      <NavRow
                        key={`${si}-${item.label}`}
                        label={item.label}
                        active={active}
                        disabled={disabled}
                        onClick={() => navigate(item.path)}
                        dot={dot}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
