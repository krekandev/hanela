"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface ProductItem {
  id: string;
  categoryKey: string;
  tag: string;
  isTagHighlight: boolean;
  title: string;
  subtitle: string;
  image: string;
  priceNote: string;
  href: string;
}

const products: ProductItem[] = [
  {
    id: "mix-24",
    categoryKey: "mix",
    tag: "Bestseller",
    isTagHighlight: true,
    title: "Víkendový Mix 24 ks",
    subtitle: "Mix čerstvých mini tartaletiek, rezov a choux v Hanela krabičke",
    image: "/images/products/featured-mix-nobg.webp",
    priceNote: "50 € za box (24 ks)",
    href: "/rezervacia?product=mix-zakuskov-24-ks",
  },
  {
    id: "malinova-torta",
    categoryKey: "torty-cheesecakes",
    tag: "Najobľúbenejšia",
    isTagHighlight: true,
    title: "Malinová torta",
    subtitle: "Mandľový korpus, malinová redukcia a mascarpone",
    image: "/images/products/featured-malinova-nobg.webp",
    priceNote: "45 € (12–16 porcií)",
    href: "/rezervacia?product=malinova-torta-12-16-porcii",
  },
  {
    id: "pistaciovy-cheesecake",
    categoryKey: "torty-cheesecakes",
    tag: "Prémiový",
    isTagHighlight: false,
    title: "Pistáciový cheesecake",
    subtitle: "Zamatový cheesecake s pravým pistáciovým praliné",
    image: "/images/products/featured-pistaciovy-nobg.webp",
    priceNote: "43 € (12–16 porcií)",
    href: "/rezervacia?product=pistaciovy-cheesecake-12-16-porcii",
  },
  {
    id: "karamelovy-veternik",
    categoryKey: "zakusky",
    tag: "Remeselná klasika",
    isTagHighlight: false,
    title: "Karamelový veterník 100g",
    subtitle: "Nadýchané odpaľované cesto a domáci karamel",
    image: "/images/products/featured-veternik-nobg.webp",
    priceNote: "2,50 € / ks",
    href: "/rezervacia?product=karamelovy-veternik-100g",
  },
];

interface FeaturedProductsProps {
  onSelectProduct?: (categoryKey: string) => void;
}

export default function FeaturedProducts({ onSelectProduct }: FeaturedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardElements = container.querySelectorAll<HTMLElement>("[data-product-card]");
    if (cardElements[index]) {
      const card = cardElements[index];
      const targetScroll = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
    setCurrentIndex(index);
  }, []);

  // Autoplay rotation every 4s on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) return;

      setCurrentIndex((prev) => {
        const next = (prev + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [scrollToIndex]);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const cardElements = container.querySelectorAll<HTMLElement>("[data-product-card]");

    let closestIdx = 0;
    let minDistance = Infinity;

    cardElements.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== currentIndex) {
      setCurrentIndex(closestIdx);
    }
  };

  const handleTouchStart = () => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleTouchEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 3000);
  };

  const handlePrev = () => {
    isInteractingRef.current = true;
    const prev = (currentIndex - 1 + products.length) % products.length;
    scrollToIndex(prev);
    handleTouchEnd();
  };

  const handleNext = () => {
    isInteractingRef.current = true;
    const next = (currentIndex + 1) % products.length;
    scrollToIndex(next);
    handleTouchEnd();
  };

  return (
    <section
      id="vikendove-mixy"
      className="bg-[#FAF8F5] text-[#261B24] py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#EAE5DC]"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#261B24] leading-[1.08]">
              Čerstvo pečené pre vaše najkrajšie chvíle.
            </h2>
          </div>

          <div className="max-w-sm flex flex-col items-start md:items-end text-left md:text-right">
            <p className="text-xs sm:text-sm text-[#261B24]/70 leading-relaxed font-normal mb-3">
              Všetky výrobky pripravujeme čerstvé na objednávku bez rastlinných tukov a práškových zmesí.
            </p>
            <Link
              href="/ponuka"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a62891] hover:text-[#8e207b] underline underline-offset-4"
            >
              <span>Prezrieť celú ponuku (41 druhov)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 
          Cards Container:
          - Pure white cards on airy cream background
          - Real photography
        */}
        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => { isInteractingRef.current = true; }}
            onMouseLeave={() => { isInteractingRef.current = false; }}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth no-scrollbar px-2 sm:px-0 -mx-2 sm:mx-0 py-3"
          >
            {products.map((item) => (
              <a
                key={item.id}
                data-product-card
                href={item.href}
                className="w-[84vw] max-w-[320px] shrink-0 snap-center md:w-auto md:shrink md:max-w-none group relative rounded-[28px] bg-white border border-[#DFD8CD] p-6 sm:p-7 flex flex-col justify-between items-center text-center transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1.5 hover:shadow-[0_20px_35px_-10px_rgba(38,27,36,0.12)] hover:border-[#a62891]/40 cursor-pointer block select-none"
              >
                {/* Top Tag */}
                <div className="absolute top-5 left-5 z-10">
                  <span
                    className={`inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full shadow-xs ${
                      item.isTagHighlight
                        ? "bg-[#a62891] text-white"
                        : "bg-[#F4EFE7] text-[#261B24]/90 border border-[#DFD8CD]"
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>

                {/* Product Title */}
                <div className="w-full pt-6 mb-2">
                  <h3 className="text-xl sm:text-[21px] font-semibold tracking-tight text-[#261B24] group-hover:text-[#a62891] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#261B24]/65 mt-1 line-clamp-2 min-h-[32px]">
                    {item.subtitle}
                  </p>
                </div>

                {/* Product Photo */}
                <div className="relative w-full aspect-square my-4 rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F3EEE6] border border-[#EAE5DC]/80 flex items-center justify-center p-3 sm:p-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain drop-shadow-[0_12px_22px_rgba(38,27,36,0.14)] group-hover:scale-108 group-hover:-translate-y-1 transition-all duration-500 ease-out"
                    />
                  </div>
                </div>

                {/* Bottom Button & Price Line */}
                <div className="w-full pt-2 flex flex-col items-center">
                  <div
                    className="w-full max-w-[220px] inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-xs sm:text-sm font-semibold tracking-tight transition-all duration-300 active:scale-[0.98] bg-[#261B24] text-white border border-[#261B24] group-hover:bg-[#a62891] group-hover:border-[#a62891] group-hover:shadow-md"
                  >
                    <span>Objednať / Rezervovať</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>

                  <span className="text-xs font-semibold text-[#261B24]/80 mt-3 font-mono">
                    {item.priceNote}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Mobile Carousel Navigation Controls */}
          <div className="flex md:hidden items-center justify-between mt-6 px-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#F4EFE7] active:scale-95 flex items-center justify-center text-[#261B24] transition-all border border-[#DFD8CD] shadow-xs"
              aria-label="Predchádzajúci produkt"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Pagination Capsule Dots */}
            <div className="flex items-center gap-2">
              {products.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    isInteractingRef.current = true;
                    scrollToIndex(i);
                    handleTouchEnd();
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === i
                      ? "w-7 bg-[#a62891]"
                      : "w-1.5 bg-[#DFD8CD] hover:bg-[#a62891]/50"
                  }`}
                  aria-label={`Produkt ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#F4EFE7] active:scale-95 flex items-center justify-center text-[#261B24] transition-all border border-[#DFD8CD] shadow-xs"
              aria-label="Ďalší produkt"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Callout Banner to Complete Catalog */}
        <div className="mt-14 rounded-3xl bg-[#F4EFE7] border border-[#DFD8CD] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a62891] block mb-1">
              Kompletná remeselná ponuka
            </span>
            <h4 className="text-xl sm:text-2xl font-semibold text-[#261B24] tracking-tight">
              Hľadáte konkrétnu príchuť torty alebo candy bar na svadbu?
            </h4>
            <p className="text-xs sm:text-sm text-[#261B24]/70 mt-1 max-w-xl">
              Pripravili sme pre vás prehľadný katalóg všetkých 38 výrobkov rozdelených do kategórií s dropdown filtrami, zložením a cenami.
            </p>
          </div>

          <Link
            href="/ponuka"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#261B24] text-white hover:bg-[#a62891] px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <span>Otvoriť celú ponuku</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
