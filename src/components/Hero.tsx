"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative w-full bg-[#FAF8F5]">
      {/* 
        Seed.com Hero Canvas:
        - Spans edge-to-edge (0px margin/padding on top, left and right)
        - Goes all the way to the very top of the page
        - ONLY the bottom corners are curved (rounded-b)
      */}
      <div className="relative w-full min-h-[680px] sm:min-h-[760px] lg:min-h-[820px] rounded-b-[40px] sm:rounded-b-[56px] lg:rounded-b-[70px] overflow-hidden bg-[#FAF8F5] flex items-center shadow-2xl">
        
        {/* Full-bleed Background Photograph */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_cake.webp"
            alt="Slávnostná narodeninová torta s jedlými kvetmi a jemným ružovým lemom Hanela"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] sm:object-[70%_center] lg:object-right"
          />
          {/* Subtle gradient overlay on the left to make typography pop cleanly */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 via-45% to-transparent hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/85 via-55% to-transparent sm:hidden" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-36 sm:pt-48 lg:pt-52 pb-24 sm:pb-32">
          <div className="max-w-2xl">
            
            {/* Seed.com pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DFD8CD] bg-white/80 backdrop-blur-sm px-3.5 py-1 text-xs font-semibold text-[#261B24] uppercase tracking-wider mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#a62891]" />
              <span>Remeselná cukráreň · Viničné</span>
            </div>

            {/* Main Headline (Seed.com typography scale) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-semibold tracking-[-0.035em] text-[#261B24] leading-[1.04] text-balance">
              Poctivé remeselné torty a dezerty bez kompromisov.
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-xl text-[#261B24]/75 font-normal leading-relaxed max-w-xl tracking-tight">
              Čistý dizajn, prémiová belgická čokoláda a pravé mascarpone. Zákazková výroba vo Viničnom a Slovenskom Grobe.
            </p>

            {/* Seed Action Row */}
            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
              <a
                href="/rezervacia"
                className="inline-flex items-center justify-center rounded-full bg-[#a62891] hover:bg-[#8e207b] px-8 sm:px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white active:scale-[0.98] transition-all shadow-md shadow-[#a62891]/25"
              >
                Nezáväzná rezervácia
              </a>

              <a
                href="/ponuka"
                className="inline-flex items-center gap-2 rounded-full bg-white/90 hover:bg-white border border-[#DFD8CD] px-7 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#261B24] active:scale-[0.98] transition-all shadow-xs"
              >
                <span>Celá ponuka (41 druhov)</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
