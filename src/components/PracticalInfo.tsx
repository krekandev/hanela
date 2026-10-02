"use client";

import React from "react";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";

export default function PracticalInfo() {
  const schedule = [
    { day: "Po – Ut", hours: "9:00 – 16:30", note: "Výroba a zákazkový výdaj" },
    { day: "Streda", hours: "9:00 – 16:30", note: "Uzávierka víkendových mixov" },
    { day: "Št – Pi", hours: "9:00 – 17:00", note: "Piatkový výdaj víkendových boxov" },
    { day: "Sobota", hours: "11:00 – 12:00", note: "Výdaj víkendových a svadobných tort" },
    { day: "Nedeľa", hours: "Sanitárny deň", note: "Výroba pre eventy po dohode" },
  ];

  return (
    <section id="kontakt" className="bg-[#FAF9F6] py-16 sm:py-24 border-b border-[#ECEAE4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D4C9] bg-white px-3 py-1 text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#aa5ca5]" />
            Výrobňa & Osobný odber
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#1e131d]">
            Kde nás nájdete & prevádzkový čas.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1e131d]/70 font-normal">
            Naša cukrárska výrobňa vo Viničnom je pripravená na osobný odber v dohodnutý čas s bezplatným parkovaním priamo pred vchodom.
          </p>
        </div>

        {/* 3-Column Compact Grid: Harmonogram | Kontakty | Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Zmenšený Harmonogram (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-[#ECEAE4] p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#aa5ca5] mb-1.5">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Prevádzkové hodiny</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1e131d] tracking-tight mb-4">
                Harmonogram týždňa
              </h3>

              <div className="divide-y divide-[#ECEAE4]/80 text-xs">
                {schedule.map((item) => (
                  <div
                    key={item.day}
                    className="py-2.5 flex items-baseline justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#1e131d] block">
                        {item.day}
                      </span>
                      <span className="text-[11px] text-[#1e131d]/50">
                        {item.note}
                      </span>
                    </div>
                    <div className="text-right font-mono font-medium text-xs text-[#1e131d] shrink-0">
                      {item.hours}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#ECEAE4] text-[11px] text-[#1e131d]/55">
              <span>* Mimo uvedených hodín po dohode pri svadobnom servise.</span>
            </div>
          </div>

          {/* 2. Informácie o cukrárni a kontakty (3 cols) */}
          <div className="lg:col-span-3 rounded-3xl bg-[#1e131d] text-white p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#d8b4e2] mb-1.5">
                <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Adresa výrobne</span>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight mb-4">
                Hanela s.r.o.
              </h3>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#d8b4e2]/80 font-medium mb-0.5">
                    Osobný odber
                  </p>
                  <p className="font-semibold text-sm text-white">
                    Hlavná 102/179
                  </p>
                  <p className="text-white/70">
                    900 23 Viničné (okr. Pezinok)
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    Bezplatné parkovanie pred objektom
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <a
                    href="tel:+421910960913"
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#d8b4e2]" />
                    <span className="font-mono text-xs">+421 910 960 913</span>
                  </a>
                  <a
                    href="mailto:hanelacakes@gmail.com"
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#d8b4e2]" />
                    <span className="text-xs truncate">hanelacakes@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <a
                href="https://maps.google.com/?q=Hlavna+102+Vinicne"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#1e131d] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F9F8F5] active:scale-95 transition-all shadow"
              >
                <Navigation className="w-3.5 h-3.5 text-[#1e131d]" />
                <span>Navigovať</span>
              </a>
            </div>
          </div>

          {/* 3. Interaktívna Mapa (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-[#ECEAE4] bg-white shadow-xs relative min-h-[280px]">
            <iframe
              title="Mapa prevádzky Hanela Viničné"
              src="https://maps.google.com/maps?q=Hlavn%C3%A1+102%2F179,+900+23+Vini%C4%8Dn%C3%A9&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[300px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Map floating pin badge */}
            <div className="absolute top-4 left-4 bg-[#1e131d]/90 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#d8b4e2] animate-pulse" />
              <span>Výrobňa Viničné (Hlavná 102)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
