"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Calendar, Clock, User, Phone, Mail, Cake, Check } from "lucide-react";
import { PRODUCTS, CATEGORIES, Product } from "@/data/products";
import { CartItem, Order } from "@/lib/types";
import { saveOrder } from "@/lib/orders-service";

interface NewAdminOrderModalProps {
  isOpen: boolean;
  initialDate?: string;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

const KORPUS_OPTIONS = [
  "Piškótový",
  "Mandľový",
  "Kakaový",
  "Pistáciový",
  "Piškót s kúskami čokolády",
  "Orechový",
  "Makový",
];

const KREM_OPTIONS = [
  "Mascarpone s bielou čokoládou",
  "Čokoládový",
  "Nutelový",
  "Gaštanový",
  "Karamelový",
  "Orieškový",
  "Pistáciový",
  "Kokosový",
];

const SIZE_OPTIONS = [
  { id: "size-4", name: "4 porcie (mini)", total: 25 },
  { id: "size-10", name: "do 10 porcií (Ø 17 cm)", total: 60 },
  { id: "size-15", name: "10–15 porcií (Ø 21 cm)", total: 80 },
  { id: "size-20", name: "16–20 porcií (Ø 24 cm)", total: 100 },
  { id: "size-30", name: "24–30 porcií (Ø 27 cm)", total: 120 },
];

const DOUGH_VARIANTS = [
  "Cesto na medovníky",
  "Cesto na linecké pečivo",
  "Cesto na vanilkové / orechové rožteky",
];

const TIME_SLOTS = ["11:00", "11:30", "15:00", "15:30", "16:00", "16:30"];

export function NewAdminOrderModal({
  isOpen,
  initialDate,
  onClose,
  onOrderCreated,
}: NewAdminOrderModalProps) {
  const defaultDate = useMemo(() => {
    if (initialDate) return initialDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [initialDate]);

  // Customer & Timing
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>(defaultDate);
  const [pickupTime, setPickupTime] = useState<string>("15:00");
  const [allergies, setAllergies] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [internalNote, setInternalNote] = useState<string>("");

  // Item Builder
  const [activeCategory, setActiveCategory] = useState<string>("vianoce");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    PRODUCTS.find((p) => p.category === "vianoce")?.id || PRODUCTS[0].id
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<string>("");
  const [customItemName, setCustomItemName] = useState<string>("");
  const [isCustomFreeform, setIsCustomFreeform] = useState<boolean>(false);

  // Specific product options
  const [selectedDough, setSelectedDough] = useState<string>(DOUGH_VARIANTS[0]);
  const [selectedSize, setSelectedSize] = useState<string>(SIZE_OPTIONS[2].name);
  const [selectedKorpus, setSelectedKorpus] = useState<string>(KORPUS_OPTIONS[1]);
  const [selectedKrem, setSelectedKrem] = useState<string>(KREM_OPTIONS[0]);
  const [itemNote, setItemNote] = useState<string>("");

  // Added items in this order
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const categoryProducts = PRODUCTS.filter((p) => p.category === activeCategory);
  const selectedProduct: Product | undefined = PRODUCTS.find((p) => p.id === selectedProductId);

  const handleCategorySwitch = (catId: string) => {
    setIsCustomFreeform(false);
    setActiveCategory(catId);
    const first = PRODUCTS.find((p) => p.category === catId);
    if (first) {
      setSelectedProductId(first.id);
      setQuantity(catId === "zakusky" ? 5 : 1);
      setCustomUnitPrice("");
    }
  };

  const handleProductSwitch = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = PRODUCTS.find((p) => p.id === prodId);
    if (prod) {
      setQuantity(prod.category === "zakusky" ? Math.max(5, quantity) : 1);
      setCustomUnitPrice("");
      if (
        prod.slug === "vianocna-krabicka-kremovych-zakuskov" ||
        prod.slug === "krabicka-cajoveho-peciva"
      ) {
        setPickupDate("2026-12-22");
      }
    }
  };

  // Calculate unit price for current builder selection
  const resolvedUnitPrice = (() => {
    if (customUnitPrice.trim() !== "" && !isNaN(Number(customUnitPrice))) {
      return Number(customUnitPrice);
    }
    if (isCustomFreeform) {
      return 0;
    }
    if (!selectedProduct) return 0;
    if (selectedProduct.name === "TORTA podľa vlastného výberu") {
      const sz = SIZE_OPTIONS.find((s) => s.name === selectedSize);
      return sz ? sz.total : selectedProduct.price;
    }
    return selectedProduct.price;
  })();

  const buildCurrentItem = (): CartItem | null => {
    if (isCustomFreeform) {
      if (!customItemName.trim()) return null;
      const uPrice = Number(customUnitPrice) || 0;
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: `custom-${Date.now()}`,
        name: customItemName.trim(),
        slug: "vlastna-polozka",
        category: "torty-mieru",
        image: "/images/logo.png",
        unitPrice: uPrice,
        quantity: Math.max(1, quantity),
        totalPrice: uPrice * Math.max(1, quantity),
        cakeNote: itemNote.trim() || undefined,
      };
    }

    if (!selectedProduct) return null;
    const isDough = selectedProduct.slug === "cesto-na-vianocne-pecenie";
    const isCustomCake = selectedProduct.category === "torty-mieru";
    const finalName = isDough
      ? `${selectedProduct.name} – ${selectedDough}`
      : selectedProduct.name;

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: selectedProduct.id,
      name: finalName,
      slug: selectedProduct.slug,
      category: selectedProduct.category,
      image: selectedProduct.image,
      unitPrice: resolvedUnitPrice,
      quantity: Math.max(1, quantity),
      totalPrice: resolvedUnitPrice * Math.max(1, quantity),
      size: selectedProduct.name === "TORTA podľa vlastného výberu" ? selectedSize : undefined,
      korpus: isCustomCake ? selectedKorpus : undefined,
      krem: isCustomCake ? selectedKrem : undefined,
      doplnky: isDough ? [`Druh: ${selectedDough}`] : undefined,
      cakeNote: itemNote.trim() || undefined,
      servings:
        selectedProduct.category === "zakusky"
          ? `${quantity} ks`
          : selectedProduct.servings,
    };
  };

  const handleAddItemToList = () => {
    const built = buildCurrentItem();
    if (!built) {
      alert("Zadajte prosím názov položky.");
      return;
    }
    if (
      built.slug === "vianocna-krabicka-kremovych-zakuskov" ||
      built.slug === "krabicka-cajoveho-peciva"
    ) {
      setPickupDate("2026-12-22");
    }
    setItems((prev) => [...prev, built]);
    setItemNote("");
    setCustomItemName("");
    setCustomUnitPrice("");
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalOrderPrice = items.reduce((sum, it) => sum + it.totalPrice, 0);

  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // If owner didn't click "+ Pridať položku" yet, add the currently selected item automatically
    let finalItems = items;
    if (finalItems.length === 0) {
      const autoBuilt = buildCurrentItem();
      if (autoBuilt) {
        finalItems = [autoBuilt];
      }
    }

    if (finalItems.length === 0) {
      alert("Pridajte prosím aspoň jeden výrobok do zákazky.");
      return;
    }

    if (!customerName.trim()) {
      alert("Zadajte prosím aspoň meno zákazníka.");
      return;
    }

    if (!pickupDate) {
      alert("Vyberte prosím dátum odberu.");
      return;
    }

    const finalTotal = finalItems.reduce((sum, it) => sum + it.totalPrice, 0);

    setIsSaving(true);
    try {
      const created = await saveOrder({
        pickupDate,
        pickupTime,
        source: "manual",
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim() || "Neuvedený",
          email: customerEmail.trim(),
          allergies: allergies.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        items: finalItems,
        totalPrice: finalTotal,
        internalNote: internalNote.trim() || undefined,
      });

      if (onOrderCreated) {
        onOrderCreated(created);
      }
      onClose();
    } catch (err) {
      console.error("Chyba pri ukladaní manuálnej zákazky:", err);
      alert("Nepodarilo sa uložiť zákazku do databázy.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#261B24]/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-3xl rounded-2xl border border-[#EAE5DC] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE5DC]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a62891] block">
              Osobná / Telefonická objednávka
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#261B24]">
              Pridať novú zákazku do systému
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6B5B65] hover:text-[#261B24] rounded-lg hover:bg-[#EAE5DC]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveManualOrder} className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Zákazník a Termín */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-[#FAF8F5] p-4 rounded-xl border border-[#EAE5DC]">
            <div className="sm:col-span-5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                Meno zákazníka *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#9E8E98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="napr. Jana Kováčová"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#DFD8CD] focus:outline-none focus:border-[#a62891]"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                Telefón (voliteľné)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#9E8E98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0900 000 000"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-mono bg-white rounded-lg border border-[#DFD8CD] focus:outline-none focus:border-[#a62891]"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                E-mail (voliteľné)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#DFD8CD] focus:outline-none focus:border-[#a62891]"
              />
            </div>

            {/* Dátum a Čas */}
            <div className="sm:col-span-6">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] flex items-center justify-between mb-1">
                <span>Dátum odberu *</span>
                <button
                  type="button"
                  onClick={() => setPickupDate("2026-12-22")}
                  className="text-[10px] font-bold text-[#a62891] hover:underline cursor-pointer"
                >
                  Nastaviť Vianoce (22. 12.)
                </button>
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-white rounded-lg border border-[#DFD8CD] focus:outline-none focus:border-[#a62891]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                Čas vyzdvihnutia *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPickupTime(slot)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                      pickupTime === slot
                        ? "bg-[#261B24] text-white border-[#261B24]"
                        : "bg-white text-[#261B24] border-[#DFD8CD] hover:bg-[#F4EFE7]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Výber produktov do zákazky */}
          <div className="space-y-3 border border-[#EAE5DC] rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#261B24]">
                Pridať výrobok do zákazky
              </span>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySwitch(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      !isCustomFreeform && activeCategory === cat.id
                        ? "bg-[#a62891] text-white"
                        : "bg-[#FAF8F5] text-[#6B5B65] hover:bg-[#F4EFE7] border border-[#EAE5DC]"
                    }`}
                  >
                    {cat.shortTitle}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFreeform(true);
                    setQuantity(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    isCustomFreeform
                      ? "bg-[#261B24] text-white"
                      : "bg-[#FAF8F5] text-[#261B24] hover:bg-[#F4EFE7] border border-[#DFD8CD]"
                  }`}
                >
                  + Vlastná položka
                </button>
              </div>
            </div>

            {isCustomFreeform ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-6">
                  <label className="text-[11px] text-[#6B5B65] block mb-1">
                    Názov vlastného výrobku
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="napr. Svadobná poschodová torta / Špeciálny box..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] text-[#6B5B65] block mb-1">
                    Počet (ks)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] text-[#6B5B65] block mb-1">
                    Cena za ks (€)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                    placeholder="napr. 65"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="text-[11px] text-[#6B5B65] block mb-1">
                      Výrobok z ponuky
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSwitch(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] rounded-lg border border-[#DFD8CD] font-medium text-[#261B24]"
                    >
                      {categoryProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.priceFormatted})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] text-[#6B5B65] block mb-1">
                      Množstvo (ks)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] text-[#6B5B65] block mb-1">
                      Cena za ks (€)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={customUnitPrice}
                      onChange={(e) => setCustomUnitPrice(e.target.value)}
                      placeholder={`${resolvedUnitPrice} €`}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                    />
                  </div>
                </div>

                {/* Extra selectors for Dough or Custom Cake */}
                {selectedProduct?.slug === "cesto-na-vianocne-pecenie" && (
                  <div>
                    <label className="text-[11px] text-[#6B5B65] block mb-1">
                      Druh vianočného cesta
                    </label>
                    <select
                      value={selectedDough}
                      onChange={(e) => setSelectedDough(e.target.value)}
                      className="w-full sm:w-72 px-3 py-2 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                    >
                      {DOUGH_VARIANTS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedProduct?.category === "torty-mieru" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {selectedProduct.name === "TORTA podľa vlastného výberu" && (
                      <div>
                        <label className="text-[11px] text-[#6B5B65] block mb-1">
                          Veľkosť torty
                        </label>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                        >
                          {SIZE_OPTIONS.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.total} €)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] text-[#6B5B65] block mb-1">
                        Korpus
                      </label>
                      <select
                        value={selectedKorpus}
                        onChange={(e) => setSelectedKorpus(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                      >
                        {KORPUS_OPTIONS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#6B5B65] block mb-1">
                        Krém
                      </label>
                      <select
                        value={selectedKrem}
                        onChange={(e) => setSelectedKrem(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
                      >
                        {KREM_OPTIONS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Item Note + Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Špecifikácia k položke (napr. bezlepková, ovocie, zápich...)"
                className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
              />
              <button
                type="button"
                onClick={handleAddItemToList}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF1F8] hover:bg-[#a62891] text-[#a62891] hover:text-white border border-[#ECD9E8] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  Pridať do zoznamu ({(resolvedUnitPrice * Math.max(1, quantity)).toFixed(0)} €)
                </span>
              </button>
            </div>

            {/* Added Items List */}
            {items.length > 0 && (
              <div className="pt-3 border-t border-[#EAE5DC] space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block">
                  Položky v tejto zákazke ({items.length})
                </span>
                <div className="space-y-1.5">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#261B24]">
                          {it.quantity}× {it.name}
                        </span>
                        {(it.size || it.korpus || it.krem || it.cakeNote) && (
                          <span className="block text-[11px] text-[#6B5B65]">
                            {[it.size, it.korpus, it.krem, it.cakeNote].filter(Boolean).join(" • ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-[#a62891]">
                          {it.totalPrice.toFixed(2)} €
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-[#7A2E2E]/70 hover:text-[#7A2E2E] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Poznámky a Alergie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                Alergie / Diéty
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="napr. bez laktózy, bez orechov..."
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block mb-1">
                Interná poznámka pre výrobu
              </label>
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="napr. záloha zaplatená 20 €, prinesie vlastný podnos..."
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] rounded-lg border border-[#DFD8CD]"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#6B5B65]">
              Celková suma:{" "}
              <strong className="font-mono text-base text-[#261B24]">
                {(items.length > 0
                  ? totalOrderPrice
                  : resolvedUnitPrice * Math.max(1, quantity)
                ).toFixed(2)}{" "}
                €
              </strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DFD8CD] text-xs font-semibold text-[#6B5B65] hover:text-[#261B24] cursor-pointer"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#a62891] hover:bg-[#8F237D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Ukladám..." : "Uložiť zákazku"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
