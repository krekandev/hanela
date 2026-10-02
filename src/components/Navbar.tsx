"use client";

import React, { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Ponuka", href: "/#ponuka" },
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
            className={`pointer-events-auto flex items-center gap-8 rounded-full px-5 py-2.5 sm:px-8 sm:py-4 transition-all duration-300 border ${
              scrolled
                ? "bg-[#1e131d]/90 backdrop-blur-md border-white/20 text-white shadow-xl shadow-black/15"
                : "bg-[#1e131d]/75 backdrop-blur-md border-white/25 text-white shadow-md shadow-black/10"
            }`}
          >
            {/* Logo: Brand Name + White Dot */}
            <a
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 font-bold tracking-tight text-white uppercase text-sm sm:text-base lg:text-lg hover:opacity-90 transition-opacity"
            >
              <span>HANELA</span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white inline-block -mt-0.5" />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-[13px] sm:text-sm font-normal text-white/95">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right Group: High-Contrast Phone Pill + CTA Button + Seed Mobile Hamburger */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
            {/* Fixed Phone Pill with solid dark backing */}
            <a
              href="tel:+421910960913"
              className="hidden sm:inline-flex items-center rounded-full bg-[#1e131d]/70 hover:bg-[#1e131d]/90 backdrop-blur-md border border-white/25 px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-medium text-white shadow-md transition-all"
            >
              +421 910 960 913
            </a>

            {/* Desktop CTA Button */}
            <a
              href="/rezervacia"
              className="hidden lg:inline-flex rounded-full bg-white text-[#1e131d] px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold tracking-tight hover:bg-[#F9F8F5] active:scale-[0.98] transition-all shadow-lg shadow-black/15 whitespace-nowrap"
            >
              Nezáväzná rezervácia
            </a>

            {/* Mobile Seed-style Action Pill */}
            <a
              href="/rezervacia"
              className="lg:hidden inline-flex items-center justify-center rounded-full bg-[#1e131d]/85 hover:bg-[#1e131d] backdrop-blur-md border border-white/25 px-4 py-2.5 text-xs font-semibold text-white shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              Rezervácia
            </a>

            {/* Mobile Seed-style Hamburger Toggle with two parallel lines (=) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center rounded-full bg-[#1e131d]/85 hover:bg-[#1e131d] backdrop-blur-md border border-white/25 w-10 h-10 text-white shadow-md active:scale-95 transition-all focus:outline-none"
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
          <div className="absolute top-24 left-4 right-4 rounded-[28px] bg-[#1e131d] border border-white/20 p-8 text-white shadow-2xl">
            <nav className="flex flex-col gap-4 text-base font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 border-b border-white/10 hover:text-[#aa5ca5]"
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
                  className="w-full text-center block rounded-full bg-white py-3.5 text-sm font-semibold text-[#1e131d] hover:bg-[#F9F8F5]"
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
