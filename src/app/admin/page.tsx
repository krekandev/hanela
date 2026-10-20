"use client";

import React, { useState, useEffect, useMemo } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { isEmailAuthorizedAdmin } from "@/lib/admin-whitelist";
import {
  Order,
  OrderStatus,
  BlockedDate,
  ProductPriceDoc,
  ManualContact,
} from "@/lib/types";
import {
  subscribeOrders,
  subscribeBlockedDates,
  subscribePrices,
  subscribeManualContacts,
  saveManualContact,
  deleteManualContact,
  updateOrderStatus,
  updateOrderInternalNote,
  blockDate,
  unblockDate,
  saveProductPrice,
} from "@/lib/orders-service";
import { AdminHeader, AdminTab } from "@/components/admin/AdminHeader";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminAuthGuard, formatFirebaseAuthErrorMessage } from "@/components/admin/AdminAuthGuard";
import { CalendarTab } from "@/components/admin/CalendarTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { CapacityTab } from "@/components/admin/CapacityTab";
import { ContactsTab } from "@/components/admin/ContactsTab";
import { PrintReceipt } from "@/components/admin/PrintReceipt";

export default function AdminPage() {
  // Auth state with localStorage session persistence
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hanela_admin_session") === "true";
    }
    return false;
  });
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [headerAuthError, setHeaderAuthError] = useState<string | null>(null);

  // Active Navigation Pillar: strictly the 4 modules
  const [activeTab, setActiveTab] = useState<AdminTab>("calendar");

  // Real-time Firestore state
  const [orders, setOrders] = useState<Order[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [prices, setPrices] = useState<Record<string, ProductPriceDoc>>({});
  const [manualContacts, setManualContacts] = useState<ManualContact[]>([]);

  // Calendar selected day
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  // Kitchen Print Receipt modal state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // 1. Listen for Firebase Auth state changes with Whitelist verification
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const isAllowed = await isEmailAuthorizedAdmin(user.email);
          if (isAllowed) {
            setCurrentUser(user);
            setIsDemoMode(false);
            if (typeof window !== "undefined") {
              localStorage.removeItem("hanela_admin_session");
            }
          } else {
            // E-mail is not in whitelist — evict immediately
            if (auth) {
              await signOut(auth);
            }
            setCurrentUser(null);
            setHeaderAuthError(
              `Prístup zamietnutý: E-mail "${user.email}" nemá administrátorské oprávnenie. Prístup je vyhradený iba pre autorizované Google e-maily majiteľky.`
            );
          }
        } else {
          setCurrentUser(null);
        }
        setAuthInitialized(true);
      });
      return () => unsubscribeAuth();
    } else {
      setAuthInitialized(true);
    }
  }, []);

  // 2. Subscribe to real-time collections (orders, blocked_dates, prices, manual contacts)
  useEffect(() => {
    const unsubOrders = subscribeOrders((data) => {
      setOrders(data);
    });

    const unsubBlocked = subscribeBlockedDates((data) => {
      setBlockedDates(data);
    });

    const unsubPrices = subscribePrices((data) => {
      setPrices(data);
    });

    const unsubContacts = subscribeManualContacts((data) => {
      setManualContacts(data);
    });

    return () => {
      unsubOrders();
      unsubBlocked();
      unsubPrices();
      unsubContacts();
    };
  }, []);

  // Auth actions
  const handleEnterLocalMode = () => {
    setIsDemoMode(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("hanela_admin_session", "true");
    }
  };

  const handleSignInGoogle = async () => {
    setHeaderAuthError(null);
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email;
        const isAllowed = await isEmailAuthorizedAdmin(email);
        if (!isAllowed) {
          await signOut(auth);
          setCurrentUser(null);
          setHeaderAuthError(
            `Prístup zamietnutý: E-mail "${email || "neznámy"}" nemá administrátorské oprávnenie. Prístup je vyhradený iba pre autorizované Google e-maily majiteľky.`
          );
        }
      } catch (err: unknown) {
        console.warn("Google Sign-In popup error:", err);
        const message = formatFirebaseAuthErrorMessage(err);
        setHeaderAuthError(message);
      }
    } else {
      setHeaderAuthError(
        "Chýba konfigurácia Firebase API kľúča v .env.local."
      );
    }
  };

  const handleSignOut = async () => {
    if (isFirebaseConfigured && auth && currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("Sign-Out error:", err);
      }
    }
    setCurrentUser(null);
    setIsDemoMode(false);
    setHeaderAuthError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hanela_admin_session");
    }
  };

  // Status updates
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
  };

  // Internal note updates
  const handleUpdateInternalNote = async (orderId: string, note: string) => {
    await updateOrderInternalNote(orderId, note);
  };

  // Capacity actions
  const handleBlockDate = async (date: string, reason: string) => {
    await blockDate(date, reason);
  };

  const handleUnblockDate = async (date: string) => {
    await unblockDate(date);
  };

  // Price updates
  const handleSavePrice = async (
    productId: string,
    price: number,
    isAvailable: boolean
  ) => {
    await saveProductPrice(productId, price, isAvailable);
  };

  // Manual contact handlers
  const handleAddManualContact = async (contact: {
    name: string;
    email: string;
    phone?: string;
    note?: string;
  }) => {
    await saveManualContact(contact);
  };

  const handleDeleteManualContact = async (id: string) => {
    await deleteManualContact(id);
  };

  // Compute active orders count for header badge
  const activeOrdersCount = orders.filter(
    (o) => o.status === "nova" || o.status === "vyroba"
  ).length;

  // Compute total unique contacts count for header badge
  const uniqueContactsCount = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.customer?.email) {
        const e = o.customer.email.trim().toLowerCase();
        if (e && e.includes("@")) set.add(e);
      }
    });
    manualContacts.forEach((m) => {
      if (m.email) {
        const e = m.email.trim().toLowerCase();
        if (e && e.includes("@")) set.add(e);
      }
    });
    return set.size;
  }, [orders, manualContacts]);

  return (
    <AdminAuthGuard
      currentUser={currentUser}
      isDemoMode={isDemoMode}
      authInitialized={authInitialized}
      onEnterDemoMode={handleEnterLocalMode}
    >
      <div className="min-h-screen bg-[#FAF8F5] text-[#261B24] font-sans antialiased selection:bg-[#FAF1F8] selection:text-[#a62891]">
        {/* Header with Navigation & Live Sync Indicator */}
        <AdminHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          isDemoMode={isDemoMode}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          isLiveFirestore={isFirebaseConfigured}
          activeOrdersCount={activeOrdersCount}
          contactsCount={uniqueContactsCount}
        />

        {/* Main Workspace Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header Google Auth notification alert if triggered from header */}
          {headerAuthError && (
            <div className="mb-6 p-4 rounded-xl bg-[#FBF2F2] border border-[#EDD5D5] text-[#7A2E2E] text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{headerAuthError}</span>
              </div>
              <button
                type="button"
                onClick={() => setHeaderAuthError(null)}
                className="text-xs font-semibold hover:underline text-[#7A2E2E] shrink-0 cursor-pointer"
              >
                Zavrieť
              </button>
            </div>
          )}

          {/* Key Business Stats Bar */}
          <AdminStats
            orders={orders}
            blockedDates={blockedDates}
          />

          {/* Core Module Pillar Views */}
          {activeTab === "calendar" && (
            <CalendarTab
              orders={orders}
              blockedDates={blockedDates}
              selectedDayStr={selectedDayStr}
              onSelectDay={setSelectedDayStr}
              onUpdateStatus={handleUpdateStatus}
              onUpdateInternalNote={handleUpdateInternalNote}
              onPrintReceipt={setReceiptOrder}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              onUpdateStatus={handleUpdateStatus}
              onUpdateInternalNote={handleUpdateInternalNote}
              onPrintReceipt={setReceiptOrder}
            />
          )}

          {activeTab === "capacity" && (
            <CapacityTab
              blockedDates={blockedDates}
              onBlockDate={handleBlockDate}
              onUnblockDate={handleUnblockDate}
            />
          )}

          {activeTab === "contacts" && (
            <ContactsTab
              orders={orders}
              manualContacts={manualContacts}
              onAddManualContact={handleAddManualContact}
              onDeleteManualContact={handleDeleteManualContact}
            />
          )}
        </main>

        {/* Kitchen Printable Bon Modal */}
        <PrintReceipt
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      </div>
    </AdminAuthGuard>
  );
}
