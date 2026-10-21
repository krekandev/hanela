const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { Resend } = require("resend");

initializeApp();
const db = getFirestore();

// Nastavenie regiónu Frankfurt (eur3) pre minimálnu latenciu s Firestore
setGlobalOptions({ region: "europe-west3" });

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = "Cukráreň Hanela <objednavky@hanela.sk>";
const OWNER_EMAIL = "hanelacakes@gmail.com";

const resend = new Resend(RESEND_API_KEY);

function generateOrderEmails(order) {
  const customer = order.customer || {};
  const customerName = customer.name || "Zákazník";
  const customerEmail = customer.email || "";
  const customerPhone = customer.phone || "";
  const customerNotes = customer.notes || "";
  const allergies = customer.allergies || "";
  const orderNumber = order.orderNumber || order.id || "HAN-2026-001";
  const pickupDate = order.pickupDate || "";
  const pickupTime = order.pickupTime || "";
  const totalPrice = order.totalPrice || 0;
  const items = order.items || [];

  let itemsListHtml = "";
  if (items.length > 0) {
    for (const it of items) {
      const priceDisplay = it.totalPrice ? `${it.totalPrice} €` : (it.unitPrice ? `${it.unitPrice} €` : "");
      let detailsHtml = "";
      if (it.size || it.korpus || it.krem || it.servings) {
        const details = [];
        if (it.size) details.push(it.size);
        if (it.servings) details.push(it.servings);
        if (it.korpus) details.push(`Korpus: ${it.korpus}`);
        if (it.krem) details.push(`Krém: ${it.krem}`);
        detailsHtml = `<div style="font-size: 11px; color: #6B5B65; margin-top: 2px;">↳ ${details.join(" • ")}</div>`;
      }

      itemsListHtml += `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #EAE5DC; color: #261B24; font-size: 13px;">
            <strong>${it.name || "Výrobok"}</strong> (${it.quantity || 1}x)
            ${detailsHtml}
          </td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #EAE5DC; font-weight: bold; color: #a62891; font-size: 13px;">
            ${priceDisplay}
          </td>
        </tr>
      `;
    }
  }

  // 1. ZÁKAZNÍCKY POTVRDZOVACÍ E-MAIL S LOGOM
  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #DFD8CD; border-radius: 16px; padding: 28px; color: #261B24;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="https://hanela.sk/images/logo.png" width="70" height="70" style="border-radius: 50%; border: 1px solid #DFD8CD; display: block; margin: 0 auto 10px auto;" alt="Cukráreň Hanela"/>
        <h1 style="font-family: serif; font-size: 24px; color: #261B24; margin: 0 0 4px 0; letter-spacing: 1px;">HANELA</h1>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6B5B65; margin: 0;">Remeselná cukráreň Viničné</p>
      </div>
      <h2 style="font-size: 18px; color: #261B24; margin-top: 0;">Ďakujeme za vašu objednávku #${orderNumber}!</h2>
      <p style="color: #6B5B65; font-size: 14px; line-height: 1.6;">Vašu rezerváciu sme v poriadku zaevidovali vo výrobe. Pripravíme ju pre vás z poctivých prémiových surovín.</p>
      
      <div style="background-color: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>Termín vyzdvihnutia:</strong> ${pickupDate} o ${pickupTime}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Miesto odberu:</strong> Hlavná 102/179, Viničné</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
          ${itemsListHtml}
        </table>
        <p style="margin: 16px 0 4px 0; font-size: 16px;"><strong>Celková suma:</strong> <span style="color: #a62891; font-weight: bold;">${totalPrice} €</span></p>
      </div>

      ${customerNotes ? `<p style="font-size: 12px; color: #6B5B65; background: #FFFFFF; padding: 12px 14px; border-radius: 8px; border: 1px solid #EAE5DC;"><strong>Vaša poznámka k výrobe:</strong> ${customerNotes}</p>` : ""}

      <p style="font-size: 12px; color: #9E8E98; text-align: center; margin-top: 26px; line-height: 1.5;">
        V prípade akýchkoľvek otázok alebo zmien nás kontaktujte na tel. čísle <strong>+421 910 960 913</strong> alebo odpovedzte priamo na tento e-mail.
      </p>
    </div>
  `;

  // 2. NOTIFIKÁCIA PRE MAJITEĽKU
  const ownerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #DFD8CD; border-radius: 16px; padding: 24px; color: #261B24;">
      <h2 style="color: #261B24; margin-top: 0;">🔔 Nová objednávka vo výrobe #${orderNumber}</h2>
      <div style="background-color: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 4px 0;"><strong>Zákazník:</strong> ${customerName}</p>
        <p style="margin: 4px 0;"><strong>Telefón:</strong> <a href="tel:${customerPhone}" style="color: #a62891; font-weight: bold;">${customerPhone}</a></p>
        <p style="margin: 4px 0;"><strong>E-mail:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
        <p style="margin: 4px 0;"><strong>Termín odberu:</strong> <span style="color: #a62891; font-weight: bold;">${pickupDate} o ${pickupTime}</span></p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
          ${itemsListHtml}
        </table>
        
        <p style="margin: 14px 0 4px 0; font-size: 15px;"><strong>Celková suma:</strong> ${totalPrice} €</p>
        ${allergies ? `<p style="margin: 8px 0; color: #7A2E2E; background: #FFF5F5; padding: 8px 10px; border-radius: 6px;"><strong>⚠️ Alergie / Diéta:</strong> ${allergies}</p>` : ""}
        ${customerNotes ? `<p style="margin: 8px 0; font-style: italic; background: #F8F6F3; padding: 8px 10px; border-radius: 6px;"><strong>Poznámka od zákazníka:</strong> ${customerNotes}</p>` : ""}
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://hanela.sk/admin/" style="background: #261B24; color: #FAF8F5; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Otvoriť v administrácii Hanela &rarr;</a>
      </div>
    </div>
  `;

  return { customerHtml, ownerHtml, orderNumber, customerName, customerEmail, pickupDate, pickupTime };
}

/**
 * 1. Automatický trigger: Spustí sa v sekunde, keď sa v kolekcii `orders` vytvorí nová objednávka
 */
exports.onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const orderData = snapshot.data();
  if (orderData.emailSent === true) {
    console.log(`Email already sent for order ${event.params.orderId}, skipping.`);
    return;
  }

  const order = { ...orderData, id: event.params.orderId };
  const { customerHtml, ownerHtml, orderNumber, customerName, customerEmail, pickupDate, pickupTime } = generateOrderEmails(order);

  try {
    const promises = [];

    // Odoslanie zákazníkovi
    if (customerEmail && customerEmail.includes("@")) {
      promises.push(
        resend.emails.send({
          from: FROM_EMAIL,
          to: [customerEmail],
          replyTo: OWNER_EMAIL,
          reply_to: OWNER_EMAIL,
          subject: `Potvrdenie objednávky č. ${orderNumber} | Cukráreň Hanela`,
          html: customerHtml,
        }).then(res => {
          console.log(`Confirmation email sent to ${customerEmail}:`, res);
          return res;
        }).catch(err => {
          console.error(`Failed to send email to ${customerEmail}:`, err);
          return null;
        })
      );
    }

    // Odoslanie notifikácie majiteľke
    promises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        replyTo: customerEmail || OWNER_EMAIL,
        reply_to: customerEmail || OWNER_EMAIL,
        subject: `🔔 Nová objednávka #${orderNumber} – ${customerName} (${pickupDate} o ${pickupTime})`,
        html: ownerHtml,
      }).then(res => {
        console.log(`Owner alert sent to ${OWNER_EMAIL}:`, res);
        return res;
      }).catch(err => {
        console.error(`Failed to send alert to ${OWNER_EMAIL}:`, err);
        return null;
      })
    );

    await Promise.all(promises);

    // Označenie v databáze, že emaily odišli
    await snapshot.ref.update({
      emailSent: true,
      emailSentAt: new Date().toISOString()
    });

    console.log(`Successfully processed emails for order ${orderNumber}`);
  } catch (err) {
    console.error(`Error processing emails for order ${event.params.orderId}:`, err);
  }
});

/**
 * 2. HTTPS webhook endpoint: Umožňuje odoslať email aj priamym volaním z Webu alebo Adminu
 */
exports.sendOrderEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const order = body.order || body;

    const { customerHtml, ownerHtml, orderNumber, customerName, customerEmail, pickupDate, pickupTime } = generateOrderEmails(order);

    const promises = [];

    // Zákazník
    if (customerEmail && customerEmail.includes("@")) {
      promises.push(
        resend.emails.send({
          from: FROM_EMAIL,
          to: [customerEmail],
          replyTo: OWNER_EMAIL,
          reply_to: OWNER_EMAIL,
          subject: `Potvrdenie objednávky č. ${orderNumber} | Cukráreň Hanela`,
          html: customerHtml,
        })
      );
    }

    // Majiteľka
    promises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        replyTo: customerEmail || OWNER_EMAIL,
        reply_to: customerEmail || OWNER_EMAIL,
        subject: `🔔 Nová objednávka #${orderNumber} – ${customerName} (${pickupDate} o ${pickupTime})`,
        html: ownerHtml,
      })
    );

    const results = await Promise.all(promises);
    res.status(200).json({ success: true, orderNumber, results });
  } catch (err) {
    console.error("HTTP sendOrderEmail error:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});
