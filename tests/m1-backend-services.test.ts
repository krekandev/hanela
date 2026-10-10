import { describe, it, expect } from "bun:test";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TOKENS,
  PICKUP_TIME_SLOTS,
  BLOCKED_DATE_PRESET_REASONS,
  Order,
  OrderStatus,
} from "@/lib/types";
import {
  escapeHtml,
  formatSlovakDate,
  generateCustomerOrderEmailHtml,
  generateOwnerAlertEmailHtml,
  sendOrderEmails,
} from "@/lib/resend";
import { sendOrderNotification } from "@/lib/webhook";
import { POST } from "@/app/api/send-email/route";
import {
  saveProductPrice,
  getProductPrices,
  getProductOverrides,
  saveOrder,
  getOrders,
  updateOrderStatus,
  blockDate,
  unblockDate,
  getBlockedDates,
  subscribeOrders,
  subscribeBlockedDates,
  subscribePrices,
} from "@/lib/orders-service";

describe("Milestone M1 Backend Services Integration Test Suite", () => {
  const sampleOrder: Order = {
    id: "test-ord-1",
    orderNumber: "HAN-2026-999",
    createdAt: "2026-10-10T12:00:00.000Z",
    pickupDate: "2026-10-24",
    pickupTime: "15:00",
    customer: {
      name: "Anna Testovacia",
      phone: "+421903123456",
      email: "anna@test.sk",
      allergies: "Bezlepková diéta",
      notes: "Prosím nápis 'Všetko najlepšie'",
    },
    items: [
      {
        id: "item-1",
        productId: "ovocna-sviezost",
        name: "Ovocná sviežosť",
        slug: "ovocna-sviezost",
        category: "torty-mieru",
        image: "/images/products/ovocna-sviezost.webp",
        unitPrice: 80,
        quantity: 1,
        totalPrice: 80,
        size: "10–15 porcií (Ø 21 cm)",
        korpus: "Mandľový korpus",
        krem: "Mascarpone",
        diets: ["Bezlepková úprava"],
      },
    ],
    totalPrice: 80,
    status: "nova",
  };

  describe("1. Canonical Types & Tokens", () => {
    it("exports all 5 required order status labels and tokens", () => {
      const statuses: OrderStatus[] = ["nova", "vyroba", "pripravena", "odovzdana", "zrusena"];
      for (const s of statuses) {
        expect(ORDER_STATUS_LABELS[s]).toBeDefined();
        expect(ORDER_STATUS_TOKENS[s]).toBeDefined();
        expect(ORDER_STATUS_TOKENS[s].bg).toBeDefined();
        expect(ORDER_STATUS_TOKENS[s].text).toBeDefined();
        expect(ORDER_STATUS_TOKENS[s].dot).toBeDefined();
      }
    });

    it("exports 6 standard pickup time slots matching PROJECT.md", () => {
      expect(PICKUP_TIME_SLOTS.length).toBe(6);
      expect(PICKUP_TIME_SLOTS).toContain("11:00");
      expect(PICKUP_TIME_SLOTS).toContain("16:30");
    });

    it("exports preset capacity blocking reasons", () => {
      expect(BLOCKED_DATE_PRESET_REASONS).toContain("Plná kapacita výroby");
      expect(BLOCKED_DATE_PRESET_REASONS).toContain("Dovolenka majiteľky");
      expect(BLOCKED_DATE_PRESET_REASONS).toContain("Sanitárny deň");
    });
  });

  describe("2. Resend Email Services & Luxury HTML Templates", () => {
    it("escapeHtml sanitizes all HTML special characters", () => {
      const raw = `<script>alert('xss' & "hack")</script>`;
      const escaped = escapeHtml(raw);
      expect(escaped).toBe("&lt;script&gt;alert(&#039;xss&#039; &amp; &quot;hack&quot;)&lt;/script&gt;");
    });

    it("formatSlovakDate converts ISO date to Slovak verbal date", () => {
      expect(formatSlovakDate("2026-10-24")).toBe("24. októbra 2026");
      expect(formatSlovakDate("2026-05-01")).toBe("1. mája 2026");
    });

    it("generateCustomerOrderEmailHtml renders Mobbin luxury template", () => {
      const html = generateCustomerOrderEmailHtml(sampleOrder);
      expect(html).toContain("HANELA");
      expect(html).toContain("Anna Testovacia");
      expect(html).toContain("HAN-2026-999");
      expect(html).toContain("80.00 &euro;");
      expect(html).toContain("Bezlepková diéta");
      expect(html).toContain("Pokyny k preprave a skladovaniu");
    });

    it("generateOwnerAlertEmailHtml renders owner alert details", () => {
      const html = generateOwnerAlertEmailHtml(sampleOrder);
      expect(html).toContain("Objednávka #HAN-2026-999");
      expect(html).toContain("+421903123456");
      expect(html).toContain("anna@test.sk");
      expect(html).toContain("Bezlepková diéta");
      expect(html).toContain("80.00 &euro;");
    });

    it("sendOrderEmails validates email and simulates dispatch when API key is unset", async () => {
      const res = await sendOrderEmails(sampleOrder);
      expect(res.customerResult.success).toBe(true);
      expect(res.ownerResult.success).toBe(true);
      expect(res.customerResult.simulated).toBe(true);
    });

    it("sendOrderEmails rejects invalid or empty email address", async () => {
      const invalidOrder = {
        ...sampleOrder,
        customer: { ...sampleOrder.customer, email: "invalid-email" },
      };
      const res = await sendOrderEmails(invalidOrder);
      expect(res.customerResult.success).toBe(false);
      expect(res.customerResult.error).toContain("Invalid customer email address");
    });
  });

  describe("3. Transitional Webhook Shim", () => {
    it("sendOrderNotification routes through Resend and succeeds", async () => {
      const result = await sendOrderNotification(sampleOrder);
      expect(result.success).toBe(true);
    });
  });

  describe("4. API Route Handler (POST /api/send-email)", () => {
    it("rejects non-JSON or empty request body with 400", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        body: "invalid-string",
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    it("rejects order with missing required fields with 400", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: { orderNumber: "HAN-1" } }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
    });

    it("accepts valid order and returns 200 OK with email IDs", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: sampleOrder }),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.simulated).toBe(true);
    });
  });

  describe("5. Orders Service & Firestore Subscriptions", () => {
    it("saveProductPrice rejects negative prices", async () => {
      expect(saveProductPrice("test-p", -10, true)).rejects.toThrow("Price cannot be negative");
    });

    it("saveProductPrice saves price override and syncs to overrides store", async () => {
      await saveProductPrice("ovocna-sviezost", 85, true);
      const prices = await getProductPrices();
      expect(prices["ovocna-sviezost"]?.price).toBe(85);
      expect(prices["ovocna-sviezost"]?.isAvailable).toBe(true);

      const overrides = getProductOverrides();
      expect(overrides["ovocna-sviezost"]?.price).toBe(85);
    });

    it("saveOrder generates order with proper ID and stores it", async () => {
      const saved = await saveOrder({
        pickupDate: "2026-10-30",
        pickupTime: "11:30",
        customer: { name: "Juraj", phone: "0900111222", email: "juraj@test.sk" },
        items: [],
        totalPrice: 40,
      });

      expect(saved.orderNumber).toMatch(/^HAN-\d{4}-\d{3}$/);
      expect(saved.status).toBe("nova");

      const all = await getOrders();
      expect(all.some((o) => o.id === saved.id)).toBe(true);
    });

    it("updateOrderStatus updates status in store", async () => {
      const saved = await saveOrder({
        id: "status-test-ord",
        pickupDate: "2026-10-31",
        pickupTime: "15:00",
        customer: { name: "Test", phone: "123", email: "t@t.sk" },
        items: [],
        totalPrice: 20,
      });

      await updateOrderStatus(saved.id, "vyroba");
      const all = await getOrders();
      const updated = all.find((o) => o.id === saved.id);
      expect(updated?.status).toBe("vyroba");
    });

    it("blockDate and unblockDate manage blocked dates list", async () => {
      await blockDate("2026-12-25", "Vianoce");
      let dates = await getBlockedDates();
      expect(dates.some((d) => d.date === "2026-12-25" && d.reason === "Vianoce")).toBe(true);

      await unblockDate("2026-12-25");
      dates = await getBlockedDates();
      expect(dates.some((d) => d.date === "2026-12-25")).toBe(false);
    });

    it("subscriptions return instant unsubscription callbacks safely", () => {
      const unsubOrders = subscribeOrders(() => {});
      const unsubDates = subscribeBlockedDates(() => {});
      const unsubPrices = subscribePrices(() => {});

      expect(() => {
        unsubOrders();
        unsubDates();
        unsubPrices();
      }).not.toThrow();
    });
  });
});
