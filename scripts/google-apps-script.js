/**
 * =========================================================================
 * HANELA CUKRÁREŇ - GOOGLE APPS SCRIPT WEBHOOK & EMAIL SENDER
 * =========================================================================
 * 
 * Tento skript automaticky:
 * 1. Zapíše novú objednávku do Google Sheets (Tabuľky) do stĺpcov:
 *    Číslo objednávky | Dátum odberu | Čas odberu | Meno | Telefón | Email | Položky | Celková suma | Poznámka / Alergie
 * 2. Okamžite odošle zákazníkovi profesionálny HTML potvrdzovací e-mail z vášho Gmailu
 * 3. Odošle notifikáciu aj vám (majiteľke)
 * 
 * NÁVOD NA NASADENIE ZA 2 MINÚTY (100% ZADARMO):
 * 1. Otvorte Google Sheets (vytvorte novú tabuľku, napr. "Objednávky Hanela")
 * 2. V hornom menu kliknite na: Rozšírenia (Extensions) -> Apps Script
 * 3. Vymažte všetko čo tam je a skopírujte tam tento celý kód.
 * 4. Vpravo hore kliknite na modré tlačidlo: Nasadiť (Deploy) -> Nové nasadenie (New deployment)
 * 5. Vyberte typ: Webová aplikácia (Web app)
 *    - Popis: Hanela Objednávky
 *    - Spustiť ako: Ja (váš Google účet)
 *    - Kto má prístup: Ktokoľvek (Anyone)  <-- DÔLEŽITÉ!
 * 6. Kliknite "Nasadiť" a potvrďte oprávnenia.
 * 7. Skopírujte vygenerovanú URL webovej aplikácie a vložte ju do Administrácie webu Hanela (/admin -> Nastavenia).
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 1. ZÁPIS DO GOOGLE SHEETS
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Vytvorenie hlavičky ak tabuľka nemá riadky
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Číslo objednávky",
        "Vytvorené",
        "Dátum odberu",
        "Čas odberu",
        "Meno zákazníka",
        "Telefón",
        "E-mail",
        "Objednané položky",
        "Celková suma (€)",
        "Alergie",
        "Poznámka zákazníka"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#F4EFE7");
    }

    sheet.appendRow([
      data.orderNumber,
      new Date().toLocaleString("sk-SK"),
      data.pickupDate,
      data.pickupTime,
      data.customerName,
      data.customerPhone,
      data.customerEmail,
      data.itemsSummary,
      data.totalPrice + " €",
      data.allergies || "-",
      data.customerNotes || "-"
    ]);

    // 2. ODOSLANIE EMAILU ZÁKAZNÍKOVI CEZ GMAIL
    if (data.customerEmail) {
      sendCustomerConfirmationEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", orderNumber: data.orderNumber }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendCustomerConfirmationEmail(data) {
  var subject = "Potvrdenie rezervácie torty a zákuskov č. " + data.orderNumber + " | Cukráreň Hanela";

  var itemsListHtml = "";
  if (data.items && data.items.length > 0) {
    for (var i = 0; i < data.items.length; i++) {
      var it = data.items[i];
      itemsListHtml += "<tr style='border-bottom: 1px solid #EAE5DC;'>";
      itemsListHtml += "<td style='padding: 12px 8px; font-weight: 600; color: #261B24;'>" + it.name + "</td>";
      itemsListHtml += "<td style='padding: 12px 8px; text-align: center; color: #666;'>" + it.quantity + "x</td>";
      itemsListHtml += "<td style='padding: 12px 8px; text-align: right; font-weight: bold; color: #a62891;'>" + it.formattedPrice + "</td>";
      itemsListHtml += "</tr>";

      // Detaily konfigurácie (veľkosť, korpus, krém)
      if (it.configuration) {
        var cfgDetails = [];
        if (it.configuration.size) cfgDetails.push("Veľkosť: " + it.configuration.size);
        if (it.configuration.korpus) cfgDetails.push("Korpus: " + it.configuration.korpus);
        if (it.configuration.krem) cfgDetails.push("Krém: " + it.configuration.krem);
        if (it.configuration.diets && it.configuration.diets.length) cfgDetails.push("Úprava: " + it.configuration.diets.join(", "));
        if (it.configuration.zdobenie && it.configuration.zdobenie.length) cfgDetails.push("Zdobenie: " + it.configuration.zdobenie.join(", "));

        if (cfgDetails.length > 0) {
          itemsListHtml += "<tr><td colspan='3' style='padding: 0 8px 10px 8px; font-size: 11px; color: #777;'>↳ " + cfgDetails.join(" • ") + "</td></tr>";
        }
      }
    }
  }

  var htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #EAE5DC; border-radius: 16px; overflow: hidden; color: #261B24;">
      
      <!-- HEADER -->
      <div style="background-color: #261B24; padding: 28px 24px; text-align: center; color: #FAF8F5;">
        <h1 style="margin: 0; font-family: serif; font-size: 26px; letter-spacing: 2px;">HANELA</h1>
        <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Remeselná cukrárska výrobňa Viničné</p>
      </div>

      <!-- BODY -->
      <div style="padding: 28px 24px;">
        <h2 style="font-size: 18px; color: #261B24; margin-top: 0;">Ďakujeme za vašu rezerváciu!</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #444;">
          Vaša objednávka <strong>${data.orderNumber}</strong> bola úspešne zaevidovaná vo výrobe. Tešíme sa na vašu návštevu v našej výrobni vo Viničnom.
        </p>

        <!-- INFO BOX -->
        <div style="background-color: #FFFFFF; border: 1px solid #DFD8CD; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #777; padding-bottom: 6px;">Termín vyzdvihnutia:</td>
              <td style="font-weight: bold; text-align: right; color: #a62891;">${data.pickupDate}</td>
            </tr>
            <tr>
              <td style="color: #777; padding-bottom: 6px;">Čas prevzatia:</td>
              <td style="font-weight: bold; text-align: right; color: #261B24;">${data.pickupTime}</td>
            </tr>
            <tr>
              <td style="color: #777; padding-bottom: 6px;">Miesto odberu:</td>
              <td style="font-weight: 500; text-align: right; color: #261B24;">Hlavná 102/179, Viničné</td>
            </tr>
            <tr>
              <td style="color: #777;">Platba:</td>
              <td style="font-weight: 500; text-align: right; color: #261B24;">Pri prevzatí (hotovosť / QR)</td>
            </tr>
          </table>
        </div>

        <!-- ITEMS TABLE -->
        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #261B24; margin-bottom: 10px;">Súhrn položiek:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #DFD8CD; overflow: hidden;">
          <tbody>
            ${itemsListHtml}
            <tr style="background-color: #F4EFE7;">
              <td colspan="2" style="padding: 14px 12px; font-weight: bold; text-transform: uppercase; font-size: 12px;">Celková suma na úhradu:</td>
              <td style="padding: 14px 12px; text-align: right; font-weight: bold; font-size: 16px; color: #a62891;">${data.totalPrice} €</td>
            </tr>
          </tbody>
        </table>

        ${data.customerNotes ? `<p style="font-size: 12px; color: #666; margin-top: 16px;"><strong>Vaša poznámka k výrobe:</strong> ${data.customerNotes}</p>` : ""}

        <!-- FOOTER INFO -->
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #EAE5DC; font-size: 11px; color: #888; text-align: center; line-height: 1.5;">
          <p style="margin: 0;">V prípade akýchkoľvek otázok alebo zmeny termínu nás kontaktujte na tel. <strong>+421 900 000 000</strong>.</p>
          <p style="margin: 4px 0 0 0;">Cukráreň Hanela • Ručne pečené s láskou a 100% živočíšnym tukom</p>
        </div>

      </div>
    </div>
  `;

  GmailApp.sendEmail(data.customerEmail, subject, "", {
    htmlBody: htmlBody,
    name: "Cukráreň Hanela"
  });
}
