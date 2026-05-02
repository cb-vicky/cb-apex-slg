import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Code2, HelpCircle, Lightbulb, Settings, Star, UserCircle } from "lucide-react";
import cbLogoWhite from "@/assets/cb-logo-white.svg";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import type { DemoPersona } from "@/types/demo-persona";
import { cn } from "@/lib/utils";

const MENU_WIDTH_PX = 176; // 11rem

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
          <span className="ml-auto block max-w-[5.5rem] truncate pl-1 text-[10px] font-normal text-gray-500">
            Queue & submit
          </span>
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
          <span className="ml-auto block max-w-[5.5rem] truncate pl-1 text-[10px] font-normal text-gray-500">
            Act on approvals
          </span>
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
        title="Demo persona — switch Operator vs Approver"
      >
        <UserCircle size={14} className="shrink-0 text-gray-300" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <ChevronDown size={12} className="shrink-0 text-gray-400" aria-hidden />
      </button>
      {menu}
    </div>
  );
}

export function TopNav() {
  return (
    <header className="relative z-0 flex h-[36px] shrink-0 items-center justify-between overflow-visible bg-[#012A38] px-[12px] text-[rgba(17,24,39,1)]">
      {/* Logo tab — absolute so it can extend below header. Top 28px visible in header,
          bottom portion bleeds under sidebar (which is z-[1] and covers it). */}
      <div className="absolute left-[12px] top-[8px] flex h-[52px] w-[24px] items-start justify-center rounded-t-md bg-cb-orange pt-[7px]">
        <img src={cbLogoWhite} alt="Chargebee" className="h-[13px] w-[13px] shrink-0" width={13} height={13} />
      </div>

      {/* Left */}
      <div className="flex h-full items-center gap-[8px]">
        {/* Spacer for logo width */}
        <div className="h-[28px] w-[24px] shrink-0 self-end" aria-hidden />

        {/* Site selector */}
        <button className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 hover:bg-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-medium text-white">Echo-corp</span>
          <span className="text-gray-400">echocorp.test.charge...</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {/* Entity / timezone */}
        <button className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 hover:bg-white/10">
          <span className="font-medium text-white">Germany</span>
          <span className="text-gray-400">Europe/Berlin (CET)</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <PersonaSwitcher />
        <NavIconButton><Bell size={15} /></NavIconButton>
        <button className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-gray-300 hover:bg-white/10">
          <Settings size={13} />
          <span>Configure Chargebee</span>
        </button>
        <NavIconButton><Code2 size={15} /></NavIconButton>
        <NavIconButton><Lightbulb size={15} /></NavIconButton>
        <NavIconButton><Star size={15} /></NavIconButton>
        <NavIconButton><HelpCircle size={15} /></NavIconButton>
        <div className="ml-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cb-orange text-[10px] font-semibold text-white">
          A
        </div>
      </div>
    </header>
  );
}

function NavIconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-gray-200">
      {children}
    </button>
  );
}
