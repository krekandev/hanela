"use client";

import React from "react";
import Image from "next/image";

export default function Philosophy() {
  return (
    <section
      id="filozofia"
      className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#1e131d] overflow-hidden"
    >
      {/* Background Soft Botanical/Ingredients Photography with Warm Tone */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pure_ingredients.jpg"
          alt="Poctivé ingrediencie v pozadí"
          fill
          sizes="100vw"
          className="object-cover opacity-25 filter blur-[6px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e131d] via-[#1e131d]/85 to-[#1e131d]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Giant Frosted Glass Card (Exact Seed.com aesthetic) */}
        <div className="relative rounded-[32px] sm:rounded-[44px] bg-[#2a1b29]/70 backdrop-blur-2xl border border-white/20 p-8 sm:p-14 lg:p-20 text-white shadow-2xl overflow-hidden">
          
          {/* Subtle Ambient Light Gradient on card */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Shortened High-Contrast Headline & Callout */}
            <div className="lg:col-span-7 flex flex-col items-start">
              
              {/* Shortened Two-Tone Contrast Headline (White/Cream vs Pistachio Green) */}
              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-[-0.035em] leading-[1.06] text-balance">
                <span className="text-[#F9F8F5]">Žiadne margaríny.</span>
                <br />
                <span className="text-[#d8b4e2]">Iba pravé suroviny.</span>
              </h2>

              {/* Subheading */}
              <p className="mt-6 text-sm sm:text-base text-white/80 leading-relaxed font-normal max-w-xl">
                Odmietame rastlinné náhrady, palmové tuky aj umelé prášky. V každom dezerte pracujeme výhradne s 82% farmárskym maslom, pravým talianskym mascarpone, 35% smotanou, čistou madagaskarskou vanilkou a belgickou čokoládou Callebaut.
              </p>

              {/* Seed-style Stat Pill Container */}
              <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 flex items-center justify-between gap-6 w-full max-w-md">
                <div>
                  <span className="inline-block rounded-full border border-white/30 px-2.5 py-0.5 text-[10px] font-mono tracking-wider text-white/90 mb-1">
                    100% ŽIVOČÍŠNY TUK
                  </span>
                  <p className="text-xs text-white/80 font-normal">
                    Pravé mascarpone & farmárske maslo
                  </p>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-2xl sm:text-3xl font-mono font-semibold text-[#d8b4e2]">
                    0%
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-white/70 block text-left leading-tight">
                    Margarínov<br />& náhrad
                  </span>
                </div>
              </div>

              {/* Footnote */}
              <p className="mt-6 text-[11px] text-white/50 tracking-tight">
                * Všetky receptúry podliehajú certifikácii HACCP a čerstvej výrobe v deň odberu.
              </p>

            </div>

            {/* Right Column: Transparent Visual with Minimalist Seed Annotations */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              
              {/* Floating Transparent Product */}
              <div className="relative w-64 sm:w-80 aspect-square flex items-center justify-center my-4">
                <Image
                  src="/images/trans_tartlets.png"
                  alt="Remeselná tartaletka a éclair z čistých surovín"
                  fill
                  sizes="(max-width: 1024px) 80vw, 40vw"
                  className="object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Clean Minimalist Callout Labels (Seed style) */}
              <div className="w-full space-y-4 pt-2 border-t border-white/15 text-xs text-white/80">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-white tracking-wider text-[11px] uppercase shrink-0">
                    KRÉM & MASCARPONE
                  </span>
                  <span className="text-right text-white/70 text-[11px]">
                    100% pravé talianske mascarpone s 35% smotanou
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-white tracking-wider text-[11px] uppercase shrink-0">
                    ČOKOLÁDA CALLEBAUT
                  </span>
                  <span className="text-right text-white/70 text-[11px]">
                    Výhradne belgické kakaové maslo bez palmového tuku
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-white tracking-wider text-[11px] uppercase shrink-0">
                    ČERSTVOSŤ V DEŇ VÝDAJA
                  </span>
                  <span className="text-right text-white/70 text-[11px]">
                    Finišované v dohodnutý čas vo výrobni Viničné
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
