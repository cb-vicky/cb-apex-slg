import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Code2,
  HelpCircle,
  Lightbulb,
  Settings,
  Star,
  Undo2,
  UserCircle,
} from "lucide-react";
import cbLogoWhite from "@/assets/cb-logo-white.svg";
import { TopBarSweepLayer } from "@/components/assistant/TopBarSweepLayer";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import type { DemoPersona } from "@/types/demo-persona";
import {
  WORKSPACE_FLIGHT_EASE_ENTER,
  WORKSPACE_TOPBAR_MORPH_MS,
  useAssistantWorkspace,
} from "@/lib/assistantWorkspace";
import { useTopBarSweep } from "@/lib/topBarSweep";
import {
  WORKSPACE_BAR_BG,
  WORKSPACE_BAR_GRADIENT,
} from "@/lib/workspaceBar";
import { cn } from "@/lib/utils";

const MENU_WIDTH_PX = 176;
const APEX_BAR_BG = "#012A38";

const ASSISTANT_NAV_PILL =
  "bg-white/10 ring-1 ring-white/15 backdrop-blur-[2px] squircle inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 text-[14px] font-normal leading-none transition-[opacity,colors,box-shadow] duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40";

function PersonaSwitcher() {
  const navigate = useNavigate();
  const { persona, setPersona } = useDemoPersona();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return;
    }
    const r = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      top: r.bottom + 4,
      left: Math.max(8, r.right - MENU_WIDTH_PX),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function place() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setMenuStyle({
        top: r.bottom + 4,
        left: Math.max(8, r.right - MENU_WIDTH_PX),
      });
    }
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const label = persona === "operator" ? "Operator" : "Approver";

  function select(p: DemoPersona) {
    if (p !== persona) {
      setPersona(p);
      navigate("/workbench");
    }
    setOpen(false);
  }

  const menu =
    open &&
    menuStyle &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        className="fixed z-[10000] w-[11rem] rounded-md border border-white/15 bg-[#0a3d4d] py-1 shadow-lg"
        style={{ top: menuStyle.top, left: menuStyle.left }}
      >
        <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Demo persona
        </p>
        <button
          type="button"
          role="option"
          aria-selected={persona === "operator"}
          onClick={() => select("operator")}
          className={cn(
            "flex w-full items-center px-2.5 py-1.5 text-left text-[12px] transition-colors",
            persona === "operator"
              ? "bg-white/10 font-semibold text-white"
              : "text-gray-200 hover:bg-white/10",
          )}
        >
          Operator
        </button>
        <button
          type="button"
          role="option"
          aria-selected={persona === "approver"}
          onClick={() => select("approver")}
          className={cn(
            "flex w-full items-center px-2.5 py-1.5 text-left text-[12px] transition-colors",
            persona === "approver"
              ? "bg-white/10 font-semibold text-white"
              : "text-gray-200 hover:bg-white/10",
          )}
        >
          Approver
        </button>
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 max-w-[9.5rem] items-center gap-1 rounded border border-white/15 bg-white/[0.06] px-2 text-left text-[11px] text-gray-200 transition-colors hover:border-white/25 hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Demo persona"
      >
        <UserCircle size={14} className="shrink-0 text-gray-300" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <ChevronDown size={12} className="shrink-0 text-gray-400" aria-hidden />
      </button>
      {menu}
    </div>
  );
}

function NavIconButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
    >
      {children}
    </button>
  );
}

/** Site + entity selectors from the original apex top bar (sidebar mode). */
function SiteEntitySelectors() {
  return (
    <div className="flex h-full items-center gap-[8px]">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 hover:bg-white/10"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="font-medium text-white">Echo-corp</span>
        <span className="text-gray-400">echocorp.test.charge...</span>
        <ChevronDown size={12} className="text-gray-400" aria-hidden />
      </button>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 hover:bg-white/10"
      >
        <span className="font-medium text-white">Germany</span>
        <span className="text-gray-400">Europe/Berlin (CET)</span>
        <ChevronDown size={12} className="text-gray-400" aria-hidden />
      </button>
    </div>
  );
}

export function TopNav() {
  const { mode, exit, prefersReducedMotion } = useAssistantWorkspace();
  const isWorkspace = mode === "workspace";

  const { sweepNonce } = useTopBarSweep(isWorkspace, prefersReducedMotion);

  const headerHeight = isWorkspace
    ? `calc(36px + env(safe-area-inset-top))`
    : "36px";
  const headerTransition = prefersReducedMotion
    ? undefined
    : `height ${WORKSPACE_TOPBAR_MORPH_MS}ms ${WORKSPACE_FLIGHT_EASE_ENTER}, background-color ${WORKSPACE_TOPBAR_MORPH_MS}ms ${WORKSPACE_FLIGHT_EASE_ENTER}`;

  return (
    <header
      className={cn(
        "relative z-0 flex shrink-0 items-center justify-between overflow-visible px-[12px] font-sora",
        isWorkspace && "pt-[env(safe-area-inset-top)]",
      )}
      style={{
        backgroundColor: isWorkspace ? WORKSPACE_BAR_BG : APEX_BAR_BG,
        height: headerHeight,
        transition: headerTransition,
      }}
      aria-label={isWorkspace ? "Chargebee Assistant" : "Application header"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: WORKSPACE_BAR_GRADIENT,
          opacity: isWorkspace ? 1 : 0,
          transition: prefersReducedMotion
            ? undefined
            : `opacity ${WORKSPACE_TOPBAR_MORPH_MS}ms ${WORKSPACE_FLIGHT_EASE_ENTER}`,
        }}
      />
      <TopBarSweepLayer nonce={sweepNonce} />

      {/* Left cluster */}
      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-1 items-center gap-[8px]",
          isWorkspace ? "text-white/95" : "text-gray-300",
        )}
      >
        <div className="squircle flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-cb-orange">
          <img
            src={cbLogoWhite}
            alt="Chargebee"
            className="h-[13px] w-[13px] shrink-0"
            width={13}
            height={13}
          />
        </div>

        {isWorkspace ? (
          <>
            <h1 className="font-sora text-[13px] font-normal tracking-tight text-white">
              <span className="font-bold">chargebee</span>{" "}
              <span className="font-normal">assistant</span>
            </h1>
            <button
              type="button"
              onClick={exit}
              aria-label="Back to app"
              className={cn(
                "assistant-nav-back group/back ml-1",
                ASSISTANT_NAV_PILL,
                prefersReducedMotion ? "" : "motion-safe:animate-suite-nav-link-in",
              )}
            >
              <Undo2
                className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out group-hover/back:-translate-x-0.5"
                strokeWidth={1.85}
                aria-hidden
              />
              <span className="whitespace-nowrap">back to app</span>
            </button>
          </>
        ) : (
          <SiteEntitySelectors />
        )}
      </div>

      {/* Right cluster — unchanged from apex */}
      <div
        className={cn(
          "relative z-10 flex shrink-0 items-center gap-1.5",
          isWorkspace ? "text-white/95" : "text-gray-300",
        )}
      >
        <PersonaSwitcher />
        <NavIconButton>
          <Bell size={15} />
        </NavIconButton>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 transition-colors hover:bg-white/10"
        >
          <Settings size={13} />
          <span>Configure Chargebee</span>
        </button>
        <NavIconButton>
          <Code2 size={15} />
        </NavIconButton>
        <NavIconButton>
          <Lightbulb size={15} />
        </NavIconButton>
        <NavIconButton>
          <Star size={15} />
        </NavIconButton>
        <NavIconButton>
          <HelpCircle size={15} />
        </NavIconButton>
        <div className="ml-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cb-orange text-[10px] font-semibold text-white">
          A
        </div>
      </div>
    </header>
  );
}
