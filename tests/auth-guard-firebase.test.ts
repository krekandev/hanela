import { describe, it, expect } from "bun:test";
import {
  isFirebaseConfigured,
  getFirebaseConfigStatus,
  firebaseConfig,
} from "@/lib/firebase";
import { formatFirebaseAuthErrorMessage } from "@/components/admin/AdminAuthGuard";

describe("Firebase Configuration and Status Diagnostics", () => {
  it("getFirebaseConfigStatus returns well-formed diagnostic object", () => {
    const status = getFirebaseConfigStatus();
    expect(typeof status.isConfigured).toBe("boolean");
    expect(typeof status.hasApiKey).toBe("boolean");
    expect(status.projectId).toBe("hanela-cukraren");
    expect(status.authDomain).toBe("hanela-cukraren.firebaseapp.com");
  });

  it("isFirebaseConfigured correctly evaluates when key is not provided in env", () => {
    // In our test / dev environment without live key:
    expect(typeof isFirebaseConfigured).toBe("boolean");
  });

  it("firebaseConfig provides default fallback domain and project id", () => {
    expect(firebaseConfig.projectId).toBe("hanela-cukraren");
    expect(firebaseConfig.authDomain).toBe("hanela-cukraren.firebaseapp.com");
    expect(firebaseConfig.storageBucket).toBe("hanela-cukraren.appspot.com");
  });
});

describe("AdminAuthGuard Firebase Error Code Localization Dictionary", () => {
  it("maps auth/popup-blocked to helpful Slovak instruction", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/popup-blocked" });
    expect(msg).toContain("vyskakovacie okno");
    expect(msg).toContain("pop-up");
  });

  it("maps auth/popup-closed-by-user to informative notice", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/popup-closed-by-user" });
    expect(msg).toContain("zatvorené");
  });

  it("maps auth/unauthorized-domain to Firebase Console guidance", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/unauthorized-domain" });
    expect(msg).toContain("Authorized domains");
    expect(msg).toContain("Firebase Console");
  });

  it("maps auth/api-key-not-valid and auth/invalid-api-key to .env.local guidance", () => {
    const msg1 = formatFirebaseAuthErrorMessage({ code: "auth/api-key-not-valid" });
    const msg2 = formatFirebaseAuthErrorMessage({ code: "auth/invalid-api-key" });
    expect(msg1).toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(msg1).toContain(".env.local");
    expect(msg2).toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
  });

  it("maps auth/operation-not-allowed to provider activation instructions", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/operation-not-allowed" });
    expect(msg).toContain("Sign-in method");
    expect(msg).toContain("Google");
  });

  it("maps auth/network-request-failed to network connection instruction", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/network-request-failed" });
    expect(msg).toContain("Chyba siete");
    expect(msg).toContain("internetové pripojenie");
  });

  it("maps auth/cancelled-popup-request to cancellation explanation", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/cancelled-popup-request" });
    expect(msg).toContain("zrušená");
  });

  it("maps auth/user-disabled to account block notice", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/user-disabled" });
    expect(msg).toContain("zablokovaný");
  });

  it("formats unhandled error codes cleanly with code identifier", () => {
    const msg = formatFirebaseAuthErrorMessage({ code: "auth/custom-code" });
    expect(msg).toContain("auth/custom-code");
  });

  it("formats standard JavaScript Error instances", () => {
    const msg = formatFirebaseAuthErrorMessage(new Error("Custom failure"));
    expect(msg).toBe("Custom failure");
  });

  it("returns fallback for unknown primitives", () => {
    const msg = formatFirebaseAuthErrorMessage(null);
    expect(msg).toBe("Prihlásenie cez Google zlyhalo.");
  });
});

describe("Admin Whitelist Authorization", () => {
  const { isEmailAuthorizedAdmin, getStaticAdminEmails, DEFAULT_ADMIN_EMAILS } = require("@/lib/admin-whitelist");

  it("contains primary bakery owner emails in default list", () => {
    expect(DEFAULT_ADMIN_EMAILS).toContain("krekan.dev@gmail.com");
    expect(DEFAULT_ADMIN_EMAILS).toContain("cukraren.hanela@gmail.com");
    expect(DEFAULT_ADMIN_EMAILS).toContain("hanelacakes@gmail.com");
  });

  it("getStaticAdminEmails returns lowercase normalized emails", () => {
    const emails = getStaticAdminEmails();
    expect(emails).toContain("krekan.dev@gmail.com");
    expect(emails).toContain("cukraren.hanela@gmail.com");
    expect(emails).toContain("hanelacakes@gmail.com");
  });

  it("authorizes primary admin emails with case-insensitivity and whitespace trimming", async () => {
    expect(await isEmailAuthorizedAdmin("krekan.dev@gmail.com")).toBe(true);
    expect(await isEmailAuthorizedAdmin("  KREKAN.DEV@GMAIL.COM  ")).toBe(true);
    expect(await isEmailAuthorizedAdmin("cukraren.hanela@gmail.com")).toBe(true);
    expect(await isEmailAuthorizedAdmin("  CUKRAREN.HANELA@GMAIL.COM  ")).toBe(true);
    expect(await isEmailAuthorizedAdmin("hanelacakes@gmail.com")).toBe(true);
    expect(await isEmailAuthorizedAdmin("HanelaCakes@Gmail.Com")).toBe(true);
  });

  it("rejects unauthorized random emails immediately", async () => {
    expect(await isEmailAuthorizedAdmin("random.person@gmail.com")).toBe(false);
    expect(await isEmailAuthorizedAdmin("attacker@hack.com")).toBe(false);
    expect(await isEmailAuthorizedAdmin("test@cukraren-hanela.sk")).toBe(false);
  });

  it("safely handles null, undefined, and empty string without throwing", async () => {
    expect(await isEmailAuthorizedAdmin("")).toBe(false);
    expect(await isEmailAuthorizedAdmin("   ")).toBe(false);
    expect(await isEmailAuthorizedAdmin(null)).toBe(false);
    expect(await isEmailAuthorizedAdmin(undefined)).toBe(false);
  });
});
