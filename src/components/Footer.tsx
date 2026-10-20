"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#261B24] text-white border-t border-white/10">
      {/* Sleek, Clean Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand with circular logo */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
              <Image
                src="/images/logo.png"
                alt="Hanela logo"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight uppercase text-white block">
                HANELA
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#e5a8db] font-medium block">
                Remeselná cukráreň · Viničné
              </span>
            </div>
          </div>

          {/* Quick Essential Actions / Contacts */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-white/75">
            <Link
              href="/ponuka"
              className="inline-flex items-center gap-1 font-medium text-white hover:text-[#e5a8db] transition-colors"
            >
              <span>Celá ponuka</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#e5a8db]" />
            </Link>
            <Link
              href="/rezervacia"
              className="inline-flex items-center gap-1 font-medium text-white hover:text-[#e5a8db] transition-colors"
            >
              <span>Rezervácia</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#e5a8db]" />
            </Link>
            <a
              href="tel:+421910960913"
              className="hover:text-white transition-colors font-mono"
            >
              +421 910 960 913
            </a>
            <a
              href="mailto:hanelacakes@gmail.com"
              className="hover:text-white transition-colors"
            >
              hanelacakes@gmail.com
            </a>
            <a
              href="https://facebook.com/hanelacakes"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Seed.com Grand Reveal Section at the bottom of the website */}
      <div className="relative w-full min-h-[320px] sm:min-h-[400px] lg:min-h-[440px] overflow-hidden flex flex-col justify-end items-center text-center pb-8 sm:pb-12 border-t border-white/10">
        {/* Background Image with Organic Atmosphere */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pure_ingredients.jpg"
            alt="Hanela prírodné suroviny a remeslo"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-[0.25] contrast-[1.1] saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#261B24] via-[#261B24]/50 to-[#261B24]/95" />
        </div>

        {/* Huge Organic Stylized Lettering */}
        <div className="relative z-10 w-full px-4 max-w-6xl mx-auto flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-[0.35em] text-[#e5a8db] mb-3">
            Čisté ingrediencie · Viničné
          </span>

          <h2
            className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-bold tracking-[-0.04em] leading-[0.95] select-none uppercase drop-shadow-2xl"
          >
            Poctivé Remeslo
          </h2>

          <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-white/70 tracking-wider font-sans font-normal max-w-md mx-auto">
            Pečieme pre vaše najkrajšie životné chvíle bez kompromisov a bez polotovarov.
          </p>

          <div className="mt-6 sm:mt-8 text-[11px] text-white/40 font-mono tracking-widest flex flex-wrap items-center justify-center gap-3">
            <span>© 2026 Hanela s.r.o. · Viničné</span>
            <span>·</span>
            <Link href="/podmienky" className="hover:text-white/80 transition-colors underline-offset-4 hover:underline">
              Podmienky
            </Link>
            <span>·</span>
            <Link href="/gdpr" className="hover:text-white/80 transition-colors underline-offset-4 hover:underline">
              GDPR
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:text-white/80 transition-colors underline-offset-4 hover:underline">
              Správa výrobne
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
