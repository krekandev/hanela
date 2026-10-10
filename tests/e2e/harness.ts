/**
 * Hanela E2E Test Suite — Unified Test Harness & Domain Contracts
 * 
 * Provides mock environments, domain contracts, validation logic,
 * and test fixtures matching PROJECT.md specifications.
 */

export type OrderStatus = "nova" | "vyroba" | "pripravena" | "odovzdana" | "zrusena";

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  allergies?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  category: "mix" | "torty-mieru" | "torty-cheesecakes" | "zakusky";
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  size?: string;
  korpus?: string;
  krem?: string;
  doplnky?: string[];
  diets?: string[];
  zdobenie?: string[];
  cakeNote?: string;
  servings?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // e.g. "15:00", "11:30"
  customer: CustomerDetails;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  internalNote?: string;
}

export interface BlockedDate {
  date: string; // YYYY-MM-DD
  reason: string;
  createdAt: string;
}

export interface ProductPriceOverride {
  productId: string;
  name?: string;
  price?: number;
  isAvailable: boolean;
  category?: string;
  updatedAt?: string;
}

export interface CakeSizeOption {
  id: string;
  name: string;
  extra: number;
  total: number;
}

// Allowed Admin Navigation Pillars (Strictly 4 Pillars)
export const ADMIN_NAV_PILLARS = [
  "calendar",
  "orders",
  "capacity",
  "pricing",
] as const;
export type AdminNavPillar = typeof ADMIN_NAV_PILLARS[number];

// Standard Pickup Time Slots
export const STANDARD_PICKUP_SLOTS = [
  "11:00",
  "11:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

// Preset Capacity Blocking Reasons
export const PRESET_BLOCKED_REASONS = [
  "Plná kapacita výroby",
  "Dovolenka majiteľky",
  "Sanitárny deň",
] as const;

// Status Badge Design Tokens (Mobbin Luxury Palette)
export const STATUS_DESIGN_TOKENS: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
  nova: { bg: "#FAF1F8", text: "#a62891", border: "#ECD9E8", label: "Nová" },
  vyroba: { bg: "#261B240D", text: "#261B24", border: "#DFD8CD", label: "Vo výrobe" },
  pripravena: { bg: "#F8F4EE", text: "#6E5335", border: "#EADFCF", label: "Pripravená" },
  odovzdana: { bg: "#F3F6F3", text: "#345139", border: "#DCE4DC", label: "Odovzdaná" },
  zrusena: { bg: "#FBF2F2", text: "#7A2E2E", border: "#EDD5D5", label: "Zrušená" },
};

// Lifecycle Status Progression Order
export const STATUS_PROGRESSION: Record<OrderStatus, OrderStatus | null> = {
  nova: "vyroba",
  vyroba: "pripravena",
  pripravena: "odovzdana",
  odovzdana: null, // Terminal state
  zrusena: null,   // Terminal state
};

// Default Cake Sizes
export const DEFAULT_CAKE_SIZES: CakeSizeOption[] = [
  { id: "size-4", name: "4 porcie (mini)", extra: 0, total: 25 },
  { id: "size-10", name: "do 10 porcií (Ø 17 cm)", extra: 35, total: 60 },
  { id: "size-15", name: "10–15 porcií (Ø 21 cm)", extra: 55, total: 80 },
  { id: "size-20", name: "16–20 porcií (Ø 24 cm)", extra: 75, total: 100 },
  { id: "size-30", name: "24–30 porcií (Ø 27 cm)", extra: 95, total: 120 },
];

// Sample Catalog Products for testing
export const TEST_CATALOG = [
  { id: "ovocna-sviezost", name: "Ovocná sviežosť", price: 80, category: "torty-mieru" as const },
  { id: "cokoladovy-sen", name: "Čokoládový sen", price: 100, category: "torty-mieru" as const },
  { id: "vikendovy-mix-velky", name: "Víkendový degustačný box (16 ks)", price: 35, category: "mix" as const },
  { id: "malinovy-cheesecake", name: "Malinový pečený cheesecake", price: 42, category: "torty-cheesecakes" as const },
  { id: "tartaletka-malina", name: "Tartaletka Malinová", price: 3.5, category: "zakusky" as const },
];

/**
 * In-Memory Reactive Firestore Simulator
 * Accurately implements real-time subscriptions, query sorting, CRUD,
 * and isolated unsubscription callbacks.
 */
export class InMemoryFirestoreStore {
  private orders = new Map<string, Order>();
  private blockedDates = new Map<string, BlockedDate>();
  private prices = new Map<string, ProductPriceOverride>();
  private orderListeners = new Set<(orders: Order[]) => void>();
  private blockedDateListeners = new Set<(dates: BlockedDate[]) => void>();
  private priceListeners = new Set<(prices: Record<string, ProductPriceOverride>) => void>();
  private seqCounter = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.orders.clear();
    this.blockedDates.clear();
    this.prices.clear();
    this.orderListeners.clear();
    this.blockedDateListeners.clear();
    this.priceListeners.clear();
    this.seqCounter = 0;
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public subscribeOrders(callback: (orders: Order[]) => void): () => void {
    this.orderListeners.add(callback);
    // Instant emit with current state
    callback(this.getOrders());
    return () => {
      this.orderListeners.delete(callback);
    };
  }

  public async saveOrder(orderData: {
    pickupDate: string;
    pickupTime: string;
    customer: CustomerDetails;
    items: CartItem[];
    totalPrice: number;
    status?: OrderStatus;
    internalNote?: string;
  }): Promise<Order> {
    this.seqCounter += 1;
    const year = new Date().getFullYear();
    const orderNumber = `HAN-${year}-${String(this.seqCounter).padStart(3, "0")}`;
    const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const order: Order = {
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
      pickupDate: orderData.pickupDate,
      pickupTime: orderData.pickupTime,
      customer: orderData.customer,
      items: orderData.items,
      totalPrice: orderData.totalPrice,
      status: orderData.status || "nova",
      internalNote: orderData.internalNote,
    };

    this.orders.set(id, order);
    this.notifyOrderListeners();
    return order;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }
    const updated = { ...existing, status };
    this.orders.set(orderId, updated);
    this.notifyOrderListeners();
  }

  public async updateOrderInternalNote(orderId: string, note: string): Promise<void> {
    const existing = this.orders.get(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }
    const updated = { ...existing, internalNote: note };
    this.orders.set(orderId, updated);
    this.notifyOrderListeners();
  }

  private notifyOrderListeners(): void {
    const list = this.getOrders();
    for (const listener of this.orderListeners) {
      listener(list);
    }
  }

  // --- Blocked Dates ---
  public getBlockedDates(): BlockedDate[] {
    return Array.from(this.blockedDates.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
  }

  public subscribeBlockedDates(callback: (dates: BlockedDate[]) => void): () => void {
    this.blockedDateListeners.add(callback);
    callback(this.getBlockedDates());
    return () => {
      this.blockedDateListeners.delete(callback);
    };
  }

  public async blockDate(date: string, reason: string): Promise<void> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date format. Expected YYYY-MM-DD, got ${date}`);
    }
    const item: BlockedDate = {
      date,
      reason: reason || "Plná kapacita",
      createdAt: new Date().toISOString(),
    };
    this.blockedDates.set(date, item);
    this.notifyBlockedDateListeners();
  }

  public async unblockDate(date: string): Promise<void> {
    this.blockedDates.delete(date);
    this.notifyBlockedDateListeners();
  }

  public isDateBlocked(date: string): boolean {
    return this.blockedDates.has(date);
  }

  private notifyBlockedDateListeners(): void {
    const list = this.getBlockedDates();
    for (const listener of this.blockedDateListeners) {
      listener(list);
    }
  }

  // --- Pricing Overrides ---
  public getPrices(): Record<string, ProductPriceOverride> {
    const result: Record<string, ProductPriceOverride> = {};
    for (const [key, val] of this.prices.entries()) {
      result[key] = { ...val };
    }
    return result;
  }

  public subscribePrices(callback: (prices: Record<string, ProductPriceOverride>) => void): () => void {
    this.priceListeners.add(callback);
    callback(this.getPrices());
    return () => {
      this.priceListeners.delete(callback);
    };
  }

  public async saveProductPrice(
    productId: string,
    price?: number,
    isAvailable: boolean = true
  ): Promise<void> {
    if (price !== undefined && price < 0) {
      throw new Error(`Price cannot be negative: ${price}`);
    }
    const record: ProductPriceOverride = {
      productId,
      price,
      isAvailable,
      updatedAt: new Date().toISOString(),
    };
    this.prices.set(productId, record);
    this.notifyPriceListeners();
  }

  public resolveEffectivePrice(productId: string, basePrice: number): { price: number; isAvailable: boolean } {
    const override = this.prices.get(productId);
    if (!override) {
      return { price: basePrice, isAvailable: true };
    }
    return {
      price: override.price !== undefined && override.price > 0 ? override.price : basePrice,
      isAvailable: override.isAvailable,
    };
  }

  private notifyPriceListeners(): void {
    const dict = this.getPrices();
    for (const listener of this.priceListeners) {
      listener(dict);
    }
  }
}

/**
 * Resend API Email Dispatch & Template Generator Simulator
 */
export class ResendEmailService {
  private sentEmails: Array<{
    type: "customer" | "owner";
    to: string;
    subject: string;
    html: string;
    orderId: string;
    timestamp: string;
  }> = [];

  public clear(): void {
    this.sentEmails = [];
  }

  public getSentEmails() {
    return [...this.sentEmails];
  }

  public static escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  public generateCustomerEmailHtml(order: Order): string {
    const escapedName = ResendEmailService.escapeHtml(order.customer.name);
    const escapedNotes = ResendEmailService.escapeHtml(order.customer.notes || "Bez špeciálnych poznámok");
    const formattedPrice = `${order.totalPrice.toFixed(2).replace(".", ",")} €`;

    const itemsListHtml = order.items
      .map((it) => {
        const itemEscapedName = ResendEmailService.escapeHtml(it.name);
        let details = "";
        if (it.size) details += `<br><small>Veľkosť: ${ResendEmailService.escapeHtml(it.size)}</small>`;
        if (it.korpus) details += `<br><small>Korpus: ${ResendEmailService.escapeHtml(it.korpus)}</small>`;
        if (it.krem) details += `<br><small>Krém: ${ResendEmailService.escapeHtml(it.krem)}</small>`;
        return `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #EAE5DC;">
            <strong>${itemEscapedName}</strong> (${it.quantity} ks)${details}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #EAE5DC; text-align: right;">
            ${it.totalPrice.toFixed(2).replace(".", ",")} €
          </td>
        </tr>`;
      })
      .join("");

    return `
      <div style="background-color: #FAF8F5; font-family: sans-serif; color: #261B24; padding: 24px;">
        <h2 style="color: #a62891;">Potvrdenie rezervácie — Cukráreň Hanela</h2>
        <p>Vážená/ý <strong>${escapedName}</strong>,</p>
        <p>vaša rezervácia <strong>${order.orderNumber}</strong> bola prijatá.</p>
        <div style="background: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>Dátum vyzdvihnutia:</strong> ${order.pickupDate} o ${order.pickupTime}</p>
          <p><strong>Miesto:</strong> Hlavná 42, Viničné</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            ${itemsListHtml}
            <tr>
              <td style="padding: 12px 8px; font-weight: bold;">Spolu k úhrade pri prevzatí:</td>
              <td style="padding: 12px 8px; font-weight: bold; text-align: right; color: #a62891;">${formattedPrice}</td>
            </tr>
          </table>
          <p style="margin-top: 12px; font-size: 13px; color: #6B5B65;">Poznámka k objednávke: ${escapedNotes}</p>
        </div>
      </div>
    `.trim();
  }

  public generateOwnerEmailHtml(order: Order): string {
    const escapedName = ResendEmailService.escapeHtml(order.customer.name);
    const escapedPhone = ResendEmailService.escapeHtml(order.customer.phone);
    const escapedEmail = ResendEmailService.escapeHtml(order.customer.email);
    const escapedAllergies = ResendEmailService.escapeHtml(order.customer.allergies || "Žiadne hlásené alergie");
    const escapedNotes = ResendEmailService.escapeHtml(order.customer.notes || "Žiadne");

    return `
      <div style="background-color: #FAF8F5; font-family: sans-serif; color: #261B24; padding: 24px;">
        <h2 style="color: #261B24;">Nová objednávka: ${order.orderNumber}</h2>
        <p>Termín: <strong>${order.pickupDate} o ${order.pickupTime}</strong></p>
        <p>Zákazník: ${escapedName} (${escapedPhone}, ${escapedEmail})</p>
        <div style="background: #FBF2F2; border: 1px solid #EDD5D5; padding: 12px; border-radius: 6px; margin: 12px 0;">
          <strong>⚠️ Alergie / Diéty:</strong> ${escapedAllergies}
        </div>
        <p><strong>Poznámky:</strong> ${escapedNotes}</p>
        <p><strong>Suma:</strong> ${order.totalPrice.toFixed(2)} €</p>
      </div>
    `.trim();
  }

  public async sendOrderEmails(order: Order): Promise<{
    success: boolean;
    customerEmailId?: string;
    ownerEmailId?: string;
    error?: string;
  }> {
    if (!order || !order.customer || !order.customer.email) {
      return { success: false, error: "Missing required order or customer email" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer.email)) {
      return { success: false, error: "Invalid customer email address format" };
    }

    const customerHtml = this.generateCustomerEmailHtml(order);
    const ownerHtml = this.generateOwnerEmailHtml(order);

    const customerEmailId = `resend-cust-${Date.now()}`;
    const ownerEmailId = `resend-owner-${Date.now()}`;

    this.sentEmails.push({
      type: "customer",
      to: order.customer.email,
      subject: `Potvrdenie rezervácie ${order.orderNumber} — Cukráreň Hanela`,
      html: customerHtml,
      orderId: order.id,
      timestamp: new Date().toISOString(),
    });

    this.sentEmails.push({
      type: "owner",
      to: "cukraren.hanela@gmail.com",
      subject: `[Nová objednávka] ${order.orderNumber} na ${order.pickupDate}`,
      html: ownerHtml,
      orderId: order.id,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      customerEmailId,
      ownerEmailId,
    };
  }
}

/**
 * Domain Calculation & Business Rules Engine
 */
export class DomainRulesEngine {
  /**
   * Enforces item quantity rules:
   * "zakusky" must be minimum 5 ks; other categories minimum 1 ks.
   */
  public static validateCartItemQuantity(category: string, requestedQty: number): number {
    if (requestedQty <= 0) return 0;
    if (category === "zakusky") {
      return Math.max(5, Math.floor(requestedQty));
    }
    return Math.max(1, Math.floor(requestedQty));
  }

  /**
   * Computes header stats for Admin shell:
   * - activeOrdersCount: orders in "nova" or "vyroba"
   * - todayPickupsCount: non-canceled orders with pickupDate === today
   * - totalRevenue: sum of totalPrice for non-canceled orders
   * - blockedDaysCount: total active blocked dates
   */
  public static computeAdminStats(
    orders: Order[],
    blockedDates: BlockedDate[],
    todayDateStr: string
  ): {
    activeOrdersCount: number;
    todayPickupsCount: number;
    totalRevenue: number;
    blockedDaysCount: number;
  } {
    let activeOrdersCount = 0;
    let todayPickupsCount = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      if (order.status !== "zrusena") {
        totalRevenue += order.totalPrice;
        if (order.status === "nova" || order.status === "vyroba") {
          activeOrdersCount += 1;
        }
        if (order.pickupDate === todayDateStr) {
          todayPickupsCount += 1;
        }
      }
    }

    return {
      activeOrdersCount,
      todayPickupsCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      blockedDaysCount: blockedDates.length,
    };
  }

  /**
   * Status progression step:
   * nova -> vyroba -> pripravena -> odovzdana
   */
  public static getNextStatus(current: OrderStatus): OrderStatus | null {
    return STATUS_PROGRESSION[current] || null;
  }

  /**
   * Filter orders by search query across customer name, phone, email, or orderNumber
   * Supports diacritic-insensitive search (e.g. "kovac" matches "Kováčová")
   */
  public static filterOrders(orders: Order[], query: string, statusFilter: string = "all"): Order[] {
    const stripDiacritics = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const q = stripDiacritics(query.trim());
    return orders.filter((ord) => {
      if (statusFilter !== "all" && ord.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const matchNum = stripDiacritics(ord.orderNumber).includes(q);
      const matchName = stripDiacritics(ord.customer.name).includes(q);
      const matchPhone = stripDiacritics(ord.customer.phone).includes(q);
      const matchEmail = stripDiacritics(ord.customer.email).includes(q);
      return matchNum || matchName || matchPhone || matchEmail;
    });
  }

  /**
   * Validates customer details on reservation submission
   */
  public static validateReservationPayload(payload: {
    customer: CustomerDetails;
    pickupDate: string;
    pickupTime: string;
    items: CartItem[];
    blockedDates: BlockedDate[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.customer.name || payload.customer.name.trim().length < 2) {
      errors.push("Meno a priezvisko musí mať aspoň 2 znaky.");
    }
    // Slovak/Czech/International phone format
    const cleanPhone = payload.customer.phone.replace(/[\s().-]/g, "");
    if (!payload.customer.phone || !/^[+]?\d{9,15}$/.test(cleanPhone)) {
      errors.push("Zadajte platné telefónne číslo.");
    }
    if (!payload.customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer.email.trim())) {
      errors.push("Zadajte platnú emailovú adresu.");
    }
    if (!payload.pickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.pickupDate)) {
      errors.push("Zadajte platný dátum vyzdvihnutia (YYYY-MM-DD).");
    }
    if (payload.blockedDates.some((b) => b.date === payload.pickupDate)) {
      errors.push("Zvolený dátum je zablokovaný pre novú výrobu.");
    }
    if (!payload.pickupTime) {
      errors.push("Zvoľte čas vyzdvihnutia.");
    }
    if (!payload.items || payload.items.length === 0) {
      errors.push("Košík je prázdny.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates kitchen print receipt structure
   */
  public static formatKitchenReceipt(order: Order): {
    orderNumber: string;
    pickupDate: string;
    pickupTime: string;
    customerName: string;
    customerPhone: string;
    allergies: string;
    notes: string;
    internalNote: string;
    items: Array<{
      name: string;
      quantity: number;
      size?: string;
      korpus?: string;
      krem?: string;
      doplnky?: string[];
      diets?: string[];
      zdobenie?: string[];
      cakeNote?: string;
    }>;
  } {
    return {
      orderNumber: order.orderNumber,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      allergies: order.customer.allergies || "Žiadne hlásené alergie",
      notes: order.customer.notes || "Žiadne zákaznícke poznámky",
      internalNote: order.internalNote || "Bez internej poznámky",
      items: order.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        size: it.size,
        korpus: it.korpus,
        krem: it.krem,
        doplnky: it.doplnky,
        diets: it.diets,
        zdobenie: it.zdobenie,
        cakeNote: it.cakeNote,
      })),
    };
  }
}
