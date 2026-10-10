import React from "react";

export default function TopBanner() {
  return (
    <aside aria-label="Oznam o výdajnom mieste" className="bg-[#F4EFE7] border-b border-[#DFD8CD] text-[#261B24] text-xs font-medium py-2 px-4 tracking-tight">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#a62891]" />
          <span>Výdajné miesto: Hlavná 102, Viničné</span>
          <span className="text-[#261B24]/40 hidden md:inline">|</span>
          <span className="hidden md:inline text-[#261B24]/80">
            Prijímame objednávky na víkendy a svadobnú sezónu 2026
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#261B24]/70 text-xs">
          <span>Otvorené Po–Pi 9:00–17:00 / So 11:00–12:00</span>
          <a
            href="tel:+421910960913"
            className="text-[#261B24] font-semibold underline underline-offset-4 hover:text-[#a62891] transition-colors"
          >
            +421 910 960 913
          </a>
        </div>
      </div>
    </aside>
  );
}
