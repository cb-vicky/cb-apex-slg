import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Sparkles,
  Search,
  Command,
  LayoutDashboard,
  FolderOpen,
  Package,
  LineChart,
  History,
} from "lucide-react";
import { customers } from "@/data/mock-data";
import { useRecentCustomerIds } from "@/lib/recent-customers";
import { useIngestContext } from "@/context/IngestContext";

interface NavItem {
  label: string;
  path: string;
}

interface NavGroup {
  label?: string;
  icon: LucideIcon;
  items: NavItem[];
}

const DISABLED_NAV_PATHS = new Set([
  "/credit-notes",
  "/product-catalog",
  "/entitlements",
  "/usages",
  "/revenuestory",
]);

const navGroups: NavGroup[] = [
  {
    label: "Desk",
    icon: LayoutDashboard,
    items: [
      { label: "My Workbench", path: "/" },
      { label: "Queue", path: "/queue" },
      { label: "Approvals", path: "/approvals" },
    ],
  },
  {
    label: "Records",
    icon: FolderOpen,
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
    icon: Package,
    items: [
      { label: "Product Catalog", path: "/product-catalog" },
      { label: "Entitlements", path: "/entitlements" },
      { label: "Usages", path: "/usages" },
    ],
  },
  {
    label: "Insights",
    icon: LineChart,
    items: [
      { label: "RevenueStory", path: "/revenuestory" },
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
  leading,
  dot,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  leading?: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-[2px] text-left text-[12px] transition-colors duration-150",
        disabled
          ? "cursor-not-allowed text-text-muted opacity-55"
          : active
          ? "bg-gradient-to-r from-cb-orange/[0.18] to-transparent font-semibold text-cb-orange"
          : "font-medium text-[#012A38] hover:bg-white/60 hover:text-cb-orange",
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
      {leading ?? (
        <ChevronRight
          size={11}
          strokeWidth={2.25}
          aria-hidden
          className={cn(
            "shrink-0",
            active ? "opacity-100" : "opacity-30 group-hover:opacity-70",
          )}
        />
      )}
      <span className="truncate">{label}</span>
      {dot && (
        <span
          aria-label="has pending items"
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cb-orange"
        />
      )}
    </button>
  );
}

// Section header — uppercase eyebrow with a faint rule directly beneath it.
function SectionHeader({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="mb-2 px-2">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
        <Icon
          size={10}
          strokeWidth={2.25}
          className="shrink-0 text-text-secondary"
          aria-hidden
        />
        {label}
      </p>
      <hr className="border-0 border-t border-black/[0.06]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const recentIds = useRecentCustomerIds();
  const { approvalRequests, pendingRenewalIngestions } = useIngestContext();

  // Dot notification counts — driven by dynamic ingest/approval state
  const pendingApprovalCount = approvalRequests.filter(
    (r) => r.status === "Pending Approval",
  ).length;
  const inflightClosures = Object.keys(pendingRenewalIngestions).length;
  const workbenchHasDot = pendingApprovalCount > 0 || inflightClosures > 0;
  const approvalsHasDot = pendingApprovalCount > 0;

  function isActive(path: string) {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/workbench";
    }
    return location.pathname.startsWith(path);
  }

  const recentCustomers = recentIds
    .map((id) => customers.find((c) => c.id === id))
    .filter((c): c is (typeof customers)[number] => Boolean(c));

  return (
    <aside className="relative z-[1] flex w-[180px] shrink-0 flex-col overflow-hidden rounded-tl-[24px] bg-[#F0F1F3] pt-6 pb-3">
      <div className="flex flex-1 flex-col overflow-y-auto px-2">
        {/* Global search — placeholder, opens command palette in future.
            Transparent by default; same grey hover as nav rows. The
            ⌘+K shortcut is rendered as a Lucide Command icon plus "K"
            inline (no pill / border). */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-text-secondary transition-colors hover:bg-white/60"
        >
          <Search size={13} strokeWidth={2.25} className="shrink-0 text-text-secondary" />
          <span className="flex-1 truncate">Search…</span>
          <span className="flex shrink-0 items-center gap-px text-text-secondary">
            <Command size={12} strokeWidth={2.25} aria-hidden />
            <span className="text-[11px] font-semibold leading-none">K</span>
          </span>
        </button>

        {/* Ask AI — 1px frame: gradient border (left full cb-orange → right
            transparent). Inner uses sidebar fill so only the frame shows, not a wash. */}
        <div className="mt-1 rounded-md bg-gradient-to-r from-cb-orange to-transparent p-px">
          <button
            type="button"
            className="group/ai flex w-full items-center gap-2 rounded-[5px] bg-[#F0F1F3] px-2 py-[3px] text-left text-[12px] font-medium text-[#012A38] transition-colors hover:bg-cb-orange hover:text-white"
          >
            <Sparkles
              size={13}
              strokeWidth={2}
              className="shrink-0 text-cb-orange transition-colors group-hover/ai:text-white"
            />
            <span className="truncate">Ask AI</span>
          </button>
        </div>

        {/* Nav groups — every section header has a line beneath it. */}
        {navGroups.map((group, idx) => (
          <div key={group.label ?? `group-${idx}`} className={idx === 0 ? "mt-5" : "mt-6"}>
            {group.label && <SectionHeader label={group.label} icon={group.icon} />}
            <div className="flex flex-col">
              {group.items.map((item) => {
                const disabled = DISABLED_NAV_PATHS.has(item.path);
                const active = !disabled && isActive(item.path);
                const dot =
                  (item.path === "/" && workbenchHasDot) ||
                  (item.path === "/approvals" && approvalsHasDot);
                return (
                  <NavRow
                    key={item.label}
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

        {/* Recent customers */}
        <div className="mt-6">
          <SectionHeader label="Recent" icon={History} />
          {recentCustomers.length === 0 ? (
            <p className="px-2 py-1 text-[11px] leading-snug text-text-muted">
              Visit a customer to see it here.
            </p>
          ) : (
            <div className="flex flex-col">
              {recentCustomers.map((customer) => {
                const path = `/customers/${customer.id}`;
                const active = location.pathname === path;
                return (
                  <NavRow
                    key={customer.id}
                    label={customer.name}
                    active={active}
                    onClick={() => navigate(path)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
