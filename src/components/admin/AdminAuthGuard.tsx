"use client";

import React, { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { isEmailAuthorizedAdmin } from "@/lib/admin-whitelist";

export interface AdminAuthGuardProps {
  currentUser: User | null;
  isDemoMode: boolean;
  onEnterDemoMode: () => void;
  authInitialized?: boolean;
  children: React.ReactNode;
}

export function formatFirebaseAuthErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: unknown }).code);
    switch (code) {
      case "auth/popup-blocked":
        return "Prehliadač zablokoval vyskakovacie okno Google. Povoľte prosím vyskakovacie okná (pop-up) v prehliadači.";
      case "auth/popup-closed-by-user":
        return "Prihlasovacie okno Google bolo zatvorené pred dokončením.";
      case "auth/unauthorized-domain":
        return "Táto doména (localhost / webová doména) nie je autorizovaná vo Firebase Console (Authentication → Settings → Authorized domains).";
      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
        return "Zadaný Firebase API kľúč nie je platný. Skontrolujte nastavenie NEXT_PUBLIC_FIREBASE_API_KEY v .env.local.";
      case "auth/operation-not-allowed":
        return "Prihlásenie cez Google nie je povolené vo Firebase Console (Authentication → Sign-in method → Google → Povoliť).";
      case "auth/network-request-failed":
        return "Chyba siete: Nepodarilo sa spojiť so servermi Firebase. Skontrolujte internetové pripojenie.";
      case "auth/cancelled-popup-request":
        return "Predchádzajúca požiadavka na prihlásenie bola zrušená kvôli novému pokusu.";
      case "auth/user-disabled":
        return "Tento používateľský účet bol zablokovaný správcom Firebase.";
      default:
        return `Chyba prihlásenia (${code}). Skontrolujte nastavenie vo Firebase konzole.`;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Prihlásenie cez Google zlyhalo.";
}

export function AdminAuthGuard({
  currentUser,
  isDemoMode,
  onEnterDemoMode,
  authInitialized = true,
  children,
}: AdminAuthGuardProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // 1. Initial auth state evaluation spinner (eliminates screen flicker)
  if (authInitialized === false && !currentUser && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="w-12 h-12 rounded-full border-2 border-[#EAE5DC] border-t-[#a62891] animate-spin" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#261B24]">
              Načítavam administráciu...
            </h2>
            <p className="text-xs text-[#6B5B65] mt-1 font-sans">
              Overujem oprávnenie a stav prihlásenia
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. If user is authenticated via Google or has entered authorized session, render content
  if (currentUser || isDemoMode) {
    return <>{children}</>;
  }

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError(
        "V .env.local chýba platný Firebase API kľúč (NEXT_PUBLIC_FIREBASE_API_KEY). Pre správu kontaktujte administrátora."
      );
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      
      // Strict Whitelist Check: only authorized emails are allowed
      const isAllowed = await isEmailAuthorizedAdmin(email);
      if (!isAllowed) {
        await signOut(auth);
        const attemptedEmail = email || "neznámy e-mail";
        setAuthError(
          `Prístup zamietnutý: E-mail "${attemptedEmail}" nemá administrátorské oprávnenie. Prístup do administrácie je povolený výhradne pre autorizované Google e-maily majiteľky.`
        );
        return;
      }
    } catch (err: unknown) {
      console.warn("Google Sign-In failed:", err);
      const message = formatFirebaseAuthErrorMessage(err);
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Emergency PIN protection so unauthorized people cannot enter
    if (pinInput.trim() === "hanela2026") {
      onEnterDemoMode();
    } else {
      setAuthError("Nesprávny bezpečnostný PIN kód.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-sm p-8 text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#FAF1F8] border border-[#ECD9E8] flex items-center justify-center text-[#a62891]">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="font-serif text-2xl font-semibold text-[#261B24] tracking-tight mb-2">
          Administrácia Hanela
        </h1>
        <p className="text-sm text-[#6B5B65] mb-6 font-sans">
          Prístup vyhradený pre majiteľku cukrárne. Správa výroby, objednávok, termínov a cien.
        </p>

        {/* Local mode informational status badge when Firebase is not configured */}
        {!isFirebaseConfigured && (
          <div className="mb-6 p-3 rounded-xl bg-[#F8F4EE] border border-[#EADFCF] text-[#6E5335] text-xs text-left flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#6E5335] shrink-0 mt-1.5" />
            <span>
              Aplikácia beží v offline režime bez pripojenia k Firebase. Pre vstup použite núdzový PIN kód majiteľky.
            </span>
          </div>
        )}

        {/* Error notification banner */}
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-[#FBF2F2] border border-[#EDD5D5] text-[#7A2E2E] text-xs text-left space-y-2 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <span className="font-semibold block">Prístup zamietnutý:</span>
                <span>{authError}</span>
              </div>
            </div>
          </div>
        )}

        {/* Primary Action: Google Sign-In */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {/* Google G logo SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? "Overujem oprávnenie..." : "Prihlásiť sa cez Google"}</span>
          </button>

          <p className="text-[11px] text-[#8C7A86] leading-relaxed">
            Prístup do systému je povolený výhradne pre registrované administrátorské e-maily cukrárne Hanela.
          </p>

          {/* Emergency PIN Fallback (Discreet) */}
          <div className="pt-4 border-t border-[#EAE5DC]/80">
            {!showPinModal ? (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="text-xs text-[#8C7A86] hover:text-[#261B24] transition-colors underline cursor-pointer"
              >
                Núdzový prístup bezpečnostným PIN kódom
              </button>
            ) : (
              <form onSubmit={handleVerifyPin} className="space-y-2.5 text-left">
                <label className="block text-xs font-medium text-[#261B24]">
                  Bezpečnostný kód majiteľky
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Zadajte kód..."
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DFD8CD] rounded-lg text-[#261B24] focus:outline-none focus:border-[#a62891]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Vstúpiť
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="text-[11px] text-[#8C7A86] hover:text-[#261B24]"
                >
                  Zrušiť
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-[#9E8E98]">
          Cukráreň Hanela &copy; {new Date().getFullYear()} &middot; Zabezpečená správa
        </p>
      </div>
    </div>
  );
}
