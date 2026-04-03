import { Bell, ChevronDown, Code2, HelpCircle, Lightbulb, Settings, Star } from "lucide-react";

export function TopNav() {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between bg-[#1a1d21] px-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex h-6 w-6 items-center justify-center rounded bg-cb-orange">
          <span className="text-[10px] font-bold leading-none text-white">CB</span>
        </div>

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
      <div className="flex items-center gap-0.5">
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
