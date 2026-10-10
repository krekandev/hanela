import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  Order,
  OrderStatus,
  BlockedDate,
  ProductPriceDoc,
  ProductPriceOverride,
  CakeSizeOverride,
  CustomerDetails,
} from "./types";
import { CartItem } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";

// Local storage keys for fallback & offline persistence
const STORAGE_KEY_ORDERS = "hanela_admin_orders_v1";
const STORAGE_KEY_BLOCKED_DATES = "hanela_admin_blocked_dates_v1";
const STORAGE_KEY_PRICES = "hanela_admin_prices_v1";
const STORAGE_KEY_PRODUCT_OVERRIDES = "hanela_admin_product_overrides_v1";
const STORAGE_KEY_CAKE_SIZES = "hanela_admin_cake_sizes_v1";
const STORAGE_KEY_SETTINGS = "hanela_admin_settings_v1";

// Helper: generate dates relative to today
const getRelativeDateStr = (dayOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Default cake sizes
export const DEFAULT_CAKE_SIZES: CakeSizeOverride[] = [
  { id: "size-10", name: "do 10 porcií (Ø 17 cm)", extra: 35, total: 60 },
  { id: "size-15", name: "10–15 porcií (Ø 21 cm)", extra: 55, total: 80 },
  { id: "size-20", name: "16–20 porcií (Ø 24 cm)", extra: 75, total: 100 },
  { id: "size-30", name: "24–30 porcií (Ø 27 cm)", extra: 95, total: 120 },
];

// Seed sample orders for instant interactive testing
export const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "ord-101",
    orderNumber: "HAN-2026-001",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    pickupDate: getRelativeDateStr(0),
    pickupTime: "15:00",
    status: "pripravena",
    totalPrice: 115,
    customer: {
      name: "Zuzana Kováčová",
      phone: "+421 905 123 456",
      email: "zuzana.kovacova@gmail.com",
      allergies: "Bez orechov",
      notes: "Prosím pridať zlaté sviečky a číslo 30.",
    },
    items: [
      {
        id: "demo-item-1",
        productId: "ovocna-sviezost",
        slug: "ovocna-sviezost",
        name: "Ovocná sviežosť",
        category: "torty-mieru",
        unitPrice: 80,
        totalPrice: 80,
        quantity: 1,
        image: "/images/products/ovocna-sviezost.webp",
        size: "10–15 porcií (Ø 21 cm)",
        korpus: "Mandľový korpus",
        krem: "Mascarpone s bielou čokoládou",
        doplnky: ["Malinová redukcia", "Čerstvé lesné ovocie"],
        diets: ["Bezlepková úprava"],
        zdobenie: ["Personalizovaný zápich s číslom (+6 €)"],
        cakeNote: "Jemné pastelové kvety po obvode",
      },
      {
        id: "demo-item-2",
        productId: "vikendovy-mix-velky",
        slug: "vikendovy-mix-velky",
        name: "Víkendový degustačný box (16 ks)",
        category: "mix",
        unitPrice: 35,
        totalPrice: 35,
        quantity: 1,
        image: "/images/products/vikendovy-mix-velky.webp",
        servings: "16 ks",
      },
    ],
    internalNote: "Tortu chladiť na 4 °C, ovocie položené dnes ráno.",
  },
  {
    id: "ord-102",
    orderNumber: "HAN-2026-002",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    pickupDate: getRelativeDateStr(1),
    pickupTime: "16:00",
    status: "vyroba",
    totalPrice: 100,
    customer: {
      name: "Martin Hruška",
      phone: "+421 911 889 220",
      email: "martin.hruska@azet.sk",
      allergies: "Žiadne",
      notes: "Vyzdvihne manželka Petra.",
    },
    items: [
      {
        id: "demo-item-3",
        productId: "cokoladovy-sen",
        slug: "cokoladovy-sen",
        name: "Čokoládový sen",
        category: "torty-mieru",
        unitPrice: 100,
        totalPrice: 100,
        quantity: 1,
        image: "/images/products/cokoladovy-sen.webp",
        size: "16–20 porcií (Ø 24 cm)",
        korpus: "Čokoládový korpus",
        krem: "Parížsky krém z belgickej čokolády",
        doplnky: ["Chrumkavá vrstva z lieskovcov"],
        zdobenie: ["Personalizovaný zápich s menom (+12 €)"],
        cakeNote: "Nápis 'Všetko najlepšie Miško'",
      },
    ],
  },
  {
    id: "ord-103",
    orderNumber: "HAN-2026-003",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    pickupDate: getRelativeDateStr(2),
    pickupTime: "11:00",
    status: "nova",
    totalPrice: 42,
    customer: {
      name: "Lucia Novotná",
      phone: "+421 908 445 112",
      email: "lucia.novotna@centrum.sk",
      notes: "Platba hotovosťou pri prevzatí.",
    },
    items: [
      {
        id: "demo-item-4",
        productId: "malinovy-cheesecake",
        slug: "malinovy-cheesecake",
        name: "Malinový pečený cheesecake",
        category: "torty-cheesecakes",
        unitPrice: 42,
        totalPrice: 42,
        quantity: 1,
        image: "/images/products/malinovy-cheesecake.webp",
        size: "Celá torta (12 rezov)",
      },
    ],
  },
];

export const INITIAL_DEMO_BLOCKED_DATES: BlockedDate[] = [
  {
    date: getRelativeDateStr(4),
    reason: "Plná kapacita výroby",
    createdAt: new Date().toISOString(),
  },
];

// In-memory store fallback for SSR, server routes, and test runtimes
const memoryStore = new Map<string, string>();

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    }
  } catch {
    // fallback to in-memory store
  }

  const mem = memoryStore.get(key);
  if (mem) {
    try {
      return JSON.parse(mem);
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryStore.set(key, serialized);

  if (typeof window !== "undefined") {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
    try {
      window.dispatchEvent(new Event("hanela-storage-update"));
    } catch (err) {
      console.error("Failed to dispatch storage update event:", err);
    }
  }
}

/* -------------------------------------------------------------
 * ORDERS API
 * ----------------------------------------------------------- */
export async function getOrders(): Promise<Order[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const orders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Order, "id">),
        }));
        saveToStorage(STORAGE_KEY_ORDERS, orders);
        return orders;
      }
    } catch (err) {
      console.warn("[Firestore] fetch orders error, falling back to local store:", err);
    }
  }

  return loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS);
}

export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  // 1. Immediate emission for instant zero-flicker UI
  callback(loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS));

  // 2. Storage event listener for offline/local sync
  const handleStorageUpdate = () => {
    if (isUnsubscribed) return;
    callback(loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS));
  };

  window.addEventListener("hanela-storage-update", handleStorageUpdate);
  window.addEventListener("storage", handleStorageUpdate);

  // 3. Attach real-time Firestore listener
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (isUnsubscribed) return;
          const orders = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, "id">),
          }));
          saveToStorage(STORAGE_KEY_ORDERS, orders);
        },
        (error) => {
          console.warn("[Firestore] subscribeOrders snapshot error, fallback to local:", error);
          if (!isUnsubscribed) {
            handleStorageUpdate();
          }
        }
      );
    } catch (err) {
      console.warn("[Firestore] Failed to attach orders listener:", err);
    }
  }

  // 4. Return instant unsubscription callback
  return () => {
    isUnsubscribed = true;
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch (e) {
        console.warn("[Firestore] Error unsubscribing orders:", e);
      }
      unsubFirestore = null;
    }
    window.removeEventListener("hanela-storage-update", handleStorageUpdate);
    window.removeEventListener("storage", handleStorageUpdate);
  };
}

export async function saveOrder(orderData: {
  pickupDate: string;
  pickupTime: string;
  customer: CustomerDetails;
  items: CartItem[];
  totalPrice: number;
  id?: string;
  orderNumber?: string;
  status?: OrderStatus;
  createdAt?: string;
  internalNote?: string;
} | Order): Promise<Order> {
  const currentOrders = loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS);
  const nextSeq = currentOrders.length + 1;
  const year = new Date().getFullYear();
  const orderNumber = orderData.orderNumber || `HAN-${year}-${String(nextSeq).padStart(3, "0")}`;
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const id = orderData.id || `ord-${Date.now()}-${randomSuffix}`;

  const newOrder: Order = {
    id,
    orderNumber,
    createdAt: orderData.createdAt || new Date().toISOString(),
    status: orderData.status || "nova",
    pickupDate: orderData.pickupDate,
    pickupTime: orderData.pickupTime,
    customer: orderData.customer,
    items: orderData.items,
    totalPrice: orderData.totalPrice,
    internalNote: orderData.internalNote || "",
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "orders", id), newOrder);
    } catch (err) {
      console.warn("[Firestore] saveOrder failed, saving to local store:", err);
    }
  }

  saveToStorage(STORAGE_KEY_ORDERS, [newOrder, ...currentOrders.filter((o) => o.id !== id)]);
  return newOrder;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const current = loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS);
  const exists = current.some((ord) => ord.id === orderId);
  if (!exists) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (err) {
      console.warn("[Firestore] updateOrderStatus failed:", err);
    }
  }

  const updated = current.map((ord) => (ord.id === orderId ? { ...ord, status } : ord));
  saveToStorage(STORAGE_KEY_ORDERS, updated);
}

export async function updateOrderInternalNote(orderId: string, note: string): Promise<void> {
  const current = loadFromStorage<Order[]>(STORAGE_KEY_ORDERS, INITIAL_DEMO_ORDERS);
  const exists = current.some((ord) => ord.id === orderId);
  if (!exists) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "orders", orderId), { internalNote: note });
    } catch (err) {
      console.warn("[Firestore] updateOrderInternalNote failed:", err);
    }
  }

  const updated = current.map((ord) => (ord.id === orderId ? { ...ord, internalNote: note } : ord));
  saveToStorage(STORAGE_KEY_ORDERS, updated);
}

/* -------------------------------------------------------------
 * BLOCKED DATES API
 * ----------------------------------------------------------- */
export async function getBlockedDates(): Promise<BlockedDate[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "blocked_dates"));
      if (!snapshot.empty) {
        const dates = snapshot.docs.map((d) => d.data() as BlockedDate);
        saveToStorage(STORAGE_KEY_BLOCKED_DATES, dates);
        return dates;
      }
    } catch (err) {
      console.warn("[Firestore] getBlockedDates failed:", err);
    }
  }

  return loadFromStorage<BlockedDate[]>(
    STORAGE_KEY_BLOCKED_DATES,
    INITIAL_DEMO_BLOCKED_DATES
  );
}

export function subscribeBlockedDates(callback: (dates: BlockedDate[]) => void): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  callback(loadFromStorage<BlockedDate[]>(STORAGE_KEY_BLOCKED_DATES, INITIAL_DEMO_BLOCKED_DATES));

  const handleStorageUpdate = () => {
    if (isUnsubscribed) return;
    callback(loadFromStorage<BlockedDate[]>(STORAGE_KEY_BLOCKED_DATES, INITIAL_DEMO_BLOCKED_DATES));
  };

  window.addEventListener("hanela-storage-update", handleStorageUpdate);
  window.addEventListener("storage", handleStorageUpdate);

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(
        collection(db, "blocked_dates"),
        (snapshot) => {
          if (isUnsubscribed) return;
          const dates = snapshot.docs.map((d) => d.data() as BlockedDate);
          saveToStorage(STORAGE_KEY_BLOCKED_DATES, dates);
        },
        (error) => {
          console.warn("[Firestore] subscribeBlockedDates snapshot error:", error);
          if (!isUnsubscribed) {
            handleStorageUpdate();
          }
        }
      );
    } catch (err) {
      console.warn("[Firestore] Failed to attach blocked_dates listener:", err);
    }
  }

  return () => {
    isUnsubscribed = true;
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch (e) {
        console.warn("[Firestore] Error unsubscribing blocked_dates:", e);
      }
      unsubFirestore = null;
    }
    window.removeEventListener("hanela-storage-update", handleStorageUpdate);
    window.removeEventListener("storage", handleStorageUpdate);
  };
}

export async function blockDate(date: string, reason: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format. Expected YYYY-MM-DD, got ${date}`);
  }

  const item: BlockedDate = {
    date,
    reason: reason || "Plná kapacita",
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "blocked_dates", date), item);
    } catch (err) {
      console.warn("[Firestore] blockDate failed:", err);
    }
  }

  const current = loadFromStorage<BlockedDate[]>(
    STORAGE_KEY_BLOCKED_DATES,
    INITIAL_DEMO_BLOCKED_DATES
  );
  const filtered = current.filter((b) => b.date !== date);
  saveToStorage(STORAGE_KEY_BLOCKED_DATES, [...filtered, item]);
}

export async function unblockDate(date: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "blocked_dates", date));
    } catch (err) {
      console.warn("[Firestore] unblockDate failed:", err);
    }
  }

  const current = loadFromStorage<BlockedDate[]>(
    STORAGE_KEY_BLOCKED_DATES,
    INITIAL_DEMO_BLOCKED_DATES
  );
  saveToStorage(
    STORAGE_KEY_BLOCKED_DATES,
    current.filter((b) => b.date !== date)
  );
}

/* -------------------------------------------------------------
 * PRODUCT & PRICING API (`prices` FIRESTORE COLLECTION)
 * ----------------------------------------------------------- */
export async function getProductPrices(): Promise<Record<string, ProductPriceDoc>> {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "prices"));
      if (!snapshot.empty) {
        const pricesMap: Record<string, ProductPriceDoc> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as ProductPriceDoc;
          const id = docSnap.id || data.productId;
          pricesMap[id] = { ...data, productId: id };
        });
        saveToStorage(STORAGE_KEY_PRICES, pricesMap);
        return pricesMap;
      }
    } catch (err) {
      console.warn("[Firestore] getProductPrices failed:", err);
    }
  }

  return loadFromStorage<Record<string, ProductPriceDoc>>(STORAGE_KEY_PRICES, {});
}

export function subscribePrices(
  callback: (prices: Record<string, ProductPriceDoc>) => void
): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  callback(loadFromStorage<Record<string, ProductPriceDoc>>(STORAGE_KEY_PRICES, {}));

  const handleStorageUpdate = () => {
    if (isUnsubscribed) return;
    callback(loadFromStorage<Record<string, ProductPriceDoc>>(STORAGE_KEY_PRICES, {}));
  };

  window.addEventListener("hanela-storage-update", handleStorageUpdate);
  window.addEventListener("storage", handleStorageUpdate);

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(
        collection(db, "prices"),
        (snapshot) => {
          if (isUnsubscribed) return;
          const pricesMap: Record<string, ProductPriceDoc> = {};
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data() as ProductPriceDoc;
            const id = docSnap.id || data.productId;
            pricesMap[id] = { ...data, productId: id };
          });
          saveToStorage(STORAGE_KEY_PRICES, pricesMap);
        },
        (error) => {
          console.warn("[Firestore] subscribePrices snapshot error:", error);
          if (!isUnsubscribed) {
            handleStorageUpdate();
          }
        }
      );
    } catch (err) {
      console.warn("[Firestore] Failed to attach prices listener:", err);
    }
  }

  return () => {
    isUnsubscribed = true;
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch (e) {
        console.warn("[Firestore] Error unsubscribing prices:", e);
      }
      unsubFirestore = null;
    }
    window.removeEventListener("hanela-storage-update", handleStorageUpdate);
    window.removeEventListener("storage", handleStorageUpdate);
  };
}

export async function saveProductPrice(
  productId: string,
  price?: number,
  isAvailable: boolean = true
): Promise<void> {
  if (price !== undefined && price < 0) {
    throw new Error(`Price cannot be negative: ${price}`);
  }

  const current = loadFromStorage<Record<string, ProductPriceDoc>>(STORAGE_KEY_PRICES, {});
  const productMeta = PRODUCTS.find((p) => p.id === productId);

  const resolvedPrice = price !== undefined ? price : (current[productId]?.price ?? (productMeta?.price || 0));

  const priceDoc: ProductPriceDoc = {
    productId,
    name: productMeta?.name || current[productId]?.name || productId,
    price: resolvedPrice,
    category: productMeta?.category || current[productId]?.category || "ostatne",
    updatedAt: new Date().toISOString(),
    isAvailable: isAvailable ?? true,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "prices", productId), priceDoc, { merge: true });
    } catch (err) {
      console.warn("[Firestore] saveProductPrice failed, saving to local store:", err);
    }
  }

  current[productId] = priceDoc;
  saveToStorage(STORAGE_KEY_PRICES, current);

  // Sync to legacy overrides store for compatibility
  const legacyOverrides = loadFromStorage<Record<string, ProductPriceOverride>>(
    STORAGE_KEY_PRODUCT_OVERRIDES,
    {}
  );
  legacyOverrides[productId] = { productId, price: resolvedPrice, isAvailable };
  saveToStorage(STORAGE_KEY_PRODUCT_OVERRIDES, legacyOverrides);
}

// Backward compatibility helpers for catalog & legacy tabs
export function getProductOverrides(): Record<string, ProductPriceOverride> {
  const prices = loadFromStorage<Record<string, ProductPriceDoc>>(STORAGE_KEY_PRICES, {});
  if (Object.keys(prices).length > 0) {
    return prices;
  }
  return loadFromStorage<Record<string, ProductPriceOverride>>(
    STORAGE_KEY_PRODUCT_OVERRIDES,
    {}
  );
}

export function saveProductOverride(
  productId: string,
  price?: number,
  isAvailable: boolean = true
): void {
  if (price !== undefined) {
    void saveProductPrice(productId, price, isAvailable);
  } else {
    const legacy = loadFromStorage<Record<string, ProductPriceOverride>>(
      STORAGE_KEY_PRODUCT_OVERRIDES,
      {}
    );
    legacy[productId] = { productId, price, isAvailable };
    saveToStorage(STORAGE_KEY_PRODUCT_OVERRIDES, legacy);
  }
}

export function getCakeSizes(): CakeSizeOverride[] {
  return loadFromStorage<CakeSizeOverride[]>(
    STORAGE_KEY_CAKE_SIZES,
    DEFAULT_CAKE_SIZES
  );
}

export function saveCakeSizes(sizes: CakeSizeOverride[]): void {
  saveToStorage(STORAGE_KEY_CAKE_SIZES, sizes);
}

/* -------------------------------------------------------------
 * DEPRECATED GOOGLE SHEETS SETTINGS (Cleaned up in M1)
 * ----------------------------------------------------------- */
/** @deprecated Legacy Google Sheets settings removed in favor of Resend API */
export interface AdminSettings {
  webhookUrl: string;
  notificationEmail: string;
}

/** @deprecated */
export const DEFAULT_SETTINGS: AdminSettings = {
  webhookUrl: "",
  notificationEmail: "cukraren.hanela@gmail.com",
};

/** @deprecated */
export function getAdminSettings(): AdminSettings {
  return DEFAULT_SETTINGS;
}

/** @deprecated */
export function saveAdminSettings(_settings: AdminSettings): void {}
