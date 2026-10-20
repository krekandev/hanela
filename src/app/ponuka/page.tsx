"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRODUCTS, CATEGORIES, Product, CategoryDefinition } from "@/data/products";
import { getProductOverrides, subscribePrices } from "@/lib/orders-service";
import { ProductPriceOverride, ProductPriceDoc } from "@/lib/types";
import {
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Check,
  X,
  Phone,
  Info,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function PonukaPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("Všetky");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const { addItem, totalQuantity } = useCart();

  const openProductModal = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveImageIndex(0);
    setModalQuantity(prod.minQuantity || 1);
    setAddedSuccess(false);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      slug: selectedProduct.slug,
      category: selectedProduct.category,
      image: selectedProduct.image,
      unitPrice: selectedProduct.price,
      quantity: modalQuantity,
      totalPrice: selectedProduct.price * modalQuantity,
      servings: selectedProduct.servings,
    });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  // Available subcategories for the active category
  const currentCategoryDef = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory);
  }, [activeCategory]);

  const availableSubcategories = useMemo(() => {
    if (!currentCategoryDef) return [];
    return currentCategoryDef.subcategories;
  }, [currentCategoryDef]);

  // When category changes, reset subcategory and smoothly scroll to catalog if scrolled past
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubcategory("Všetky");

    if (typeof window !== "undefined") {
      const navEl = document.getElementById("kategorie-ponuky");
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetScroll = rect.top + scrollTop - 58;
        if (scrollTop > targetScroll + 20) {
          window.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    }
  };

  // Realtime product overrides from admin
  const [productOverrides, setProductOverrides] = useState<Record<string, ProductPriceOverride>>({});

  useEffect(() => {
    // Initial local read
    setProductOverrides(getProductOverrides());

    // Subscribe to Firestore prices in real time
    const unsub = subscribePrices((data) => {
      setProductOverrides(data);
    });

    return () => unsub();
  }, []);

  // Merged products with admin pricing & availability overrides
  const mergedProducts = useMemo(() => {
    return PRODUCTS.map((p) => {
      const ovr = productOverrides[p.id];
      if (!ovr) return p;
      return {
        ...p,
        price: ovr.price !== undefined ? ovr.price : p.price,
        priceFormatted:
          ovr.price !== undefined ? `${ovr.price.toFixed(0)} €` : p.priceFormatted,
        isAvailable: ovr.isAvailable !== undefined ? ovr.isAvailable : true,
      };
    }).filter((p) => (p as unknown as { isAvailable?: boolean }).isAvailable !== false);
  }, [productOverrides]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return mergedProducts.filter((product) => {
      // Category filter
      if (activeCategory !== "all" && product.category !== activeCategory) {
        return false;
      }
      // Subcategory filter
      if (activeSubcategory !== "Všetky" && product.subcategory !== activeSubcategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesSub = product.subcategory.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesSub) return false;
      }
      return true;
    });
  }, [mergedProducts, activeCategory, activeSubcategory, searchQuery]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#261B24] flex flex-col font-sans">
      {/* Floating Pill Nav Bar */}
      <Navbar onOpenBooking={() => { window.location.href = "/rezervacia"; }} />

      {/* Hero Header for Catalog */}
      <section className="relative pt-36 sm:pt-44 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE5DC] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto text-center sm:text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] text-[#261B24] leading-[1.08]">
                Poctivé torty, cheesecakes a mini dezerty.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-[#261B24]/75 max-w-xl leading-relaxed">
                Všetkých 41 remeselných výrobkov pečených z pravého mascarpone, 82% masla a belgickej čokolády Callebaut s osobným odberom vo Viničnom.
              </p>
            </div>

            {/* Quick Contact & Action */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:+421910960913"
                className="inline-flex items-center gap-2 rounded-full border border-[#DFD8CD] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#261B24] hover:bg-[#F4EFE7] transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#a62891]" />
                <span className="font-mono">0910 960 913</span>
              </a>
              <Link
                href="/rezervacia"
                className="inline-flex items-center gap-2 rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <span>Prejsť na rezerváciu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Search bar & Category filters */}
          {/* Search bar */}
          <div className="pt-4 border-t border-[#EAE5DC]">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-[#261B24]/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hľadať tortu, príchuť (napr. malinová, veterník, pistácia)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#DFD8CD] bg-white pl-11 pr-10 py-3 text-xs sm:text-sm text-[#261B24] placeholder:text-[#261B24]/40 focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#261B24]/40 hover:text-[#261B24]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Sticky Mobile/Desktop Category Bar */}
      <nav
        id="kategorie-ponuky"
        aria-label="Kategórie ponuky"
        className="sticky top-[48px] sm:top-[56px] z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE5DC] py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 shadow-xs"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          {/* Main Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => handleCategoryChange("all")}
              className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#261B24] text-white shadow-xs"
                  : "bg-white text-[#261B24]/80 border border-[#DFD8CD] hover:bg-[#F4EFE7]"
              }`}
            >
              Všetky (41)
            </button>

            {CATEGORIES.map((cat) => {
              const count = PRODUCTS.filter((p) => p.category === cat.id).length;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`rounded-full px-4 sm:px-5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#261B24] text-white shadow-xs"
                      : "bg-white text-[#261B24]/80 border border-[#DFD8CD] hover:bg-[#F4EFE7]"
                  }`}
                >
                  <span>{cat.shortTitle}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-[#F4EFE7] text-[#261B24]/70"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subcategories Pills if a category with subcategories is active */}
          {availableSubcategories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[#EAE5DC]/60">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#261B24]/50 mr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" />
                Filter:
              </span>
              {availableSubcategories.map((sub) => {
                const isSubActive = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubcategory(sub)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSubActive
                        ? "bg-[#a62891] text-white shadow-xs"
                        : "bg-white/80 border border-[#DFD8CD] text-[#261B24]/70 hover:bg-white"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Products Content Area */}
      <section className="py-8 sm:py-14 px-3 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto">
          
          {/* Status summary */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#EAE5DC]">
            <p className="text-xs sm:text-sm text-[#261B24]/70 font-medium">
              Zobrazených <span className="font-semibold text-[#261B24]">{filteredProducts.length}</span> výrobkov
              {activeCategory !== "all" && currentCategoryDef && ` v kategórii „${currentCategoryDef.title}“`}
              {activeSubcategory !== "Všetky" && ` · ${activeSubcategory}`}
            </p>

            {(activeCategory !== "all" || activeSubcategory !== "Všetky" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSubcategory("Všetky");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-[#a62891] hover:underline cursor-pointer"
              >
                Resetovať filtre
              </button>
            )}
          </div>

          {/* No results */}
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-base text-[#261B24]/70">
                Nenašli sa žiadne výrobky zodpovedajúce vašim filtrom.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSubcategory("Všetky");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#261B24] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider"
              >
                Zobraziť všetky výrobky
              </button>
            </div>
          ) : (
            /* Category sections (or single filtered section) */
            <div className="space-y-12 sm:space-y-16">
              {(activeCategory === "all" && !searchQuery ? CATEGORIES : CATEGORIES.filter(c => c.id === activeCategory || searchQuery)).map((cat) => {
                const sectionProducts = filteredProducts.filter((p) => p.category === cat.id);
                if (sectionProducts.length === 0) return null;

                return (
                  <div key={cat.id} id={`sekcia-${cat.id}`} className="space-y-5">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b-2 border-[#261B24]/10">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#a62891] bg-[#FAF1F8] border border-[#ECD9E8] px-2.5 py-0.5 rounded-full">
                            {cat.badge}
                          </span>
                          <span className="text-xs text-[#261B24]/50 font-mono">
                            {sectionProducts.length} {sectionProducts.length === 1 ? "položka" : "položiek"}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#261B24] tracking-tight">
                          {cat.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#261B24]/70 mt-1 max-w-2xl leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      {activeCategory === "all" && (
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className="self-start sm:self-end text-xs font-semibold text-[#a62891] hover:text-[#8e207b] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>Iba {cat.shortTitle}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Products Grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                      {sectionProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group rounded-2xl sm:rounded-3xl bg-white border border-[#DFD8CD] p-3 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-[#a62891]/40 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div>
                            {/* Product Photo */}
                            <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#FAF8F5] mb-3 sm:mb-4 border border-[#EAE5DC]">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              {/* Tag badge */}
                              {product.tag && (
                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                                  <span className="inline-block px-2 py-0.5 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#a62891] text-white shadow-xs">
                                    {product.tag}
                                  </span>
                                </div>
                              )}

                              {/* Subcategory badge */}
                              <div className="hidden sm:block absolute bottom-3 left-3 z-10">
                                <span className="inline-block px-2 py-0.5 text-[9px] font-medium tracking-wide rounded-full bg-white/90 backdrop-blur-xs text-[#261B24] border border-[#DFD8CD] shadow-xs">
                                  {product.subcategory}
                                </span>
                              </div>
                            </div>

                            {/* Subcategory mobile badge */}
                            <span className="sm:hidden text-[9px] font-semibold uppercase tracking-wider text-[#a62891] block mb-0.5 truncate">
                              {product.subcategory}
                            </span>

                            {/* Title */}
                            <h3 className="text-xs sm:text-base font-semibold text-[#261B24] group-hover:text-[#a62891] transition-colors leading-tight sm:leading-snug line-clamp-2 min-h-[32px] sm:min-h-[44px]">
                              {product.name}
                            </h3>

                            {/* Servings */}
                            {product.servings && (
                              <p className="text-[10px] sm:text-[11px] text-[#a62891] font-medium mt-0.5 sm:mt-1 truncate">
                                {product.servings}
                              </p>
                            )}

                            {/* Description (desktop/tablet only to keep mobile cards compact) */}
                            <p className="hidden sm:block mt-2 text-xs text-[#261B24]/70 leading-relaxed line-clamp-2">
                              {product.description || "Čerstvo pečené z poctivých surovín podľa vlastnej receptúry Hanela."}
                            </p>
                          </div>

                          {/* Bottom: Price & CTA */}
                          <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-4 border-t border-[#EAE5DC] flex items-center justify-between gap-1 sm:gap-2">
                            <div>
                              <span className="hidden sm:block text-[9px] sm:text-[10px] uppercase tracking-wider text-[#261B24]/50 font-medium">
                                Cena
                              </span>
                              <span className="text-xs sm:text-base font-bold text-[#261B24] font-mono">
                                {product.priceFormatted}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <button
                                type="button"
                                onClick={() => openProductModal(product)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#DFD8CD] hover:bg-[#F4EFE7] flex items-center justify-center text-[#261B24]/70 hover:text-[#261B24] transition-colors cursor-pointer shrink-0"
                                title="Zobraziť detail a možnosti"
                              >
                                <Info className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              </button>

                              <Link
                                href={`/rezervacia?product=${product.slug}`}
                                className="inline-flex items-center justify-center rounded-full bg-[#261B24] hover:bg-[#a62891] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold tracking-tight transition-all active:scale-95 shadow-xs whitespace-nowrap"
                              >
                                <span className="hidden sm:inline">Vybrať</span>
                                <ArrowRight className="w-3 h-3 sm:ml-1" />
                              </Link>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-[#DFD8CD] p-6 sm:p-8 text-[#261B24] shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F4EFE7] hover:bg-[#EAE5DC] text-[#261B24] flex items-center justify-center transition-all cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Image Gallery */}
            {(() => {
              const galleryImages = selectedProduct.images && selectedProduct.images.length > 0
                ? selectedProduct.images
                : [selectedProduct.image];
              const activeImg = galleryImages[activeImageIndex] || galleryImages[0];

              return (
                <div className="mb-6">
                  {/* Active main photo */}
                  <div className="relative w-full aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EAE5DC]">
                    <Image
                      src={activeImg}
                      alt={selectedProduct.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 700px"
                      className="object-cover transition-opacity duration-300"
                    />
                    {selectedProduct.tag && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-[#a62891] text-white shadow-xs">
                          {selectedProduct.tag}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails row (like Take.app photo selector) */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            activeImageIndex === idx
                              ? "border-[#a62891] ring-2 ring-[#a62891]/25 scale-[1.03]"
                              : "border-[#DFD8CD] opacity-65 hover:opacity-100 hover:border-[#261B24]/40"
                          }`}
                        >
                          <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Content */}
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#a62891] font-semibold block mb-1">
                  {selectedProduct.subcategory}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#261B24] tracking-tight">
                  {selectedProduct.name}
                </h2>
                {selectedProduct.servings && (
                  <p className="text-xs text-[#261B24]/60 font-medium mt-1">
                    Odporúčané porcie / balenie: <strong className="text-[#261B24]">{selectedProduct.servings}</strong>
                  </p>
                )}
              </div>

              {/* Min Quantity Warning / Note (matching Take.app screenshot) */}
              {selectedProduct.minQuantity && selectedProduct.minQuantity > 1 && (
                <div className="p-3.5 rounded-2xl bg-[#FCF8F5] border border-[#ECD9E8] flex items-start gap-3 text-xs text-[#261B24]/85 leading-relaxed">
                  <Info className="w-4 h-4 text-[#a62891] shrink-0 mt-0.5" />
                  <p>
                    Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je{" "}
                    <strong className="text-[#a62891] font-semibold">5 kusov z jedného druhu</strong>.
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
                <span className="text-[10px] uppercase tracking-wider text-[#261B24]/50 font-bold block mb-1">
                  Popis & zloženie
                </span>
                <p className="text-xs sm:text-sm text-[#261B24]/80 leading-relaxed whitespace-pre-line">
                  {selectedProduct.description || "Pečieme z poctivých surovín, pravého mascarpone a 82% masla. Bez margarínov a rastlinných náhrad."}
                </p>
              </div>

              {/* Quantity Stepper (for Zákusky) */}
              {selectedProduct.minQuantity && selectedProduct.minQuantity > 1 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#DFD8CD] shadow-2xs">
                  <div>
                    <span className="text-xs font-semibold text-[#261B24] uppercase tracking-wider block">
                      Počet kusov
                    </span>
                    <span className="text-[11px] text-[#261B24]/55">
                      Minimálny odber: {selectedProduct.minQuantity} ks
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={modalQuantity <= (selectedProduct.minQuantity || 1)}
                      onClick={() => setModalQuantity((q) => Math.max(selectedProduct.minQuantity || 1, q - 1))}
                      className="w-9 h-9 rounded-xl border border-[#DFD8CD] flex items-center justify-center font-bold text-base hover:bg-[#F4EFE7] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base w-8 text-center">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="w-9 h-9 rounded-xl border border-[#DFD8CD] flex items-center justify-center font-bold text-base hover:bg-[#F4EFE7] cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Cake Options Preview (if cake has options) */}
              {selectedProduct.options && selectedProduct.options.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-[#a62891] font-bold">
                      Prispôsobenie na mieru
                    </span>
                    <span className="text-[10px] text-[#261B24]/50">
                      Výber korpusu & krému
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
                      <strong className="text-[11px] uppercase tracking-wider text-[#261B24] block mb-1">
                        Korpus (7 možností)
                      </strong>
                      <p className="text-[11px] text-[#261B24]/70 leading-relaxed">
                        Piškótový, Mandľový, Kakaový, Pistáciový, S kúskami čokolády, Orechový, Makový
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
                      <strong className="text-[11px] uppercase tracking-wider text-[#261B24] block mb-1">
                        Krém (8 príchutí)
                      </strong>
                      <p className="text-[11px] text-[#261B24]/70 leading-relaxed">
                        Mascarpone s bielou čoko, Čokoládový, Nutelový, Gaštanový, Karamelový, Orieškový, Pistáciový, Kokosový
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#261B24]/60 italic">
                    * V ďalšom kroku v rezervačnom formulári si presne naklikáte požadovaný korpus, krém, ovocné redukcie aj personalizovaný zápich.
                  </p>
                </div>
              )}

              {/* Success Notification after adding to Cart */}
              {addedSuccess && (
                <div className="p-3.5 rounded-2xl bg-[#fcf4fb] border border-[#d9a5cf] text-[#a62891] flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span className="font-semibold">
                      Úspešne pridané do košíka ({modalQuantity} ks)!
                    </span>
                  </div>
                  <Link
                    href="/rezervacia"
                    className="font-bold underline uppercase tracking-wider text-[11px] hover:text-[#8e207b]"
                  >
                    Otvoriť košík →
                  </Link>
                </div>
              )}

              {/* Price & Booking action bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EAE5DC]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#261B24]/50 block font-semibold">
                    {selectedProduct.minQuantity && selectedProduct.minQuantity > 1 ? "Cena za kus / spolu" : "Cena"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#261B24] font-mono">
                      {selectedProduct.minQuantity && selectedProduct.minQuantity > 1
                        ? `${(modalQuantity * selectedProduct.price).toFixed(2).replace('.', ',')} €`
                        : selectedProduct.priceFormatted}
                    </span>
                    {selectedProduct.minQuantity && selectedProduct.minQuantity > 1 && (
                      <span className="text-xs text-[#261B24]/50 font-mono">
                        ({selectedProduct.priceFormatted} / ks)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="rounded-full border border-[#DFD8CD] px-4 py-2.5 text-xs font-semibold text-[#261B24] hover:bg-[#F4EFE7] cursor-pointer transition-colors"
                  >
                    Zavrieť
                  </button>

                  {selectedProduct.category === "torty-mieru" ? (
                    <Link
                      href={`/rezervacia?product=${selectedProduct.slug}&qty=${modalQuantity}`}
                      className="rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 text-center cursor-pointer flex items-center gap-2"
                    >
                      <span>Prispôsobiť & Rezervovať</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="rounded-full border border-[#a62891] bg-white text-[#a62891] hover:bg-[#fcf4fb] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Pridať do košíka</span>
                      </button>

                      <Link
                        href={`/rezervacia?product=${selectedProduct.slug}&qty=${modalQuantity}`}
                        className="rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 text-center cursor-pointer"
                      >
                        Rezervovať priamo
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </main>
  );
}
