import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Zásady ochrany osobných údajov (GDPR) | Hanela",
  description: "Informácie o spracúvaní a ochrane osobných údajov v remeselnej cukrárni Hanela.",
};

export default function GdprPage() {
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#261B24] tracking-tight">
                Zásady ochrany osobných údajov (GDPR)
              </h1>
              <p className="text-xs text-[#6B5B65] mt-1 font-sans">
                Platné od: 1. januára 2026 &middot; Cukráreň Hanela
              </p>
            </div>
          </div>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              1. Prevádzkovateľ osobných údajov
            </h2>
            <p>
              Prevádzkovateľom internetových stránok a rezervačného systému je remeselná cukráreň <strong>Hanela</strong> (Hlavná 102/179, 900 29 Viničné, e-mail: <a href="mailto:hanelacakes@gmail.com" className="text-[#a62891] underline">hanelacakes@gmail.com</a>, tel: +421 910 960 913).
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              2. Aké údaje spracúvame a prečo
            </h2>
            <p>
              Spracúvame výlučne údaje, ktoré nám dobrovoľne poskytnete pri odoslaní nezáväznej rezervácie alebo objednávky:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Meno a priezvisko:</strong> slúži na identifikáciu zákazníka pri vyzdvihnutí a označenie zákazkového balenia.</li>
              <li><strong>Telefónne číslo:</strong> pre rýchle operatívne overenie detailov výroby, času vyzdvihnutia a prípadné nejasnosti pri výrobe.</li>
              <li><strong>E-mailová adresa:</strong> na zaslanie automatického potvrdenia rezervácie, rekapitulácie položiek a termínu prevzatia.</li>
              <li><strong>Informácie o alergiách / diétach a poznámky:</strong> nevyhnutné pre bezpečnú potravinársku výrobu tort a koláčov podľa vašich požiadaviek.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              3. Právny základ spracúvania
            </h2>
            <p>
              Právnym základom spracúvania vašich osobných údajov je <strong>plnenie zmluvy alebo predzmluvných vzťahov</strong> (vybavenie vašej objednávky a príprava remeselných cukrárskych výrobkov) v zmysle čl. 6 ods. 1 písm. b) Nariadenia GDPR.
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              4. Doba uchovávania údajov
            </h2>
            <p>
              Vaše osobné údaje uchovávame len po dobu nevyhnutnú na vybavenie zákazky a splnenie zákonných účtovných a archivačných povinností podľa platnej legislatívy SR. Vaše kontaktné údaje neposkytujeme tretím stranám na marketingové účely ani nepredávame databázy.
            </p>
          </section>

          <section className="space-y-3 text-sm text-[#4A3B45] leading-relaxed">
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              5. Vaše práva
            </h2>
            <p>
              Ako dotknutá osoba máte právo požadovať prístup k svojim osobným údajom, ich opravu, vymazanie alebo obmedzenie spracúvania, ako aj právo namietať proti spracúvaniu. V prípade akýchkoľvek otázok nás môžete kedykoľvek kontaktovať na <a href="mailto:hanelacakes@gmail.com" className="text-[#a62891] underline">hanelacakes@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
