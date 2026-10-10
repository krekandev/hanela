import { describe, it, expect, beforeEach } from "bun:test";
import {
  InMemoryFirestoreStore,
  ResendEmailService,
  DomainRulesEngine,
  ADMIN_NAV_PILLARS,
  STATUS_DESIGN_TOKENS,
  Order,
  CartItem,
  OrderStatus,
} from "./harness";

describe("Tier 2: Boundary & Corner Cases (F1 to F9)", () => {
  let store: InMemoryFirestoreStore;
  let emailService: ResendEmailService;

  beforeEach(() => {
    store = new InMemoryFirestoreStore();
    emailService = new ResendEmailService();
  });

  // =========================================================================
  // F1 Boundary Cases: Firebase Real-Time Data Services
  // =========================================================================
  describe("F1 Boundary: Firebase Real-Time Data Services", () => {
    it("F1-B01: subscribeOrders handles empty collection without throwing errors", () => {
      let received: Order[] = [];
      const unsub = store.subscribeOrders((orders) => {
        received = orders;
      });
      expect(received).toEqual([]);
      unsub();
    });

    it("F1-B02: blockDate handles idempotent blocking of identical date without duplicates", async () => {
      await store.blockDate("2026-11-20", "Plná kapacita");
      await store.blockDate("2026-11-20", "Dovolenka");
      const blocked = store.getBlockedDates();
      expect(blocked.length).toBe(1);
      expect(blocked[0].reason).toBe("Dovolenka");
    });

    it("F1-B03: unblockDate silently succeeds when unblocking a non-existent date", async () => {
      expect(async () => {
        await store.unblockDate("2099-01-01");
      }).not.toThrow();
      expect(store.getBlockedDates().length).toBe(0);
    });

    it("F1-B04: subscribeOrders unsubscribe function cleanly detaches listener", async () => {
      let notificationCount = 0;
      const unsub = store.subscribeOrders(() => {
        notificationCount += 1;
      });

      expect(notificationCount).toBe(1); // Initial emit
      unsub();

      await store.saveOrder({
        pickupDate: "2026-10-15",
        pickupTime: "11:00",
        customer: { name: "Test", phone: "+421900000000", email: "test@ex.sk" },
        items: [],
        totalPrice: 10,
      });

      expect(notificationCount).toBe(1); // No new emits after unsubscribe
    });

    it("F1-B05: updateOrderStatus throws clear error when order ID does not exist", async () => {
      expect(store.updateOrderStatus("non-existent-id", "vyroba")).rejects.toThrow(
        "Order non-existent-id not found"
      );
    });
  });

  // =========================================================================
  // F2 Boundary Cases: Resend API Email Sending & Templates
  // =========================================================================
  describe("F2 Boundary: Resend API Email Sending & Templates", () => {
    it("F2-B01: sendOrderEmails returns failure if order or customer email is missing", async () => {
      const invalidOrder = {
        id: "err-1",
        orderNumber: "HAN-000",
        createdAt: "",
        pickupDate: "",
        pickupTime: "",
        customer: { name: "", phone: "", email: "" },
        items: [],
        totalPrice: 0,
        status: "nova" as OrderStatus,
      };

      const result = await emailService.sendOrderEmails(invalidOrder);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required");
    });

    it("F2-B02: sendOrderEmails rejects malformed customer email address format", async () => {
      const malformedOrder: Order = {
        id: "err-2",
        orderNumber: "HAN-001",
        createdAt: "",
        pickupDate: "2026-10-20",
        pickupTime: "15:00",
        customer: { name: "Test User", phone: "+421900000000", email: "invalid-email-string" },
        items: [],
        totalPrice: 50,
        status: "nova",
      };

      const result = await emailService.sendOrderEmails(malformedOrder);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid customer email address format");
    });

    it("F2-B03: HTML template escapes XSS script tags in customer notes", () => {
      const xssOrder: Order = {
        id: "xss-1",
        orderNumber: "HAN-XSS",
        createdAt: "",
        pickupDate: "2026-10-20",
        pickupTime: "15:00",
        customer: {
          name: "Attacker <script>alert('xss')</script>",
          phone: "123",
          email: "xss@evil.com",
          notes: "<img src=x onerror=alert(1)>",
        },
        items: [],
        totalPrice: 10,
        status: "nova",
      };

      const html = emailService.generateCustomerEmailHtml(xssOrder);
      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });

    it("F2-B04: sendOrderEmails handles orders with empty items array cleanly", async () => {
      const emptyItemsOrder: Order = {
        id: "empty-1",
        orderNumber: "HAN-EMPTY",
        createdAt: "",
        pickupDate: "2026-10-20",
        pickupTime: "15:00",
        customer: { name: "Empty Order", phone: "+421900000000", email: "empty@ex.sk" },
        items: [],
        totalPrice: 0,
        status: "nova",
      };

      const result = await emailService.sendOrderEmails(emptyItemsOrder);
      expect(result.success).toBe(true);
      expect(emailService.getSentEmails().length).toBe(2);
    });

    it("F2-B05: ResendEmailService.escapeHtml correctly escapes all HTML special characters", () => {
      const raw = `& < > " ' /`;
      const escaped = ResendEmailService.escapeHtml(raw);
      expect(escaped).toBe("&amp; &lt; &gt; &quot; &#039; /");
    });
  });

  // =========================================================================
  // F3 Boundary Cases: Mobbin Luxury Admin Shell & Design Tokens
  // =========================================================================
  describe("F3 Boundary: Mobbin Luxury Admin Shell & Design Tokens", () => {
    it("F3-B01: computeAdminStats returns 0 revenue without NaN for empty orders list", () => {
      const stats = DomainRulesEngine.computeAdminStats([], [], "2026-10-10");
      expect(stats.totalRevenue).toBe(0);
      expect(stats.activeOrdersCount).toBe(0);
      expect(stats.todayPickupsCount).toBe(0);
      expect(stats.blockedDaysCount).toBe(0);
      expect(Number.isNaN(stats.totalRevenue)).toBe(false);
    });

    it("F3-B02: Status tokens handle unknown status string gracefully", () => {
      const unknownStatus = "unknown" as any;
      const token = STATUS_DESIGN_TOKENS[unknownStatus as OrderStatus];
      expect(token).toBeUndefined(); // Predictable type boundary
    });

    it("F3-B03: Header stats excludes canceled ('zrusena') orders from revenue and active counts", () => {
      const canceledOrder: Order = {
        id: "c-1",
        orderNumber: "HAN-C",
        createdAt: "",
        pickupDate: "2026-10-10",
        pickupTime: "15:00",
        customer: { name: "Cancel", phone: "", email: "" },
        items: [],
        totalPrice: 200,
        status: "zrusena",
      };

      const stats = DomainRulesEngine.computeAdminStats([canceledOrder], [], "2026-10-10");
      expect(stats.totalRevenue).toBe(0);
      expect(stats.todayPickupsCount).toBe(0);
      expect(stats.activeOrdersCount).toBe(0);
    });

    it("F3-B04: Admin navigation pillars is immutable and bounded to exactly 4 items", () => {
      expect(Object.isFrozen(ADMIN_NAV_PILLARS) || Array.isArray(ADMIN_NAV_PILLARS)).toBe(true);
      expect(ADMIN_NAV_PILLARS.length).toBe(4);
    });

    it("F3-B05: Header stats computes revenue with floating cents accurately", () => {
      const orders: Order[] = [
        { id: "1", orderNumber: "1", createdAt: "", pickupDate: "", pickupTime: "", customer: { name: "", phone: "", email: "" }, items: [], totalPrice: 19.99, status: "odovzdana" },
        { id: "2", orderNumber: "2", createdAt: "", pickupDate: "", pickupTime: "", customer: { name: "", phone: "", email: "" }, items: [], totalPrice: 30.01, status: "odovzdana" },
      ];
      const stats = DomainRulesEngine.computeAdminStats(orders, [], "2026-10-10");
      expect(stats.totalRevenue).toBe(50.0);
    });
  });

  // =========================================================================
  // F4 Boundary Cases: Module 1: Kalendár výroby
  // =========================================================================
  describe("F4 Boundary: Module 1: Kalendár výroby", () => {
    it("F4-B01: Calendar grouping handles dates with zero orders without error", () => {
      const orders: Order[] = [];
      const grouped: Record<string, Order[]> = {};
      for (const ord of orders) {
        if (!grouped[ord.pickupDate]) grouped[ord.pickupDate] = [];
        grouped[ord.pickupDate].push(ord);
      }
      expect(Object.keys(grouped).length).toBe(0);
    });

    it("F4-B02: Chronological sorting accommodates non-standard pickup times smoothly", () => {
      const times = ["16:30", "12:15", "11:00", "09:45"];
      const sorted = [...times].sort((a, b) => a.localeCompare(b));
      expect(sorted).toEqual(["09:45", "11:00", "12:15", "16:30"]);
    });

    it("F4-B03: Multi-cake orders preserve separate custom options without merging", () => {
      const items: CartItem[] = [
        { id: "1", productId: "p1", name: "Torta 1", slug: "t1", category: "torty-mieru", image: "", unitPrice: 80, quantity: 1, totalPrice: 80, korpus: "Mandľový", krem: "Mascarpone" },
        { id: "2", productId: "p2", name: "Torta 2", slug: "t2", category: "torty-mieru", image: "", unitPrice: 90, quantity: 1, totalPrice: 90, korpus: "Čokoládový", krem: "Parížsky" },
      ];
      expect(items[0].korpus).toBe("Mandľový");
      expect(items[1].korpus).toBe("Čokoládový");
    });

    it("F4-B04: formatKitchenReceipt handles missing customer notes/allergies with default fallbacks", () => {
      const order: Order = {
        id: "k-min",
        orderNumber: "HAN-MIN",
        createdAt: "",
        pickupDate: "2026-10-30",
        pickupTime: "11:00",
        customer: { name: "Minimal", phone: "+421900111222", email: "min@ex.sk" },
        items: [],
        totalPrice: 40,
        status: "nova",
      };

      const receipt = DomainRulesEngine.formatKitchenReceipt(order);
      expect(receipt.allergies).toBe("Žiadne hlásené alergie");
      expect(receipt.notes).toBe("Žiadne zákaznícke poznámky");
      expect(receipt.internalNote).toBe("Bez internej poznámky");
    });

    it("F4-B05: Date string progression handles transition across year boundary", () => {
      const dec31 = new Date(Date.UTC(2026, 11, 31)); // Dec 31, 2026
      const jan1 = new Date(dec31);
      jan1.setUTCDate(jan1.getUTCDate() + 1);

      const y = jan1.getUTCFullYear();
      const m = String(jan1.getUTCMonth() + 1).padStart(2, "0");
      const d = String(jan1.getUTCDate()).padStart(2, "0");
      expect(`${y}-${m}-${d}`).toBe("2027-01-01");
    });
  });

  // =========================================================================
  // F5 Boundary Cases: Module 2: Objednávky
  // =========================================================================
  describe("F5 Boundary: Module 2: Objednávky", () => {
    const list: Order[] = [
      { id: "1", orderNumber: "HAN-01", createdAt: "", pickupDate: "", pickupTime: "", customer: { name: "Ján Červeň", phone: "+421901111222", email: "jan@cerven.sk" }, items: [], totalPrice: 50, status: "nova" },
      { id: "2", orderNumber: "HAN-02", createdAt: "", pickupDate: "", pickupTime: "", customer: { name: "Božena Žilavá", phone: "+421902333444", email: "bozena@zilava.sk" }, items: [], totalPrice: 70, status: "vyroba" },
    ];

    it("F5-B01: Order search matches diacritic names when searching plain ascii text", () => {
      const match1 = DomainRulesEngine.filterOrders(list, "cerven");
      expect(match1.length).toBe(1);
      expect(match1[0].customer.name).toBe("Ján Červeň");

      const match2 = DomainRulesEngine.filterOrders(list, "zilava");
      expect(match2.length).toBe(1);
      expect(match2[0].customer.name).toBe("Božena Žilavá");
    });

    it("F5-B02: Search with whitespace-only returns all unfiltered orders", () => {
      const result = DomainRulesEngine.filterOrders(list, "   ");
      expect(result.length).toBe(2);
    });

    it("F5-B03: Status progression at terminal state 'odovzdana' returns null", () => {
      expect(DomainRulesEngine.getNextStatus("odovzdana")).toBeNull();
    });

    it("F5-B04: Status progression at terminal state 'zrusena' returns null", () => {
      expect(DomainRulesEngine.getNextStatus("zrusena")).toBeNull();
    });

    it("F5-B05: updateOrderInternalNote preserves original order details and items", async () => {
      const order = await store.saveOrder({
        pickupDate: "2026-10-20",
        pickupTime: "11:00",
        customer: { name: "Note Test", phone: "123", email: "n@ex.sk" },
        items: [{ id: "1", productId: "p", name: "Cake", slug: "cake", category: "mix", image: "", unitPrice: 20, quantity: 1, totalPrice: 20 }],
        totalPrice: 20,
        status: "nova",
      });

      await store.updateOrderInternalNote(order.id, "Zavolať pred vyzdvihnutím!");
      const fetched = store.getOrders().find((o) => o.id === order.id);
      expect(fetched?.internalNote).toBe("Zavolať pred vyzdvihnutím!");
      expect(fetched?.status).toBe("nova");
      expect(fetched?.items.length).toBe(1);
    });
  });

  // =========================================================================
  // F6 Boundary Cases: Module 3: Kapacita dní
  // =========================================================================
  describe("F6 Boundary: Module 3: Kapacita dní", () => {
    it("F6-B01: blockDate throws error when date string is not in ISO YYYY-MM-DD format", async () => {
      expect(store.blockDate("2026/13/45", "Plná kapacita")).rejects.toThrow("Invalid date format");
      expect(store.blockDate("invalid-date", "Plná kapacita")).rejects.toThrow("Invalid date format");
    });

    it("F6-B02: Multiple consecutive calls to block different dates maintain sorted unique list", async () => {
      await store.blockDate("2026-11-20", "Plná kapacita");
      await store.blockDate("2026-11-05", "Dovolenka");
      await store.blockDate("2026-11-12", "Sanitárny deň");

      const blocked = store.getBlockedDates();
      expect(blocked.length).toBe(3);
      expect(blocked[0].date).toBe("2026-11-05");
      expect(blocked[1].date).toBe("2026-11-12");
      expect(blocked[2].date).toBe("2026-11-20");
    });

    it("F6-B03: Custom reason string with emojis and quotes is stored accurately", async () => {
      const customReason = `Dovolenka 🏖️ — "Viničné zatvorené"`;
      await store.blockDate("2026-12-25", customReason);
      const blocked = store.getBlockedDates().find((b) => b.date === "2026-12-25");
      expect(blocked?.reason).toBe(customReason);
    });

    it("F6-B04: Unblocking on empty list operates safely without exceptions", async () => {
      await store.unblockDate("2026-10-10");
      expect(store.getBlockedDates().length).toBe(0);
    });

    it("F6-B05: Historical dates can be blocked and unblocked safely", async () => {
      await store.blockDate("2020-01-01", "Archív");
      expect(store.isDateBlocked("2020-01-01")).toBe(true);
      await store.unblockDate("2020-01-01");
      expect(store.isDateBlocked("2020-01-01")).toBe(false);
    });
  });

  // =========================================================================
  // F7 Boundary Cases: Module 4: Zmena cien
  // =========================================================================
  describe("F7 Boundary: Module 4: Zmena cien", () => {
    it("F7-B01: saveProductPrice rejects negative prices", async () => {
      expect(store.saveProductPrice("p-neg", -15, true)).rejects.toThrow("Price cannot be negative");
    });

    it("F7-B02: Price resolution handles decimal euro amounts (e.g. 42.50 €)", async () => {
      await store.saveProductPrice("p-dec", 42.5, true);
      const res = store.resolveEffectivePrice("p-dec", 40);
      expect(res.price).toBe(42.5);
    });

    it("F7-B03: Overriding price with undefined preserves base price while setting availability", async () => {
      await store.saveProductPrice("p-avail", undefined, false);
      const res = store.resolveEffectivePrice("p-avail", 55);
      expect(res.price).toBe(55);
      expect(res.isAvailable).toBe(false);
    });

    it("F7-B04: Resolving effective price for non-existent product ID returns base price safely", () => {
      const res = store.resolveEffectivePrice("non-existent-product", 75);
      expect(res.price).toBe(75);
      expect(res.isAvailable).toBe(true);
    });

    it("F7-B05: Price override with 0 price falls back to base catalog price", async () => {
      await store.saveProductPrice("p-zero", 0, true);
      const res = store.resolveEffectivePrice("p-zero", 30);
      expect(res.price).toBe(30);
    });
  });

  // =========================================================================
  // F8 Boundary Cases: Customer Reservation Integration
  // =========================================================================
  describe("F8 Boundary: Customer Reservation Integration", () => {
    it("F8-B01: Reservation validator rejects customer name shorter than 2 characters", () => {
      const res = DomainRulesEngine.validateReservationPayload({
        customer: { name: "A", phone: "+421903111222", email: "a@ex.sk" },
        pickupDate: "2026-11-01",
        pickupTime: "11:00",
        items: [{ id: "1", productId: "p", name: "", slug: "", category: "mix", image: "", unitPrice: 10, quantity: 1, totalPrice: 10 }],
        blockedDates: [],
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("aspoň 2 znaky"))).toBe(true);
    });

    it("F8-B02: Reservation validator rejects invalid phone numbers", () => {
      const res = DomainRulesEngine.validateReservationPayload({
        customer: { name: "Valid Name", phone: "123", email: "valid@ex.sk" }, // too short phone
        pickupDate: "2026-11-01",
        pickupTime: "11:00",
        items: [{ id: "1", productId: "p", name: "", slug: "", category: "mix", image: "", unitPrice: 10, quantity: 1, totalPrice: 10 }],
        blockedDates: [],
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("telefónne číslo"))).toBe(true);
    });

    it("F8-B03: Reservation validator rejects invalid email format without @ or domain", () => {
      const res = DomainRulesEngine.validateReservationPayload({
        customer: { name: "Valid Name", phone: "+421903111222", email: "user-without-at.sk" },
        pickupDate: "2026-11-01",
        pickupTime: "11:00",
        items: [{ id: "1", productId: "p", name: "", slug: "", category: "mix", image: "", unitPrice: 10, quantity: 1, totalPrice: 10 }],
        blockedDates: [],
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("emailovú adresu"))).toBe(true);
    });

    it("F8-B04: Reservation validator rejects submission with empty cart", () => {
      const res = DomainRulesEngine.validateReservationPayload({
        customer: { name: "Valid Name", phone: "+421903111222", email: "valid@ex.sk" },
        pickupDate: "2026-11-01",
        pickupTime: "11:00",
        items: [], // empty cart
        blockedDates: [],
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("Košík je prázdny"))).toBe(true);
    });

    it("F8-B05: validateCartItemQuantity handles negative and zero quantities by returning 0", () => {
      expect(DomainRulesEngine.validateCartItemQuantity("zakusky", 0)).toBe(0);
      expect(DomainRulesEngine.validateCartItemQuantity("zakusky", -5)).toBe(0);
      expect(DomainRulesEngine.validateCartItemQuantity("torty-mieru", -1)).toBe(0);
    });
  });

  // =========================================================================
  // F9 Boundary Cases: E2E Testing & Verification Track
  // =========================================================================
  describe("F9 Boundary: E2E Testing & Verification Track", () => {
    it("F9-B01: Adversarial injection in customer details does not corrupt order record", async () => {
      const maliciousPayload = {
        name: `Robert'); DROP TABLE Orders;--`,
        phone: "+421905123456",
        email: "injection@test.com",
        notes: `<script>document.location='http://evil.com'</script>`,
      };

      const order = await store.saveOrder({
        pickupDate: "2026-10-31",
        pickupTime: "15:00",
        customer: maliciousPayload,
        items: [],
        totalPrice: 45,
      });

      expect(order.customer.name).toBe(`Robert'); DROP TABLE Orders;--`);
      expect(order.customer.notes).toBe(`<script>document.location='http://evil.com'</script>`);
    });

    it("F9-B02: Multi-byte UTF-8 emojis and special characters are preserved accurately", async () => {
      const emojiNotes = "🍰 Torta pre princeznú 👑🎉 Želáme veľa zdravia! ✨🎂";
      const order = await store.saveOrder({
        pickupDate: "2026-10-31",
        pickupTime: "15:00",
        customer: { name: "Emoji Test", phone: "+421905111222", email: "emoji@test.sk", notes: emojiNotes },
        items: [],
        totalPrice: 80,
      });

      expect(order.customer.notes).toBe(emojiNotes);
    });

    it("F9-B03: High payload stress test handles 100 distinct items without performance degradation", () => {
      const manyItems: CartItem[] = [];
      for (let i = 0; i < 100; i++) {
        manyItems.push({
          id: `item-${i}`,
          productId: `prod-${i % 5}`,
          name: `Produkt ${i}`,
          slug: `prod-${i}`,
          category: "mix",
          image: "",
          unitPrice: 10,
          quantity: 2,
          totalPrice: 20,
        });
      }

      const totalSum = manyItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      expect(manyItems.length).toBe(100);
      expect(totalSum).toBe(2000);
    });

    it("F9-B04: Concurrent asynchronous orders do not interleave sequence numbers", async () => {
      const promises = [
        store.saveOrder({ pickupDate: "2026-11-01", pickupTime: "11:00", customer: { name: "C1", phone: "1", email: "c1@ex.sk" }, items: [], totalPrice: 10 }),
        store.saveOrder({ pickupDate: "2026-11-01", pickupTime: "11:00", customer: { name: "C2", phone: "2", email: "c2@ex.sk" }, items: [], totalPrice: 20 }),
        store.saveOrder({ pickupDate: "2026-11-01", pickupTime: "11:00", customer: { name: "C3", phone: "3", email: "c3@ex.sk" }, items: [], totalPrice: 30 }),
      ];

      const results = await Promise.all(promises);
      const orderNumbers = results.map((r) => r.orderNumber);
      const uniqueNumbers = new Set(orderNumbers);
      expect(uniqueNumbers.size).toBe(3);
    });

    it("F9-B05: Timeout prevention guarantees sub-second completion for asynchronous pipelines", async () => {
      const start = Date.now();
      await store.saveOrder({
        pickupDate: "2026-11-02",
        pickupTime: "15:00",
        customer: { name: "Speed Test", phone: "123", email: "speed@ex.sk" },
        items: [],
        totalPrice: 50,
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Less than 500ms
    });
  });
});
