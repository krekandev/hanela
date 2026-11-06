"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight } from "lucide-react";

/**
 * Handcrafted festive Santa Hat SVG designed to sit centered right on top of the Hanela logo.
 */
function SantaHat({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft shadow under hat onto the logo */}
      <ellipse cx="50" cy="58" rx="42" ry="7" fill="rgba(0,0,0,0.3)" />

      {/* Red Velvet Hat Cone curving up and folding to the right */}
      <path
        d="M16 54 C20 28, 42 10, 72 6 C78 5, 83 10, 79 18 C74 27, 77 38, 83 54 Z"
        fill="url(#xmasRedGrad)"
      />
      {/* Inner highlight */}
      <path
        d="M24 51 C28 32, 45 15, 68 11 C62 19, 68 34, 74 51 Z"
        fill="url(#xmasHighlightGrad)"
        opacity="0.38"
      />

      {/* Fluffy Brim (Trim) hugging the circular logo */}
      <path
        d="M10 54 C35 60, 65 60, 90 54 C90 45, 10 45, 10 54 Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.22))"
      />
      <circle cx="14" cy="54" r="6" fill="#FFFFFF" />
      <circle cx="26" cy="55" r="7" fill="#F8F9FA" />
      <circle cx="38" cy="56" r="7.5" fill="#FFFFFF" />
      <circle cx="50" cy="56.5" r="8" fill="#F8F9FA" />
      <circle cx="62" cy="56" r="7.5" fill="#FFFFFF" />
      <circle cx="74" cy="55" r="7" fill="#F8F9FA" />
      <circle cx="86" cy="54" r="6" fill="#FFFFFF" />

      {/* Pom-Pom Ball at the tip */}
      <circle cx="78" cy="9" r="9" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
      <circle cx="77" cy="8" r="8" fill="#F8F9FA" />
      <circle cx="75" cy="6" r="3" fill="#FFFFFF" />

      <defs>
        <linearGradient id="xmasRedGrad" x1="16" y1="54" x2="72" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#960E0E" />
          <stop offset="0.45" stopColor="#D62828" />
          <stop offset="1" stopColor="#EE3838" />
        </linearGradient>
        <linearGradient id="xmasHighlightGrad" x1="24" y1="51" x2="68" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA4A4" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ChristmasPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isTeaserVisible, setIsTeaserVisible] = useState(false);
  const [hasDismissedTeaser, setHasDismissedTeaser] = useState(false);

  // Exclude from admin dashboard
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    // Check if user already saw the popup in this session
    const seenModal = sessionStorage.getItem("hanela_xmas_modal_seen");
    if (!seenModal) {
      // Gentle appearance after 1.8 seconds on initial page load
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("hanela_xmas_modal_seen", "true");
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      // If modal was already seen, show subtle teaser badge after 3 seconds
      const teaserTimer = setTimeout(() => {
        setIsTeaserVisible(true);
      }, 2500);
      return () => clearTimeout(teaserTimer);
    }
  }, [isAdmin]);

  if (isAdmin) return null;

  const handleOpenModal = () => {
    setIsOpen(true);
    setIsTeaserVisible(false);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    sessionStorage.setItem("hanela_xmas_modal_seen", "true");
  };

  const handleDismissTeaser = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTeaserVisible(false);
    setHasDismissedTeaser(true);
  };

  return (
    <>
      {/* FLOATING TRIGGER BADGE (BOTTOM-RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Subtle Teaser Speech Bubble (if visible) */}
        {isTeaserVisible && !hasDismissedTeaser && !isOpen && (
          <div
            onClick={handleOpenModal}
            className="mb-2.5 bg-[#FFFFFF] text-[#261B24] p-3 rounded-2xl shadow-xl border border-[#ECD9E8] max-w-[240px] text-xs cursor-pointer animate-bounce-subtle relative group"
          >
            <button
              type="button"
              onClick={handleDismissTeaser}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#261B24] text-white rounded-full flex items-center justify-center text-[10px] hover:bg-[#a62891] transition-colors"
              title="Zavrieť bublinu"
            >
              &times;
            </button>
            <div className="text-[#a62891] font-bold text-[11px] mb-0.5">
              Vianočná ponuka spustená
            </div>
            <p className="text-[11px] text-[#6B5B65] leading-snug">
              Tradičné maslové pečivo a slávnostné krabičky. Kliknite sem.
            </p>
          </div>
        )}

        {/* Floating Capsule Button with Santa Logo */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="group relative inline-flex items-center gap-3 bg-[#261B24] text-[#FAF8F5] pl-2 pr-4 py-1.5 rounded-full shadow-2xl border border-white/10 hover:border-[#a62891]/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Otvoriť vianočnú ponuku"
        >
          {/* Logo with festive Santa Hat centered on top reaching down to Hanela text */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Hanela Vianoce"
              className="w-full h-full rounded-full object-cover border border-white/20 shadow-xs"
            />
            <div className="absolute -top-4 left-1/2 -translate-x-[48%] w-[58px] h-[46px] pointer-events-none drop-shadow-md z-10">
              <SantaHat className="w-full h-full" />
            </div>
          </div>

          {/* Text Label (No tree emoji, no AI sparkle) */}
          <div className="flex flex-col text-left pr-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#e5a8db]">
              Vianoce 2026
            </span>
            <span className="text-xs font-semibold text-white group-hover:text-[#FAF1F8] flex items-center gap-1.5">
              <span>Vianočná ponuka</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#e5a8db]" />
            </span>
          </div>
        </button>
      </div>

      {/* LUXURY CHRISTMAS MODAL POPUP */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-w-xl w-full bg-[#FAF8F5] text-[#261B24] rounded-3xl border border-[#EAE5DC] shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Festive Header Banner */}
            <div className="relative bg-[#261B24] text-white p-6 sm:p-7 text-center overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#a62891]/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#e5a8db]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Zavrieť"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Centered Logo with Santa Hat nicely sitting in the middle reaching down to Hanela text */}
              <div className="relative inline-block mx-auto mb-3">
                <div className="relative w-20 h-20 rounded-full border-2 border-white/20 p-1 shadow-lg bg-[#261B24] flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Hanela Vianoce"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute -top-7 left-1/2 -translate-x-[48%] w-[96px] h-[76px] pointer-events-none drop-shadow-lg z-10">
                    <SantaHat className="w-full h-full" />
                  </div>
                </div>
              </div>

              {/* Header Title (Clean, no AI sparkles) */}
              <div className="text-[#e5a8db] text-[11px] font-bold tracking-widest uppercase mb-1">
                Limitovaná ponuka 2026
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Slávnostná vianočná ponuka
              </h2>
              <p className="text-xs sm:text-sm text-white/75 max-w-md mx-auto leading-relaxed">
                Ručne pečené vianočné krabičky a tradičné maslové pečivo vo Viničnom. Pečené s láskou z pravého 82% masla a belgickej čokolády.
              </p>
            </div>

            {/* Christmas Products Cards */}
            <div className="p-5 sm:p-6 space-y-3.5 max-h-[58vh] overflow-y-auto">
              {/* Product 1: Krémové zákusky */}
              <div className="bg-white rounded-2xl border border-[#ECD9E8] p-3.5 flex items-center gap-4 hover:border-[#a62891]/40 transition-colors shadow-2xs">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#DFD8CD]">
                  <img
                    src="/images/products/vianocna-krabicka-kremovych-zakuskov.webp"
                    alt="Vianočná krabička krémových zákuskov"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-serif text-sm font-bold text-[#261B24] truncate">
                      Vianočná krabička zákuskov (27 ks)
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#a62891] shrink-0">
                      70 €
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5B65] line-clamp-2 leading-relaxed">
                    Veterníčky, doboška, punčový rez, grilážka, čoko-tartaletky a medovo-orechové rezy.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[10px] font-medium text-[#a62891] bg-[#FAF1F8] px-2 py-0.5 rounded-md">
                      27 ks krémových zákuskov
                    </span>
                    <span className="inline-block text-[10px] font-semibold text-[#261B24] bg-[#F4EFE7] px-2 py-0.5 rounded-md border border-[#DFD8CD]">
                      Odber iba 22. 12.
                    </span>
                  </div>
                </div>
              </div>

              {/* Product 2: Čajové pečivo */}
              <div className="bg-white rounded-2xl border border-[#ECD9E8] p-3.5 flex items-center gap-4 hover:border-[#a62891]/40 transition-colors shadow-2xs">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#DFD8CD]">
                  <img
                    src="/images/products/krabicka-cajoveho-peciva.webp"
                    alt="Krabička čajového pečiva"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-serif text-sm font-bold text-[#261B24] truncate">
                      Krabička čajového pečiva (750g)
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#a62891] shrink-0">
                      37 €
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5B65] line-clamp-2 leading-relaxed">
                    Tradičné maslové linecké, vanilkové rožteky, plnené oriešky a kávové kolieska (cca 55 ks).
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[10px] font-medium text-[#a62891] bg-[#FAF1F8] px-2 py-0.5 rounded-md">
                      750g čajového pečiva
                    </span>
                    <span className="inline-block text-[10px] font-semibold text-[#261B24] bg-[#F4EFE7] px-2 py-0.5 rounded-md border border-[#DFD8CD]">
                      Odber iba 22. 12.
                    </span>
                  </div>
                </div>
              </div>

              {/* Product 3: Maslové cestá */}
              <div className="bg-white rounded-2xl border border-[#ECD9E8] p-3.5 flex items-center gap-4 hover:border-[#a62891]/40 transition-colors shadow-2xs">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#DFD8CD]">
                  <img
                    src="/images/products/cesto-na-vianocne-pecenie.webp"
                    alt="Cesto na vianočné pečenie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-serif text-sm font-bold text-[#261B24] truncate">
                      Cesto na vianočné pečenie (750g)
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#a62891] shrink-0">
                      10 €
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5B65] line-clamp-2 leading-relaxed">
                    Pripravené maslové linecké, kakaové alebo orechové cesto na domáce pečenie bez námahy.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[10px] font-medium text-[#a62891] bg-[#FAF1F8] px-2 py-0.5 rounded-md">
                      750g hotového cesta
                    </span>
                    <span className="inline-block text-[10px] font-medium text-[#6B5B65] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE5DC]">
                      Odber kedykoľvek
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Direct Link to Christmas Category */}
            <div className="p-5 bg-white border-t border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#6B5B65] hover:text-[#261B24] transition-colors order-2 sm:order-1 text-center"
              >
                Zavrieť
              </button>
              <Link
                href="/ponuka?kategoria=vianoce"
                onClick={handleCloseModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#a62891] hover:bg-[#8F237D] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#a62891]/25 transition-all active:scale-[0.98] order-1 sm:order-2"
              >
                <span>Otvoriť celú vianočnú ponuku</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
