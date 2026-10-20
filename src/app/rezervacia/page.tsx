"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Cake,
  Info,
  ShoppingBag,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { OrderTicketReceipt } from "@/components/ui/receipt-pricing";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  PRODUCTS,
  CATEGORIES,
  Product,
  CategoryDefinition,
} from "@/data/products";
import { useCart, CartItem } from "@/context/CartContext";
import {
  subscribeBlockedDates,
  subscribePrices,
  getProductOverrides,
  saveOrder,
  getCakeSizes,
  DEFAULT_CAKE_SIZES,
} from "@/lib/orders-service";
import { sendOrderNotification } from "@/lib/webhook";
import { CakeSizeOverride, ProductPriceDoc } from "@/lib/types";

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

const DOPLNKY_OPTIONS = [
  "Slaný karamel",
  "Malinová redukcia",
  "Mix ovocia redukcia",
  "Mangová redukcia",
  "Čerstvé jahody",
  "Čučoriedky",
  "Marhuľový džem",
  "Malinový džem",
  "Jahodový džem",
  "Višne",
];

const SIZE_OPTIONS = [
  { id: "size-4", name: "4 porcie (mini)", extra: 0, total: 25 },
  { id: "size-10", name: "do 10 porcií (Ø 17 cm)", extra: 35, total: 60 },
  { id: "size-15", name: "10–15 porcií (Ø 21 cm)", extra: 55, total: 80 },
  { id: "size-20", name: "16–20 porcií (Ø 24 cm)", extra: 75, total: 100 },
  { id: "size-30", name: "24–30 porcií (Ø 27 cm)", extra: 95, total: 120 },
];

const DIET_OPTIONS = [
  { id: "bezlepkova", name: "Bezlepková úprava", price: 5 },
  { id: "bezlaktozova", name: "Bezlaktózová úprava", price: 10 },
];

const ZDOBENIE_OPTIONS = [
  { id: "cislo", name: "Personalizovaný zápich s číslom", price: 6 },
  { id: "meno", name: "Personalizovaný zápich s menom", price: 12 },
];

function ReservationContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category") || "mix";
  const initialProductParam = searchParams.get("product");
  const initialQtyParam = searchParams.get("qty");

  // Global Cart
  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice: cartTotalPrice,
    formattedTotalPrice: cartFormattedTotalPrice,
    totalQuantity: cartTotalQuantity,
  } = useCart();

  // Wizard Steps: 1 = Výber & Košík, 2 = Termín, 3 = Kontakt
  const [step, setStep] = useState<number>(1);

  // Active Category & Subcategory in product picker
  const [selectedCategory, setSelectedCategory] = useState<string>("mix");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("Všetky");

  // Currently configuring product (null if only browsing cart)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Active configuration inputs
  const [pieceCount, setPieceCount] = useState<number>(5);
  const [selectedSize, setSelectedSize] = useState<string>("10–15 porcií (Ø 21 cm)");
  const [selectedSizeExtra, setSelectedSizeExtra] = useState<number>(55);
  const [selectedKorpus, setSelectedKorpus] = useState<string>("Mandľový");
  const [selectedKrem, setSelectedKrem] = useState<string>("Mascarpone s bielou čokoládou");
  const [selectedDoplnky, setSelectedDoplnky] = useState<string[]>(["Malinová redukcia"]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedZdobenie, setSelectedZdobenie] = useState<string[]>([]);
  const [cakeNote, setCakeNote] = useState<string>("");

  // Dynamic cake sizes from admin
  const [cakeSizes, setCakeSizes] = useState<CakeSizeOverride[]>(DEFAULT_CAKE_SIZES);

  // Blocked dates from admin
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedReasonMap, setBlockedReasonMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load cake sizes
    const sizes = getCakeSizes();
    if (sizes && sizes.length > 0) {
      setCakeSizes(sizes);
    }

    // Subscribe to blocked dates in real time
    const unsub = subscribeBlockedDates((dates) => {
      setBlockedDates(dates.map((d) => d.date));
      const reasonMap: Record<string, string> = {};
      dates.forEach((d) => {
        reasonMap[d.date] = d.reason;
      });
      setBlockedReasonMap(reasonMap);
    });

    return () => unsub();
  }, []);

  // Feedback banner after adding to cart
  const [justAddedNotification, setJustAddedNotification] = useState<string | null>(null);

  // Step 2 & 3 Fulfillment Details
  const [date, setDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("15:00");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Helper to parse "YYYY-MM-DD" reliably in local timezone
  const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  // Determine selected day of week: 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const selectedDayOfWeek = useMemo(() => {
    const d = parseLocalDate(date);
    return d ? d.getDay() : null;
  }, [date]);

  // Exact time slots:
  // - Bežné dni (Pondelok – Štvrtok): 15:00 a 15:30
  // - Piatok: 16:00 a 16:30
  // - Sobota: 11:00 a 11:30
  // - Nedeľa: zatvorené (nedá sa ani kliknúť)
  const availableTimeOptions = useMemo(() => {
    if (selectedDayOfWeek === 6) {
      // Sobota
      return [
        { label: "11:00", value: "11:00", sublabel: "Sobotný výdaj" },
        { label: "11:30", value: "11:30", sublabel: "Sobotný výdaj" },
      ];
    }
    if (selectedDayOfWeek === 5) {
      // Piatok
      return [
        { label: "16:00", value: "16:00", sublabel: "Piatkový výdaj" },
        { label: "16:30", value: "16:30", sublabel: "Piatkový výdaj" },
      ];
    }
    // Bežné dni (Pondelok – Štvrtok)
    return [
      { label: "15:00", value: "15:00", sublabel: "Poobedný výdaj" },
      { label: "15:30", value: "15:30", sublabel: "Poobedný výdaj" },
    ];
  }, [selectedDayOfWeek]);

  // Automatically adjust selected pickupTime when switching dates
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const d = parseLocalDate(newDate);
    const dow = d ? d.getDay() : null;
    if (dow === 6) {
      setPickupTime("11:00");
    } else if (dow === 5) {
      setPickupTime("16:00");
    } else {
      setPickupTime("15:00");
    }
  };

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [orderCode, setOrderCode] = useState<string>("");

  // Initialize from searchParams
  useEffect(() => {
    if (initialProductParam) {
      const found = PRODUCTS.find(
        (p) => p.slug === initialProductParam || p.id === initialProductParam
      );
      if (found) {
        setSelectedCategory(found.category);
        setSelectedProduct(found);
        setActiveGalleryIndex(0);
        if (found.category === "zakusky") {
          const parsedQty = initialQtyParam ? parseInt(initialQtyParam, 10) : 5;
          setPieceCount(Math.max(5, isNaN(parsedQty) ? 5 : parsedQty));
        }
        return;
      }
    }

    const validCat = CATEGORIES.find(
      (c) =>
        c.id === initialCategoryParam ||
        c.shortTitle.toLowerCase().includes(initialCategoryParam.toLowerCase())
    );
    if (validCat) {
      setSelectedCategory(validCat.id);
      const firstProd = PRODUCTS.find((p) => p.category === validCat.id);
      if (firstProd) {
        setSelectedProduct(firstProd);
        setActiveGalleryIndex(0);
        if (firstProd.category === "zakusky") setPieceCount(5);
      }
    } else {
      const defaultProd = PRODUCTS.find((p) => p.category === "mix");
      if (defaultProd) setSelectedProduct(defaultProd);
    }
  }, [initialCategoryParam, initialProductParam, initialQtyParam]);

  // Handle category switch
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setActiveSubcategory("Všetky");
    const firstInCat = PRODUCTS.find((p) => p.category === catId);
    if (firstInCat) {
      setSelectedProduct(firstInCat);
      setActiveGalleryIndex(0);
      if (firstInCat.category === "zakusky") setPieceCount(5);
    }
  };

  const currentCategoryDef = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  }, [selectedCategory]);

  const categoryProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (p.category !== selectedCategory) return false;
      if (activeSubcategory !== "Všetky" && p.subcategory !== activeSubcategory) return false;
      return true;
    });
  }, [selectedCategory, activeSubcategory]);

  const toggleDoplnok = (item: string) => {
    setSelectedDoplnky((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleDiet = (item: string) => {
    setSelectedDiets((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleZdobenie = (item: string) => {
    setSelectedZdobenie((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  // Price for currently configured single item
  const currentItemPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.category === "zakusky") {
      return selectedProduct.price * pieceCount;
    }
    if (selectedProduct.category === "torty-mieru") {
      let base = selectedProduct.price;
      if (selectedProduct.name === "TORTA podľa vlastného výberu") {
        base = 25.0 + selectedSizeExtra;
      }
      selectedDiets.forEach((d) => {
        const found = DIET_OPTIONS.find((opt) => opt.name === d);
        if (found) base += found.price;
      });
      selectedZdobenie.forEach((z) => {
        const found = ZDOBENIE_OPTIONS.find((opt) => opt.name === z);
        if (found) base += found.price;
      });
      return base;
    }
    return selectedProduct.price;
  }, [selectedProduct, pieceCount, selectedSizeExtra, selectedDiets, selectedZdobenie]);

  const currentItemFormattedPrice = useMemo(() => {
    if (Math.floor(currentItemPrice) === currentItemPrice) {
      return `${Math.round(currentItemPrice)} €`;
    }
    return `${currentItemPrice.toFixed(2).replace(".", ",")} €`;
  }, [currentItemPrice]);

  // Add the currently configured item into the Cart
  const handleAddCurrentToCart = () => {
    if (!selectedProduct) return;

    const itemQuantity = selectedProduct.category === "zakusky" ? pieceCount : 1;
    const unitPrice =
      selectedProduct.category === "zakusky"
        ? selectedProduct.price
        : currentItemPrice;

    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      slug: selectedProduct.slug,
      category: selectedProduct.category,
      image: selectedProduct.image,
      unitPrice,
      quantity: itemQuantity,
      totalPrice: currentItemPrice,
      size: selectedProduct.name === "TORTA podľa vlastného výberu" ? selectedSize : undefined,
      korpus: selectedProduct.category === "torty-mieru" ? selectedKorpus : undefined,
      krem: selectedProduct.category === "torty-mieru" ? selectedKrem : undefined,
      doplnky: selectedDoplnky.length > 0 ? selectedDoplnky : undefined,
      diets: selectedDiets.length > 0 ? selectedDiets : undefined,
      zdobenie: selectedZdobenie.length > 0 ? selectedZdobenie : undefined,
      cakeNote: cakeNote.trim() || undefined,
      servings:
        selectedProduct.category === "zakusky"
          ? `${pieceCount} ks`
          : selectedProduct.servings,
    });

    setJustAddedNotification(`Položka "${selectedProduct.name}" bola úspešne pridaná do košíka!`);
    setTimeout(() => setJustAddedNotification(null), 3500);

    // Smooth scroll to cart summary
    const cartEl = document.getElementById("cart-summary-section");
    if (cartEl) {
      cartEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Handle proceed to Step 2
  const handleProceedToDate = () => {
    // If cart is empty but user has a product selected, add it automatically
    if (cartItems.length === 0 && selectedProduct) {
      handleAddCurrentToCart();
    }
    if (cartItems.length === 0 && !selectedProduct) {
      alert("Najprv, prosím, pridajte do košíka aspoň jeden výrobok.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !date) {
      alert("Prosím, vyplňte povinné polia (dátum, meno, telefón a e-mail).");
      return;
    }
    setIsSubmitting(true);
    try {
      const newOrder = await saveOrder({
        pickupDate: date,
        pickupTime: pickupTime,
        customer: {
          name,
          phone,
          email,
          allergies,
          notes,
        },
        items: cartItems,
        totalPrice: cartTotalPrice,
      });

      // Odoslanie e-mailov zákazníkovi a majiteľke cez Resend API route
      try {
        await fetch("/api/send-email/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder }),
        });
      } catch (emailErr) {
        console.warn("[Rezervácia] /api/send-email call failed, fallback:", emailErr);
        await sendOrderNotification(newOrder);
      }

      setOrderCode(newOrder.orderNumber);
      setIsSubmitted(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Chyba pri odosielaní objednávky:", err);
      alert("Nastala chyba pri odosielaní objednávky. Skúste to prosím znova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentImages = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.images && selectedProduct.images.length > 0
      ? selectedProduct.images
      : [selectedProduct.image];
  }, [selectedProduct]);

  // Ledger items for the live thermal receipt
  const receiptItems = useMemo(() => {
    if (cartItems.length > 0) {
      const itemsList: Array<{ label: string; value: string }> = [];

      cartItems.forEach((ci) => {
        // Clean short label
        const shortName = ci.name.replace(/–.*$/, "").trim();
        itemsList.push({
          label: `${ci.quantity}x ${shortName}`,
          value: `${ci.totalPrice.toFixed(0)} €`,
        });
      });

      itemsList.push(
        { label: "Termín odberu", value: date || "Neurčený" },
        { label: "Čas prevzatia", value: pickupTime },
        { label: "Odberné miesto", value: "Viničné" }
      );

      if (name) itemsList.push({ label: "Meno", value: name });
      if (phone) itemsList.push({ label: "Kontakt", value: phone });

      return itemsList;
    }

    // Fallback: Currently configured single item preview
    return [
      { label: "Výrobok", value: selectedProduct?.name || "Podľa výberu" },
      { label: "Kategória", value: currentCategoryDef.shortTitle },
      {
        label: "Množstvo",
        value:
          selectedProduct?.category === "zakusky"
            ? `${pieceCount} ks`
            : selectedProduct?.name === "TORTA podľa vlastného výberu"
            ? selectedSize
            : selectedProduct?.servings || "1 ks",
      },
      ...(selectedProduct?.category === "torty-mieru" && selectedKorpus
        ? [{ label: "Korpus", value: selectedKorpus }]
        : []),
      ...(selectedProduct?.category === "torty-mieru" && selectedKrem
        ? [{ label: "Krém", value: selectedKrem }]
        : []),
      { label: "Termín odberu", value: date || "Neurčený" },
      { label: "Časové okno", value: pickupTime },
      { label: "Výdajné miesto", value: "Hlavná 102/179, Viničné" },
    ];
  }, [
    cartItems,
    selectedProduct,
    currentCategoryDef,
    pieceCount,
    selectedSize,
    selectedKorpus,
    selectedKrem,
    date,
    pickupTime,
    name,
    phone,
  ]);

  const receiptTitle = useMemo(() => {
    if (cartItems.length > 1) {
      return `KOŠÍK (${cartItems.length} POLOŽIEK)`;
    }
    if (cartItems.length === 1) {
      return cartItems[0].name;
    }
    return selectedProduct?.name || "Zákazkový výrobok";
  }, [cartItems, selectedProduct]);

  const receiptPriceNote = useMemo(() => {
    if (cartItems.length > 0) {
      return cartFormattedTotalPrice;
    }
    return currentItemFormattedPrice;
  }, [cartItems, cartFormattedTotalPrice, currentItemFormattedPrice]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#261B24] flex flex-col font-sans selection:bg-[#a62891]/25">
      {/* Top Header */}
      <header className="border-b border-[#EAE5DC] bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#261B24]/60 hover:text-[#261B24] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Návrat na hlavnú stránku</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight uppercase text-base sm:text-lg"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#DFD8CD] shrink-0">
              <Image src="/images/logo.png" alt="Hanela" fill sizes="32px" className="object-cover" />
            </div>
            <span>HANELA</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/ponuka"
              className="text-xs uppercase tracking-wider font-semibold text-[#a62891] hover:underline hidden sm:inline"
            >
              Celá ponuka (41)
            </Link>
            <a
              href="tel:+421910960913"
              className="text-xs sm:text-sm font-mono text-[#261B24]/80 hover:text-[#261B24] hidden sm:inline"
            >
              +421 910 960 913
            </a>
          </div>
        </div>
      </header>

      {/* Main Reservation Container */}
      <main className="grow max-w-6xl mx-auto w-full px-6 sm:px-10 py-10 sm:py-14">
        {/* Step Indicator Header */}
        {!isSubmitted && (
          <nav aria-label="Kroky rezervácie" className="flex flex-wrap items-center gap-4 sm:gap-8 mb-10 sm:mb-12 border-b border-[#EAE5DC]/80 pb-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-left group transition-opacity cursor-pointer"
            >
              <span
                className={`transition-colors ${
                  step === 1
                    ? "font-serif text-lg sm:text-2xl text-[#261B24] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#261B24]/40 font-light tracking-wide hover:text-[#261B24]"
                }`}
              >
                01 Výber & Košík ({cartItems.length})
              </span>
            </button>

            <span className="text-[#261B24]/20 font-light select-none">/</span>

            <button
              type="button"
              onClick={() => {
                if (cartItems.length > 0 || selectedProduct) setStep(2);
              }}
              className="text-left group transition-opacity cursor-pointer"
            >
              <span
                className={`transition-colors ${
                  step === 2
                    ? "font-serif text-lg sm:text-2xl text-[#261B24] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#261B24]/40 font-light tracking-wide hover:text-[#261B24]"
                }`}
              >
                02 Termín a výdaj
              </span>
            </button>

            <span className="text-[#261B24]/20 font-light select-none">/</span>

            <button
              type="button"
              onClick={() => {
                if ((cartItems.length > 0 || selectedProduct) && date) setStep(3);
              }}
              className="text-left group transition-opacity cursor-pointer"
            >
              <span
                className={`transition-colors ${
                  step === 3
                    ? "font-serif text-lg sm:text-2xl text-[#261B24] font-normal"
                    : "font-sans text-xs sm:text-sm text-[#261B24]/40 font-light tracking-wide hover:text-[#261B24]"
                }`}
              >
                03 Detaily & Kontakt
              </span>
            </button>
          </nav>
        )}

        {/* NOTIFICATION TOAST: WHEN ITEM ADDED TO CART */}
        {justAddedNotification && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#261B24] text-white shadow-2xl flex items-center gap-3 animate-fadeIn border border-white/10 max-w-md">
            <div className="w-8 h-8 rounded-full bg-[#a62891] text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <strong className="block text-white font-medium">Pridané do košíka!</strong>
              <span className="text-white/80">{justAddedNotification}</span>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION STATE */}
        {isSubmitted ? (
          <div className="py-8 sm:py-12 animate-fadeIn">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-[#fcf4fb] border border-[#d9a5cf] text-[#a62891] flex items-center justify-center mx-auto mb-6 shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#261B24] font-normal tracking-tight">
                Ďakujeme za vašu rezerváciu
              </h1>
              <p className="mt-4 text-sm sm:text-base text-[#261B24]/75 leading-relaxed font-sans max-w-lg mx-auto">
                Vašu kompletnú objednávku sme prijali. Do 24 hodín vás budeme telefonicky alebo e-mailom kontaktovať s potvrdením kapacity výrobne a inštrukciami k osobnému odberu.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/"
                  className="rounded-full bg-[#261B24] hover:bg-[#a62891] text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Návrat na domovskú stránku
                </Link>
                <Link
                  href="/ponuka"
                  className="rounded-full border border-[#DFD8CD] bg-white hover:bg-[#F4EFE7] text-[#261B24] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Prezrieť celú ponuku
                </Link>
              </div>
            </div>

            {/* Final receipt representation */}
            <div className="max-w-md mx-auto">
              <OrderTicketReceipt
                orderCode={orderCode}
                merchant="HANELA · CUKRÁREŇ"
                merchantNote="VINIČNÉ & SLOVENSKÝ GROB"
                title="POTVRDENÁ OBJEDNÁVKA"
                badge="ZÁVÄZNÝ DOPYT"
                items={receiptItems}
                priceNote={receiptPriceNote}
                pickupLocation="Výrobňa Hlavná 102/179, Viničné"
                notice="Objednávka v procese schvaľovania"
              />
            </div>
          </div>
        ) : (
          /* Two-column Layout: Form (Left) & Live Thermal Receipt (Right) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Content Area */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit}>
                {/* STEP 1: CATEGORY & PRODUCT & OPTIONS CONFIGURATION & CART */}
                {step === 1 && (
                  <div className="space-y-10 animate-fadeIn">
                    {/* Header */}
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#261B24] font-normal tracking-tight">
                        Vyberte si výrobky do objednávky
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#261B24]/70 font-sans tracking-wide">
                        Môžete si nakombinovať viacero druhov koláčikov, mixov aj tortu. Pridajte ich do košíka a pokračujte na výber termínu.
                      </p>
                    </div>

                    {/* SECTION 1: SHOPPING CART OVERVIEW (If items in cart) */}
                    {cartItems.length > 0 && (
                      <div
                        id="cart-summary-section"
                        className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-[#a62891]/40 shadow-sm space-y-5 animate-fadeIn"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#fcf4fb] text-[#a62891] flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-[#261B24]">
                              Váš nákupný košík ({cartItems.length} {cartItems.length === 1 ? "položka" : "položky"})
                            </h2>
                          </div>

                          <span className="font-mono font-bold text-lg text-[#a62891]">
                            Spolu: {cartFormattedTotalPrice}
                          </span>
                        </div>

                        {/* Cart items list */}
                        <div className="divide-y divide-[#EAE5DC]">
                          {cartItems.map((item) => (
                            <div
                              key={item.id}
                              className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#DFD8CD] shrink-0">
                                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-sm font-bold text-[#261B24] leading-tight">
                                    {item.name}
                                  </h4>
                                  {/* Custom specs */}
                                  {(item.korpus || item.krem || item.size || item.doplnky) && (
                                    <p className="text-[11px] text-[#261B24]/70 line-clamp-1">
                                      {[item.size, item.korpus && `Korpus: ${item.korpus}`, item.krem && `Krém: ${item.krem}`]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  )}
                                  <span className="text-xs font-mono text-[#a62891] font-semibold">
                                    {item.totalPrice.toFixed(0)} €
                                    {item.category === "zakusky" && (
                                      <span className="text-[10px] text-[#261B24]/50 ml-1">
                                        ({item.unitPrice.toFixed(2).replace(".", ",")} € / ks)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Quantity Stepper & Remove */}
                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <div className="flex items-center bg-[#FAF8F5] rounded-xl border border-[#DFD8CD] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        item.category === "zakusky"
                                          ? item.quantity - 1
                                          : item.quantity - 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center font-bold text-sm text-[#261B24] hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-xs font-bold w-9 text-center">
                                    {item.quantity} {item.category === "zakusky" ? "ks" : "ks"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center font-bold text-sm text-[#261B24] hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="w-8 h-8 rounded-xl border border-[#DFD8CD] hover:border-red-300 hover:text-red-600 text-[#261B24]/60 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Odstrániť z košíka"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cart Quick Navigation CTA Buttons */}
                        <div className="pt-4 border-t border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const pickerEl = document.getElementById("catalog-picker-section");
                              if (pickerEl) pickerEl.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#261B24] bg-white text-[#261B24] hover:bg-[#F4EFE7] px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pridať ďalší výrobok</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleProceedToDate}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer"
                          >
                            <span>Pokračovať na termín odberu</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: PRODUCT CATALOG PICKER */}
                    <div id="catalog-picker-section" className="space-y-6 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#261B24]/70">
                          Vyberte položku z ponuky
                        </span>
                        {cartItems.length > 0 && (
                          <span className="text-xs text-[#a62891] font-semibold">
                            Košík obsahuje {cartTotalQuantity} ks ({cartFormattedTotalPrice})
                          </span>
                        )}
                      </div>

                      {/* Category Tab Switcher */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[#F4EFE7] border border-[#DFD8CD]">
                        {CATEGORIES.map((cat) => {
                          const isCatSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategoryChange(cat.id)}
                              className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                                isCatSelected
                                  ? "bg-white text-[#261B24] shadow-sm font-semibold border border-[#DFD8CD]"
                                  : "text-[#261B24]/70 hover:text-[#261B24] hover:bg-white/50 text-xs"
                              }`}
                            >
                              <span className="block text-xs sm:text-[13px] leading-tight">
                                {cat.shortTitle}
                              </span>
                              <span className="text-[10px] text-[#a62891] mt-0.5 block font-medium">
                                {cat.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Subcategories Filter Pills */}
                      {currentCategoryDef.subcategories.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#261B24]/50 mr-1">
                            Filter:
                          </span>
                          {currentCategoryDef.subcategories.map((sub) => {
                            const isSubActive = activeSubcategory === sub;
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => setActiveSubcategory(sub)}
                                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                                  isSubActive
                                    ? "bg-[#a62891] text-white shadow-xs"
                                    : "bg-white border border-[#DFD8CD] text-[#261B24]/70 hover:bg-[#F4EFE7]"
                                }`}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Products Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {categoryProducts.map((prod) => {
                          const isSelected = selectedProduct?.id === prod.id;
                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setSelectedProduct(prod);
                                setActiveGalleryIndex(0);
                                if (prod.category === "zakusky") setPieceCount(5);
                              }}
                              className={`p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer flex gap-4 items-center ${
                                isSelected
                                  ? "bg-white border-2 border-[#a62891] ring-2 ring-[#a62891]/20 shadow-md -translate-y-0.5"
                                  : "bg-white border border-[#DFD8CD] hover:border-[#a62891]/50 hover:shadow-xs"
                              }`}
                            >
                              {/* Product Thumbnail */}
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#EAE5DC] shrink-0">
                                <Image
                                  src={prod.image}
                                  alt={prod.name}
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#a62891] text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a62891] truncate">
                                    {prod.subcategory}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-[#261B24] font-mono shrink-0">
                                    {prod.priceFormatted}
                                  </span>
                                </div>

                                <h3 className="text-sm sm:text-base font-semibold text-[#261B24] leading-tight line-clamp-2">
                                  {prod.name}
                                </h3>

                                {prod.servings && (
                                  <p className="text-[11px] text-[#261B24]/60 mt-0.5">
                                    {prod.servings}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 3: CONFIGURATION CARD FOR SELECTED PRODUCT */}
                    {selectedProduct && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DFD8CD] shadow-sm space-y-8 animate-fadeIn">
                        {/* Title & Gallery */}
                        <div className="border-b border-[#EAE5DC] pb-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div className="space-y-1">
                              <span className="text-[11px] uppercase tracking-wider font-bold text-[#a62891]">
                                Nastavenie vybraného výrobku
                              </span>
                              <h2 className="text-2xl sm:text-3xl font-serif text-[#261B24]">
                                {selectedProduct.name}
                              </h2>
                              <p className="text-xs sm:text-sm text-[#261B24]/70 pt-1 leading-relaxed">
                                {selectedProduct.description}
                              </p>
                            </div>

                            {/* Gallery Preview with Thumbnails */}
                            <div className="shrink-0 flex flex-col items-center">
                              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#DFD8CD] shadow-xs">
                                <Image
                                  src={currentImages[activeGalleryIndex] || currentImages[0]}
                                  alt={selectedProduct.name}
                                  fill
                                  sizes="144px"
                                  className="object-cover"
                                />
                              </div>

                              {currentImages.length > 1 && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  {currentImages.map((img, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setActiveGalleryIndex(idx)}
                                      className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                        activeGalleryIndex === idx
                                          ? "border-[#a62891] ring-1 ring-[#a62891]/30"
                                          : "border-transparent opacity-60 hover:opacity-100"
                                      }`}
                                    >
                                      <Image src={img} alt="" fill sizes="32px" className="object-cover" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ZÁKUSKY QUANTITY (Min. 5 ks) */}
                        {selectedProduct.category === "zakusky" && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[#FCF8F5] border border-[#ECD9E8] flex items-start gap-3 text-xs sm:text-sm text-[#261B24]/85 leading-relaxed">
                              <Info className="w-5 h-5 text-[#a62891] shrink-0 mt-0.5" />
                              <p>
                                Aby Vám chutilo a koláčiky boli vždy čerstvé, minimálne množstvo na objednávku je{" "}
                                <strong className="text-[#a62891] font-semibold">5 kusov z jedného druhu</strong>.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC]">
                              <div>
                                <span className="text-sm font-semibold text-[#261B24] uppercase tracking-wider block">
                                  Požadované množstvo
                                </span>
                                <span className="text-xs text-[#261B24]/60">
                                  Cena za kus: <strong>{selectedProduct.priceFormatted}</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center bg-white rounded-xl border border-[#DFD8CD] p-1 shadow-2xs">
                                  <button
                                    type="button"
                                    disabled={pieceCount <= 5}
                                    onClick={() => setPieceCount((prev) => Math.max(5, prev - 1))}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg text-[#261B24] hover:bg-[#F4EFE7] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-bold text-lg w-12 text-center text-[#261B24]">
                                    {pieceCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setPieceCount((prev) => prev + 1)}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg text-[#261B24] hover:bg-[#F4EFE7] cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] uppercase tracking-wider text-[#261B24]/50 block">Položka</span>
                                  <span className="font-mono font-bold text-xl text-[#a62891]">
                                    {currentItemFormattedPrice}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CUSTOM CAKE OPTIONS */}
                        {selectedProduct.category === "torty-mieru" && (
                          <div className="space-y-7">
                            {/* Size selection */}
                            {selectedProduct.name === "TORTA podľa vlastného výberu" && (
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24] mb-3">
                                  Veľkosť torty & Počet porcií *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {cakeSizes.map((opt) => {
                                    const isSizeActive = selectedSize === opt.name;
                                    return (
                                      <div
                                        key={opt.id}
                                        onClick={() => {
                                          setSelectedSize(opt.name);
                                          setSelectedSizeExtra(opt.extra);
                                        }}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                          isSizeActive
                                            ? "border-[#a62891] bg-[#fcf4fb] ring-2 ring-[#a62891]/20 font-semibold"
                                            : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5]"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-xs sm:text-sm text-[#261B24]">{opt.name}</p>
                                          <span className="text-[11px] text-[#a62891] font-mono">
                                            {opt.total} €
                                          </span>
                                        </div>
                                        <div
                                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                            isSizeActive
                                              ? "border-[#a62891] bg-[#a62891] text-white"
                                              : "border-[#DFD8CD] bg-white"
                                          }`}
                                        >
                                          {isSizeActive && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Korpus options */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24]">
                                  Korpus (cesto) *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setSelectedKorpus("")}
                                  className="text-[11px] text-[#261B24]/50 hover:text-[#a62891] underline cursor-pointer"
                                >
                                  Zrušiť výber
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {KORPUS_OPTIONS.map((korp) => {
                                  const isKorpActive = selectedKorpus === korp;
                                  return (
                                    <button
                                      key={korp}
                                      type="button"
                                      onClick={() => setSelectedKorpus(korp)}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        isKorpActive
                                          ? "border-[#a62891] bg-[#fcf4fb] text-[#261B24] font-semibold ring-1 ring-[#a62891]/20"
                                          : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5] text-[#261B24]/80 text-xs"
                                      }`}
                                    >
                                      <span className="text-xs truncate">{korp}</span>
                                      <div
                                        className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                                          isKorpActive
                                            ? "border-[#a62891] bg-[#a62891]"
                                            : "border-[#DFD8CD] bg-white"
                                        }`}
                                      >
                                        {isKorpActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Krém options */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24]">
                                  Krém (lahodná plnka) *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setSelectedKrem("")}
                                  className="text-[11px] text-[#261B24]/50 hover:text-[#a62891] underline cursor-pointer"
                                >
                                  Zrušiť výber
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {KREM_OPTIONS.map((krm) => {
                                  const isKremActive = selectedKrem === krm;
                                  return (
                                    <button
                                      key={krm}
                                      type="button"
                                      onClick={() => setSelectedKrem(krm)}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        isKremActive
                                          ? "border-[#a62891] bg-[#fcf4fb] text-[#261B24] font-semibold ring-1 ring-[#a62891]/20"
                                          : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5] text-[#261B24]/80 text-xs"
                                      }`}
                                    >
                                      <span className="text-xs truncate">{krm}</span>
                                      <div
                                        className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                                          isKremActive
                                            ? "border-[#a62891] bg-[#a62891]"
                                            : "border-[#DFD8CD] bg-white"
                                        }`}
                                      >
                                        {isKremActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Doplnky */}
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24] mb-3">
                                Doplnky & Ovocné redukcie (voliteľné)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {DOPLNKY_OPTIONS.map((dop) => {
                                  const isDopActive = selectedDoplnky.includes(dop);
                                  return (
                                    <button
                                      key={dop}
                                      type="button"
                                      onClick={() => toggleDoplnok(dop)}
                                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                                        isDopActive
                                          ? "border-[#a62891] bg-[#261B24] text-white shadow-xs"
                                          : "border-[#DFD8CD] bg-white text-[#261B24]/75 hover:bg-[#FAF8F5]"
                                      }`}
                                    >
                                      <span>{dop}</span>
                                      {isDopActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Diéty */}
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24] mb-3">
                                Špeciálna diéta / intolerancia
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {DIET_OPTIONS.map((diet) => {
                                  const isDietActive = selectedDiets.includes(diet.name);
                                  return (
                                    <div
                                      key={diet.id}
                                      onClick={() => toggleDiet(diet.name)}
                                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        isDietActive
                                          ? "border-[#a62891] bg-[#fcf4fb] text-[#261B24] ring-1 ring-[#a62891]/20 font-semibold"
                                          : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5] text-[#261B24]/80 text-xs"
                                      }`}
                                    >
                                      <div>
                                        <p className="text-xs sm:text-sm">{diet.name}</p>
                                        <span className="text-[11px] text-[#a62891] font-mono">+{diet.price} €</span>
                                      </div>
                                      <div
                                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                          isDietActive
                                            ? "border-[#a62891] bg-[#a62891] text-white"
                                            : "border-[#DFD8CD] bg-white"
                                        }`}
                                      >
                                        {isDietActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Zdobenie */}
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24] mb-3">
                                Personalizované zdobenie & Zápichy
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ZDOBENIE_OPTIONS.map((zdob) => {
                                  const isZdobActive = selectedZdobenie.includes(zdob.name);
                                  return (
                                    <div
                                      key={zdob.id}
                                      onClick={() => toggleZdobenie(zdob.name)}
                                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        isZdobActive
                                          ? "border-[#a62891] bg-[#fcf4fb] text-[#261B24] ring-1 ring-[#a62891]/20 font-semibold"
                                          : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5] text-[#261B24]/80 text-xs"
                                      }`}
                                    >
                                      <div>
                                        <p className="text-xs sm:text-sm">{zdob.name}</p>
                                        <span className="text-[11px] text-[#a62891] font-mono">+{zdob.price} €</span>
                                      </div>
                                      <div
                                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                          isZdobActive
                                            ? "border-[#a62891] bg-[#a62891] text-white"
                                            : "border-[#DFD8CD] bg-white"
                                        }`}
                                      >
                                        {isZdobActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Nápis */}
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#261B24] mb-2">
                                Nápis na torte & Špecifikácia zápichu (meno, vek, farba)
                              </label>
                              <input
                                type="text"
                                placeholder="Napr. Všetko najlepšie Nina (30), zlatý zápich s číslom..."
                                value={cakeNote}
                                onChange={(e) => setCakeNote(e.target.value)}
                                className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-xs sm:text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-2xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* CONFIGURATOR BOTTOM ACTIONS */}
                        <div className="pt-6 border-t border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#261B24]/50 block font-semibold">
                              Cena tejto položky
                            </span>
                            <span className="font-mono font-bold text-2xl text-[#261B24]">
                              {currentItemFormattedPrice}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={handleAddCurrentToCart}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a62891] bg-[#fcf4fb] text-[#a62891] hover:bg-[#a62891] hover:text-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>Pridať do košíka ({currentItemFormattedPrice})</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleProceedToDate}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#261B24] hover:bg-[#a62891] text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <span>Pokračovať na termín odberu</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 2 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#261B24] font-normal tracking-tight">
                        Termín a vyzdvihnutie
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#261B24]/60 font-sans tracking-wide">
                        Výdajné miesto sa nachádza vo Viničnom (Hlavná 102/179).
                      </p>
                    </div>

                    {/* Order summary reminder bar */}
                    {cartItems.length > 0 && (
                      <div className="p-4 rounded-2xl bg-white border border-[#DFD8CD] flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#fcf4fb] text-[#a62891] flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-[#a62891] block">
                              Položky v objednávke ({cartItems.length})
                            </span>
                            <p className="text-sm font-semibold text-[#261B24] line-clamp-1">
                              {cartItems.map((ci) => `${ci.quantity}x ${ci.name}`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-base text-[#261B24] shrink-0">
                          {cartFormattedTotalPrice}
                        </span>
                      </div>
                    )}

                    {/* Fulfillment Guidelines */}
                    <div className="p-4 rounded-2xl bg-[#F4EFE7] text-xs text-[#261B24]/80 leading-relaxed border border-[#DFD8CD]">
                      <strong className="font-semibold text-[#261B24]">
                        Otváracie hodiny výdajne Viničné:
                      </strong>
                      <p className="mt-1">
                        Pondelok – Štvrtok: 15:00 a 15:30 | Piatok: 16:00 a 16:30 | Sobota: 11:00 a 11:30 | Nedeľa: Zatvorené
                      </p>
                    </div>

                    {/* Interactive Calendar & Time Picker Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                      
                      {/* Left: Custom Luxury Calendar */}
                      <div className="lg:col-span-7 space-y-2">
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-1">
                          Vyberte dátum odberu *
                        </label>
                        <CustomCalendar
                          selectedDate={date}
                          onSelectDate={handleDateChange}
                          blockedDates={blockedDates}
                          blockedReasonMap={blockedReasonMap}
                        />
                        <span className="text-[11px] text-[#261B24]/60 mt-1 block">
                          {date && parseLocalDate(date) ? (
                            <span className="text-[#a62891] font-semibold">
                              Zvolený termín: {parseLocalDate(date)!.toLocaleDateString("sk-SK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                          ) : (
                            "Kliknite na požadovaný deň v kalendári vyššie (v nedeľu je zatvorené)."
                          )}
                        </span>
                      </div>

                      {/* Right: Time Window Selector & Summary Card */}
                      <div className="lg:col-span-5 space-y-4">
                        <div>
                          <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-2">
                            Čas vyzdvihnutia *
                          </label>

                          {/* Quick clickable time slot cards */}
                          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                            {availableTimeOptions.map((opt) => {
                              const isSelected = pickupTime === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setPickupTime(opt.value)}
                                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-[#a62891] bg-[#fcf4fb] text-[#261B24] font-bold shadow-xs ring-2 ring-[#a62891]/25"
                                      : "border-[#DFD8CD] bg-white text-[#261B24]/80 hover:bg-[#FAF8F5] hover:border-[#261B24]/30"
                                  }`}
                                >
                                  <div className="text-base font-semibold">{opt.value}</div>
                                  <div className="text-[10px] text-[#261B24]/60 mt-0.5">{opt.sublabel}</div>
                                </button>
                              );
                            })}
                          </div>

                          <span className="text-[11px] text-[#261B24]/55 block">
                            {selectedDayOfWeek === 6
                              ? "V sobotu vydávame v časoch 11:00 a 11:30."
                              : selectedDayOfWeek === 5
                              ? "V piatok vydávame v časoch 16:00 a 16:30."
                              : "V bežné dni (po–štv) vydávame v časoch 15:00 a 15:30."}
                          </span>
                        </div>

                        {/* Selected summary note */}
                        <div className="p-4 rounded-xl bg-white border border-[#DFD8CD] space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[#261B24]/70">
                            <span>Miesto výdaja:</span>
                            <strong className="text-[#261B24]">Hlavná 102/179, Viničné</strong>
                          </div>
                          <div className="flex items-center justify-between text-[#261B24]/70">
                            <span>Čas odberu:</span>
                            <strong className="text-[#a62891]">{pickupTime}</strong>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="pt-6 border-t border-[#EAE5DC] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-[#261B24]/60 hover:text-[#261B24] underline underline-offset-4 cursor-pointer"
                      >
                        Späť na úpravu košíka
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!date) {
                            alert("Zvoľte prosím dátum odberu.");
                            return;
                          }
                          setStep(3);
                          window.scrollTo({ top: 180, behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[#261B24] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a62891] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                      >
                        <span>Pokračovať na kontaktné údaje</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DETAILS & CUSTOMER CONTACT */}
                {step === 3 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl text-[#261B24] font-normal tracking-tight">
                        Detaily a kontaktné údaje
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-[#261B24]/60 font-sans tracking-wide">
                        Vyplňte dodatočné požiadavky na tortu a vaše kontaktné údaje.
                      </p>
                    </div>

                    {/* Inscription & Allergies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-2">
                          Alergie & potravinové intolerancie
                        </label>
                        <input
                          type="text"
                          placeholder="napr. bez orechov, intolerancia na laktózu..."
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-2">
                          Poznámka pre cukrárku
                        </label>
                        <input
                          type="text"
                          placeholder="Špeciálne požiadavky, štýl svadby, farba kvetov..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Customer contact fields */}
                    <div className="space-y-4 pt-4 border-t border-[#EAE5DC]">
                      <h3 className="text-base font-semibold text-[#261B24]">
                        Kontaktné údaje pre potvrdenie
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-1.5">
                            Meno a priezvisko *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Mária Nováková"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-1.5">
                            Telefónne číslo *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+421 900 000 000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium uppercase tracking-widest text-[#261B24]/70 mb-1.5">
                          E-mailová adresa *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="maria@priklad.sk"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white rounded-xl border border-[#DFD8CD] px-4 py-3 text-sm text-[#261B24] focus:border-[#a62891] focus:outline-none focus:ring-1 focus:ring-[#a62891] shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#EAE5DC] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs font-semibold text-[#261B24]/60 hover:text-[#261B24] underline underline-offset-4 cursor-pointer"
                      >
                        Späť na termín
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-full bg-[#a62891] hover:bg-[#8e207b] text-white px-9 py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        <span>{isSubmitting ? "Odosielam..." : "Odoslať nezáväznú rezerváciu"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: Live Slovak Thermal Receipt ("Bloček") */}
            <div className="lg:col-span-4 sticky top-28">
              <OrderTicketReceipt
                orderCode="HN-DOPYT"
                merchant="HANELA · CUKRÁREŇ"
                merchantNote="VINIČNÉ & SLOVENSKÝ GROB"
                title={receiptTitle}
                badge={cartItems.length > 0 ? `KOŠÍK (${cartItems.length})` : currentCategoryDef.badge}
                items={receiptItems}
                priceNote={receiptPriceNote}
                pickupLocation="Výrobňa Hlavná 102/179, Viničné"
                notice="Nezáväzný dopyt · Potvrdenie do 24h"
              />

              <div className="mt-5 text-center">
                <span className="text-[11px] text-[#261B24]/50 font-sans">
                  Bez platby vopred · Osobný odber Viničné
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-[#261B24]/60">
          Načítavam rezervačný systém...
        </div>
      }
    >
      <ReservationContent />
    </Suspense>
  );
}
