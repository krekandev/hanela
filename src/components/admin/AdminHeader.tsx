"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ListOrdered,
  Ban,
  DollarSign,
  LogOut,
  ExternalLink,
  Radio,
  User as UserIcon,
  LogIn,
} from "lucide-react";
import { User } from "firebase/auth";

export type AdminTab = "calendar" | "orders" | "capacity" | "pricing";

interface AdminHeaderProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  currentUser: User | null;
  isDemoMode: boolean;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  isLiveFirestore: boolean;
  activeOrdersCount: number;
}

export const ADMIN_NAV_PILLARS = [
  { id: "calendar" as const, label: "Kalendár výroby", icon: CalendarIcon },
  { id: "orders" as const, label: "Objednávky", icon: ListOrdered },
  { id: "capacity" as const, label: "Kapacita dní", icon: Ban },
  { id: "pricing" as const, label: "Zmena cien", icon: DollarSign },
];

export function AdminHeader({
  activeTab,
  onSelectTab,
  currentUser,
  isDemoMode,
  onSignInGoogle,
  onSignOut,
  isLiveFirestore,
  activeOrdersCount,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top brand & user bar */}
        <div className="flex items-center justify-between h-16 border-b border-[#EAE5DC]/60">
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-baseline gap-2 text-decoration-none"
              title="Prejsť na web"
            >
              <span className="font-serif text-2xl font-semibold tracking-tight text-[#261B24] group-hover:text-[#a62891] transition-colors">
                Hanela
              </span>
              <span className="text-[11px] font-sans tracking-widest uppercase text-[#6B5B65] font-medium">
                Admin
              </span>
            </Link>

            {/* Live Firestore Sync Status Pill */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isLiveFirestore
                  ? "bg-[#F3F6F3] text-[#345139] border-[#DCE4DC]"
                  : "bg-[#F8F4EE] text-[#6E5335] border-[#EADFCF]"
              }`}
              title={
                isLiveFirestore
                  ? "Pripojené k Firebase Firestore v reálnom čase"
                  : "Offline / lokálny režim úložiska"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveFirestore ? "bg-[#345139] animate-pulse" : "bg-[#6E5335]"
                }`}
              />
              <span className="font-sans">
                {isLiveFirestore ? "Živé spojenie Firestore" : "Lokálny režim"}
              </span>
            </div>
          </div>

          {/* Right actions: Public web link + User Profile / Auth */}
          <div className="flex items-center gap-3">
            <Link
              href="/ponuka"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#6B5B65] hover:text-[#261B24] transition-colors px-2 py-1 rounded"
            >
              <span>Zákaznícka ponuka</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#EAE5DC]">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      className="w-7 h-7 rounded-full border border-[#DFD8CD] object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FAF1F8] border border-[#ECD9E8] text-[#a62891] flex items-center justify-center text-xs font-bold">
                      {currentUser.displayName ? currentUser.displayName[0] : "H"}
                    </div>
                  )}
                  <span className="hidden sm:inline-block text-xs font-medium text-[#261B24] max-w-[140px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 text-[#6B5B65] hover:text-[#7A2E2E] hover:bg-[#FBF2F2] rounded-md transition-colors"
                  title="Odhlásiť sa"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#EAE5DC]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FAF1F8] border border-[#ECD9E8] text-[#a62891] flex items-center justify-center text-xs font-bold">
                    H
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-[#261B24]">
                    Majiteľka (Lokálny režim)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#261B24] hover:text-[#a62891] px-2 py-1 rounded border border-[#DFD8CD] hover:border-[#a62891] transition-colors cursor-pointer"
                  title="Prepojiť s Google účtom"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Google Prihlásenie</span>
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 text-[#6B5B65] hover:text-[#7A2E2E] hover:bg-[#FBF2F2] rounded-md transition-colors cursor-pointer"
                  title="Odhlásiť sa"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FAF8F5] bg-[#261B24] hover:bg-[#3d2c3a] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Prihlásiť sa</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Core Navigation Pillars */}
        <nav className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto no-scrollbar">
          {ADMIN_NAV_PILLARS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#FFFFFF] text-[#261B24] shadow-xs border border-[#EAE5DC] font-semibold"
                    : "text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FFFFFF]/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#a62891]" : "text-[#9E8E98]"
                  }`}
                />
                <span>{item.label}</span>
                {item.id === "orders" && activeOrdersCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8]">
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
