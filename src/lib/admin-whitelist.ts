import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

// Default authorized emails for the bakery owners
export const DEFAULT_ADMIN_EMAILS = [
  "krekan.dev@gmail.com",
  "cukraren.hanela@gmail.com",
  "hanelacakes@gmail.com",
];

/**
 * Returns static authorized emails from environment variables and defaults.
 */
export function getStaticAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const combined = [
    ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...envEmails,
  ];

  return Array.from(new Set(combined));
}

/**
 * Checks whether the given email has administrator privileges.
 * 1. Checks local env / default static whitelist.
 * 2. If Firestore is active, also checks document `settings/admins` (field `emails`)
 *    and collection `admin_users/{email}`.
 */
export async function isEmailAuthorizedAdmin(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // 1. Quick check against static/env whitelist
  const staticList = getStaticAdminEmails();
  if (staticList.includes(normalized)) {
    return true;
  }

  // 2. Dynamic check in Firestore (settings/admins, settings/admin, admins/{email}, or admin_users/{email})
  if (isFirebaseConfigured && db) {
    try {
      // Check settings/admins and settings/admin docs
      for (const settingsDocName of ["admins", "admin"]) {
        const settingsRef = doc(db, "settings", settingsDocName);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (Array.isArray(data?.emails)) {
            const remoteList = data.emails.map((e: string) =>
              String(e).trim().toLowerCase()
            );
            if (remoteList.includes(normalized)) {
              return true;
            }
          }
        }
      }

      // Check direct user documents in 'admin_users' or 'admins'
      for (const colName of ["admin_users", "admins"]) {
        const userRef = doc(db, colName, normalized);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return true;
        }
      }
    } catch (err) {
      console.warn("[Admin Whitelist] Firestore check failed, relying on static whitelist:", err);
    }
  }

  return false;
}
