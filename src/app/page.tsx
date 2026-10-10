"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Philosophy from "@/components/Philosophy";
import { ArrowRight } from "lucide-react";
import Reviews from "@/components/Reviews";
import PracticalInfo from "@/components/PracticalInfo";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#261B24] flex flex-col font-sans">
      {/* Floating Seed.com Pill Header */}
      <Navbar onOpenBooking={() => { window.location.href = "/rezervacia"; }} />

      {/* Hero Canvas with Panoramic Background */}
      <Hero onOpenBooking={() => { window.location.href = "/rezervacia"; }} />

      {/* Featured Products Bar (Clean White Cards on Warm Cream) */}
      <div id="ponuka">
        <FeaturedProducts onSelectProduct={(cat) => { window.location.href = `/rezervacia?category=${cat}`; }} />
      </div>

      {/* Philosophy & Ingredients Section (Swiss Grid) */}
      <Philosophy />

      {/* Seed-style Reservation Teaser Banner */}
      <section className="bg-[#261B24] py-20 sm:py-28 px-6 sm:px-12 text-center text-white border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#e5a8db] font-medium block mb-4">
            Výroba na zákazku & Výdajné okno
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-white leading-[1.1] mb-6">
            Pripravené na váš výnimočný okamih.
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed mb-10 font-normal">
            Vyberte si víkendový degustačný box, poschodovú svadobnú tortu alebo elegantný candy bar vo Viničnom a Slovenskom Grobe.
          </p>
          <a
            href="/rezervacia"
            className="inline-flex items-center gap-2 rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#a62891]/25"
          >
            <span>Prejsť do rezervačného systému</span>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </a>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/50 tracking-wider font-sans">
            <span>✓ Bez viazanosti</span>
            <span>✓ Potvrdenie termínu do 24 hodín</span>
            <span>✓ Osobný odber Viničné</span>
          </div>
        </div>
      </section>

      {/* Social Proof & Reviews (5.0 / 5.0) */}
      <Reviews />

      {/* Practical Information & Workshop Schedule */}
      <PracticalInfo />

      {/* Seed.com Structured Footer */}
      <Footer />
    </main>
  );
}
