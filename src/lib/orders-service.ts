import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  Order,
  OrderStatus,
  OrderInspirationPhoto,
  BlockedDate,
  ProductPriceDoc,
  ProductPriceOverride,
  CakeSizeOverride,
  CustomerDetails,
  ManualContact,
} from "./types";
import { CartItem } from "@/context/CartContext";
import { PRODUCTS } from "@/data/products";

// Local storage keys for fallback & offline persistence
const STORAGE_KEY_ORDERS = "hanela_admin_orders_v1";
const STORAGE_KEY_BLOCKED_DATES = "hanela_admin_blocked_dates_v1";
const STORAGE_KEY_PRICES = "hanela_admin_prices_v1";
const STORAGE_KEY_PRODUCT_OVERRIDES = "hanela_admin_product_overrides_v1";
const STORAGE_KEY_CAKE_SIZES = "hanela_admin_cake_sizes_v1";
const STORAGE_KEY_MANUAL_CONTACTS = "hanela_admin_manual_contacts_v1";
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

// Empty initial state for production
export const INITIAL_DEMO_ORDERS: Order[] = [];

export const INITIAL_DEMO_BLOCKED_DATES: BlockedDate[] = [];

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
 * ORDERS API (100% LIVE FIRESTORE)
 * ----------------------------------------------------------- */
export async function getOrders(): Promise<Order[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }));
    } catch (err) {
      console.error("[Firestore] fetch orders error:", err);
    }
  }
  return [];
}

export function subscribeOrders(callback: (orders: Order[]) => void): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  // Clear any legacy localStorage orders so stale local data is never used
  try {
    window.localStorage.removeItem(STORAGE_KEY_ORDERS);
  } catch {
    // ignore
  }

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
          callback(orders);
        },
        (error) => {
          console.error("[Firestore] subscribeOrders snapshot error:", error);
        }
      );
    } catch (err) {
      console.error("[Firestore] Failed to attach orders listener:", err);
    }
  }

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
  };
}

/**
 * Removes undefined fields deeply so Firestore setDoc does not reject payload.
 */
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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
  inspirationPhoto?: OrderInspirationPhoto;
} | Order): Promise<Order> {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const id = orderData.id || `ord-${Date.now()}-${randomSuffix}`;

  // Generate a unique order number based on live Firestore count or timestamp code
  let orderNumber = orderData.orderNumber;
  if (!orderNumber) {
    let nextSeq = 1;
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, "orders"));
        nextSeq = snap.size + 1;
      } catch {
        nextSeq = Math.floor(100 + Math.random() * 900);
      }
    }
    const shortRand = Math.random().toString(36).substring(2, 4).toUpperCase();
    orderNumber = `HAN-${year}-${String(nextSeq).padStart(3, "0")}-${shortRand}`;
  }

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
    inspirationPhoto: orderData.inspirationPhoto,
    emailSent: true,
    emailSentAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }

  const sanitized = cleanForFirestore(newOrder);
  await setDoc(doc(db, "orders", id), sanitized);
  console.log(`[Firestore] Order ${id} (${orderNumber}) successfully saved to Firestore.`);
  return newOrder;
}

export async function removeOrderInspirationPhoto(orderId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (snap.exists()) {
      const target = snap.data() as Order;
      if (target.inspirationPhoto?.storagePath) {
        try {
          const { deleteCakeInspirationPhoto } = await import("./image-upload");
          await deleteCakeInspirationPhoto(target.inspirationPhoto.storagePath);
        } catch (e) {
          console.warn("Failed to delete from storage:", e);
        }
      }
    }
    await updateDoc(doc(db, "orders", orderId), { inspirationPhoto: deleteField() });
  } catch (err) {
    console.error("[Firestore] removeOrderInspirationPhoto failed:", err);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }
  await updateDoc(doc(db, "orders", orderId), { status });
}

export async function updateOrderInternalNote(orderId: string, note: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }
  await updateDoc(doc(db, "orders", orderId), { internalNote: note });
}

export async function deleteOrder(orderId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }

  // 1. Delete inspiration photo from Firebase Storage if present
  try {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (snap.exists()) {
      const target = snap.data() as Order;
      if (target?.inspirationPhoto?.storagePath) {
        const { deleteCakeInspirationPhoto } = await import("./image-upload");
        await deleteCakeInspirationPhoto(target.inspirationPhoto.storagePath);
      }
    }
  } catch (e) {
    console.warn("Failed to delete photo from storage during order deletion:", e);
  }

  // 2. Delete document from Firestore
  await deleteDoc(doc(db, "orders", orderId));
  console.log(`[Firestore] Order ${orderId} successfully deleted from Firestore.`);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "orders", orderId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Order;
      }
    } catch (e) {
      console.error("[Firestore] getOrder failed:", e);
    }
  }
  return null;
}

/* -------------------------------------------------------------
 * BLOCKED DATES API (100% LIVE FIRESTORE)
 * ----------------------------------------------------------- */
export async function getBlockedDates(): Promise<BlockedDate[]> {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "blocked_dates"));
      return snapshot.docs.map((d) => d.data() as BlockedDate);
    } catch (err) {
      console.error("[Firestore] getBlockedDates failed:", err);
    }
  }
  return [];
}

export function subscribeBlockedDates(callback: (dates: BlockedDate[]) => void): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY_BLOCKED_DATES);
  } catch {
    // ignore
  }

  if (isFirebaseConfigured && db) {
    try {
      unsubFirestore = onSnapshot(
        collection(db, "blocked_dates"),
        (snapshot) => {
          if (isUnsubscribed) return;
          const dates = snapshot.docs.map((d) => d.data() as BlockedDate);
          callback(dates);
        },
        (error) => {
          console.error("[Firestore] subscribeBlockedDates snapshot error:", error);
        }
      );
    } catch (err) {
      console.error("[Firestore] Failed to attach blocked_dates listener:", err);
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

  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }

  await setDoc(doc(db, "blocked_dates", date), item);
}

export async function unblockDate(date: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }
  await deleteDoc(doc(db, "blocked_dates", date));
}

/* -------------------------------------------------------------
 * PRODUCT & PRICING API (`prices` FIRESTORE COLLECTION)
 * ----------------------------------------------------------- */
export async function getProductPrices(): Promise<Record<string, ProductPriceDoc>> {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "prices"));
      const pricesMap: Record<string, ProductPriceDoc> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as ProductPriceDoc;
        const id = docSnap.id || data.productId;
        pricesMap[id] = { ...data, productId: id };
      });
      return pricesMap;
    } catch (err) {
      console.error("[Firestore] getProductPrices failed:", err);
    }
  }
  return {};
}

export function subscribePrices(
  callback: (prices: Record<string, ProductPriceDoc>) => void
): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

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
          callback(pricesMap);
        },
        (error) => {
          console.error("[Firestore] subscribePrices snapshot error:", error);
        }
      );
    } catch (err) {
      console.error("[Firestore] Failed to attach prices listener:", err);
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

  const productMeta = PRODUCTS.find((p) => p.id === productId);
  const resolvedPrice = price !== undefined ? price : (productMeta?.price || 0);

  const priceDoc: ProductPriceDoc = {
    productId,
    name: productMeta?.name || productId,
    price: resolvedPrice,
    category: productMeta?.category || "ostatne",
    updatedAt: new Date().toISOString(),
    isAvailable: isAvailable ?? true,
  };

  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }

  await setDoc(doc(db, "prices", productId), cleanForFirestore(priceDoc), { merge: true });
}

// Backward compatibility helpers for catalog & legacy tabs
export function getProductOverrides(): Record<string, ProductPriceOverride> {
  return {};
}

export function saveProductOverride(
  productId: string,
  price?: number,
  isAvailable: boolean = true
): void {
  if (price !== undefined) {
    void saveProductPrice(productId, price, isAvailable);
  }
}

export function getCakeSizes(): CakeSizeOverride[] {
  return DEFAULT_CAKE_SIZES;
}

export function saveCakeSizes(sizes: CakeSizeOverride[]): void {
  saveToStorage(STORAGE_KEY_CAKE_SIZES, sizes);
}

/* -------------------------------------------------------------
 * MANUAL CONTACTS & NEWSLETTER SUBSCRIBERS (100% LIVE FIRESTORE)
 * ----------------------------------------------------------- */
export async function getManualContacts(): Promise<ManualContact[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ManualContact, "id">),
      }));
    } catch (err) {
      console.error("[Firestore] fetch contacts error:", err);
    }
  }
  return [];
}

export function subscribeManualContacts(callback: (contacts: ManualContact[]) => void): () => void {
  let isUnsubscribed = false;
  let unsubFirestore: (() => void) | null = null;

  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY_MANUAL_CONTACTS);
  } catch {
    // ignore
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (isUnsubscribed) return;
          const contacts = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ManualContact, "id">),
          }));
          callback(contacts);
        },
        (error) => {
          console.error("[Firestore] subscribeManualContacts snapshot error:", error);
        }
      );
    } catch (err) {
      console.error("[Firestore] Failed to attach contacts listener:", err);
    }
  }

  return () => {
    isUnsubscribed = true;
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch (e) {
        console.warn("[Firestore] Error unsubscribing contacts:", e);
      }
      unsubFirestore = null;
    }
  };
}

export async function saveManualContact(contactData: {
  name: string;
  email: string;
  phone?: string;
  note?: string;
}): Promise<ManualContact> {
  const id = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newContact: ManualContact = {
    id,
    name: contactData.name.trim(),
    email: contactData.email.trim().toLowerCase(),
    phone: contactData.phone?.trim() || "",
    note: contactData.note?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }

  await setDoc(doc(db, "contacts", id), cleanForFirestore(newContact));
  return newContact;
}

export async function deleteManualContact(contactId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore databáza nie je pripojená.");
  }
  await deleteDoc(doc(db, "contacts", contactId));
}

/* -------------------------------------------------------------
 * EMAIL DISPATCH VIA WEBHOOK & RESEND
 * ----------------------------------------------------------- */
export async function dispatchOrderNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  let webhookUrl = process.env.NEXT_PUBLIC_EMAIL_WEBHOOK_URL || "";

  // If not in env, read live from Firestore settings/resend
  if (!webhookUrl && isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "settings", "resend"));
      if (snap.exists()) {
        const data = snap.data();
        if (data.webhookUrl) webhookUrl = String(data.webhookUrl).trim();
      }
    } catch (err) {
      console.warn("[Email Dispatch] Failed to read webhookUrl from Firestore:", err);
    }
  }

  // Also check localStorage fallback
  if (!webhookUrl && typeof window !== "undefined") {
    try {
      webhookUrl = localStorage.getItem("hanela_email_webhook_url") || "";
    } catch {
      // ignore
    }
  }

  if (!webhookUrl) {
    console.warn("[Email Dispatch] No email webhook URL configured yet. Order saved to Firestore.");
    return { success: false, error: "No webhook URL configured" };
  }

  try {
    // We send Content-Type text/plain with mode no-cors to prevent browser preflight blocks
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ order }),
      mode: "no-cors",
    });
    console.log(`[Email Dispatch] Order #${order.orderNumber} successfully dispatched to webhook.`);
    return { success: true };
  } catch (err: unknown) {
    console.error("[Email Dispatch] Webhook call failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Chyba odoslania" };
  }
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
  notificationEmail: "hanelacakes@gmail.com",
};

/** @deprecated */
export function getAdminSettings(): AdminSettings {
  return DEFAULT_SETTINGS;
}

/** @deprecated */
export function saveAdminSettings(_settings: AdminSettings): void {}
