"use client";

import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    author: "Ing. Martina Kováčová",
    event: "Svadobná trojposchodová torta & 80 ks výslužiek",
    date: "August 2025",
    text: "Pre našu svadbu v stodole sme nechceli fondán, ale čistý minimalistický dizajn s mascarpone a malinami. Torta zožala obrovský úspech. Výslužkové krabičky vyzerali luxusne ako zo švajčiarskeho katalógu.",
    rating: "5.0",
    source: "Overená Google recenzia",
  },
  {
    author: "Mgr. Peter Dubovský",
    event: "Jubilejná narodeninová torta 50-tka",
    date: "Október 2025",
    text: "Objednával som pistáciovo-malinovú tortu pre manželku. Žiadne margaríny, žiadna umelá chémia, iba poctivé suroviny a pravá vanilka. Hladký systém vyzdvihnutia vo Viničnom bez čakania.",
    rating: "5.0",
    source: "Overená Google recenzia",
  },
  {
    author: "Veronika & Tomáš B.",
    event: "Víkendový degustačný box",
    date: "Január 2026",
    text: "Víkendové mixy od Hanela objednávame takmer každý druhý týždeň. Tartaletky sú chrumkavé, krémy delikátne vyvážené a nie sú presladené. Obrovský rešpekt k remeslu.",
    rating: "5.0",
    source: "Hodnotenie Zlatá Firma",
  },
  {
    author: "Lucia Miezgová",
    event: "Candy bar na firemný event",
    date: "Február 2026",
    text: "Kompletný candy bar tartaletiek, mini panna cotta a makróniek pre 70 hostí. Všetko čerstvé, voňavé a vizuálne dokonalé. Kolegovia si pýtali kontakt hneď na druhý deň.",
    rating: "5.0",
    source: "Overená Google recenzia",
  },
  {
    author: "Michal Horváth",
    event: "Svadobné mini zákusky 4×4",
    date: "Marec 2026",
    text: "Mini zákusky 4×4 cm boli hitom celého svadobného večera. Každý kúsok precízne ozdobený jedlými kvetmi a čerstvým lesným ovocím. Cukrárska precíznosť na najvyššej úrovni.",
    rating: "5.0",
    source: "Overená Google recenzia",
  },
];

// Duplicate for continuous seamless infinite marquee loop
const marqueeItems = [...reviews, ...reviews];

export default function Reviews() {
  return (
    <section id="recenzie" className="bg-[#FAF8F5] py-16 sm:py-20 border-b border-[#EAE5DC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        
        {/* Compact Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EAE5DC]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DFD8CD] bg-white px-3 py-1 text-[11px] font-semibold text-[#261B24] uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a62891]" />
              Skúsenosti zákazníkov
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em] text-[#261B24]">
              Dôvera overená stovkami osláv.
            </h2>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#a62891]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current stroke-none" />
              ))}
            </div>
            <span className="font-mono font-bold text-sm text-[#261B24]">5.0 / 5.0</span>
            <span className="text-xs text-[#261B24]/50 hidden sm:inline">Google & Zlatá Firma</span>
          </div>
        </div>

      </div>

      {/* Infinite Horizontal Running Marquee */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right gradient edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF8F5] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF8F5] to-transparent z-10" />

        {/* Marquee Track */}
        <div className="animate-marquee flex gap-4 sm:gap-5 px-4 cursor-grab active:cursor-grabbing">
          {marqueeItems.map((r, idx) => (
            <div
              key={idx}
              className="w-[280px] sm:w-[330px] shrink-0 rounded-2xl bg-white border border-[#EAE5DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-1 font-mono font-semibold text-[#a62891] bg-[#fcf4fb] px-2 py-0.5 rounded-full text-[11px]">
                    <Star className="w-3 h-3 fill-current stroke-none" />
                    <span>{r.rating}</span>
                  </div>
                  <span className="text-[11px] text-[#261B24]/45 font-medium">
                    {r.date}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#261B24]/80 leading-relaxed italic mb-5 line-clamp-4">
                  "{r.text}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#EAE5DC]/80">
                <p className="font-semibold text-xs sm:text-sm text-[#261B24] truncate">
                  {r.author}
                </p>
                <p className="text-[11px] text-[#261B24]/60 mt-0.5 truncate">
                  {r.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
