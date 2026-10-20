import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Obchodné a rezervačné podmienky | Hanela",
  description: "Všeobecné obchodné a rezervačné podmienky remeselnej cukrárne Hanela.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#261B24]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B5B65] hover:text-[#261B24] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Späť na úvod</span>
          </Link>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="border-b border-[#EAE5DC] pb-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF1F8] border border-[#ECD9E8] flex items-center justify-center text-[#a62891] shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#261B24] tracking-tight">
                Obchodné a rezervačné podmienky
              </h1>
              <p className="text-xs text-[#6B5B65] mt-1 font-sans">
                Platné od: 1. januára 2026 &middot; Cukráreň Hanela
              </p>
            </div>
          </div>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              1. Úvodné ustanovenia
            </h2>
            <p>
              Tieto obchodné podmienky upravujú proces rezervácie, zákazkovej výroby a odberu remeselných cukrárskych výrobkov medzi zákazníkom a prevádzkovateľom cukrárne <strong>Hanela</strong> (Hlavná 102/179, 900 29 Viničné).
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              2. Objednávka a rezervácia termínu
            </h2>
            <p>
              Odoslaním formulára cez rezervačný systém zákazník vytvára záväznú objednávku na mieru. Zákazník je povinný uviesť pravdivé kontaktné údaje. Každá objednávka je po odoslaní potvrdená notifikačným e-mailom a zaevidovaná do výrobného harmonogramu.
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              3. Prevzatie tovaru a platba
            </h2>
            <p>
              Hotové torty a koláče sa preberajú v dohodnutom časovom slote osobne vo výrobni vo Viničnom (Hlavná 102/179). Vzhľadom na povahu čerstvých potravín odporúčame výrobky vyzdvihnúť v presne rezervovanom čase a prepravovať v chlade. Platba sa uskutočňuje pri osobnom prevzatí alebo podľa dohody.
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              4. Zmena a storno rezervácie
            </h2>
            <p>
              Keďže ide o zákazkovú výrobu čerstvých cukrárskych produktov podliehajúcich rýchlej skaze z prémiových surovín, prípadnú zmenu termínu alebo zrušenie je potrebné nahlásiť najneskôr 48 hodín pred plánovaným dňom odberu telefonicky na +421 910 960 913.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
