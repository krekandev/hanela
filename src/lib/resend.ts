import { Order } from "./types";

/**
 * Resend Email Integration & Luxury Email Templates
 *
 * Implements Mobbin luxury minimalist style:
 * - Canvas background: #FAF8F5
 * - Surface container: #FFFFFF
 * - Espresso typography: #261B24
 * - Subtle brand accent: #a62891
 * - Warm contrast panel: #F4EFE7
 * - Subtle borders: #DFD8CD / #EAE5DC
 * - Accent tint: #FAF1F8
 */

export interface SendEmailParams {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

export interface OrderEmailDispatchResult {
  customerResult: SendEmailResult;
  ownerResult: SendEmailResult;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export const RESEND_CONFIG = {
  get apiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  get fromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || "Cukráreň Hanela <onboarding@resend.dev>";
  },
  get ownerEmail(): string {
    return process.env.RESEND_OWNER_EMAIL || "cukraren.hanela@gmail.com";
  },
  bakeryAddress: "Hlavná 102/179, 900 29 Viničné",
  bakeryPhone: "+421 900 000 000",
  bakeryName: "Cukráreň Hanela",
};

/**
 * HTML sanitization helper to escape special characters and prevent injection
 * in customer names, notes, allergies, and customization strings.
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Low-level Resend REST API client using native fetch.
 * Works seamlessly in Node, Bun, and Next.js Server Route Handlers without external dependencies.
 * Automatically falls back to simulation mode if RESEND_API_KEY is not set.
 */
export async function sendEmailWithResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = RESEND_CONFIG.apiKey;

  // Validate recipient email address
  if (!params.to || (Array.isArray(params.to) && params.to.length === 0)) {
    return {
      success: false,
      error: "Missing required recipient email address",
    };
  }

  const toList = Array.isArray(params.to) ? params.to : [params.to];
  for (const email of toList) {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return {
        success: false,
        error: `Invalid customer email address format: ${email}`,
      };
    }
  }

  // Fallback if API key is not configured (offline / local dev / CI tests)
  if (!apiKey || apiKey.trim() === "" || apiKey === "mock-resend-key") {
    console.warn(
      `[Resend Simulation] RESEND_API_KEY not configured. Simulating email dispatch to: ${toList.join(", ")} | Subject: "${params.subject}"`
    );
    return {
      success: true,
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      simulated: true,
    };
  }

  try {
    const from = params.from || RESEND_CONFIG.fromEmail;
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Resend API Error]", data);
      return {
        success: false,
        error: data.message || `Resend API error (${response.status})`,
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Chyba siete pri odosielaní emailu";
    console.error("[Resend Exception]", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Format date string into Slovak readable format (e.g. "24. októbra 2026")
 */
export function formatSlovakDate(dateStr: string): string {
  try {
    if (!dateStr) return dateStr;
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const months = [
        "januára", "februára", "marca", "apríla", "mája", "júna",
        "júla", "augusta", "septembra", "októbra", "novembra", "decembra"
      ];
      const day = parts[2];
      const month = months[parts[1] - 1];
      const year = parts[0];
      return `${day}. ${month} ${year}`;
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
}

/**
 * Generate luxury HTML confirmation email for the customer.
 */
export function generateCustomerOrderEmailHtml(order: Order): string {
  const formattedDate = escapeHtml(formatSlovakDate(order.pickupDate));
  const safeCustomerName = escapeHtml(order.customer.name);
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safePickupTime = escapeHtml(order.pickupTime);
  const safeNotes = escapeHtml(order.customer.notes);
  const safeAllergies = escapeHtml(order.customer.allergies);

  const itemsHtml = order.items
    .map((item) => {
      const badges: string[] = [];
      if (item.size) badges.push(`Veľkosť: ${escapeHtml(item.size)}`);
      if (item.servings) badges.push(`Porcie: ${escapeHtml(item.servings)}`);
      if (item.korpus) badges.push(`Korpus: ${escapeHtml(item.korpus)}`);
      if (item.krem) badges.push(`Krém: ${escapeHtml(item.krem)}`);
      if (item.diets && item.diets.length > 0) badges.push(`Diéta: ${item.diets.map(escapeHtml).join(", ")}`);
      if (item.zdobenie && item.zdobenie.length > 0) badges.push(`Zdobenie: ${item.zdobenie.map(escapeHtml).join(", ")}`);
      if (item.doplnky && item.doplnky.length > 0) badges.push(`Doplnky: ${item.doplnky.map(escapeHtml).join(", ")}`);
      if (item.cakeNote) badges.push(`Poznámka: ${escapeHtml(item.cakeNote)}`);

      const badgesHtml = badges.length > 0
        ? `<div style="margin-top: 6px; font-size: 11px; line-height: 1.5; color: #6B5B65;">
            ${badges.map(b => `<span style="display: inline-block; background-color: #FAF8F5; border: 1px solid #EAE5DC; border-radius: 4px; padding: 2px 6px; margin: 2px 4px 2px 0;">${b}</span>`).join("")}
          </div>`
        : "";

      const anyItem = item as unknown as { price?: number };
      const itemTotal = typeof item.totalPrice === "number" 
        ? item.totalPrice 
        : (typeof item.unitPrice === "number" 
            ? item.unitPrice * (item.quantity || 1) 
            : (typeof anyItem.price === "number" 
                ? anyItem.price * (item.quantity || 1) 
                : 0));

      return `
        <tr style="border-bottom: 1px solid #EAE5DC;">
          <td style="padding: 16px 12px; vertical-align: top;">
            <div style="font-size: 14px; font-weight: 600; color: #261B24;">${escapeHtml(item.name)}</div>
            ${badgesHtml}
          </td>
          <td style="padding: 16px 12px; text-align: center; vertical-align: top; font-size: 13px; color: #6B5B65; white-space: nowrap;">
            ${item.quantity}&times;
          </td>
          <td style="padding: 16px 12px; text-align: right; vertical-align: top; font-size: 14px; font-weight: 600; color: #a62891; white-space: nowrap;">
            ${itemTotal.toFixed(2)} &euro;
          </td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potvrdenie rezervácie #${safeOrderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #261B24; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- MAIN CONTAINER -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #DFD8CD; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(38, 27, 36, 0.04);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color: #261B24; padding: 36px 32px; text-align: center; border-bottom: 3px solid #a62891;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: 400; letter-spacing: 4px; color: #FAF8F5; text-transform: uppercase;">HANELA</h1>
              <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2.5px; color: #DFD8CD; text-transform: uppercase; font-weight: 500;">Remeselná cukrárska výrobňa &bull; Viničné</p>
            </td>
          </tr>

          <!-- HERO GREETING -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <div style="display: inline-block; background-color: #FAF1F8; color: #a62891; border: 1px solid #ECD9E8; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                Rezervácia úspešne prijatá
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 600; color: #261B24; line-height: 1.3;">
                Ďakujeme za vašu objednávku, ${safeCustomerName}!
              </h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6B5B65;">
                Vaša objednávka č. <strong style="color: #261B24;">#${safeOrderNumber}</strong> bola úspešne zaevidovaná vo výrobe. Každý náš dezert a tortu pripravujeme ručne, z poctivých surovín, pravého masla a čerstvej živočíšnej smotany.
              </p>
            </td>
          </tr>

          <!-- PICKUP LOGISTICS CARD -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; border: 1px solid #EAE5DC; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6B5B65;">Termín vyzdvihnutia:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #a62891; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6B5B65;">Časový slot odberu:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #261B24; text-align: right;">${safePickupTime}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6B5B65;">Miesto vyzdvihnutia:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #261B24; text-align: right;">${RESEND_CONFIG.bakeryAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6B5B65;">Platba:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #261B24; text-align: right;">Pri prevzatí (hotovosť / okamžitý QR kód)</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS SPECIFICATION TABLE -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #261B24;">
                Špecifikácia objednaných položiek
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #DFD8CD; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #FAF8F5; border-bottom: 1px solid #DFD8CD;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65;">Položka / Špecifikácia</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65;">Množstvo</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65;">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="background-color: #F4EFE7;">
                    <td colspan="2" style="padding: 16px 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #261B24;">
                      Celková suma na úhradu:
                    </td>
                    <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #a62891; white-space: nowrap;">
                      ${(Number(order.totalPrice) || 0).toFixed(2)} &euro;
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CUSTOMER NOTES & ALLERGIES (IF PRESENT) -->
          ${(safeAllergies || safeNotes) ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #FFFFFF; border: 1px dashed #DFD8CD; border-radius: 12px; padding: 16px;">
                ${safeAllergies ? `
                  <div style="margin-bottom: 8px; font-size: 12px; color: #261B24;">
                    <strong style="color: #a62891;">Uvedené alergie / intolerancie:</strong> ${safeAllergies}
                  </div>
                ` : ""}
                ${safeNotes ? `
                  <div style="font-size: 12px; color: #6B5B65;">
                    <strong style="color: #261B24;">Vaša poznámka k výrobe:</strong> ${safeNotes}
                  </div>
                ` : ""}
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- CARE & TRANSPORT INSTRUCTIONS -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; border: 1px solid #EAE5DC; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #261B24;">
                      Pokyny k preprave a skladovaniu
                    </h4>
                    <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #6B5B65;">
                      ❄️ <strong style="color: #261B24;">Skladovanie:</strong> Torty a zákusky skladujte v chladničke pri teplote 4&ndash;6 &deg;C.
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #6B5B65;">
                      🚗 <strong style="color: #261B24;">Preprava autom:</strong> Tortu prevážajte vždy na vodorovnej ploche (podlaha pred sedadlom spolujazdca alebo rovný kufor), nikdy nie na šikmom sedadle. V teple majte zapnutú klimatizáciu.
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6B5B65;">
                      🍰 <strong style="color: #261B24;">Konzumácia:</strong> Pre najlepšiu chuť a jemnosť krémov odporúčame tortu vybrať z chladu 15&ndash;20 minút pred krájaním.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #FAF8F5; border-top: 1px solid #DFD8CD; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #6B5B65;">
                V prípade otázok nás kontaktujte na tel. <a href="tel:${RESEND_CONFIG.bakeryPhone}" style="color: #261B24; font-weight: 600; text-decoration: none;">${RESEND_CONFIG.bakeryPhone}</a> alebo <a href="mailto:${RESEND_CONFIG.ownerEmail}" style="color: #a62891; text-decoration: none;">${RESEND_CONFIG.ownerEmail}</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9E8E98;">
                Cukráreň Hanela &bull; ${RESEND_CONFIG.bakeryAddress} &bull; Ručne pečené s láskou a 100% poctivými surovinami
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate luxury HTML alert email for the bakery owner (cukraren.hanela@gmail.com).
 */
export function generateOwnerAlertEmailHtml(order: Order): string {
  const formattedDate = escapeHtml(formatSlovakDate(order.pickupDate));
  const safeCustomerName = escapeHtml(order.customer.name);
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safePickupTime = escapeHtml(order.pickupTime);
  const safePhone = escapeHtml(order.customer.phone);
  const safeEmail = escapeHtml(order.customer.email);
  const safeNotes = escapeHtml(order.customer.notes);
  const safeAllergies = escapeHtml(order.customer.allergies);

  const itemsList = order.items
    .map((item, idx) => {
      const specs: string[] = [];
      if (item.size) specs.push(`Veľkosť: ${escapeHtml(item.size)}`);
      if (item.servings) specs.push(`Porcie: ${escapeHtml(item.servings)}`);
      if (item.korpus) specs.push(`Korpus: ${escapeHtml(item.korpus)}`);
      if (item.krem) specs.push(`Krém: ${escapeHtml(item.krem)}`);
      if (item.diets && item.diets.length > 0) specs.push(`DIÉTA: ${item.diets.map(escapeHtml).join(", ")}`);
      if (item.zdobenie && item.zdobenie.length > 0) specs.push(`Zdobenie: ${item.zdobenie.map(escapeHtml).join(", ")}`);
      if (item.doplnky && item.doplnky.length > 0) specs.push(`Doplnky: ${item.doplnky.map(escapeHtml).join(", ")}`);
      if (item.cakeNote) specs.push(`Špeciálna požiadavka: ${escapeHtml(item.cakeNote)}`);

      const anyItem = item as unknown as { price?: number };
      const itemTotal = typeof item.totalPrice === "number" 
        ? item.totalPrice 
        : (typeof item.unitPrice === "number" 
            ? item.unitPrice * (item.quantity || 1) 
            : (typeof anyItem.price === "number" 
                ? anyItem.price * (item.quantity || 1) 
                : 0));

      return `
        <tr style="border-bottom: 1px solid #EAE5DC;">
          <td style="padding: 12px; vertical-align: top; font-weight: 700; color: #261B24; width: 40px; text-align: center;">
            #${idx + 1}
          </td>
          <td style="padding: 12px; vertical-align: top;">
            <div style="font-size: 14px; font-weight: 700; color: #261B24;">
              ${item.quantity}&times; ${escapeHtml(item.name)}
            </div>
            ${specs.length > 0 ? `
              <div style="margin-top: 6px; font-size: 12px; color: #6B5B65; line-height: 1.4;">
                ${specs.join(" &bull; ")}
              </div>
            ` : ""}
          </td>
          <td style="padding: 12px; vertical-align: top; text-align: right; font-size: 14px; font-weight: 700; color: #a62891; white-space: nowrap;">
            ${itemTotal.toFixed(2)} &euro;
          </td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nová objednávka #${safeOrderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #261B24;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- CONTAINER -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #DFD8CD; border-radius: 16px; overflow: hidden;">
          
          <!-- TOP ALERT BAR -->
          <tr>
            <td style="background-color: #261B24; padding: 24px 28px; border-bottom: 3px solid #a62891;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color: #FAF1F8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                      NOVÁ REZERVÁCIA DO VÝROBY
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 24px; color: #FAF8F5; margin-top: 4px;">
                      Objednávka #${safeOrderNumber}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="background-color: #FAF1F8; color: #a62891; padding: 6px 14px; border-radius: 20px; font-size: 16px; font-weight: 700; white-space: nowrap;">
                      ${(Number(order.totalPrice) || 0).toFixed(2)} &euro;
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PICKUP SCHEDULE & CUSTOMER HIGHLIGHT -->
          <tr>
            <td style="padding: 24px 28px 16px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4EFE7; border-radius: 12px; padding: 18px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 12px; border-right: 1px solid #DFD8CD;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6B5B65; letter-spacing: 1px;">
                      Termín vyzdvihnutia
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #a62891; margin-top: 4px;">
                      ${formattedDate}
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #261B24; margin-top: 2px;">
                      Čas: ${safePickupTime}
                    </div>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6B5B65; letter-spacing: 1px;">
                      Zákazník
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #261B24; margin-top: 4px;">
                      ${safeCustomerName}
                    </div>
                    <div style="font-size: 13px; margin-top: 4px;">
                      📞 <a href="tel:${safePhone}" style="color: #261B24; font-weight: 600; text-decoration: underline;">${safePhone}</a>
                    </div>
                    <div style="font-size: 12px; color: #6B5B65; margin-top: 2px;">
                      ✉️ <a href="mailto:${safeEmail}" style="color: #6B5B65; text-decoration: none;">${safeEmail}</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ALLERGY WARNING CALLOUT -->
          <tr>
            <td style="padding: 0 28px 16px 28px;">
              ${safeAllergies ? `
                <div style="background-color: #FBF2F2; border: 1px solid #EDD5D5; border-radius: 10px; padding: 14px 16px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7A2E2E; letter-spacing: 1px;">
                    ⚠️ POZOR NA ALERGIE / DIÉTY
                  </div>
                  <div style="font-size: 14px; font-weight: 700; color: #7A2E2E; margin-top: 4px;">
                    ${safeAllergies}
                  </div>
                </div>
              ` : `
                <div style="background-color: #FAF8F5; border: 1px solid #EAE5DC; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #6B5B65;">
                  ✓ Bez nahlásených alergií
                </div>
              `}
            </td>
          </tr>

          <!-- CUSTOMER NOTES (IF ANY) -->
          ${safeNotes ? `
          <tr>
            <td style="padding: 0 28px 16px 28px;">
              <div style="background-color: #FAF8F5; border: 1px dashed #DFD8CD; border-radius: 10px; padding: 12px 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B5B65;">
                  Poznámka zákazníka k výrobe:
                </div>
                <div style="font-size: 13px; color: #261B24; margin-top: 4px; font-style: italic;">
                  &ldquo;${safeNotes}&rdquo;
                </div>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- KITCHEN ITEMS PRODUCTION TABLE -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #261B24;">
                Rozpis výrobkov pre cukrárku
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #DFD8CD; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #FAF8F5; border-bottom: 1px solid #DFD8CD;">
                    <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65; width: 40px;">#</th>
                    <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65;">Názov a špecifikácie</th>
                    <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6B5B65;">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- ADMIN LINK BUTTON -->
          <tr>
            <td style="padding: 0 28px 28px 28px; text-align: center;">
              <a href="/admin" style="display: inline-block; background-color: #261B24; color: #FAF8F5; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                Otvoriť v administrácii Hanela &rarr;
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Aliases for interface compatibility
export const generateCustomerEmailHtml = generateCustomerOrderEmailHtml;
export const generateOwnerEmailHtml = generateOwnerAlertEmailHtml;

/**
 * High-level orchestration function to dispatch both customer and owner emails for an order.
 */
export async function sendOrderEmails(order: Order): Promise<OrderEmailDispatchResult> {
  if (!order || !order.customer) {
    const errorResult: SendEmailResult = {
      success: false,
      error: "Missing required order or customer details",
    };
    return { customerResult: errorResult, ownerResult: errorResult };
  }

  const customerEmail = order.customer.email;
  if (!customerEmail || typeof customerEmail !== "string" || customerEmail.trim() === "") {
    return {
      customerResult: {
        success: false,
        error: "Missing required customer email address",
      },
      ownerResult: {
        success: false,
        error: "Missing required customer email address",
      },
    };
  }

  if (!customerEmail.includes("@")) {
    return {
      customerResult: {
        success: false,
        error: `Invalid customer email address format: ${customerEmail}`,
      },
      ownerResult: {
        success: false,
        error: `Invalid customer email address format: ${customerEmail}`,
      },
    };
  }

  const customerHtml = generateCustomerOrderEmailHtml(order);
  const ownerHtml = generateOwnerAlertEmailHtml(order);

  const [customerResult, ownerResult] = await Promise.all([
    sendEmailWithResend({
      to: customerEmail,
      subject: `Potvrdenie rezervácie #${order.orderNumber} | Cukráreň Hanela`,
      html: customerHtml,
      replyTo: RESEND_CONFIG.ownerEmail,
    }),
    sendEmailWithResend({
      to: RESEND_CONFIG.ownerEmail,
      subject: `🔔 Nová objednávka #${order.orderNumber} – ${order.customer.name} (${order.pickupDate} o ${order.pickupTime})`,
      html: ownerHtml,
      replyTo: customerEmail,
    }),
  ]);

  return { customerResult, ownerResult };
}
