"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  Printer,
  Check,
  ArrowRight,
  FileText,
  Calendar as CalendarIcon,
  Ban,
  User,
} from "lucide-react";
import { Order, OrderStatus, BlockedDate, ORDER_STATUS_TOKENS } from "@/lib/types";

interface CalendarTabProps {
  orders: Order[];
  blockedDates: BlockedDate[];
  selectedDayStr: string;
  onSelectDay: (dayStr: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdateInternalNote: (orderId: string, note: string) => Promise<void>;
  onPrintReceipt: (order: Order) => void;
}

const MONTH_NAMES = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];
const DAY_NAMES = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

const STATUS_PROGRESSION: Record<OrderStatus, OrderStatus | null> = {
  nova: "vyroba",
  vyroba: "pripravena",
  pripravena: "odovzdana",
  odovzdana: null,
  zrusena: null,
};

const NEXT_STATUS_BUTTON_LABELS: Partial<Record<OrderStatus, string>> = {
  nova: "Začať výrobu",
  vyroba: "Označiť ako pripravená",
  pripravena: "Odovzdať zákazníkovi",
};

export function CalendarTab({
  orders,
  blockedDates,
  selectedDayStr,
  onSelectDay,
  onUpdateStatus,
  onUpdateInternalNote,
  onPrintReceipt,
}: CalendarTabProps) {
  // Calendar View month/year state
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (selectedDayStr && selectedDayStr.length >= 4) {
      return parseInt(selectedDayStr.substring(0, 4), 10);
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (selectedDayStr && selectedDayStr.length >= 7) {
      return parseInt(selectedDayStr.substring(5, 7), 10) - 1;
    }
    return new Date().getMonth();
  });

  // Internal note editing local states: orderId -> draft text
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday-based indexing: Sunday is 6, Mon is 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      orderCount: number;
      isBlocked: boolean;
      blockedReason?: string;
    }> = [];

    // Empty padding slots for days before start
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(currentYear, currentMonth, -startDayOfWeek + i + 1);
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      const d = String(prevDate.getDate()).padStart(2, "0");
      const dateStr = `${prevDate.getFullYear()}-${m}-${d}`;
      days.push({
        dayNumber: prevDate.getDate(),
        dateStr,
        isCurrentMonth: false,
        orderCount: 0,
        isBlocked: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      const dayOrders = orders.filter(
        (o) => o.pickupDate === dateStr && o.status !== "zrusena"
      );
      const blocked = blockedDates.find((b) => b.date === dateStr);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        orderCount: dayOrders.length,
        isBlocked: !!blocked,
        blockedReason: blocked?.reason,
      });
    }

    return days;
  }, [currentYear, currentMonth, orders, blockedDates]);

  // Orders for the currently selected day
  const selectedDayOrders = useMemo(() => {
    return orders
      .filter((o) => o.pickupDate === selectedDayStr)
      .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
  }, [orders, selectedDayStr]);

  // Check if selected day is blocked
  const selectedDayBlocked = useMemo(() => {
    return blockedDates.find((b) => b.date === selectedDayStr);
  }, [blockedDates, selectedDayStr]);

  // Group selected day's orders chronologically by pickup time slot
  const slotGroups = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    for (const order of selectedDayOrders) {
      const slot = order.pickupTime || "Neurčený čas";
      if (!groups[slot]) {
        groups[slot] = [];
      }
      groups[slot].push(order);
    }
    // Sort keys chronologically
    return Object.keys(groups)
      .sort()
      .map((slot) => ({
        slot,
        orders: groups[slot],
      }));
  }, [selectedDayOrders]);

  const handleSaveInternalNote = async (orderId: string) => {
    const draft = editingNotes[orderId];
    if (draft === undefined) return;
    setSavingNoteId(orderId);
    try {
      await onUpdateInternalNote(orderId, draft);
      const next = { ...editingNotes };
      delete next[orderId];
      setEditingNotes(next);
    } finally {
      setSavingNoteId(null);
    }
  };

  // Format selected day label in Slovak
  const formattedSelectedDay = useMemo(() => {
    try {
      const [y, m, d] = selectedDayStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("sk-SK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDayStr;
    }
  }, [selectedDayStr]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Monthly Calendar Grid (5 cols on lg) */}
      <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-5">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-[#261B24]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg border border-[#EAE5DC] transition-colors"
              title="Predchádzajúci mesiac"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg border border-[#EAE5DC] transition-colors"
              title="Nasledujúci mesiac"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Labels (Po - Ne) */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAY_NAMES.map((name) => (
            <span
              key={name}
              className="text-[11px] font-semibold text-[#6B5B65] uppercase tracking-wider py-1"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((item, idx) => {
            const isSelected = item.dateStr === selectedDayStr;
            const isToday =
              item.dateStr ===
              (() => {
                const td = new Date();
                return `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
              })();

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (item.isCurrentMonth) {
                    onSelectDay(item.dateStr);
                  }
                }}
                disabled={!item.isCurrentMonth}
                className={`min-h-[58px] p-1.5 rounded-xl text-left flex flex-col justify-between transition-all relative ${
                  !item.isCurrentMonth
                    ? "opacity-25 cursor-default bg-[#FAF8F5]/40"
                    : isSelected
                    ? "bg-[#261B24] text-[#FAF8F5] shadow-xs ring-2 ring-[#261B24]/20"
                    : "bg-[#FAF8F5] hover:bg-[#F4EFE7] text-[#261B24] border border-[#EAE5DC]/60"
                }`}
              >
                {/* Day number & indicators */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono font-medium ${
                      isSelected
                        ? "text-[#FAF8F5]"
                        : isToday
                        ? "text-[#a62891] font-bold"
                        : "text-[#261B24]"
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  {item.isBlocked && (
                    <span
                      title={item.blockedReason || "Kapacita zablokovaná"}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-rose-300" : "bg-rose-500"
                      }`}
                    />
                  )}
                </div>

                {/* Orders count pill */}
                {item.orderCount > 0 && (
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? "bg-[#FAF1F8] text-[#a62891]"
                          : "bg-[#FAF1F8] text-[#a62891] border border-[#ECD9E8]"
                      }`}
                    >
                      {item.orderCount} {item.orderCount === 1 ? "obj" : "obj"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[#EAE5DC] flex items-center justify-between text-[11px] text-[#6B5B65]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Zablokovaný deň</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#FAF1F8] border border-[#ECD9E8]" />
            <span>Objednávky</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Chronological Daily Schedule (7 cols on lg) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Selected Day Header Bar */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#a62891]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65]">
                Harmonogram vyzdvihnutí
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#261B24] capitalize mt-0.5">
              {formattedSelectedDay}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2.5 py-1 bg-[#FAF8F5] border border-[#EAE5DC] rounded-lg text-[#261B24]">
              {selectedDayOrders.length}{" "}
              {selectedDayOrders.length === 1
                ? "objednávka"
                : selectedDayOrders.length >= 2 && selectedDayOrders.length <= 4
                ? "objednávky"
                : "objednávok"}
            </span>
          </div>
        </div>

        {/* Blocked Day Notice Banner if date is blocked */}
        {selectedDayBlocked && (
          <div className="bg-[#FBF2F2] border border-[#EDD5D5] rounded-xl p-4 flex items-start gap-3 text-[#7A2E2E]">
            <Ban className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                Tento deň má zablokovanú kapacitu
              </p>
              <p className="text-sm font-medium mt-0.5">
                Dôvod: {selectedDayBlocked.reason}
              </p>
            </div>
          </div>
        )}

        {/* Slot-based Daily Schedule */}
        {slotGroups.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] p-12 text-center shadow-xs">
            <Clock className="w-10 h-10 text-[#DFD8CD] mx-auto mb-3" />
            <h4 className="font-serif text-lg font-semibold text-[#261B24]">
              Žiadne vyzdvihnutia
            </h4>
            <p className="text-xs text-[#6B5B65] mt-1 max-w-sm mx-auto">
              Na tento deň nie sú v systéme evidované žiadne objednávky na odovzdanie.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {slotGroups.map(({ slot, orders: slotOrders }) => (
              <div key={slot} className="space-y-3">
                {/* Time slot header chip */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-[#261B24] text-[#FAF8F5] rounded-lg text-xs font-mono font-bold tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-[#FAF1F8]" />
                    <span>{slot}</span>
                  </div>
                  <div className="h-px flex-1 bg-[#EAE5DC]" />
                </div>

                {/* Orders in this time slot */}
                <div className="space-y-3">
                  {slotOrders.map((order) => {
                    const statusToken = ORDER_STATUS_TOKENS[order.status];
                    const nextStatus = STATUS_PROGRESSION[order.status];
                    const draftNote =
                      editingNotes[order.id] !== undefined
                        ? editingNotes[order.id]
                        : order.internalNote || "";

                    return (
                      <div
                        key={order.id}
                        className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-5 hover:border-[#DFD8CD] transition-all space-y-4"
                      >
                        {/* Order Header: ID, Customer, Status badge, Quick Actions */}
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#EAE5DC]/70">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-[#a62891] px-2 py-0.5 bg-[#FAF1F8] border border-[#ECD9E8] rounded-md">
                                {order.orderNumber}
                              </span>
                              {/* Tone-on-tone Status Badge with 6px dot */}
                              <span
                                style={{
                                  backgroundColor: statusToken.bg,
                                  color: statusToken.text,
                                  borderColor: statusToken.border,
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                              >
                                <span
                                  style={{ backgroundColor: statusToken.dot }}
                                  className="w-1.5 h-1.5 rounded-full"
                                />
                                <span>{statusToken.label}</span>
                              </span>
                            </div>

                            {/* Customer Contact */}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                              <span className="font-semibold text-sm text-[#261B24]">
                                {order.customer.name}
                              </span>
                              <a
                                href={`tel:${order.customer.phone}`}
                                className="inline-flex items-center gap-1 text-[#6B5B65] hover:text-[#a62891] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span className="font-mono">{order.customer.phone}</span>
                              </a>
                              {order.customer.email && (
                                <a
                                  href={`mailto:${order.customer.email}`}
                                  className="inline-flex items-center gap-1 text-[#6B5B65] hover:text-[#a62891] transition-colors"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>{order.customer.email}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Print Kitchen Bon & Status Advance */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onPrintReceipt(order)}
                              className="p-2 text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg border border-[#EAE5DC] transition-colors"
                              title="Tlačiť bon do pekárne"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(order.id, nextStatus)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#261B24] text-[#261B24] hover:text-[#FAF8F5] border border-[#DFD8CD] hover:border-[#261B24] text-xs font-medium rounded-lg transition-all cursor-pointer shadow-2xs"
                              >
                                <span>{NEXT_STATUS_BUTTON_LABELS[order.status]}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] block">
                            Položky zákazky
                          </span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {order.items.map((item, itIdx) => (
                              <div
                                key={item.id || itIdx}
                                className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EAE5DC]/80 text-xs space-y-1.5"
                              >
                                <div className="flex items-baseline justify-between">
                                  <span className="font-semibold text-sm text-[#261B24]">
                                    {item.name}
                                  </span>
                                  <span className="font-mono font-bold text-[#a62891]">
                                    {item.quantity} ks &middot; {item.totalPrice} €
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[#6B5B65]">
                                  {item.size && (
                                    <div>
                                      <span className="text-[#9E8E98]">Veľkosť: </span>
                                      <span className="font-medium text-[#261B24]">{item.size}</span>
                                    </div>
                                  )}
                                  {item.korpus && (
                                    <div>
                                      <span className="text-[#9E8E98]">Korpus: </span>
                                      <span className="font-medium text-[#261B24]">{item.korpus}</span>
                                    </div>
                                  )}
                                  {item.krem && (
                                    <div>
                                      <span className="text-[#9E8E98]">Krém: </span>
                                      <span className="font-medium text-[#261B24]">{item.krem}</span>
                                    </div>
                                  )}
                                  {item.doplnky && item.doplnky.length > 0 && (
                                    <div className="sm:col-span-2">
                                      <span className="text-[#9E8E98]">Doplnky: </span>
                                      <span className="font-medium text-[#261B24]">{item.doplnky.join(", ")}</span>
                                    </div>
                                  )}
                                  {item.diets && item.diets.length > 0 && (
                                    <div className="sm:col-span-2 text-[#7A2E2E]">
                                      <span className="font-bold">Diéty / Úpravy: </span>
                                      <span className="font-semibold">{item.diets.join(", ")}</span>
                                    </div>
                                  )}
                                  {item.zdobenie && item.zdobenie.length > 0 && (
                                    <div className="sm:col-span-2">
                                      <span className="text-[#9E8E98]">Zdobenie: </span>
                                      <span className="font-medium text-[#261B24]">{item.zdobenie.join(", ")}</span>
                                    </div>
                                  )}
                                  {item.cakeNote && (
                                    <div className="sm:col-span-2 text-[#6E5335] bg-[#F8F4EE] p-2 rounded border border-[#EADFCF] italic">
                                      &bdquo;{item.cakeNote}&ldquo;
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Allergy / Note Warnings */}
                        {(order.customer.allergies || order.customer.notes) && (
                          <div className="space-y-1.5 text-xs pt-1">
                            {order.customer.allergies && order.customer.allergies !== "Žiadne hlásené alergie" && (
                              <div className="bg-[#FBF2F2] border border-[#EDD5D5] rounded-lg p-2 text-[#7A2E2E] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Alergie: {order.customer.allergies}</span>
                              </div>
                            )}
                            {order.customer.notes && (
                              <p className="text-[#6B5B65]">
                                <span className="font-medium text-[#261B24]">Poznámka zákazníka: </span>
                                {order.customer.notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Internal Bakery Note Editor */}
                        <div className="pt-2 border-t border-[#EAE5DC]/60 space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5B65] flex items-center justify-between">
                            <span>Interná poznámka cukrárne</span>
                            {order.internalNote && editingNotes[order.id] === undefined && (
                              <span className="text-emerald-700 font-normal lowercase">uložené</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={draftNote}
                              placeholder="Napr. tortu chladiť na 4 °C, ovocie dozdobené ráno..."
                              onChange={(e) =>
                                setEditingNotes({
                                  ...editingNotes,
                                  [order.id]: e.target.value,
                                })
                              }
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#EAE5DC] bg-[#FAF8F5] text-[#261B24] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-colors"
                            />
                            <button
                              type="button"
                              disabled={savingNoteId === order.id || editingNotes[order.id] === undefined}
                              onClick={() => handleSaveInternalNote(order.id)}
                              className="px-3 py-1.5 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              {savingNoteId === order.id ? "Ukladám..." : "Uložiť"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
