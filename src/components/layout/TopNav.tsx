import { Bell, ChevronDown, Code2, HelpCircle, Lightbulb, Settings, Star } from "lucide-react";
import cbLogoWhite from "@/assets/cb-logo-white.svg";

export function TopNav() {
  return (
    <header className="relative z-10 flex h-[36px] shrink-0 items-center justify-between overflow-visible bg-[#012A38] px-[12px]">
      {/* Left */}
      <div className="flex h-full items-center gap-[8px]">
        {/* Logo — tab shape: rounded top, flush bottom */}
        <div className="flex h-[28px] w-[24px] shrink-0 items-center justify-center self-end rounded-t-md rounded-b-none bg-cb-orange">
          <img src={cbLogoWhite} alt="Chargebee" className="h-[13px] w-[13px] shrink-0 text-[16px]" width={13} height={13} />
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
      <div className="flex items-center gap-[2px]">
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
