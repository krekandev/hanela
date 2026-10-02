"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  label: string;
  value: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
  label?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Vyberte možnosť...",
  className,
  label,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: CustomSelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <span className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#1e131d]/70 mb-2">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between text-left py-3 px-4 rounded-xl border transition-all duration-200 cursor-pointer bg-white/80 hover:bg-white text-sm",
          isOpen
            ? "border-[#1e131d] ring-2 ring-[#1e131d]/10 shadow-sm"
            : "border-[#D8D4C9] hover:border-[#1e131d]/60 shadow-xs"
        )}
      >
        <span className="truncate font-medium text-[#1e131d]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="ml-2 shrink-0 text-[#1e131d]/60"
        >
          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
        </motion.span>
      </button>

      {/* Animated Dropdown Menu (No native OS select box!) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 z-50 overflow-hidden rounded-2xl bg-[#FFFFFF] border border-[#ECEAE4] shadow-2xl shadow-black/15 py-1.5 max-h-64 overflow-y-auto"
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left text-xs sm:text-sm transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#2a1b29] text-white font-medium"
                      : "text-[#1e131d] hover:bg-[#f5eef5]/80"
                  )}
                >
                  <div className="flex flex-col pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-white/70" : "text-[#1e131d]/50"
                        )}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 stroke-[2.5] text-[#d8b4e2] shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomSelect;
