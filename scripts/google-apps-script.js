/**
 * =========================================================================
 * HANELA CUKRÁREŇ — RESEND EMAIL DISPATCHER (GOOGLE APPS SCRIPT)
 * =========================================================================
 * 
 * Tento skript funguje ako 100% bezplatný, spoľahlivý cloudový mostík.
 * Prijme novú objednávku z webu https://hanela.sk a okamžite odošle:
 * 1. Zákazníkovi oficiálne potvrdenie z objednavky@hanela.sk cez Resend API.
 * 2. Majiteľke okamžitú notifikáciu na hanelacakes@gmail.com cez Resend API.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var raw = JSON.parse(rawData);
    var order = raw.order ? raw.order : raw;

    // Resend API kľúč nastavený v prostredí alebo script properties
    var RESEND_API_KEY = PropertiesService.getScriptProperties().getProperty("RESEND_API_KEY") || "";
    var FROM_EMAIL = "Cukráreň Hanela <objednavky@hanela.sk>";
    var OWNER_EMAIL = "hanelacakes@gmail.com";

    var customer = order.customer || {};
    var customerName = customer.name || "Zákazník";
    var customerEmail = customer.email || "";
    var customerPhone = customer.phone || "";
    var customerNotes = customer.notes || "";
    var allergies = customer.allergies || "";
    var orderNumber = order.orderNumber || "HAN-" + new Date().getFullYear() + "-001";
    var pickupDate = order.pickupDate || "";
    var pickupTime = order.pickupTime || "";
    var totalPrice = order.totalPrice || 0;
    var items = order.items || [];

    // Vytvorenie HTML riadkov položiek
    var itemsListHtml = "";
    if (items.length > 0) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var priceDisplay = it.totalPrice ? it.totalPrice + " €" : (it.unitPrice ? it.unitPrice + " €" : "");
        itemsListHtml += "<tr>";
        itemsListHtml += "<td style='padding: 10px 0; border-bottom: 1px solid #EAE5DC; color: #261B24; font-size: 13px;'>";
        itemsListHtml += "<strong>" + (it.name || "Výrobok") + "</strong> (" + (it.quantity || 1) + "x)";
        if (it.size || it.korpus || it.krem || it.servings) {
          var details = [];
          if (it.size) details.push(it.size);
          if (it.servings) details.push(it.servings);
          if (it.korpus) details.push("Korpus: " + it.korpus);
          if (it.krem) details.push("Krém: " + it.krem);
          itemsListHtml += "<div style='font-size: 11px; color: #6B5B65; margin-top: 2px;'>↳ " + details.join(" • ") + "</div>";
        }
        itemsListHtml += "</td>";
        itemsListHtml += "<td style='padding: 10px 0; text-align: right; border-bottom: 1px solid #EAE5DC; font-weight: bold; color: #a62891; font-size: 13px;'>";
        itemsListHtml += priceDisplay;
        itemsListHtml += "</td>";
        itemsListHtml += "</tr>";
      }
    }

    // 1. ŠABLÓNA PRE ZÁKAZNÍKA
    var customerHtml = [
      "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #DFD8CD; border-radius: 16px; padding: 28px; color: #261B24;'>",
      "  <div style='text-align: center; margin-bottom: 24px;'>",
      "    <img src='https://hanela.sk/images/logo.png' width='70' height='70' style='border-radius: 50%; border: 1px solid #DFD8CD;' alt='Hanela'/>",
      "    <h1 style='font-family: serif; font-size: 24px; color: #261B24; margin: 10px 0 2px 0;'>HANELA</h1>",
      "    <p style='font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6B5B65; margin: 0;'>Remeselná cukráreň Viničné</p>",
      "  </div>",
      "  <h2 style='font-size: 18px; color: #261B24; margin-top: 0;'>Ďakujeme za vašu objednávku #" + orderNumber + "!</h2>",
      "  <p style='color: #6B5B65; font-size: 14px; line-height: 1.6;'>Vašu rezerváciu sme v poriadku zaevidovali vo výrobe. Pripravíme ju pre vás z poctivých surovín.</p>",
      "  <div style='background-color: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 12px; padding: 16px; margin: 18px 0;'>",
      "    <p style='margin: 4px 0; font-size: 13px;'><strong>Termín vyzdvihnutia:</strong> " + pickupDate + " o " + pickupTime + "</p>",
      "    <p style='margin: 4px 0; font-size: 13px;'><strong>Miesto odberu:</strong> Hlavná 102/179, Viničné</p>",
      "    <table style='width: 100%; border-collapse: collapse; margin-top: 12px;'>" + itemsListHtml + "</table>",
      "    <p style='margin: 14px 0 4px 0; font-size: 16px;'><strong>Celková suma:</strong> <span style='color: #a62891; font-weight: bold;'>" + totalPrice + " €</span></p>",
      "  </div>",
      customerNotes ? "  <p style='font-size: 12px; color: #6B5B65; background: #FFFFFF; padding: 10px 12px; border-radius: 8px; border: 1px solid #EAE5DC;'><strong>Vaša poznámka:</strong> " + customerNotes + "</p>" : "",
      "  <p style='font-size: 12px; color: #9E8E98; text-align: center; margin-top: 24px; line-height: 1.5;'>V prípade otázok nás kontaktujte na tel. <strong>+421 910 960 913</strong> alebo odpovedzte priamo na tento e-mail.</p>",
      "</div>"
    ].join("");

    // 2. ŠABLÓNA PRE MAJITEĽKU
    var ownerHtml = [
      "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #DFD8CD; border-radius: 16px; padding: 24px; color: #261B24;'>",
      "  <h2 style='color: #261B24; margin-top: 0;'>🔔 Nová objednávka vo výrobe #" + orderNumber + "</h2>",
      "  <div style='background-color: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;'>",
      "    <p style='margin: 4px 0;'><strong>Zákazník:</strong> " + customerName + "</p>",
      "    <p style='margin: 4px 0;'><strong>Telefón:</strong> <a href='tel:" + customerPhone + "'>" + customerPhone + "</a></p>",
      "    <p style='margin: 4px 0;'><strong>E-mail:</strong> " + customerEmail + "</p>",
      "    <p style='margin: 4px 0;'><strong>Termín odberu:</strong> <span style='color: #a62891; font-weight: bold;'>" + pickupDate + " o " + pickupTime + "</span></p>",
      "    <table style='width: 100%; border-collapse: collapse; margin-top: 12px;'>" + itemsListHtml + "</table>",
      "    <p style='margin: 14px 0 4px 0; font-size: 15px;'><strong>Celková suma:</strong> " + totalPrice + " €</p>",
      allergies ? "    <p style='margin: 6px 0; color: #7A2E2E;'><strong>⚠️ Alergie:</strong> " + allergies + "</p>" : "",
      customerNotes ? "    <p style='margin: 6px 0; font-style: italic;'><strong>Poznámka:</strong> " + customerNotes + "</p>" : "",
      "  </div>",
      "  <div style='text-align: center; margin-top: 20px;'>",
      "    <a href='https://hanela.sk/admin/' style='background: #261B24; color: #FAF8F5; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;'>Otvoriť v administrácii Hanela &rarr;</a>",
      "  </div>",
      "</div>"
    ].join("");

    // Odoslanie zákazníkovi cez Resend
    if (customerEmail && customerEmail.indexOf("@") !== -1) {
      UrlFetchApp.fetch("https://api.resend.com/emails", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + RESEND_API_KEY },
        payload: JSON.stringify({
          from: FROM_EMAIL,
          to: [customerEmail],
          reply_to: OWNER_EMAIL,
          subject: "Potvrdenie objednávky č. " + orderNumber + " | Cukráreň Hanela",
          html: customerHtml
        }),
        muteHttpExceptions: true
      });
    }

    // Odoslanie notifikácie majiteľke cez Resend
    UrlFetchApp.fetch("https://api.resend.com/emails", {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + RESEND_API_KEY },
      payload: JSON.stringify({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        reply_to: customerEmail || OWNER_EMAIL,
        subject: "🔔 Nová objednávka #" + orderNumber + " – " + customerName + " (" + pickupDate + " o " + pickupTime + ")",
        html: ownerHtml
      }),
      muteHttpExceptions: true
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true, orderNumber: orderNumber }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
