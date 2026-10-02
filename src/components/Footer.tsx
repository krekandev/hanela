"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1e131d] text-white border-t border-white/10">
      {/* Sleek, Clean Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <span className="text-2xl font-bold tracking-[-0.04em] uppercase text-white block">
              HANELA
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#d8b4e2] font-medium block mt-0.5">
              Remeselná cukráreň · Viničné
            </span>
          </div>

          {/* Quick Essential Actions / Contacts */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-white/70">
            <Link
              href="/rezervacia"
              className="inline-flex items-center gap-1.5 font-medium text-white hover:text-[#d8b4e2] transition-colors"
            >
              <span>Rezervácia</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#d8b4e2]" />
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
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Seed.com Grand Reveal Section at the bottom of the website */}
      <div className="relative w-full min-h-[320px] sm:min-h-[420px] lg:min-h-[480px] overflow-hidden flex flex-col justify-end items-center text-center pb-8 sm:pb-12 border-t border-white/10">
        {/* Background Image with Organic Atmosphere */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pure_ingredients.jpg"
            alt="Hanela prírodné suroviny a remeslo"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-[0.30] contrast-[1.15] saturate-[0.9]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e131d] via-[#1e131d]/50 to-[#1e131d]/90" />
        </div>

        {/* Huge Organic Stylized Lettering (Seed "Awaken Within" Aesthetic) */}
        <div className="relative z-10 w-full px-4 max-w-6xl mx-auto flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-[0.35em] text-[#d8b4e2] mb-3">
            Čisté ingrediencie · Viničné & Slovenský Grob
          </span>

          <h2
            className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-[110px] font-bold tracking-[-0.04em] leading-[0.95] select-none uppercase drop-shadow-2xl"
          >
            Poctivé Remeslo
          </h2>

          <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-white/70 tracking-wider font-sans font-normal max-w-md mx-auto">
            Pečieme pre vaše najkrajšie životné chvíle bez kompromisov a bez polotovarov.
          </p>

          <div className="mt-6 sm:mt-8 text-[11px] text-white/40 font-mono tracking-widest">
            © 2026 Hanela (Hanela s.r.o.)
          </div>
        </div>
      </div>
    </footer>
  );
}
