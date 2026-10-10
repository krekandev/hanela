"use client";

import React from "react";
import {
  Clock,
  PackageCheck,
  TrendingUp,
  Ban,
  CalendarCheck,
} from "lucide-react";
import { Order, BlockedDate } from "@/lib/types";

interface AdminStatsProps {
  orders: Order[];
  blockedDates: BlockedDate[];
  todayDateStr?: string;
}

export function computeAdminStats(
  orders: Order[],
  blockedDates: BlockedDate[],
  todayDateStr: string
): {
  activeOrdersCount: number;
  todayPickupsCount: number;
  totalRevenue: number;
  blockedDaysCount: number;
} {
  let activeOrdersCount = 0;
  let todayPickupsCount = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    if (order.status !== "zrusena") {
      totalRevenue += order.totalPrice;
      if (order.status === "nova" || order.status === "vyroba") {
        activeOrdersCount += 1;
      }
      if (order.pickupDate === todayDateStr) {
        todayPickupsCount += 1;
      }
    }
  }

  return {
    activeOrdersCount,
    todayPickupsCount,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    blockedDaysCount: blockedDates.length,
  };
}

export function AdminStats({ orders, blockedDates, todayDateStr }: AdminStatsProps) {
  const resolvedToday =
    todayDateStr ||
    (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

  const stats = computeAdminStats(orders, blockedDates, resolvedToday);

  const statItems = [
    {
      id: "active",
      label: "Aktívne vo výrobe",
      value: stats.activeOrdersCount,
      subtext: "Nové a spracovávané zákazky",
      icon: Clock,
      accent: "text-[#a62891]",
    },
    {
      id: "today",
      label: "Dnešné vyzdvihnutia",
      value: stats.todayPickupsCount,
      subtext: "Pripravené na prevzatie dnes",
      icon: CalendarCheck,
      accent: "text-[#345139]",
    },
    {
      id: "revenue",
      label: "Tržby celkom",
      value: `${stats.totalRevenue.toLocaleString("sk-SK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      subtext: "Súčet nezrušených objednávok",
      icon: TrendingUp,
      accent: "text-[#261B24]",
    },
    {
      id: "blocked",
      label: "Zablokované dni",
      value: stats.blockedDaysCount,
      subtext: "Dni bez možnosti rezervácie",
      icon: Ban,
      accent: "text-[#7A2E2E]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="bg-[#FFFFFF] p-4 rounded-xl border border-[#EAE5DC] shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#6B5B65]">
                {item.label}
              </span>
              <Icon className={`w-4 h-4 ${item.accent} opacity-80`} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight text-[#261B24] font-mono">
                {item.value}
              </div>
              <p className="text-[11px] text-[#9E8E98] mt-0.5 truncate">
                {item.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
