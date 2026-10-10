import { Order } from "./types";
import { sendOrderEmails } from "./resend";

/**
 * @deprecated Legacy webhook notification. Migrated to Resend API via /api/send-email.
 * This file serves as a transitional compatibility shim during Milestones M1-M3
 * to prevent breaking builds before Admin and Rezervacia callers are updated in M2/M4.
 */
export async function sendOrderNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  console.warn("[DEPRECATED] sendOrderNotification called. Routing through Resend email service.");
  try {
    const { customerResult, ownerResult } = await sendOrderEmails(order);
    const ok = customerResult.success || ownerResult.success;
    return {
      success: ok,
      error: !ok ? (customerResult.error || ownerResult.error) : undefined,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba odoslania emailu",
    };
  }
}
