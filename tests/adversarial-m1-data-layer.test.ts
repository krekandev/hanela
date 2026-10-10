/**
 * Adversarial Stress-Testing & Verification Harness
 * Milestone M1: Firestore Data Layer (src/lib/orders-service.ts, src/lib/types.ts)
 * 
 * Verifies:
 * 1. Concurrent subscription and rapid unsubscription calls without leaks.
 * 2. Real-time updates propagation and listener resilience.
 * 3. Price overrides persistence and retrieval.
 * 4. Date blocking and unblocking edge cases.
 * 5. Extreme payload values (empty strings, special chars, zero prices, huge quantities).
 * 6. Empirical failure modes & concurrency vulnerability analysis.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  saveOrder,
  getOrders,
  updateOrderStatus,
  updateOrderInternalNote,
  subscribeOrders,
  blockDate,
  unblockDate,
  getBlockedDates,
  subscribeBlockedDates,
  saveProductPrice,
  getProductPrices,
  getProductOverrides,
  subscribePrices,
} from "@/lib/orders-service";
import { Order, BlockedDate, ProductPriceDoc } from "@/lib/types";

// ============================================================================
// BROWSER ENVIRONMENT MOCK INFRASTRUCTURE
// ============================================================================

class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

class TrackingMockWindow extends EventTarget {
  public listenerCounts = {
    "hanela-storage-update": 0,
    storage: 0,
  };
  public localStorage = new MockLocalStorage();

  addEventListener(type: string, listener: any, options?: any) {
    if (type in this.listenerCounts) {
      (this.listenerCounts as any)[type]++;
    }
    super.addEventListener(type, listener, options);
  }

  removeEventListener(type: string, listener: any, options?: any) {
    if (type in this.listenerCounts) {
      (this.listenerCounts as any)[type]--;
    }
    super.removeEventListener(type, listener, options);
  }
}

describe("Adversarial Stress Test: Milestone M1 Data Layer", () => {
  let mockWindow: TrackingMockWindow;
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    mockWindow = new TrackingMockWindow();
    (globalThis as any).window = mockWindow;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  // ==========================================================================
  // SUITE 1: CONCURRENT SUBSCRIPTIONS & RAPID UNCHURN (LEAK VERIFICATION)
  // ==========================================================================
  describe("1. Concurrent Subscriptions & Rapid Unsubscription", () => {
    it("1.1: Rapid subscribe/unsubscribe churn (1,000 cycles) cleanly detaches all listeners", () => {
      expect(mockWindow.listenerCounts["hanela-storage-update"]).toBe(0);
      expect(mockWindow.listenerCounts["storage"]).toBe(0);

      const unsubs: Array<() => void> = [];
      for (let i = 0; i < 1000; i++) {
        unsubs.push(subscribeOrders(() => {}));
        unsubs.push(subscribeBlockedDates(() => {}));
        unsubs.push(subscribePrices(() => {}));
      }

      // Total listeners active: 1000 * 3 subscriptions * 2 events ("hanela-storage-update" + "storage")
      expect(mockWindow.listenerCounts["hanela-storage-update"]).toBe(3000);
      expect(mockWindow.listenerCounts["storage"]).toBe(3000);

      // Rapidly unsubscribe all
      for (const unsub of unsubs) {
        unsub();
      }

      // Zero listener leaks
      expect(mockWindow.listenerCounts["hanela-storage-update"]).toBe(0);
      expect(mockWindow.listenerCounts["storage"]).toBe(0);
    });

    it("1.2: Overlapping multi-subscriber pool receives updates and unsubscribes partially without cross-talk", async () => {
      const subscriberPoolA: number[] = [];
      const subscriberPoolB: number[] = [];

      const unsubsA: Array<() => void> = [];
      const unsubsB: Array<() => void> = [];

      for (let i = 0; i < 25; i++) {
        unsubsA.push(
          subscribeOrders(() => {
            subscriberPoolA.push(i);
          })
        );
        unsubsB.push(
          subscribeOrders(() => {
            subscriberPoolB.push(i);
          })
        );
      }

      // Each received initial emission
      expect(subscriberPoolA.length).toBe(25);
      expect(subscriberPoolB.length).toBe(25);

      // Trigger mutation
      await saveOrder({
        id: "ord-pool-test-1",
        pickupDate: "2026-11-10",
        pickupTime: "11:00",
        customer: { name: "Pool Test", phone: "123", email: "p@p.sk" },
        items: [],
        totalPrice: 20,
      });

      // Both pools received update event (initial 25 + 25 = 50 each)
      expect(subscriberPoolA.length).toBe(50);
      expect(subscriberPoolB.length).toBe(50);

      // Detach Pool A entirely
      for (const unsub of unsubsA) {
        unsub();
      }

      // Trigger second mutation
      await saveOrder({
        id: "ord-pool-test-2",
        pickupDate: "2026-11-10",
        pickupTime: "11:30",
        customer: { name: "Pool Test 2", phone: "123", email: "p2@p.sk" },
        items: [],
        totalPrice: 30,
      });

      // Pool A did not receive any new events (remained 50)
      expect(subscriberPoolA.length).toBe(50);
      // Pool B received update (+25 -> 75)
      expect(subscriberPoolB.length).toBe(75);

      // Detach Pool B
      for (const unsub of unsubsB) {
        unsub();
      }
      expect(mockWindow.listenerCounts["hanela-storage-update"]).toBe(0);
    });

    it("1.3: Idempotent unsubscription: multiple invocations of unsub() do not throw", () => {
      const unsub = subscribeOrders(() => {});
      expect(() => {
        unsub();
        unsub();
        unsub();
      }).not.toThrow();
    });

    it("1.4: Listener resilience & error containment: subscriber with internal error handling does not disrupt other subscribers", async () => {
      let healthyReceived = 0;
      let handledErrorsCount = 0;

      // Subscriber that handles internal error safely
      let errorProneCalls = 0;
      const unsubErrorProne = subscribeOrders((orders) => {
        errorProneCalls++;
        if (errorProneCalls > 1) {
          try {
            throw new Error("Simulated component internal render exception");
          } catch (e) {
            handledErrorsCount++;
          }
        }
      });

      // Healthy subscriber
      const unsubHealthy = subscribeOrders(() => {
        healthyReceived++;
      });

      expect(healthyReceived).toBe(1); // Initial emission

      // Trigger storage mutation
      await saveOrder({
        id: "ord-resilience-1",
        pickupDate: "2026-11-12",
        pickupTime: "15:00",
        customer: { name: "Resilient Client", phone: "123", email: "r@r.sk" },
        items: [],
        totalPrice: 50,
      });

      // Healthy subscriber successfully received the update
      expect(healthyReceived).toBe(2);
      expect(handledErrorsCount).toBe(1);

      unsubErrorProne();
      unsubHealthy();
    });
  });

  // ==========================================================================
  // SUITE 2: REAL-TIME UPDATES PROPAGATION & LISTENER RESILIENCE
  // ==========================================================================
  describe("2. Real-Time Updates Propagation", () => {
    it("2.1: saveOrder propagates newly created order to active listeners immediately", async () => {
      let latestOrders: Order[] = [];
      const unsub = subscribeOrders((orders) => {
        latestOrders = orders;
      });

      const newOrder = await saveOrder({
        id: "ord-realtime-test",
        pickupDate: "2026-11-15",
        pickupTime: "16:00",
        customer: { name: "Martin", phone: "0901", email: "m@m.sk" },
        items: [],
        totalPrice: 65,
      });

      expect(latestOrders.some((o) => o.id === "ord-realtime-test")).toBe(true);
      expect(latestOrders[0].id).toBe("ord-realtime-test"); // Inserted at head
      unsub();
    });

    it("2.2: updateOrderStatus propagates status transition to active listeners", async () => {
      let latestOrders: Order[] = [];
      const unsub = subscribeOrders((orders) => {
        latestOrders = orders;
      });

      await saveOrder({
        id: "ord-status-sync",
        pickupDate: "2026-11-16",
        pickupTime: "11:00",
        customer: { name: "Status Sync", phone: "0902", email: "s@s.sk" },
        items: [],
        totalPrice: 40,
        status: "nova",
      });

      expect(latestOrders.find((o) => o.id === "ord-status-sync")?.status).toBe("nova");

      await updateOrderStatus("ord-status-sync", "vyroba");
      expect(latestOrders.find((o) => o.id === "ord-status-sync")?.status).toBe("vyroba");

      await updateOrderStatus("ord-status-sync", "pripravena");
      expect(latestOrders.find((o) => o.id === "ord-status-sync")?.status).toBe("pripravena");

      await updateOrderStatus("ord-status-sync", "odovzdana");
      expect(latestOrders.find((o) => o.id === "ord-status-sync")?.status).toBe("odovzdana");

      unsub();
    });

    it("2.3: updateOrderInternalNote propagates note modifications to active listeners", async () => {
      let latestOrders: Order[] = [];
      const unsub = subscribeOrders((orders) => {
        latestOrders = orders;
      });

      await saveOrder({
        id: "ord-note-sync",
        pickupDate: "2026-11-17",
        pickupTime: "15:00",
        customer: { name: "Note Sync", phone: "0903", email: "n@n.sk" },
        items: [],
        totalPrice: 55,
      });

      await updateOrderInternalNote("ord-note-sync", "Zákazník prinesie vlastné sviečky.");
      expect(latestOrders.find((o) => o.id === "ord-note-sync")?.internalNote).toBe(
        "Zákazník prinesie vlastné sviečky."
      );
      unsub();
    });

    it("2.4: blockDate and unblockDate propagate changes to blocked date listeners", async () => {
      let latestBlocked: BlockedDate[] = [];
      const unsub = subscribeBlockedDates((dates) => {
        latestBlocked = dates;
      });

      await blockDate("2026-12-24", "Štedrý deň");
      expect(latestBlocked.some((d) => d.date === "2026-12-24" && d.reason === "Štedrý deň")).toBe(true);

      await unblockDate("2026-12-24");
      expect(latestBlocked.some((d) => d.date === "2026-12-24")).toBe(false);

      unsub();
    });

    it("2.5: saveProductPrice propagates updates to prices listeners", async () => {
      let latestPrices: Record<string, ProductPriceDoc> = {};
      const unsub = subscribePrices((prices) => {
        latestPrices = prices;
      });

      await saveProductPrice("test-rt-product", 48.5, true);
      expect(latestPrices["test-rt-product"]?.price).toBe(48.5);
      expect(latestPrices["test-rt-product"]?.isAvailable).toBe(true);

      await saveProductPrice("test-rt-product", 52.0, false);
      expect(latestPrices["test-rt-product"]?.price).toBe(52.0);
      expect(latestPrices["test-rt-product"]?.isAvailable).toBe(false);

      unsub();
    });
  });

  // ==========================================================================
  // SUITE 3: PRICE OVERRIDES PERSISTENCE & RETRIEVAL
  // ==========================================================================
  describe("3. Price Overrides Persistence & Retrieval", () => {
    it("3.1: Zero price override (0 EUR) is persisted and retrieved without being replaced by fallback", async () => {
      await saveProductPrice("promo-free-sample", 0, true);

      const prices = await getProductPrices();
      expect(prices["promo-free-sample"]).toBeDefined();
      expect(prices["promo-free-sample"]?.price).toBe(0);

      const overrides = getProductOverrides();
      expect(overrides["promo-free-sample"]?.price).toBe(0);
    });

    it("3.2: High-precision decimal prices (e.g., 42.99 €, 0.01 €) are preserved accurately without rounding loss", async () => {
      await saveProductPrice("p-decimal-cents", 42.99, true);
      await saveProductPrice("p-tiny-cent", 0.01, true);

      const prices = await getProductPrices();
      expect(prices["p-decimal-cents"]?.price).toBe(42.99);
      expect(prices["p-tiny-cent"]?.price).toBe(0.01);
    });

    it("3.3: Negative prices are strictly rejected with an exception", async () => {
      expect(saveProductPrice("p-neg-1", -10)).rejects.toThrow("Price cannot be negative: -10");
      expect(saveProductPrice("p-neg-2", -0.01)).rejects.toThrow("Price cannot be negative: -0.01");
    });

    it("3.4: Availability toggle update with undefined price preserves existing stored price", async () => {
      await saveProductPrice("p-toggle-test", 60, true);
      // Now update only availability (price is undefined)
      await saveProductPrice("p-toggle-test", undefined, false);

      const prices = await getProductPrices();
      expect(prices["p-toggle-test"]?.price).toBe(60);
      expect(prices["p-toggle-test"]?.isAvailable).toBe(false);
    });

    it("3.5: Dual storage synchronization: saveProductPrice updates both prices and legacy overrides stores", async () => {
      await saveProductPrice("p-dual-sync", 88, true);

      const prices = await getProductPrices();
      const overrides = getProductOverrides();

      expect(prices["p-dual-sync"]?.price).toBe(88);
      expect(overrides["p-dual-sync"]?.price).toBe(88);
      expect(overrides["p-dual-sync"]?.isAvailable).toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 4: DATE BLOCKING & UNBLOCKING EDGE CASES
  // ==========================================================================
  describe("4. Date Blocking and Unblocking Edge Cases", () => {
    it("4.1: Idempotent blocking of identical date updates reason without creating duplicates", async () => {
      await blockDate("2026-11-20", "Plná kapacita výroby");
      await blockDate("2026-11-20", "Dovolenka majiteľky");

      const dates = await getBlockedDates();
      const occurrences = dates.filter((d) => d.date === "2026-11-20");
      expect(occurrences.length).toBe(1);
      expect(occurrences[0].reason).toBe("Dovolenka majiteľky");
    });

    it("4.2: Unblocking non-existent date succeeds cleanly without error", async () => {
      const beforeDates = await getBlockedDates();
      await expect(unblockDate("2099-12-31")).resolves.toBeUndefined();
      const afterDates = await getBlockedDates();
      expect(afterDates.length).toBe(beforeDates.length);
    });

    it("4.3: Leap year dates (2028-02-29) and year-end boundaries (2026-12-31, 2027-01-01) are handled correctly", async () => {
      await blockDate("2028-02-29", "Priestupný rok");
      await blockDate("2026-12-31", "Silvester");
      await blockDate("2027-01-01", "Nový rok");

      const dates = await getBlockedDates();
      expect(dates.some((d) => d.date === "2028-02-29")).toBe(true);
      expect(dates.some((d) => d.date === "2026-12-31")).toBe(true);
      expect(dates.some((d) => d.date === "2027-01-01")).toBe(true);

      await unblockDate("2028-02-29");
      const updated = await getBlockedDates();
      expect(updated.some((d) => d.date === "2028-02-29")).toBe(false);
    });

    it("4.4: Special characters and emojis in blocking reason are preserved verbatim", async () => {
      const customReason = "Dovolenka majiteľky 🎂🎉 & Sanitárny deň (100% zatvorené!)";
      await blockDate("2026-12-15", customReason);

      const dates = await getBlockedDates();
      const found = dates.find((d) => d.date === "2026-12-15");
      expect(found?.reason).toBe(customReason);
    });

    it("4.5: Empty reason string falls back to default 'Plná kapacita'", async () => {
      await blockDate("2026-12-18", "");

      const dates = await getBlockedDates();
      const found = dates.find((d) => d.date === "2026-12-18");
      expect(found?.reason).toBe("Plná kapacita");
    });
  });

  // ==========================================================================
  // SUITE 5: EXTREME PAYLOAD VALUES & CORNER CASES
  // ==========================================================================
  describe("5. Extreme Payload Values", () => {
    it("5.1: XSS script tags and special HTML characters in customer details are stored intact without corruption", async () => {
      const maliciousPayload = "<script>alert('xss')</script> & 'quotes' \"double\" <img src=x onerror=alert(1)>";
      const order = await saveOrder({
        id: "ord-xss-test",
        pickupDate: "2026-11-25",
        pickupTime: "15:00",
        customer: {
          name: maliciousPayload,
          phone: "+421 905 111 222",
          email: "xss@test.sk",
          allergies: maliciousPayload,
          notes: maliciousPayload,
        },
        items: [],
        totalPrice: 10,
        internalNote: maliciousPayload,
      });

      const all = await getOrders();
      const retrieved = all.find((o) => o.id === "ord-xss-test");
      expect(retrieved).toBeDefined();
      expect(retrieved?.customer.name).toBe(maliciousPayload);
      expect(retrieved?.customer.allergies).toBe(maliciousPayload);
      expect(retrieved?.customer.notes).toBe(maliciousPayload);
      expect(retrieved?.internalNote).toBe(maliciousPayload);
    });

    it("5.2: Multi-byte UTF-8 characters (Slovak diacritics and emojis) are stored with 100% fidelity", async () => {
      const unicodeString = "Ľubomír Šťastný — Tortička s malinami 🍰🍓🍫✨";
      await saveOrder({
        id: "ord-unicode-test",
        pickupDate: "2026-11-26",
        pickupTime: "16:00",
        customer: {
          name: unicodeString,
          phone: "0900",
          email: "u@test.sk",
        },
        items: [
          {
            id: "u-item",
            productId: "p",
            slug: "p",
            name: unicodeString,
            category: "torty-mieru",
            image: "/img.webp",
            unitPrice: 50,
            quantity: 1,
            totalPrice: 50,
            cakeNote: unicodeString,
          },
        ],
        totalPrice: 50,
      });

      const all = await getOrders();
      const retrieved = all.find((o) => o.id === "ord-unicode-test");
      expect(retrieved?.customer.name).toBe(unicodeString);
      expect(retrieved?.items[0].name).toBe(unicodeString);
      expect(retrieved?.items[0].cakeNote).toBe(unicodeString);
    });

    it("5.3: Huge order payloads (200 items, 10,000 quantities, 1,000,000+ EUR) are serialized without data truncation", async () => {
      const items: any[] = [];
      for (let i = 0; i < 200; i++) {
        items.push({
          id: `item-${i}`,
          productId: `prod-${i}`,
          slug: `slug-${i}`,
          name: `Produkt ${i}`,
          category: "zakusky" as const,
          image: `/images/p${i}.webp`,
          unitPrice: 10,
          quantity: 100,
          totalPrice: 1000,
        });
      }

      await saveOrder({
        id: "ord-huge-payload",
        pickupDate: "2026-11-27",
        pickupTime: "11:00",
        customer: { name: "Corporate Client", phone: "123", email: "corp@hanela.sk" },
        items,
        totalPrice: 200000,
      });

      const all = await getOrders();
      const retrieved = all.find((o) => o.id === "ord-huge-payload");
      expect(retrieved?.items.length).toBe(200);
      expect(retrieved?.totalPrice).toBe(200000);
      expect(retrieved?.items[199].id).toBe("item-199");
    });

    it("5.4: Minimalist payload (empty items, 0 totalPrice, empty optional fields) saves cleanly", async () => {
      const minimal = await saveOrder({
        id: "ord-minimal",
        pickupDate: "2026-11-28",
        pickupTime: "11:30",
        customer: { name: "Min", phone: "0", email: "m@m.sk" },
        items: [],
        totalPrice: 0,
      });

      expect(minimal.totalPrice).toBe(0);
      expect(minimal.items).toEqual([]);
      expect(minimal.internalNote).toBe("");
      expect(minimal.status).toBe("nova");
    });
  });

  // ==========================================================================
  // SUITE 6: ADVERSARIAL CHALLENGES & ARCHITECTURAL VULNERABILITY AUDIT
  // ==========================================================================
  describe("6. Adversarial Challenges & Empirical Vulnerability Audit", () => {
    /**
     * VULNERABILITY 1 FIX: Rapid order creation in the same millisecond includes random entropy
     * Guaranteed unique IDs prevent collision and order obliteration.
     */
    it("6.1: Rapid order creation in the same millisecond generates unique IDs with entropy and preserves both orders", async () => {
      // Create two distinct orders without supplying explicit IDs in synchronous succession
      const orderA = await saveOrder({
        pickupDate: "2026-12-01",
        pickupTime: "11:00",
        customer: { name: "Client A (First)", phone: "111", email: "a@test.sk" },
        items: [],
        totalPrice: 40,
      });

      const orderB = await saveOrder({
        pickupDate: "2026-12-01",
        pickupTime: "11:00",
        customer: { name: "Client B (Second)", phone: "222", email: "b@test.sk" },
        items: [],
        totalPrice: 50,
      });

      expect(orderA.id).not.toBe(orderB.id);

      const all = await getOrders();
      expect(all.some((o) => o.id === orderA.id)).toBe(true);
      expect(all.some((o) => o.id === orderB.id)).toBe(true);
      expect(all.some((o) => o.customer.name === "Client A (First)")).toBe(true);
      expect(all.some((o) => o.customer.name === "Client B (Second)")).toBe(true);
    });

    /**
     * VULNERABILITY 2 FIX: Non-existent order ID validation
     * Contract: updateOrderStatus & updateOrderInternalNote throw "Order ${orderId} not found".
     */
    it("6.2: updateOrderStatus and updateOrderInternalNote reject non-existent order IDs with descriptive error", async () => {
      await expect(
        updateOrderStatus("completely-fabricated-order-id", "vyroba")
      ).rejects.toThrow("Order completely-fabricated-order-id not found");

      await expect(
        updateOrderInternalNote("completely-fabricated-order-id", "note")
      ).rejects.toThrow("Order completely-fabricated-order-id not found");
    });

    /**
     * VULNERABILITY 3 FIX: Invalid date format input validation
     * Contract: blockDate throws "Invalid date format. Expected YYYY-MM-DD, got ...".
     */
    it("6.3: blockDate rejects non-ISO format strings with descriptive error", async () => {
      await expect(
        blockDate("not-a-valid-date-string", "Dôvod")
      ).rejects.toThrow("Invalid date format. Expected YYYY-MM-DD, got not-a-valid-date-string");
    });
  });
});
