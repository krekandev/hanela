"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative w-full bg-[#1e131d]">
      {/* 
        Seed.com Hero Canvas:
        - Spans edge-to-edge (0px margin/padding on top, left and right)
        - Goes all the way to the very top of the page
        - ONLY the bottom corners are curved (rounded-b)
      */}
      <div className="relative w-full min-h-[680px] sm:min-h-[760px] lg:min-h-[820px] rounded-b-[40px] sm:rounded-b-[56px] lg:rounded-b-[70px] overflow-hidden bg-[#F9F8F5] flex items-center shadow-2xl">
        
        {/* Full-bleed Background Photograph */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/seed_hero.jpg"
            alt="Remeselné torty a čerstvý degustačný box Hanela na drevenom stole"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[75%_center] lg:object-right"
          />
          {/* Subtle gradient overlay on the left to make typography pop cleanly */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F9F8F5] via-[#F9F8F5]/85 via-50% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9F8F5]/60 via-transparent to-transparent sm:hidden" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-36 sm:pt-48 lg:pt-52 pb-24 sm:pb-32">
          <div className="max-w-2xl">
            
            {/* Main Headline (Seed.com typography scale) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-semibold tracking-[-0.035em] text-[#1e131d] leading-[1.04] text-balance">
              Poctivé remeselné torty a dezerty bez kompromisov.
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-xl text-[#1e131d]/75 font-normal leading-relaxed max-w-xl tracking-tight">
              Čistý dizajn, prémiová belgická čokoláda a pravé mascarpone. Zákazková výroba vo Viničnom a Slovenskom Grobe.
            </p>

            {/* Seed Action Row */}
            <div className="mt-10 flex flex-wrap items-center gap-5 sm:gap-6">
              <a
                href="/rezervacia"
                className="inline-flex items-center justify-center rounded-full bg-[#1e131d] px-8 sm:px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] active:scale-[0.98] transition-all shadow-md shadow-black/10"
              >
                Nezáväzná rezervácia
              </a>

              <a
                href="#ponuka"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-[#1e131d] hover:text-[#aa5ca5] transition-colors group py-2"
              >
                <span>Preskúmať ponuku</span>
                <ArrowRight className="w-4 h-4 stroke-[2] group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
