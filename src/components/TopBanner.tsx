import React from "react";

export default function TopBanner() {
  return (
    <aside aria-label="Oznam o výdajnom mieste" className="bg-[#ECEAE4] border-b border-[#E2DFD7] text-[#1e131d] text-xs font-medium py-2 px-4 tracking-tight">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#aa5ca5]" />
          <span>Výdajné miesto: Hlavná 102, Viničné</span>
          <span className="text-[#1e131d]/40 hidden md:inline">|</span>
          <span className="hidden md:inline text-[#1e131d]/80">
            Prijímame objednávky na víkendy a svadobnú sezónu 2026
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#1e131d]/70 text-xs">
          <span>Otvorené Po–Pi 9:00–17:00 / So 11:00–12:00</span>
          <a
            href="tel:+421910960913"
            className="text-[#1e131d] font-semibold underline underline-offset-4 hover:text-[#aa5ca5] transition-colors"
          >
            +421 910 960 913
          </a>
        </div>
      </div>
    </aside>
  );
}
