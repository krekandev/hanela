"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  DollarSign,
  Search,
  Check,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  AlertCircle,
} from "lucide-react";
import { ProductPriceDoc } from "@/lib/types";
import { PRODUCTS, CATEGORIES } from "@/data/products";

interface PricingTabProps {
  prices: Record<string, ProductPriceDoc>;
  onSavePrice: (
    productId: string,
    price: number,
    isAvailable: boolean
  ) => Promise<void>;
}

export function PricingTab({ prices, onSavePrice }: PricingTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Local draft price inputs: productId -> string representation
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  // Local saving state: productId -> boolean
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    const stripDiacritics = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const q = stripDiacritics(searchQuery.trim());

    return PRODUCTS.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      const matchName = stripDiacritics(product.name).includes(q);
      const matchCat = stripDiacritics(product.category).includes(q);
      const matchSub = stripDiacritics(product.subcategory || "").includes(q);

      return matchName || matchCat || matchSub;
    });
  }, [searchQuery, selectedCategory]);

  const handlePriceChange = (productId: string, val: string) => {
    setDraftPrices((prev) => ({ ...prev, [productId]: val }));
  };

  const handleSaveProduct = async (
    productId: string,
    currentPrice: number,
    currentAvailability: boolean,
    newPriceVal?: number,
    newAvailabilityVal?: boolean
  ) => {
    setSavingId(productId);
    try {
      const priceToSave =
        newPriceVal !== undefined
          ? newPriceVal
          : draftPrices[productId] !== undefined
          ? parseFloat(draftPrices[productId])
          : currentPrice;

      const availToSave =
        newAvailabilityVal !== undefined
          ? newAvailabilityVal
          : currentAvailability;

      if (isNaN(priceToSave) || priceToSave < 0) {
        throw new Error("Cena musí byť nezáporné číslo");
      }

      await onSavePrice(productId, priceToSave, availToSave);

      // Clean draft
      setDraftPrices((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      setSavedSuccessId(productId);
      setTimeout(() => {
        setSavedSuccessId((curr) => (curr === productId ? null : curr));
      }, 2000);
    } catch (err) {
      console.error("Failed to save product price:", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9E8E98] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hľadať produkt podľa názvu alebo kategórie..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] text-sm text-[#261B24] placeholder-[#9E8E98] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#261B24] text-[#FAF8F5] shadow-xs font-semibold"
                : "bg-[#FAF8F5] text-[#6B5B65] hover:bg-[#F4EFE7] border border-[#EAE5DC]"
            }`}
          >
            Všetky kategórie ({PRODUCTS.length})
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = PRODUCTS.filter((p) => p.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? "bg-[#261B24] text-[#FAF8F5] border-[#261B24] shadow-xs font-semibold"
                    : "bg-[#FAF8F5] text-[#6B5B65] hover:bg-[#F4EFE7] border-[#EAE5DC]"
                }`}
              >
                <span>{cat.shortTitle}</span>
                <span className="ml-1 opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const priceDoc = prices[product.id];
          const currentPrice = priceDoc?.price ?? product.price;
          const isAvailable = priceDoc?.isAvailable ?? true;
          const draftVal = draftPrices[product.id];
          const hasUnsavedPrice =
            draftVal !== undefined &&
            parseFloat(draftVal) !== currentPrice &&
            !isNaN(parseFloat(draftVal));
          const isSaving = savingId === product.id;
          const isSuccess = savedSuccessId === product.id;

          return (
            <div
              key={product.id}
              className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] hover:border-[#DFD8CD] p-4 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              {/* Product Header & Image */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE5DC] shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9E8E98]">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E8E98] block">
                      {product.subcategory || product.category}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#261B24] leading-tight truncate mt-0.5">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-[#6B5B65] mt-1 line-clamp-1">
                      {product.servings
                        ? `${product.servings}`
                        : `Katalóg: ${product.price} €`}
                    </p>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="pt-2 border-t border-[#EAE5DC]/60 flex items-center justify-between">
                  <span className="text-xs text-[#6B5B65]">Dostupnosť:</span>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveProduct(
                        product.id,
                        currentPrice,
                        isAvailable,
                        undefined,
                        !isAvailable
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isAvailable
                        ? "bg-[#F3F6F3] text-[#345139] border-[#DCE4DC] hover:bg-[#E5ECE5]"
                        : "bg-[#FBF2F2] text-[#7A2E2E] border-[#EDD5D5] hover:bg-[#F8E5E5]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAvailable ? "bg-[#345139]" : "bg-[#7A2E2E]"
                      }`}
                    />
                    <span>{isAvailable ? "Dostupný" : "Vypredané"}</span>
                  </button>
                </div>
              </div>

              {/* Inline Price Editor Form */}
              <div className="pt-3 border-t border-[#EAE5DC] flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#6B5B65]">
                    €
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={draftVal !== undefined ? draftVal : currentPrice}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && hasUnsavedPrice && !isSaving) {
                        e.preventDefault();
                        handleSaveProduct(product.id, currentPrice, isAvailable);
                      }
                    }}
                    className={`w-full pl-7 pr-3 py-1.5 text-sm font-mono font-bold rounded-lg border text-[#261B24] focus:outline-none transition-colors ${
                      hasUnsavedPrice
                        ? "border-[#a62891] bg-[#FAF1F8]/50"
                        : "border-[#EAE5DC] bg-[#FAF8F5] focus:bg-[#FFFFFF] focus:border-[#a62891]"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  disabled={isSaving || (!hasUnsavedPrice && !isSuccess)}
                  onClick={() =>
                    handleSaveProduct(product.id, currentPrice, isAvailable)
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    isSuccess
                      ? "bg-[#F3F6F3] text-[#345139] border border-[#DCE4DC]"
                      : hasUnsavedPrice
                      ? "bg-[#261B24] text-[#FAF8F5] hover:bg-[#3d2c3a] shadow-2xs"
                      : "bg-[#FAF8F5] text-[#9E8E98] border border-[#EAE5DC] cursor-not-allowed"
                  }`}
                >
                  {isSaving ? (
                    <span>...</span>
                  ) : isSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Uložené</span>
                    </>
                  ) : (
                    <span>Uložiť</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
