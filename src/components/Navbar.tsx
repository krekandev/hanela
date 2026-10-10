"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Menu, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalQuantity, formattedTotalPrice } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      if (window.location.pathname === "/") {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.location.href = href;
      }
    }
  };

  const navLinks = [
    { label: "Ponuka", href: "/ponuka" },
    { label: "Víkendové mixy", href: "/#vikendove-mixy" },
    { label: "Suroviny", href: "/#filozofia" },
    { label: "Výdaj & Kontakt", href: "/#kontakt" },
  ];

  const handleBooking = () => {
    onOpenBooking();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Floating Pill Nav Bar */}
      <header className="fixed top-3.5 sm:top-8 left-0 right-0 z-50 pointer-events-none px-3.5 sm:px-10 lg:px-14 transition-all duration-300">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          
          {/* Left Pill Capsule: Logo + Desktop Links */}
          <div
            className={`pointer-events-auto flex items-center gap-6 lg:gap-8 rounded-full px-4 sm:px-7 py-2 sm:py-3 transition-all duration-300 border ${
              scrolled
                ? "bg-[#261B24]/90 backdrop-blur-md border-white/20 text-white shadow-xl shadow-black/15"
                : "bg-[#261B24]/80 backdrop-blur-md border-white/25 text-white shadow-md shadow-black/10"
            }`}
          >
            {/* Logo: Brand Icon + Name */}
            <a
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-white uppercase text-sm sm:text-base lg:text-lg hover:opacity-95 transition-opacity"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/30 shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Hanela - remeselná cukráreň"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span>HANELA</span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] sm:text-sm font-normal text-white/95">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right Group: Cart Pill + Phone Pill + CTA Button + Seed Mobile Hamburger */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
            {/* Active Cart Pill if items exist */}
            {totalQuantity > 0 && (
              <a
                href="/rezervacia"
                className="inline-flex items-center gap-2 rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold shadow-lg shadow-[#a62891]/30 transition-all active:scale-95 animate-fadeIn"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Košík ({totalQuantity})</span>
                <span className="hidden sm:inline font-mono opacity-90 border-l border-white/30 pl-2">
                  {formattedTotalPrice}
                </span>
              </a>
            )}

            {/* Fixed Phone Pill with solid dark backing */}
            <a
              href="tel:+421910960913"
              className="hidden sm:inline-flex items-center rounded-full bg-[#261B24]/75 hover:bg-[#261B24]/95 backdrop-blur-md border border-white/25 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-md transition-all font-mono"
            >
              +421 910 960 913
            </a>

            {/* Desktop CTA Button */}
            <a
              href="/rezervacia"
              className="hidden lg:inline-flex rounded-full bg-white text-[#261B24] px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-tight hover:bg-[#FAF8F5] active:scale-[0.98] transition-all shadow-lg shadow-black/15 whitespace-nowrap"
            >
              {totalQuantity > 0 ? "Dokončiť rezerváciu" : "Nezáväzná rezervácia"}
            </a>

            {/* Mobile Seed-style Action Pill */}
            {totalQuantity === 0 && (
              <a
                href="/rezervacia"
                className="lg:hidden inline-flex items-center justify-center rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-4 py-2 text-xs font-semibold shadow-md active:scale-95 transition-all whitespace-nowrap"
              >
                Rezervácia
              </a>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center rounded-full bg-[#261B24]/85 hover:bg-[#261B24] backdrop-blur-md border border-white/25 w-9 h-9 text-white shadow-md active:scale-95 transition-all focus:outline-none"
              aria-label="Menu"
            >
              <div className="w-4 h-3 flex flex-col justify-between py-0.5 pointer-events-none">
                <span
                  className={`block w-4 h-[1.75px] bg-white rounded-full transition-all duration-300 origin-center ${
                    mobileMenuOpen ? "rotate-45 translate-y-[3.5px]" : ""
                  }`}
                />
                <span
                  className={`block w-4 h-[1.75px] bg-white rounded-full transition-all duration-300 origin-center ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
                  }`}
                />
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fadeIn">
          <div className="absolute top-24 left-4 right-4 rounded-[28px] bg-[#261B24] border border-white/20 p-8 text-white shadow-2xl">
            <nav className="flex flex-col gap-4 text-base font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 border-b border-white/10 hover:text-[#d9a5cf] cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <a
                  href="tel:+421910960913"
                  className="text-center py-2.5 text-sm text-white/80 font-mono"
                >
                  Tel: +421 910 960 913
                </a>
                <a
                  href="/rezervacia"
                  className="w-full text-center block rounded-full bg-white py-3.5 text-sm font-semibold text-[#261B24] hover:bg-[#FAF8F5]"
                >
                  Vytvoriť nezáväznú rezerváciu
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
