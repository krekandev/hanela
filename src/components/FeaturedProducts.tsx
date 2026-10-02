"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  categoryKey: string;
  tag: string;
  isTagHighlight: boolean;
  title: string;
  image: string;
  priceNote: string;
}

const products: Product[] = [
  {
    id: "vikendovy-mix",
    categoryKey: "mix",
    tag: "Bestseller",
    isTagHighlight: true,
    title: "Víkendový Mix",
    image: "/images/trans_weekend_mix.png",
    priceNote: "Od 28 € za krabičku",
  },
  {
    id: "mini-zakusky",
    categoryKey: "vysluky",
    tag: "Novinka",
    isTagHighlight: false,
    title: "Mini Zákusky 4×4",
    image: "/images/trans_mini_pastries.png",
    priceNote: "Od 1,90 € / ks",
  },
  {
    id: "tartaletky-eclairs",
    categoryKey: "candybar",
    tag: "Sezónne",
    isTagHighlight: false,
    title: "Tartaletky & Éclairs",
    image: "/images/trans_tartlets.png",
    priceNote: "Od 3,60 € / ks",
  },
  {
    id: "torty-na-mieru",
    categoryKey: "torta",
    tag: "Na mieru",
    isTagHighlight: true,
    title: "Svadobné & Jubilejné",
    image: "/images/trans_wedding_cake.png",
    priceNote: "Od 75 € za tortu",
  },
];

interface FeaturedProductsProps {
  onSelectProduct: (categoryKey: string) => void;
}

export default function FeaturedProducts({
  onSelectProduct,
}: FeaturedProductsProps) {
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

  // Autoplay rotation every 3.8s on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      // Don't auto-rotate if the user is swiping, hovering, or screen is desktop
      if (isInteractingRef.current) return;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) return;

      setCurrentIndex((prev) => {
        const next = (prev + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [scrollToIndex]);

  // Sync active index when user manually swipes
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
    // Resume auto-rotation after 3s of inactivity
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
      className="bg-[#1e131d] text-white py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-16">
          <div className="max-w-xl">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.22em] text-[#d8b4e2] block mb-3">
              Týždenné remeselné série
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-white leading-[1.08]">
              Víkendové degustačné mixy a sezónna ponuka.
            </h2>
          </div>

          <div className="max-w-sm flex flex-col items-start md:items-end text-left md:text-right">
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal mb-2">
              Limitované várky pečené z čistých surovín s osobným odberom vo Viničnom.
            </p>
            <a
              href="#ponuka"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white underline underline-offset-4"
            >
              <span>Všetky kategórie</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 
          Cards Container:
          - Mobile (<md): Side-by-side horizontal touch-swipe carousel with auto-rotation (snap-x snap-mandatory)
          - Tablet/Desktop (md+): Crisp 2 / 4 column grid
        */}
        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => { isInteractingRef.current = true; }}
            onMouseLeave={() => { isInteractingRef.current = false; }}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth no-scrollbar px-2 sm:px-0 -mx-2 sm:mx-0 py-3"
          >
            {products.map((item, idx) => (
              <a
                key={item.id}
                data-product-card
                href={`/rezervacia?category=${item.categoryKey}`}
                className="w-[84vw] max-w-[320px] shrink-0 snap-center md:w-auto md:shrink md:max-w-none group relative rounded-[28px] bg-[#2a1b29] border border-white/5 p-6 sm:p-7 flex flex-col justify-between items-center text-center transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_25px_35px_-10px_rgba(0,0,0,0.5)] hover:bg-[#352435] hover:border-white/20 cursor-pointer block select-none"
              >
                {/* Top Tag on the left */}
                <div className="absolute top-5 left-5 z-10">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                      item.isTagHighlight
                        ? "bg-[#aa5ca5] text-white"
                        : "bg-white/10 text-white/90 border border-white/10"
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>

                {/* Product Title */}
                <div className="w-full pt-5 mb-2">
                  <h3 className="text-xl sm:text-[22px] font-medium tracking-tight text-white">
                    {item.title}
                  </h3>
                </div>

                {/* Transparent Pastry Visual */}
                <div className="relative w-full aspect-square my-4 flex items-center justify-center pointer-events-none">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.38)]"
                  />
                </div>

                {/* Bottom Button & Price Line */}
                <div className="w-full pt-2 flex flex-col items-center">
                  <div
                    className="w-full max-w-[210px] inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-xs sm:text-sm font-semibold tracking-tight transition-all duration-300 active:scale-[0.98] bg-[#1e131d] text-white border border-white/20 group-hover:bg-white group-hover:text-[#1e131d] group-hover:border-white group-hover:shadow-lg"
                  >
                    <span>Rezervovať</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2] transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>

                  <span className="text-xs text-white/60 mt-3 font-normal tracking-tight">
                    {item.priceNote}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Mobile Carousel Navigation Controls & Autoplay Indicator Dots */}
          <div className="flex md:hidden items-center justify-between mt-6 px-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all border border-white/10"
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
                      ? "w-7 bg-[#aa5ca5]"
                      : "w-1.5 bg-white/25 hover:bg-white/50"
                  }`}
                  aria-label={`Produkt ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all border border-white/10"
              aria-label="Ďalší produkt"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
