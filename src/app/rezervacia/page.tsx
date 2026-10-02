"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { OrderTicketReceipt } from "@/components/ui/receipt-pricing";
import { CustomSelect } from "@/components/ui/custom-select";

interface CategoryItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  priceNote: string;
  notice: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: "mix",
    name: "Víkendový degustačný box",
    badge: "Sezónna kolekcia",
    description: "Výber 9, 16 alebo 24 ks mini tartaletiek, rezov a moderných choux.",
    priceNote: "od 28 €",
    notice: "Uzávierka na aktuálny víkend v stredu",
  },
  {
    id: "torta",
    name: "Torta na mieru",
    badge: "Oslavy & Svadby",
    description: "Moderné poschodové aj jednoliate torty s mascarpone krémom a jemnou štruktúrou.",
    priceNote: "od 75 €",
    notice: "Rezervácia 2–4 týždne vopred",
  },
  {
    id: "vysluky",
    name: "Mini zákusky & výslužky",
    badge: "Svadobné balíčky",
    description: "Precízne mini rezy 4×4 cm balené v elegantných darčekových krabičkách.",
    priceNote: "od 1,90 € / ks",
    notice: "Minimálny odber 20 ks",
  },
  {
    id: "candybar",
    name: "Candy bar & tartaletky",
    badge: "Eventový stôl",
    description: "Kompletný sladký bar tartaletiek, moderných panna cotta a makróniek.",
    priceNote: "od 120 €",
    notice: "Rezervácia 3–6 týždňov vopred",
  },
];

const FLAVORS = [
  "Mascarpone & Čerstvé maliny",
  "Belgická horká čokoláda Callebaut & Višňové coulis",
  "Pistáciové praliné & Jahodová redukcia",
  "Slaný karamel & Pražené lieskovce",
  "Mango & Marakuja s vanilkou Bourbon",
  "Nechám si odporučiť cukrárkou",
];

const PORTIONS: Record<string, string[]> = {
  mix: ["Box 9 ks (degustačný)", "Box 16 ks (rodinný)", "Box 24 ks (spoločenský)"],
  torta: [
    "Malá torta (8–10 porcií, ø 16 cm)",
    "Stredná torta (12–16 porcií, ø 20 cm)",
    "Veľká torta (18–24 porcií, ø 24 cm)",
    "2-poschodová svadobná (30–40 porcií)",
    "3-poschodová svadobná (50–80 porcií)",
  ],
  vysluky: ["20 ks výslužiek", "40 ks výslužiek", "60 ks výslužiek", "100+ ks na svadbu"],
  candybar: ["Malý candy bar (do 30 hostí)", "Stredný candy bar (30–60 hostí)", "Veľký candy bar (60–120 hostí)"],
};

function ReservationContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category") || "torta";

  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<string>(initialCategoryParam);
  const [portion, setPortion] = useState<string>("");
  const [flavor, setFlavor] = useState<string>(FLAVORS[0]);
  const [date, setDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("11:00");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [inscription, setInscription] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [orderCode, setOrderCode] = useState<string>("");

  useEffect(() => {
    if (initialCategoryParam && CATEGORIES.some((c) => c.id === initialCategoryParam)) {
      setCategory(initialCategoryParam);
    }
  }, [initialCategoryParam]);

  useEffect(() => {
    if (PORTIONS[category]) {
      setPortion(PORTIONS[category][0]);
    }
  }, [category]);

  const selectedCategoryObj =
    CATEGORIES.find((c) => c.id === category) || CATEGORIES[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !date) {
      alert("Prosím, vyplňte povinné polia (dátum, meno, telefón a e-mail).");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setOrderCode(`HN-${Math.floor(100000 + Math.random() * 900000)}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1e131d] flex flex-col font-sans selection:bg-[#aa5ca5]/30">
      
      {/* Minimal Top Header */}
      <header className="border-b border-[#ECEAE4] bg-[#F9F8F5]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#1e131d]/60 hover:text-[#1e131d] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Návrat na hlavnú stránku</span>
          </Link>

          <Link href="/" className="font-bold tracking-tight uppercase text-base sm:text-lg">
            HANELA <span className="w-1.5 h-1.5 rounded-full bg-[#1e131d] inline-block -mt-0.5" />
          </Link>

          <a
            href="tel:+421910960913"
            className="text-xs sm:text-sm font-mono text-[#1e131d]/80 hover:text-[#1e131d] hidden sm:inline"
          >
            +421 910 960 913
          </a>
        </div>
      </header>

      {/* Main Reservation Canvas */}
      <main className="grow max-w-6xl mx-auto w-full px-6 sm:px-10 py-12 sm:py-16">
        
        {/* Stepper (Seed style: pure typography, no circles, active in serif, inactive in light sans-serif) */}
        {!isSubmitted && (
          <nav aria-label="Kroky rezervácie" className="flex flex-wrap items-center gap-4 sm:gap-8 mb-12 sm:mb-16 border-b border-[#ECEAE4]/80 pb-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-left group transition-opacity"
            >
              <span
                className={`transition-colors ${
                  step === 1
                    ? "font-serif text-lg sm:text-2xl text-[#1e131d] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#1e131d]/35 font-light tracking-wide hover:text-[#1e131d]/70"
                }`}
              >
                01 Kategória
              </span>
            </button>

            <span className="text-[#1e131d]/20 font-light select-none">/</span>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-left group transition-opacity"
            >
              <span
                className={`transition-colors ${
                  step === 2
                    ? "font-serif text-lg sm:text-2xl text-[#1e131d] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#1e131d]/35 font-light tracking-wide hover:text-[#1e131d]/70"
                }`}
              >
                02 Termín a výdaj
              </span>
            </button>

            <span className="text-[#1e131d]/20 font-light select-none">/</span>

            <button
              type="button"
              onClick={() => {
                if (date) setStep(3);
              }}
              className="text-left group transition-opacity"
            >
              <span
                className={`transition-colors ${
                  step === 3
                    ? "font-serif text-lg sm:text-2xl text-[#1e131d] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#1e131d]/35 font-light tracking-wide hover:text-[#1e131d]/70"
                }`}
              >
                03 Detaily & Kontakt
              </span>
            </button>
          </nav>
        )}

        {/* Success View */}
        {isSubmitted ? (
          <div className="max-w-4xl mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Thank you and instructions */}
              <div className="md:col-span-7">
                <span className="text-xs uppercase tracking-widest text-[#aa5ca5] font-bold block mb-2 font-sans">
                  Rezervácia úspešne odoslaná
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1e131d] font-normal tracking-tight mb-4">
                  Ďakujeme za vašu požiadavku, {name}.
                </h1>

                <p className="text-sm text-[#1e131d]/80 leading-relaxed mb-6 font-sans">
                  Vaša nezáväzná rezervácia s referenčným kódom <strong className="text-[#1e131d] font-mono bg-white px-2 py-0.5 rounded border border-[#ECEAE4]">{orderCode}</strong> bola zaevidovaná do nášho výrobného plánu. 
                </p>

                <div className="p-5 rounded-2xl bg-[#f5eef5]/70 text-xs text-[#1e131d]/85 leading-relaxed space-y-2 mb-8 border border-[#d9bdd7]">
                  <p className="font-semibold text-[#1e131d]">Čo bude nasledovať?</p>
                  <p>1. Do 24 hodín preveríme výrobné kapacity na zvolený termín ({date}).</p>
                  <p>2. Na e-mail <strong>{email}</strong> vám zašleme potvrdenie dostupnosti s konečnou kalkuláciou.</p>
                  <p>3. V prípade nejasností vás kontaktujeme na telefónnom čísle <strong>{phone}</strong>.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#1e131d] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] transition-all shadow-md"
                  >
                    Späť na úvodnú stránku
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setStep(1);
                    }}
                    className="text-xs text-[#1e131d]/70 hover:text-[#1e131d] underline underline-offset-4"
                  >
                    Zadať ďalšiu požiadavku
                  </button>
                </div>
              </div>

              {/* Right Column: Printed Receipt Ticket ("Bloček") */}
              <div className="md:col-span-5 flex justify-center">
                <OrderTicketReceipt
                  orderCode={orderCode}
                  title={selectedCategoryObj.name}
                  badge="POTVRDENÝ DOPYT"
                  items={[
                    { label: "Kategória", value: selectedCategoryObj.name },
                    { label: "Porcie / Rozmer", value: portion || "Štandard" },
                    ...(category !== "mix"
                      ? [{ label: "Príchuť", value: flavor.split("(")[0].trim() }]
                      : [{ label: "Skladba", value: "9, 16 alebo 24 ks" }]),
                    { label: "Termín odberu", value: date },
                    { label: "Časové okno", value: pickupTime },
                    { label: "Výdajné miesto", value: "Viničné, Hlavná 102" },
                    { label: "Zákazník", value: name },
                    { label: "Telefón", value: phone },
                  ]}
                  priceNote={selectedCategoryObj.priceNote}
                  pickupLocation="Výrobňa Hlavná 102/179, Viničné"
                  notice="Objednávka v procese schvaľovania"
                />
              </div>

            </div>
          </div>
        ) : (
          /* Grid: Clean Form (Left) & Minimalist Overview (Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Content Area (No card borders!) */}
            <div className="lg:col-span-8">
              
              <form onSubmit={handleSubmit}>
                
                {/* STEP 1: CATEGORY (Clean layout without card boxes) */}
                {step === 1 && (
                  <div className="space-y-10">
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#1e131d] font-normal tracking-tight">
                        Vyberte požadovaný typ výroby
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#1e131d]/60 font-sans tracking-wide">
                        Remeselné produkty pečieme na zákazku z čistých ingrediencií.
                      </p>
                    </div>

                    {/* Products Grid: High-contrast green blocks with crisp white text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`cursor-pointer p-7 sm:p-8 rounded-[28px] transition-all duration-300 flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#2a1b29] text-white shadow-2xl shadow-black/25 ring-2 ring-[#aa5ca5] -translate-y-1.5"
                                : "bg-[#1e131d] text-white border border-white/10 hover:bg-[#2f1e2e] hover:-translate-y-1 hover:border-white/25 shadow-lg shadow-black/15"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <span
                                  className={`text-[10px] font-sans font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                    isSelected
                                      ? "bg-[#aa5ca5] text-white"
                                      : "bg-white/15 text-white/90"
                                  }`}
                                >
                                  {cat.badge}
                                </span>
                                {isSelected ? (
                                  <span className="w-6 h-6 rounded-full bg-[#aa5ca5] text-white inline-flex items-center justify-center font-bold shadow">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className="w-6 h-6 rounded-full border border-white/30 inline-flex items-center justify-center" />
                                )}
                              </div>

                              <h3 className="font-serif text-2xl sm:text-[26px] text-white font-medium tracking-tight mb-2.5 leading-snug">
                                {cat.name}
                              </h3>

                              <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-sans mb-8">
                                {cat.description}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-white/15 flex items-baseline justify-between text-xs">
                              <span className="font-serif text-base sm:text-lg text-white font-semibold">
                                {cat.priceNote}
                              </span>
                              <span
                                className={`text-[11px] font-sans font-medium tracking-wide ${
                                  isSelected ? "text-[#d8b4e2]" : "text-white/60"
                                }`}
                              >
                                {cat.notice}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-8 border-t border-[#ECEAE4]/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] active:scale-[0.98] transition-all shadow-sm"
                      >
                        <span>Pokračovať na výber termínu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 2 && (
                  <div className="space-y-10">
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#1e131d] font-normal tracking-tight">
                        Termín a vyzdvihnutie
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#1e131d]/60 font-sans tracking-wide">
                        Výdajné miesto sa nachádza vo Viničnom (Hlavná 102/179).
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#ECEAE4]/50 text-xs text-[#1e131d]/80 leading-relaxed">
                      <strong className="font-medium text-[#1e131d]">Upozornenie k plánovaniu:</strong> Zákazkové torty a svadobné výslužky odporúčame rezervovať 2–4 týždne vopred. Víkendové mixy sa pripravujú na piatkový a sobotný odber.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          Požadovaný dátum odberu *
                        </label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors"
                        />
                        <span className="text-[11px] text-[#1e131d]/50 mt-2 block">
                          Odporúčaný odber: Štvrtok, Piatok alebo Sobota
                        </span>
                      </div>

                      <div>
                        <CustomSelect
                          label="Časové okno výdaja"
                          value={pickupTime}
                          onChange={setPickupTime}
                          options={[
                            { label: "Dopoludnia (09:00 – 11:00)", value: "09:00 - 11:00" },
                            { label: "Okolo obeda (11:00 – 13:00)", value: "11:00 - 13:00" },
                            { label: "Popoludní (13:00 – 15:00)", value: "13:00 - 15:00" },
                            { label: "Podvečer (15:00 – 17:00)", value: "15:00 - 17:00" },
                            { label: "Sobotný víkendový výdaj (11:00 – 12:00)", value: "Sobota 11:00 - 12:00" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#ECEAE4] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs text-[#1e131d]/60 hover:text-[#1e131d] underline underline-offset-4"
                      >
                        Späť na kategóriu
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!date) {
                            alert("Zvoľte prosím dátum odberu.");
                            return;
                          }
                          setStep(3);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] active:scale-[0.98] transition-all shadow-sm"
                      >
                        <span>Pokračovať na detaily</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DETAILS & CONTACT */}
                {step === 3 && (
                  <div className="space-y-10">
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#1e131d] font-normal tracking-tight">
                        Detaily a kontaktné údaje
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#1e131d]/60 font-sans tracking-wide">
                        Vyplňte veľkosť, preferovanú chuť a vaše kontaktné údaje.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
                      <div>
                        <CustomSelect
                          label="Veľkosť / Počet porcií"
                          value={portion}
                          onChange={setPortion}
                          options={(PORTIONS[category] || []).map((opt) => ({
                            label: opt,
                            value: opt,
                          }))}
                        />

                        {/* Quick Interactive Selection Pills */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(PORTIONS[category] || []).map((opt) => {
                            const isSelected = portion === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setPortion(opt)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#2a1b29] text-white shadow-xs ring-1 ring-[#2a1b29]"
                                    : "bg-white/90 text-[#1e131d]/75 border border-[#D8D4C9] hover:bg-white hover:text-[#1e131d]"
                                }`}
                              >
                                {opt.split("(")[0].trim()}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        {category === "mix" ? (
                          <div>
                            <span className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                              Príchuť & Skladba
                            </span>
                            <div className="p-4 rounded-xl bg-white border border-[#D8D4C9] text-xs text-[#1e131d]/85 shadow-xs">
                              <strong className="font-semibold block text-[#1e131d] mb-1">
                                Týždenný výber cukrárky
                              </strong>
                              Harmonická skladba: belgická čokoláda, lesné maliny, pistáciové praliné a Bourbon vanilka.
                            </div>
                          </div>
                        ) : (
                          <CustomSelect
                            label="Príchuť & Korpus"
                            value={flavor}
                            onChange={setFlavor}
                            options={FLAVORS.map((f) => ({
                              label: f,
                              value: f,
                            }))}
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          Text na tortu (voliteľné)
                        </label>
                        <input
                          type="text"
                          placeholder="napr. Všetko najlepšie Nina (30)"
                          value={inscription}
                          onChange={(e) => setInscription(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          Alergie / intolerancie (voliteľné)
                        </label>
                        <input
                          type="text"
                          placeholder="napr. bez orechov..."
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-2">
                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          Meno a priezvisko *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Jana Nováková"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          Telefónne číslo *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+421 900 123 456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="jana.novakova@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
                        Doplňujúca poznámka k výzdobe
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Opíšte vašu predstavu o dekorovaní, farebnosti alebo špeciálnych požiadavkách..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-transparent border-b border-[#D8D4C9] py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none transition-colors placeholder-[#1e131d]/30"
                      />
                    </div>

                    <div className="pt-6 border-t border-[#ECEAE4] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs text-[#1e131d]/60 hover:text-[#1e131d] underline underline-offset-4"
                      >
                        Späť na termín
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-9 py-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                      >
                        {isSubmitting ? (
                          <span>Odosielam rezerváciu...</span>
                        ) : (
                          <>
                            <span>Odoslať nezáväznú rezerváciu</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </form>

            </div>

            {/* Right Panel: Confectionery Receipt Ticket ("Bloček") */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 pt-2 flex flex-col items-center">
              <div className="w-full max-w-[22rem] mb-3 text-left">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#1e131d]/50 font-bold block">
                  Súhrnný doklad
                </span>
                <p className="text-xs text-[#1e131d]/70 font-sans mt-0.5">
                  Váš aktuálny rezervačný bloček na zákazkovú výrobu.
                </p>
              </div>

              <OrderTicketReceipt
                orderCode="HN-829104"
                title={selectedCategoryObj.name}
                badge={selectedCategoryObj.badge}
                items={[
                  { label: "Kategória", value: selectedCategoryObj.name },
                  { label: "Porcie / Rozmer", value: portion || "Štandard" },
                  ...(category !== "mix"
                    ? [{ label: "Príchuť", value: flavor.split("(")[0].trim() }]
                    : [{ label: "Skladba", value: "9, 16 alebo 24 ks" }]),
                  { label: "Termín odberu", value: date ? date : "Nezvolený" },
                  { label: "Časové okno", value: pickupTime },
                  { label: "Miesto výdaja", value: "Viničné, Hlavná 102" },
                  ...(name ? [{ label: "Zákazník", value: name }] : []),
                  ...(phone ? [{ label: "Telefón", value: phone }] : []),
                ]}
                priceNote={selectedCategoryObj.priceNote}
                pickupLocation="Výrobňa Hlavná 102/179, Viničné"
                notice="Nezáväzný dopyt · Potvrdenie termínu do 24h"
              />
            </div>

          </div>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#ECEAE4] py-8 text-center text-xs text-[#1e131d]/50 bg-[#F9F8F5]">
        © 2026 Hanela s.r.o. · Remeselné koláčiky a torty Viničné & Slovenský Grob
      </footer>

    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F5] p-10 font-sans text-xs">Načítavam rezervačný systém...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
