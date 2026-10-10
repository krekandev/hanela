import { describe, it, expect, beforeEach } from "bun:test";
import {
  InMemoryFirestoreStore,
  ResendEmailService,
  DomainRulesEngine,
  STATUS_DESIGN_TOKENS,
  Order,
  CartItem,
} from "./harness";

describe("Tier 3: Cross-Feature Interactions (Pairwise)", () => {
  let store: InMemoryFirestoreStore;
  let emailService: ResendEmailService;

  beforeEach(() => {
    store = new InMemoryFirestoreStore();
    emailService = new ResendEmailService();
  });

  it("T3-01 (F1 ↔ F6): Blocking a date in Firestore immediately prevents customer booking for that date", async () => {
    const targetDate = "2026-11-15";
    // Initially open
    expect(store.isDateBlocked(targetDate)).toBe(false);

    // Admin blocks date in F6/F1
    await store.blockDate(targetDate, "Plná kapacita výroby");
    expect(store.isDateBlocked(targetDate)).toBe(true);

    // Customer attempts reservation in F8
    const valResult = DomainRulesEngine.validateReservationPayload({
      customer: { name: "Pavol Kováč", phone: "+421905111222", email: "pavol@kovac.sk" },
      pickupDate: targetDate,
      pickupTime: "15:00",
      items: [{ id: "i1", productId: "p1", name: "Torta", slug: "torta", category: "torty-mieru", image: "", unitPrice: 70, quantity: 1, totalPrice: 70 }],
      blockedDates: store.getBlockedDates(),
    });

    expect(valResult.valid).toBe(false);
    expect(valResult.errors.some((err) => err.includes("zablokovaný"))).toBe(true);
  });

  it("T3-02 (F1 ↔ F7): Price override in Firestore immediately reflects in customer cart unit price", async () => {
    const productId = "vikendovy-mix-velky";
    const catalogBasePrice = 35;

    // Base price
    const initial = store.resolveEffectivePrice(productId, catalogBasePrice);
    expect(initial.price).toBe(35);

    // Admin updates price to 40 €
    await store.saveProductPrice(productId, 40, true);

    // Customer page resolves effective price
    const updated = store.resolveEffectivePrice(productId, catalogBasePrice);
    expect(updated.price).toBe(40);

    // Adding 2 boxes to customer cart
    const itemQuantity = 2;
    const cartItem: CartItem = {
      id: "cart-1",
      productId,
      name: "Víkendový box",
      slug: productId,
      category: "mix",
      image: "",
      unitPrice: updated.price,
      quantity: itemQuantity,
      totalPrice: updated.price * itemQuantity,
    };

    expect(cartItem.totalPrice).toBe(80); // 40 * 2
  });

  it("T3-03 (F1 ↔ F2): Firestore order persistence triggers Resend transactional email with matching orderNumber", async () => {
    const savedOrder = await store.saveOrder({
      pickupDate: "2026-10-25",
      pickupTime: "11:00",
      customer: { name: "Zuzana Malá", phone: "+421908777888", email: "zuzana@mala.sk" },
      items: [{ id: "1", productId: "p", name: "Cheesecake", slug: "cheesecake", category: "torty-cheesecakes", image: "", unitPrice: 42, quantity: 1, totalPrice: 42 }],
      totalPrice: 42,
    });

    const emailRes = await emailService.sendOrderEmails(savedOrder);
    expect(emailRes.success).toBe(true);

    const sent = emailService.getSentEmails();
    const customerMail = sent.find((e) => e.type === "customer");
    const ownerMail = sent.find((e) => e.type === "owner");

    expect(customerMail?.html).toContain(savedOrder.orderNumber);
    expect(ownerMail?.html).toContain(savedOrder.orderNumber);
  });

  it("T3-04 (F4 ↔ F5): Changing order status in Objednávky module instantly updates pickup item status badge in Kalendár výroby", async () => {
    const order = await store.saveOrder({
      pickupDate: "2026-10-26",
      pickupTime: "15:30",
      customer: { name: "Miroslav Urban", phone: "+421905333111", email: "miro@urban.sk" },
      items: [],
      totalPrice: 60,
      status: "nova",
    });

    // Calendar view checks status badge
    let calendarBadgeText = STATUS_DESIGN_TOKENS[order.status].label;
    expect(calendarBadgeText).toBe("Nová");

    // Orders tab advances status
    await store.updateOrderStatus(order.id, "vyroba");

    // Refreshed order in calendar
    const refreshed = store.getOrders().find((o) => o.id === order.id);
    expect(refreshed?.status).toBe("vyroba");
    calendarBadgeText = STATUS_DESIGN_TOKENS[refreshed!.status].label;
    expect(calendarBadgeText).toBe("Vo výrobe");
  });

  it("T3-05 (F3 ↔ F5): Status progression in Objednávky module updates header stats counters dynamically", async () => {
    const today = "2026-10-27";
    const order = await store.saveOrder({
      pickupDate: today,
      pickupTime: "16:00",
      customer: { name: "Katarína", phone: "+421905444333", email: "katka@ex.sk" },
      items: [],
      totalPrice: 90,
      status: "nova",
    });

    let stats = DomainRulesEngine.computeAdminStats(store.getOrders(), [], today);
    expect(stats.activeOrdersCount).toBe(1);
    expect(stats.totalRevenue).toBe(90);

    // Mark as finished / delivered
    await store.updateOrderStatus(order.id, "odovzdana");

    stats = DomainRulesEngine.computeAdminStats(store.getOrders(), [], today);
    expect(stats.activeOrdersCount).toBe(0); // "odovzdana" is no longer active
    expect(stats.totalRevenue).toBe(90);     // revenue is still retained
  });

  it("T3-06 (F6 ↔ F8): Unblocking a previously blocked date restores customer reservation capability", async () => {
    const targetDate = "2026-11-20";
    await store.blockDate(targetDate, "Sanitárny deň");

    // Blocked validation check
    let check = DomainRulesEngine.validateReservationPayload({
      customer: { name: "Jozef", phone: "+421905111222", email: "jozef@ex.sk" },
      pickupDate: targetDate,
      pickupTime: "11:00",
      items: [{ id: "1", productId: "p", name: "Box", slug: "box", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });
    expect(check.valid).toBe(false);

    // Admin unblocks
    await store.unblockDate(targetDate);

    // Validation re-run
    check = DomainRulesEngine.validateReservationPayload({
      customer: { name: "Jozef", phone: "+421905111222", email: "jozef@ex.sk" },
      pickupDate: targetDate,
      pickupTime: "11:00",
      items: [{ id: "1", productId: "p", name: "Box", slug: "box", category: "mix", image: "", unitPrice: 35, quantity: 1, totalPrice: 35 }],
      blockedDates: store.getBlockedDates(),
    });
    expect(check.valid).toBe(true);
  });

  it("T3-07 (F7 ↔ F8): Product disabled in Zmena cien cannot be selected or ordered in customer cart", async () => {
    const productId = "malinovy-cheesecake";
    await store.saveProductPrice(productId, undefined, false); // isAvailable = false

    const effective = store.resolveEffectivePrice(productId, 42);
    expect(effective.isAvailable).toBe(false);

    // Simulating frontend guard: disabled product cannot add item
    const canAddToCart = effective.isAvailable;
    expect(canAddToCart).toBe(false);
  });

  it("T3-08 (F2 ↔ F8): Reservation allergy notes from reservation flow are correctly passed into Resend email template", async () => {
    const allergyText = "Silná alergia na orechy a sezam!";
    const specialDecorNote = "Ružová mašľa na balenie";

    const order = await store.saveOrder({
      pickupDate: "2026-10-30",
      pickupTime: "15:00",
      customer: {
        name: "Silvia Vranová",
        phone: "+421903888777",
        email: "silvia@vrana.sk",
        allergies: allergyText,
        notes: specialDecorNote,
      },
      items: [{ id: "1", productId: "p1", name: "Torta", slug: "torta", category: "torty-mieru", image: "", unitPrice: 75, quantity: 1, totalPrice: 75 }],
      totalPrice: 75,
    });

    await emailService.sendOrderEmails(order);
    const ownerEmail = emailService.getSentEmails().find((e) => e.type === "owner");

    expect(ownerEmail?.html).toContain(allergyText);
    expect(ownerEmail?.html).toContain(specialDecorNote);
  });

  it("T3-09 (F1 ↔ F4): Kitchen print receipt formats real order data synchronized from Firestore", async () => {
    const order = await store.saveOrder({
      pickupDate: "2026-10-31",
      pickupTime: "11:30",
      customer: {
        name: "Roman Kováčik",
        phone: "+421908999000",
        email: "roman@kovacik.sk",
        allergies: "Bez lepku",
      },
      items: [
        {
          id: "item-print",
          productId: "ovocna-sviezost",
          name: "Ovocná sviežosť",
          slug: "ovocna-sviezost",
          category: "torty-mieru",
          image: "",
          unitPrice: 80,
          quantity: 1,
          totalPrice: 80,
          size: "10–15 porcií (Ø 21 cm)",
          korpus: "Mandľový korpus",
          krem: "Mascarpone s bielou čokoládou",
          cakeNote: "Nápis 'Všetko najlepšie deduško'",
        },
      ],
      totalPrice: 80,
      internalNote: "Vyzdvihne vnúčik Michal",
    });

    const receipt = DomainRulesEngine.formatKitchenReceipt(order);
    expect(receipt.orderNumber).toBe(order.orderNumber);
    expect(receipt.customerName).toBe("Roman Kováčik");
    expect(receipt.allergies).toBe("Bez lepku");
    expect(receipt.internalNote).toBe("Vyzdvihne vnúčik Michal");
    expect(receipt.items[0].korpus).toBe("Mandľový korpus");
    expect(receipt.items[0].cakeNote).toBe("Nápis 'Všetko najlepšie deduško'");
  });
});
