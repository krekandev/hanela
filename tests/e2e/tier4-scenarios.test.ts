import { describe, it, expect, beforeEach } from "bun:test";
import {
  InMemoryFirestoreStore,
  ResendEmailService,
  DomainRulesEngine,
  STATUS_DESIGN_TOKENS,
  Order,
  CartItem,
} from "./harness";

describe("Tier 4: Real-World Application Scenarios", () => {
  let store: InMemoryFirestoreStore;
  let emailService: ResendEmailService;

  beforeEach(() => {
    store = new InMemoryFirestoreStore();
    emailService = new ResendEmailService();
  });

  // =========================================================================
  // Scenario 1: Complete Custom Wedding Cake Booking Flow
  // =========================================================================
  it("T4-01: Realistic wedding cake reservation with customizations, allergy alerts, email confirmation, and calendar timeline entry", async () => {
    const pickupDate = "2026-11-14";
    const pickupTime = "11:00";

    // 1. Customer configures tiered wedding cake
    const weddingCakeItem: CartItem = {
      id: "wedding-cake-item-1",
      productId: "svadobna-elegancia",
      name: "Trojposchodová svadobná torta",
      slug: "svadobna-elegancia",
      category: "torty-mieru",
      image: "/images/wedding.webp",
      unitPrice: 280,
      quantity: 1,
      totalPrice: 280,
      size: "24–30 porcií (Ø 27 cm)",
      korpus: "Mandľový korpus",
      krem: "Mascarpone s bielou čokoládou",
      doplnky: ["Malinová redukcia", "Slaný karamel"],
      diets: ["Bezlepková úprava"],
      zdobenie: ["Personalizovaný zápich s menami mladomanželov (+12 €)"],
      cakeNote: "Jemné biele pivonky a zlaté akcenty",
    };

    const customerData = {
      name: "Veronika & Martin Blaškovič",
      phone: "+421 917 555 888",
      email: "veronika.blaskovic@gmail.com",
      allergies: "Silná celiakia (bezlepková kuchyňa nutná)",
      notes: "Prosíme vyzdvihnutie presne o 11:00, svadobný fotograf bude pri preberaní.",
    };

    // 2. Validate submission
    const validation = DomainRulesEngine.validateReservationPayload({
      customer: customerData,
      pickupDate,
      pickupTime,
      items: [weddingCakeItem],
      blockedDates: store.getBlockedDates(),
    });
    expect(validation.valid).toBe(true);

    // 3. Persist order in Firestore
    const order = await store.saveOrder({
      pickupDate,
      pickupTime,
      customer: customerData,
      items: [weddingCakeItem],
      totalPrice: 280,
    });

    expect(order.orderNumber).toMatch(/^HAN-\d{4}-\d{3}$/);
    expect(order.status).toBe("nova");

    // 4. Dispatch transactional emails
    const emailResult = await emailService.sendOrderEmails(order);
    expect(emailResult.success).toBe(true);

    const sentEmails = emailService.getSentEmails();
    const customerMail = sentEmails.find((e) => e.type === "customer");
    const ownerMail = sentEmails.find((e) => e.type === "owner");

    expect(customerMail?.html).toContain("280,00 €");
    expect(customerMail?.html).toContain("Trojposchodová svadobná torta");
    expect(ownerMail?.html).toContain("Silná celiakia");

    // 5. Verify presence in Kalendár výroby daily schedule
    const allOrders = store.getOrders();
    const dayOrders = allOrders.filter((o) => o.pickupDate === pickupDate);
    expect(dayOrders.length).toBe(1);
    expect(dayOrders[0].pickupTime).toBe("11:00");
    expect(dayOrders[0].items[0].korpus).toBe("Mandľový korpus");
  });

  // =========================================================================
  // Scenario 2: Emergency Capacity Blocking Workflow
  // =========================================================================
  it("T4-02: Bakery emergency capacity blocking: Saturday maxed out, customer rejected, rescheduled to Sunday", async () => {
    const saturday = "2026-11-21";
    const sunday = "2026-11-22";

    // 1. Owner realizes Saturday capacity is full -> 1-click blocks day
    await store.blockDate(saturday, "Plná kapacita výroby");
    expect(store.isDateBlocked(saturday)).toBe(true);

    // 2. Customer attempts to book for Saturday
    const satAttempt = DomainRulesEngine.validateReservationPayload({
      customer: { name: "Marek Vlk", phone: "+421908123456", email: "marek@vlk.sk" },
      pickupDate: saturday,
      pickupTime: "15:00",
      items: [{ id: "it1", productId: "mix", name: "Box", slug: "box", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });

    expect(satAttempt.valid).toBe(false);
    expect(satAttempt.errors.some((err) => err.includes("zablokovaný"))).toBe(true);

    // 3. Customer changes date to Sunday
    const sunAttempt = DomainRulesEngine.validateReservationPayload({
      customer: { name: "Marek Vlk", phone: "+421908123456", email: "marek@vlk.sk" },
      pickupDate: sunday,
      pickupTime: "11:00",
      items: [{ id: "it1", productId: "mix", name: "Box", slug: "box", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });

    expect(sunAttempt.valid).toBe(true);

    // 4. Booking successfully completes for Sunday
    const order = await store.saveOrder({
      pickupDate: sunday,
      pickupTime: "11:00",
      customer: { name: "Marek Vlk", phone: "+421908123456", email: "marek@vlk.sk" },
      items: [{ id: "it1", productId: "mix", name: "Box", slug: "box", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      totalPrice: 35,
    });

    expect(order.pickupDate).toBe(sunday);
    expect(store.getOrders().length).toBe(1);
  });

  // =========================================================================
  // Scenario 3: Seasonal Price Surge & Catalog Availability Update
  // =========================================================================
  it("T4-03: Bakery updates seasonal pricing and disables sold-out items with immediate cart reflection", async () => {
    const boxId = "vikendovy-mix-velky";
    const cheesecakeId = "malinovy-cheesecake";

    // 1. Owner changes price of weekend mix from 35 € to 40 €
    await store.saveProductPrice(boxId, 40, true);

    // 2. Owner marks raspberry cheesecake as sold out
    await store.saveProductPrice(cheesecakeId, undefined, false);

    // 3. Customer checks products
    const boxPrice = store.resolveEffectivePrice(boxId, 35);
    const cheesecakePrice = store.resolveEffectivePrice(cheesecakeId, 42);

    expect(boxPrice.price).toBe(40);
    expect(boxPrice.isAvailable).toBe(true);
    expect(cheesecakePrice.isAvailable).toBe(false);

    // 4. Customer adds 2 boxes to cart
    const qty = 2;
    const cartItem: CartItem = {
      id: "cart-item-surge",
      productId: boxId,
      name: "Víkendový degustačný box",
      slug: boxId,
      category: "mix",
      image: "",
      unitPrice: boxPrice.price,
      quantity: qty,
      totalPrice: boxPrice.price * qty,
    };

    expect(cartItem.unitPrice).toBe(40);
    expect(cartItem.totalPrice).toBe(80);
  });

  // =========================================================================
  // Scenario 4: Full Order Lifecycle Progression & Kitchen Ticket Printing
  // =========================================================================
  it("T4-04: Full lifecycle progression: nova -> search -> vyroba -> pripravena -> print ticket -> odovzdana with revenue tracking", async () => {
    const today = "2026-11-25";

    // 1. Customer places order for 10 pcs artisan desserts (status: nova)
    const order = await store.saveOrder({
      pickupDate: today,
      pickupTime: "15:30",
      customer: {
        name: "Juraj Slezák",
        phone: "+421905666777",
        email: "juraj@slezak.sk",
        notes: "Vyzdvihnutie cestou z práce",
      },
      items: [
        {
          id: "item-zakusky-1",
          productId: "tartaletka-malina",
          name: "Tartaletka Malinová",
          slug: "tartaletka-malina",
          category: "zakusky",
          image: "",
          unitPrice: 3.5,
          quantity: 10,
          totalPrice: 35,
        },
      ],
      totalPrice: 35,
      status: "nova",
    });

    // Initial stats check: 1 active order, 35 € revenue
    let stats = DomainRulesEngine.computeAdminStats(store.getOrders(), [], today);
    expect(stats.activeOrdersCount).toBe(1);
    expect(stats.todayPickupsCount).toBe(1);
    expect(stats.totalRevenue).toBe(35);

    // 2. Owner searches order by phone
    const found = DomainRulesEngine.filterOrders(store.getOrders(), "666777");
    expect(found.length).toBe(1);
    expect(found[0].id).toBe(order.id);

    // 3. Move to production (vyroba)
    const next1 = DomainRulesEngine.getNextStatus(order.status);
    expect(next1).toBe("vyroba");
    await store.updateOrderStatus(order.id, "vyroba");

    // 4. Confectioner finishes baking -> marks ready (pripravena)
    const next2 = DomainRulesEngine.getNextStatus("vyroba");
    expect(next2).toBe("pripravena");
    await store.updateOrderStatus(order.id, "pripravena");

    // 5. Print kitchen receipt ticket
    const refreshed = store.getOrders().find((o) => o.id === order.id);
    const receipt = DomainRulesEngine.formatKitchenReceipt(refreshed!);
    expect(receipt.orderNumber).toBe(order.orderNumber);
    expect(receipt.items[0].quantity).toBe(10);
    expect(receipt.customerName).toBe("Juraj Slezák");

    // 6. Customer picks up cake at 15:30 -> mark delivered (odovzdana)
    const next3 = DomainRulesEngine.getNextStatus("pripravena");
    expect(next3).toBe("odovzdana");
    await store.updateOrderStatus(order.id, "odovzdana");

    // Final stats check: 0 active orders, 35 € revenue retained
    stats = DomainRulesEngine.computeAdminStats(store.getOrders(), [], today);
    expect(stats.activeOrdersCount).toBe(0);
    expect(stats.totalRevenue).toBe(35);

    // Terminal state verification
    expect(DomainRulesEngine.getNextStatus("odovzdana")).toBeNull();
  });

  // =========================================================================
  // Scenario 5: Customer Invalidation & Error Recovery
  // =========================================================================
  it("T4-05: Customer booking error recovery: malformed input and blocked date rejected, corrected and completed", async () => {
    const blockedSaturday = "2026-11-28";
    const openSunday = "2026-11-29";
    await store.blockDate(blockedSaturday, "Plná kapacita");

    // Step 1: User submits invalid email and blocked date
    const attempt1 = DomainRulesEngine.validateReservationPayload({
      customer: {
        name: "Michaela",
        phone: "+421903123456",
        email: "not-an-email", // Malformed
      },
      pickupDate: blockedSaturday, // Blocked
      pickupTime: "11:30",
      items: [{ id: "1", productId: "p", name: "Mix", slug: "mix", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });

    expect(attempt1.valid).toBe(false);
    expect(attempt1.errors.length).toBeGreaterThanOrEqual(2);
    expect(attempt1.errors.some((e) => e.includes("emailovú"))).toBe(true);
    expect(attempt1.errors.some((e) => e.includes("zablokovaný"))).toBe(true);

    // Step 2: User fixes email and selects open Sunday
    const attempt2 = DomainRulesEngine.validateReservationPayload({
      customer: {
        name: "Michaela",
        phone: "+421903123456",
        email: "michaela@recovery.sk", // Valid
      },
      pickupDate: openSunday, // Open
      pickupTime: "11:30",
      items: [{ id: "1", productId: "p", name: "Mix", slug: "mix", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });

    expect(attempt2.valid).toBe(true);
    expect(attempt2.errors.length).toBe(0);

    // Step 3: Order succeeds and dispatches Resend confirmation
    const finalOrder = await store.saveOrder({
      pickupDate: openSunday,
      pickupTime: "11:30",
      customer: { name: "Michaela", phone: "+421903123456", email: "michaela@recovery.sk" },
      items: [{ id: "1", productId: "p", name: "Mix", slug: "mix", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      totalPrice: 35,
    });

    const emailStatus = await emailService.sendOrderEmails(finalOrder);
    expect(emailStatus.success).toBe(true);
    expect(emailService.getSentEmails().length).toBe(2);
  });
});
