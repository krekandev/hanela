"use client";

import React from "react";
import Image from "next/image";

export default function Philosophy() {
  return (
    <section
      id="filozofia"
      className="relative w-full py-12 sm:py-20 px-3.5 sm:px-6 lg:px-8 bg-[#261B24] overflow-hidden"
    >
      {/* Background Soft Botanical/Ingredients Photography with Warm Tone */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/pure_ingredients.jpg"
          alt="Poctivé ingrediencie v pozadí"
          fill
          sizes="100vw"
          className="object-cover opacity-15 filter blur-[6px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#261B24] via-[#261B24]/90 to-[#261B24]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Compact Frosted Glass Card */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#342432]/85 backdrop-blur-xl border border-white/15 p-6 sm:p-10 lg:p-14 text-white shadow-xl overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Shortened High-Contrast Headline & Details */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.1] text-balance">
                <span className="text-[#FAF8F5]">Žiadne margaríny.</span>
                <br />
                <span className="text-[#e5a8db]">Iba pravé suroviny.</span>
              </h2>

              <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed font-normal max-w-xl">
                Odmietame rastlinné náhrady, palmové tuky aj umelé prášky. V každom dezerte pracujeme výhradne s 82% maslom, pravým talianskym mascarpone, 35% smotanou, čistou madagaskarskou vanilkou a belgickou čokoládou Callebaut.
              </p>

              {/* Minimalist Trust Features List */}
              <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-base sm:text-lg font-mono font-bold text-[#e5a8db] block">
                    100%
                  </span>
                  <span className="text-[11px] text-white/75 leading-tight block mt-0.5">
                    Pravé mascarpone & 82% maslo
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-base sm:text-lg font-mono font-bold text-[#e5a8db] block">
                    0%
                  </span>
                  <span className="text-[11px] text-white/75 leading-tight block mt-0.5">
                    Margarínov, palmových tukov a náhrad
                  </span>
                </div>
              </div>

              {/* Footnote */}
              <p className="mt-4 text-[10px] text-white/45 tracking-tight">
                * Všetky receptúry podliehajú certifikácii HACCP a čerstvej výrobe v deň odberu.
              </p>

            </div>

            {/* Right Column: Visual and Key Attributes */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              
              {/* Product Visual */}
              <div className="relative w-48 sm:w-64 aspect-square flex items-center justify-center my-2">
                <Image
                  src="/images/trans_tartlets.png"
                  alt="Remeselná tartaletka a éclair z čistých surovín"
                  fill
                  sizes="(max-width: 640px) 192px, 256px"
                  className="object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Callout highlights */}
              <div className="w-full space-y-2.5 pt-3 border-t border-white/15 text-xs text-white/80">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-white tracking-wider uppercase shrink-0">
                    KRÉM & MASCARPONE
                  </span>
                  <span className="text-right text-white/70">
                    100% pravé mascarpone
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-white tracking-wider uppercase shrink-0">
                    ČOKOLÁDA CALLEBAUT
                  </span>
                  <span className="text-right text-white/70">
                    Belgické kakaové maslo
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-white tracking-wider uppercase shrink-0">
                    ČERSTVOSŤ VÝDAJA
                  </span>
                  <span className="text-right text-white/70">
                    Čerstvo v deň odberu
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
