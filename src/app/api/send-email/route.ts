import { NextResponse } from "next/server";
import { Order } from "@/lib/types";
import { sendOrderEmails } from "@/lib/resend";

export interface SendEmailRequestBody {
  order: Order;
}

export interface SendEmailResponseBody {
  success: boolean;
  customerEmailId?: string;
  ownerEmailId?: string;
  simulated?: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate order data structure before attempting email dispatch.
 */
function validateOrderPayload(order: unknown): { valid: boolean; error?: string; validatedOrder?: Order } {
  if (!order || typeof order !== "object") {
    return { valid: false, error: "Chýba objekt objednávky ('order')." };
  }

  const o = order as Record<string, unknown>;

  if (!o.orderNumber || typeof o.orderNumber !== "string") {
    return { valid: false, error: "Chýba číslo objednávky ('orderNumber')." };
  }

  if (!o.pickupDate || typeof o.pickupDate !== "string") {
    return { valid: false, error: "Chýba dátum vyzdvihnutia ('pickupDate')." };
  }

  if (!o.pickupTime || typeof o.pickupTime !== "string") {
    return { valid: false, error: "Chýba časový slot vyzdvihnutia ('pickupTime')." };
  }

  if (!o.customer || typeof o.customer !== "object") {
    return { valid: false, error: "Chýbajú údaje o zákazníkovi ('customer')." };
  }

  const c = o.customer as Record<string, unknown>;
  if (!c.name || typeof c.name !== "string" || c.name.trim() === "") {
    return { valid: false, error: "Chýba meno zákazníka ('customer.name')." };
  }

  if (!c.email || typeof c.email !== "string" || !c.email.includes("@")) {
    return { valid: false, error: "Neplatný e-mail zákazníka ('customer.email')." };
  }

  if (!c.phone || typeof c.phone !== "string" || c.phone.trim() === "") {
    return { valid: false, error: "Chýba telefón zákazníka ('customer.phone')." };
  }

  if (!Array.isArray(o.items) || o.items.length === 0) {
    return { valid: false, error: "Objednávka musí obsahovať aspoň jednu položku ('items')." };
  }

  if (typeof o.totalPrice !== "number" || isNaN(o.totalPrice) || o.totalPrice < 0) {
    return { valid: false, error: "Neplatná celková suma ('totalPrice')." };
  }

  return { valid: true, validatedOrder: order as Order };
}

/**
 * POST /api/send-email
 *
 * Transactional email endpoint for Hanela bakery reservations.
 * Dispatches:
 * 1. Customer confirmation receipt email
 * 2. Bakery owner instant alert email (cukraren.hanela@gmail.com)
 */
export async function POST(request: Request): Promise<NextResponse<SendEmailResponseBody>> {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Neplatný formát požiadavky (očakáva sa validný JSON)." },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { success: false, error: "Telo požiadavky nesmie byť prázdne." },
        { status: 400 }
      );
    }

    // Accept either { order: Order } or direct Order payload for maximum resilience
    const bodyObj = rawBody as Record<string, unknown>;
    const orderCandidate = bodyObj.order ? bodyObj.order : bodyObj;

    const validation = validateOrderPayload(orderCandidate);
    if (!validation.valid || !validation.validatedOrder) {
      return NextResponse.json(
        { success: false, error: validation.error || "Validačná chyba objednávky." },
        { status: 400 }
      );
    }

    const order = validation.validatedOrder;

    // Send emails via Resend
    const { customerResult, ownerResult } = await sendOrderEmails(order);

    // If both failed
    if (!customerResult.success && !ownerResult.success) {
      console.error("[send-email] Both customer and owner email dispatches failed:", {
        customerError: customerResult.error,
        ownerError: ownerResult.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: customerResult.error || ownerResult.error || "Odoslanie e-mailov zlyhalo.",
        },
        { status: 502 }
      );
    }

    // Partial warning if one succeeded and one failed
    let warning: string | undefined;
    if (!customerResult.success) {
      warning = `Email zákazníkovi zlyhal: ${customerResult.error}`;
      console.warn(`[send-email] ${warning}`);
    } else if (!ownerResult.success) {
      warning = `Notifikácia majiteľke zlyhala: ${ownerResult.error}`;
      console.warn(`[send-email] ${warning}`);
    }

    return NextResponse.json(
      {
        success: true,
        customerEmailId: customerResult.id,
        ownerEmailId: ownerResult.id,
        simulated: customerResult.simulated || ownerResult.simulated,
        warning,
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Interná chyba servera pri odosielaní e-mailu.";
    console.error("[send-email Exception]", err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
