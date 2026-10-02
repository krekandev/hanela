"use client";

import React, { useState, useEffect } from "react";
import { Check, Calendar, Clock, ArrowRight } from "lucide-react";

interface ReservationSectionProps {
  initialCategory?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  priceNote: string;
  minNotice: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "mix",
    name: "Víkendový degustačný box",
    badge: "Každý víkend nový výber",
    description: "Kolekcia 9, 16 alebo 24 ks mini tartaletiek, rezov a choux dezertov.",
    priceNote: "od 28 € / krabička",
    minNotice: "Objednávka do stredy 18:00",
  },
  {
    id: "torta",
    name: "Torta na mieru",
    badge: "Oslavy, svadby, jubileá",
    description: "Jedno- aj viacposchodové moderné torty s mascarpone krémom a jemnou štruktúrou.",
    priceNote: "od 75 € (podľa porcií)",
    minNotice: "Rezervácia 2–4 týždne vopred",
  },
  {
    id: "vysluky",
    name: "Mini zákusky & výslužky",
    badge: "Svadobné & rodinné krabičky",
    description: "Precízne mini kocky 4×4 cm balené v elegantných darčekových boxoch.",
    priceNote: "od 1,90 € / ks (min. 20 ks)",
    minNotice: "Rezervácia min. 7–14 dní vopred",
  },
  {
    id: "candybar",
    name: "Candy bar & tartaletky",
    badge: "Eventový catering",
    description: "Kombinácia choux, tartaletiek, moderných panna cotta a makróniek pre váš stôl.",
    priceNote: "Individuálny rozpočet od 120 €",
    minNotice: "Rezervácia 3–6 týždňov vopred",
  },
];

const FLAVORS = [
  "Mascarpone & Čerstvé maliny (Najžiadanejšia)",
  "Belgická horká čokoláda Callebaut & Višňové coulis",
  "Pistáciové praliné & Jahodová redukcia",
  "Slaný karamel & Pražené lieskovce",
  "Mango & Marakuja s vanilkou Bourbon",
  "Nechám si odporučiť cukrárkou",
];

const PORTION_OPTIONS: Record<string, string[]> = {
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

export default function ReservationSection({
  initialCategory = "torta",
}: ReservationSectionProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [category, setCategory] = useState<string>(initialCategory);
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
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Update category when prop changes
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
      if (PORTION_OPTIONS[initialCategory]?.length > 0) {
        setPortion(PORTION_OPTIONS[initialCategory][0]);
      }
    }
  }, [initialCategory]);

  // Set default portion when category changes
  useEffect(() => {
    if (PORTION_OPTIONS[category] && !PORTION_OPTIONS[category].includes(portion)) {
      setPortion(PORTION_OPTIONS[category][0]);
    }
  }, [category, portion]);

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
      setSubmittedData({
        categoryName: selectedCategoryObj.name,
        portion,
        flavor: category === "mix" ? "Sezónna víkendová skladba" : flavor,
        date,
        pickupTime,
        name,
        phone,
        email,
        inscription,
        allergies,
        notes,
        orderId: `HN-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }, 600);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setCurrentStep(1);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setInscription("");
    setAllergies("");
  };

  return (
    <section id="rezervacia" className="bg-[#FAF9F6] py-20 lg:py-28 border-b border-[#ECEAE4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D4C9] bg-white px-3 py-1 text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#aa5ca5]" />
            Rezervačný systém
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-[#1e131d]">
            Nezáväzná rezervácia a kalkulácia.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#1e131d]/75 font-normal">
            Vyberte si požadovaný sortiment a termín. Vašu požiadavku skontrolujeme s výrobným plánom a potvrdíme e-mailom alebo telefonicky do 24 hodín.
          </p>
        </div>

        {/* Success State View */}
        {isSubmitted && submittedData ? (
          <div className="rounded-3xl bg-white border border-[#aa5ca5]/30 p-8 sm:p-12 shadow-sm max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#1e131d] text-[#aa5ca5] flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#aa5ca5] font-semibold block">
                  Rezervácia úspešne odoslaná
                </span>
                <h3 className="text-2xl font-semibold text-[#1e131d] tracking-tight">
                  Ďakujeme, {submittedData.name}!
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#1e131d]/80 leading-relaxed mb-8">
              Vašu nezáväznú požiadavku s číslom <strong>{submittedData.orderId}</strong> sme prijali do systému. Do 24 hodín vám na e-mail <strong>{submittedData.email}</strong> zašleme potvrdenie dostupnosti termínu a cenovú špecifikáciu.
            </p>

            {/* Summary Details Card */}
            <div className="rounded-2xl bg-[#F9F8F5] border border-[#ECEAE4] p-6 mb-8 text-xs space-y-3">
              <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                <span className="text-[#1e131d]/60">Kategória:</span>
                <span className="font-semibold text-[#1e131d]">{submittedData.categoryName}</span>
              </div>
              <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                <span className="text-[#1e131d]/60">Veľkosť / Porcie:</span>
                <span className="font-semibold text-[#1e131d]">{submittedData.portion}</span>
              </div>
              <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                <span className="text-[#1e131d]/60">Vybraná príchuť:</span>
                <span className="font-semibold text-[#1e131d]">{submittedData.flavor}</span>
              </div>
              <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                <span className="text-[#1e131d]/60">Termín a čas výdaja:</span>
                <span className="font-semibold text-[#1e131d]">{submittedData.date} o {submittedData.pickupTime}</span>
              </div>
              <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                <span className="text-[#1e131d]/60">Miesto výdaja:</span>
                <span className="font-semibold text-[#1e131d]">Výrobňa Viničné (Hlavná 102/179)</span>
              </div>
              {submittedData.inscription && (
                <div className="flex justify-between border-b border-[#ECEAE4] pb-2">
                  <span className="text-[#1e131d]/60">Text na tortu:</span>
                  <span className="font-semibold text-[#1e131d]">{submittedData.inscription}</span>
                </div>
              )}
              {submittedData.allergies && (
                <div className="flex justify-between">
                  <span className="text-[#1e131d]/60">Intolerancie / Alergie:</span>
                  <span className="font-semibold text-[#1e131d]">{submittedData.allergies}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#ECEAE4]">
              <div className="text-xs text-[#1e131d]/60">
                Máte súrnu otázku? Volajte priamo na <strong>+421 910 960 913</strong>.
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto rounded-full bg-[#1e131d] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] transition-colors"
              >
                Vytvoriť ďalšiu rezerváciu
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Multi-Step Form */}
            <div className="lg:col-span-8 rounded-3xl bg-white border border-[#ECEAE4] p-6 sm:p-10 shadow-[0_4px_25px_-5px_rgba(24,41,30,0.03)]">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-6 mb-8">
                <div className="flex items-center gap-3 sm:gap-6 text-xs font-semibold tracking-wider">
                  
                  {/* Step 1 */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`flex items-center gap-2 ${
                      currentStep === 1
                        ? "text-[#1e131d]"
                        : currentStep > 1
                        ? "text-[#aa5ca5]"
                        : "text-[#1e131d]/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                        currentStep === 1
                          ? "bg-[#1e131d] text-white"
                          : currentStep > 1
                          ? "bg-[#aa5ca5] text-white"
                          : "bg-[#ECEAE4] text-[#1e131d]/60"
                      }`}
                    >
                      {currentStep > 1 ? "✓" : "1"}
                    </span>
                    <span className="hidden sm:inline">Kategória</span>
                  </button>

                  <span className="text-[#ECEAE4] font-normal">/</span>

                  {/* Step 2 */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={`flex items-center gap-2 ${
                      currentStep === 2
                        ? "text-[#1e131d]"
                        : currentStep > 2
                        ? "text-[#aa5ca5]"
                        : "text-[#1e131d]/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                        currentStep === 2
                          ? "bg-[#1e131d] text-white"
                          : currentStep > 2
                          ? "bg-[#aa5ca5] text-white"
                          : "bg-[#ECEAE4] text-[#1e131d]/60"
                      }`}
                    >
                      {currentStep > 2 ? "✓" : "2"}
                    </span>
                    <span className="hidden sm:inline">Termín a výdaj</span>
                  </button>

                  <span className="text-[#ECEAE4] font-normal">/</span>

                  {/* Step 3 */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={`flex items-center gap-2 ${
                      currentStep === 3
                        ? "text-[#1e131d]"
                        : "text-[#1e131d]/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                        currentStep === 3
                          ? "bg-[#1e131d] text-white"
                          : "bg-[#ECEAE4] text-[#1e131d]/60"
                      }`}
                    >
                      3
                    </span>
                    <span className="hidden sm:inline">Detaily & Kontakt</span>
                  </button>
                </div>

                <span className="text-xs text-[#1e131d]/50 font-mono">
                  Krok {currentStep} z 3
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* STEP 1: CATEGORY SELECTION */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1e131d] tracking-tight">
                        Vyberte požadovaný typ výroby
                      </h3>
                      <p className="text-xs text-[#1e131d]/65 mt-1">
                        Vyberte kategóriu dezertov pre vaše podujatie alebo víkendové posedenie.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setCategory(cat.id);
                              if (PORTION_OPTIONS[cat.id]) {
                                setPortion(PORTION_OPTIONS[cat.id][0]);
                              }
                            }}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all text-left flex flex-col justify-between ${
                              isSelected
                                ? "border-[#1e131d] bg-[#1e131d]/[0.03] ring-1 ring-[#1e131d]"
                                : "border-[#ECEAE4] bg-white hover:border-[#1e131d]/40"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-block rounded-full bg-[#ECEAE4] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1e131d]">
                                  {cat.badge}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? "border-[#1e131d] bg-[#1e131d]"
                                      : "border-[#D8D4C9]"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </div>
                              <h4 className="text-base font-semibold text-[#1e131d] mb-1">
                                {cat.name}
                              </h4>
                              <p className="text-xs text-[#1e131d]/70 leading-relaxed mb-4">
                                {cat.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-[#ECEAE4] flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-[#1e131d]">
                                {cat.priceNote}
                              </span>
                              <span className="text-[#aa5ca5] font-medium">
                                {cat.minNotice}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] transition-all"
                      >
                        <span>Pokračovať na výber termínu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DATE & PICKUP TIME */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1e131d] tracking-tight">
                        Dátum a predpokladaný čas vyzdvihnutia
                      </h3>
                      <p className="text-xs text-[#1e131d]/65 mt-1">
                        Výrobňa a výdajné okno sa nachádza vo Viničnom (Hlavná 102/179).
                      </p>
                    </div>

                    {/* Notice Callout */}
                    <div className="rounded-2xl bg-[#ECEAE4]/60 border border-[#D8D4C9] p-4 text-xs text-[#1e131d] flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#aa5ca5] mt-1.5 shrink-0" />
                      <div className="leading-relaxed">
                        <strong>Dôležité upozornenie:</strong> Zákazkové torty a svadobné výslužky odporúčame rezervovať <strong>2–4 týždne vopred</strong>. Víkendové mixy sa pripravujú na piatkový a sobotný odber s uzávierkou v stredu.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Požadovaný dátum odberu *
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                          />
                        </div>
                        <span className="text-[11px] text-[#1e131d]/50 mt-1 block">
                          Odporúčaný odber: Štvrtok, Piatok alebo Sobota
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Predpokladané časové okno
                        </label>
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        >
                          <option value="09:00 - 11:00">Dopoludnia (09:00 – 11:00)</option>
                          <option value="11:00 - 13:00">Okolo obeda (11:00 – 13:00)</option>
                          <option value="13:00 - 15:00">Skoré popoludnie (13:00 – 15:00)</option>
                          <option value="15:00 - 17:00">Podvečer (15:00 – 17:00)</option>
                          <option value="Sobota 11:00 - 12:00">Sobotný víkendový výdaj (11:00 – 12:00)</option>
                        </select>
                        <span className="text-[11px] text-[#1e131d]/50 mt-1 block">
                          Presný čas odberu doladíme v potvrdzovacom e-maili
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#ECEAE4]">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-semibold text-[#1e131d]/70 hover:text-[#1e131d] underline underline-offset-4"
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
                          setCurrentStep(3);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] transition-all"
                      >
                        <span>Pokračovať na detaily</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DETAILS & CONTACT */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#1e131d] tracking-tight">
                        Detaily objednávky a kontaktné údaje
                      </h3>
                      <p className="text-xs text-[#1e131d]/65 mt-1">
                        Vyplňte veľkosť, preferovanú chuť a kontakt pre zaslanie cenovej ponuky.
                      </p>
                    </div>

                    {/* Portions & Flavors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Veľkosť / Počet porcií
                        </label>
                        <select
                          value={portion}
                          onChange={(e) => setPortion(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        >
                          {PORTION_OPTIONS[category]?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Príchuť & Korpus
                        </label>
                        {category === "mix" ? (
                          <div className="rounded-xl border border-[#D8D4C9] bg-[#ECEAE4]/30 px-4 py-3 text-xs text-[#1e131d]/80">
                            Aktuálna týždenná degustačná skladba (malina, pistácia, vanilka, karamel)
                          </div>
                        ) : (
                          <select
                            value={flavor}
                            onChange={(e) => setFlavor(e.target.value)}
                            className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                          >
                            {FLAVORS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Text on cake and allergies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Text na tortu / zápich (voliteľné)
                        </label>
                        <input
                          type="text"
                          placeholder="napr. Všetko najlepšie Nina (30)"
                          value={inscription}
                          onChange={(e) => setInscription(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Alergie a intolerancie (voliteľné)
                        </label>
                        <input
                          type="text"
                          placeholder="napr. bez orechov, bezlepkové požiadavky..."
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        />
                      </div>
                    </div>

                    {/* Contact fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Meno a priezvisko *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Jana Nováková"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          Telefónne číslo *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+421 900 123 456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="jana.novakova@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                        />
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1e131d] uppercase tracking-wider mb-2">
                        Doplňujúca poznámka k výzdobe alebo odberu
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Opíšte vašu predstavu o dekorovaní, farebnosti alebo špeciálnych požiadavkách..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-xl border border-[#D8D4C9] bg-white px-4 py-3 text-sm text-[#1e131d] focus:border-[#1e131d] focus:outline-none focus:ring-1 focus:ring-[#1e131d]"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-[#ECEAE4]">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-semibold text-[#1e131d]/70 hover:text-[#1e131d] underline underline-offset-4"
                      >
                        Späť na termín
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e131d] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#2f1e2e] transition-all disabled:opacity-50"
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

            {/* Order Live Summary Card (Side Widget) */}
            <div className="lg:col-span-4 rounded-3xl bg-[#1e131d] text-white p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#aa5ca5]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#aa5ca5]">
                  Prehľad požiadavky
                </span>
              </div>

              <h4 className="text-xl font-semibold text-white tracking-tight mb-6">
                {selectedCategoryObj.name}
              </h4>

              <div className="space-y-4 text-xs divide-y divide-white/10">
                <div className="pt-3 flex justify-between">
                  <span className="text-white/60">Typ:</span>
                  <span className="font-medium text-white">{selectedCategoryObj.badge}</span>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-white/60">Veľkosť:</span>
                  <span className="font-medium text-white">{portion || "Štandard"}</span>
                </div>

                {category !== "mix" && (
                  <div className="pt-3 flex justify-between">
                    <span className="text-white/60">Príchuť:</span>
                    <span className="font-medium text-white text-right max-w-[180px] truncate">
                      {flavor.split("(")[0]}
                    </span>
                  </div>
                )}

                <div className="pt-3 flex justify-between">
                  <span className="text-white/60">Termín odberu:</span>
                  <span className="font-medium text-white">
                    {date ? `${date}` : "Zatiaľ nezvolený"}
                  </span>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-white/60">Časové okno:</span>
                  <span className="font-medium text-white">{pickupTime}</span>
                </div>

                <div className="pt-3 flex justify-between">
                  <span className="text-white/60">Orientačná cena:</span>
                  <span className="font-semibold text-[#aa5ca5]">
                    {selectedCategoryObj.priceNote}
                  </span>
                </div>
              </div>

              {/* Notice in side card */}
              <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-white/60 space-y-2">
                <p>
                  ✓ Bez viazanosti – platba prebieha pri prevzatí alebo vopred na zálohovú faktúru.
                </p>
                <p>
                  ✓ Osobný odber vo výrobni Viničné, Hlavná 102/179.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}
