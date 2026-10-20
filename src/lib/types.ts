/**
 * Hanela Cukráreň — Canonical Domain Data Models & Firestore Collections Schema
 * 
 * Target path: src/lib/types.ts
 * Architecture: Next.js 16 (Turbopack) + React 19 + Firebase Firestore + Resend API
 */

// ============================================================================
// 1. PRODUCT & CART DOMAIN MODELS
// ============================================================================

/**
 * Bakery catalog categories matching ORIGINAL_REQUEST and products.ts
 */
export type ProductCategory =
  | "mix"
  | "torty-mieru"
  | "torty-cheesecakes"
  | "zakusky";

/**
 * Shopping cart item representation across customer booking, cart context,
 * order storage, kitchen receipts, and email dispatch.
 */
export interface CartItem {
  id: string; // unique item instance id (e.g. item-1728567890-abcde)
  productId: string;
  name: string;
  slug: string;
  category: ProductCategory | string;
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;

  // Customization options for artisanal products:
  size?: string; // e.g. "10–15 porcií (Ø 21 cm)"
  korpus?: string; // e.g. "Mandľový korpus"
  krem?: string; // e.g. "Mascarpone s bielou čokoládou"
  doplnky?: string[]; // e.g. ["Malinová redukcia", "Čerstvé lesné ovocie"]
  diets?: string[]; // e.g. ["Bezlepková úprava"]
  zdobenie?: string[]; // e.g. ["Personalizovaný zápich (+6 €)"]
  cakeNote?: string; // custom decoration instructions
  servings?: string; // e.g. "16 ks"
}

// ============================================================================
// 2. ORDER DOMAIN MODELS & STATUS TOKENS
// ============================================================================

/**
 * 5 strict order workflow statuses
 */
export type OrderStatus =
  | "nova"
  | "vyroba"
  | "pripravena"
  | "odovzdana"
  | "zrusena";

/**
 * Slovak localization labels for order statuses
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nova: "Nová",
  vyroba: "Vo výrobe",
  pripravena: "Pripravená",
  odovzdana: "Odovzdaná",
  zrusena: "Zrušená",
};

/**
 * Mobbin-grade luxury tone-on-tone badge design tokens
 */
export const ORDER_STATUS_TOKENS: Record<
  OrderStatus,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  nova: {
    bg: "#FAF1F8",
    text: "#a62891",
    border: "#ECD9E8",
    dot: "#a62891",
    label: "Nová",
  },
  vyroba: {
    bg: "rgba(38, 27, 36, 0.05)",
    text: "#261B24",
    border: "#DFD8CD",
    dot: "#261B24",
    label: "Vo výrobe",
  },
  pripravena: {
    bg: "#F8F4EE",
    text: "#6E5335",
    border: "#EADFCF",
    dot: "#6E5335",
    label: "Pripravená",
  },
  odovzdana: {
    bg: "#F3F6F3",
    text: "#345139",
    border: "#DCE4DC",
    dot: "#345139",
    label: "Odovzdaná",
  },
  zrusena: {
    bg: "#FBF2F2",
    text: "#7A2E2E",
    border: "#EDD5D5",
    dot: "#7A2E2E",
    label: "Zrušená",
  },
};

/**
 * Customer contact and dietary information
 */
export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  allergies?: string;
  notes?: string;
}

/**
 * Standard pickup time slots defined in PROJECT.md
 */
export const PICKUP_TIME_SLOTS = [
  "11:00",
  "11:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

export type PickupTimeSlot = typeof PICKUP_TIME_SLOTS[number] | string;

/**
 * Canonical Order document schema (Firestore: orders/{orderId})
 */
export interface Order {
  id: string; // document id (e.g. ord-1728567890)
  orderNumber: string; // human-readable code (e.g. HAN-2026-001)
  createdAt: string; // ISO 8601 string
  pickupDate: string; // YYYY-MM-DD
  pickupTime: PickupTimeSlot; // e.g. "11:00", "15:00"
  customer: CustomerDetails;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  internalNote?: string;
  updatedAt?: string;
}

/**
 * Order payload when creating a new order from checkout/reservation
 */
export type CreateOrderInput = Omit<Order, "id" | "orderNumber" | "createdAt" | "status"> & {
  status?: OrderStatus;
};

// ============================================================================
// 3. CAPACITY & BLOCKED DATES (Firestore: blocked_dates/{YYYY-MM-DD})
// ============================================================================

/**
 * Blocked date document schema (Firestore: blocked_dates/{YYYY-MM-DD})
 */
export interface BlockedDate {
  date: string; // YYYY-MM-DD key and document ID
  reason: string; // Operational reason
  createdAt: string; // ISO 8601 creation timestamp
}

/**
 * Bakery capacity preset blocking reasons
 */
export const BLOCKED_DATE_PRESET_REASONS = [
  "Plná kapacita výroby",
  "Dovolenka majiteľky",
  "Sanitárny deň",
] as const;

// ============================================================================
// 4. PRICING & PRODUCT OVERRIDES (Firestore: prices/{productId})
// ============================================================================

/**
 * Product price override document schema (Firestore: prices/{productId})
 */
export interface ProductPriceDoc {
  productId: string; // Document ID matching catalog Product.id or slug
  name: string; // Product title
  price: number; // Active price in EUR
  category: string; // Category identifier
  updatedAt: string; // ISO 8601 last modified timestamp
  isAvailable: boolean; // Availability toggle (true = active, false = sold out/hidden)
}

/**
 * Backward-compatible override type matching existing client state and local storage.
 * Any ProductPriceDoc is assignable to ProductPriceOverride.
 */
export interface ProductPriceOverride {
  productId: string;
  name?: string;
  price?: number;
  category?: string;
  updatedAt?: string;
  isAvailable: boolean;
}

/**
 * Cake size configuration and price override interface.
 * Preserves full backward-compatibility with existing interactive selectors
 * in /rezervacia and /admin (id, name, extra, total) while accommodating
 * product-specific price overrides (productId, sizeName, price).
 */
export interface CakeSizeOverride {
  id: string; // e.g. "size-10"
  name: string; // e.g. "do 10 porcií (Ø 17 cm)"
  extra: number; // surcharge amount (e.g. 35)
  total: number; // total package price (e.g. 60)

  // M1 per-product override properties (optional aliases/keys)
  productId?: string;
  sizeName?: string; // alias for name
  price?: number; // alias for total
}

/**
 * Standalone interface for per-product cake size override documents
 */
export interface ProductCakeSizeDoc {
  productId: string;
  sizeName: string;
  price: number;
}

// ============================================================================
// 5. EMAIL TRANSACTION PAYLOADS (Route: POST /api/send-email)
// ============================================================================

/**
 * Request payload for POST /api/send-email
 */
export interface SendEmailRequest {
  order: Order;
  customerEmail?: string;
  ownerEmail?: string;
}

/**
 * Response payload for POST /api/send-email
 */
export interface SendEmailResponse {
  success: boolean;
  customerEmailId?: string;
  ownerEmailId?: string;
  error?: string;
  warning?: string;
}

// ============================================================================
// 6. CUSTOMER CONTACTS & EMAIL CAMPAIGNS
// ============================================================================

export interface ManualContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  createdAt: string;
}

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  source: "objednavka" | "manual";
  notes?: string;
}

