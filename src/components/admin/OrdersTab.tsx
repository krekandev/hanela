"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
  Printer,
  Phone,
  Mail,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  Order,
  OrderStatus,
  ORDER_STATUS_TOKENS,
  ORDER_STATUS_LABELS,
} from "@/lib/types";

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdateInternalNote: (orderId: string, note: string) => Promise<void>;
  onPrintReceipt: (order: Order) => void;
}

const STATUS_PROGRESSION: Record<OrderStatus, OrderStatus | null> = {
  nova: "vyroba",
  vyroba: "pripravena",
  pripravena: "odovzdana",
  odovzdana: null,
  zrusena: null,
};

const NEXT_STATUS_BUTTON_LABELS: Partial<Record<OrderStatus, string>> = {
  nova: "Začať výrobu",
  vyroba: "Pripravená",
  pripravena: "Odovzdaná",
};

export function OrdersTab({
  orders,
  onUpdateStatus,
  onUpdateInternalNote,
  onPrintReceipt,
}: OrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Note editor inside detail drawer
  const [drawerNote, setDrawerNote] = useState<string>("");
  const [isSavingDrawerNote, setIsSavingDrawerNote] = useState<boolean>(false);

  // Diacritic-insensitive filtering helper
  const filteredOrders = useMemo(() => {
    const stripDiacritics = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const q = stripDiacritics(searchQuery.trim());

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (!q) return true;

      const matchNum = stripDiacritics(order.orderNumber).includes(q);
      const matchName = stripDiacritics(order.customer.name).includes(q);
      const matchPhone = stripDiacritics(order.customer.phone).includes(q);
      const matchEmail = stripDiacritics(order.customer.email || "").includes(q);

      return matchNum || matchName || matchPhone || matchEmail;
    });
  }, [orders, searchQuery, statusFilter]);

  // Compute status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const ord of orders) {
      counts[ord.status] = (counts[ord.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setDrawerNote(order.internalNote || "");
  };

  const handleSaveDrawerNote = async () => {
    if (!selectedOrder) return;
    setIsSavingDrawerNote(true);
    try {
      await onUpdateInternalNote(selectedOrder.id, drawerNote);
      setSelectedOrder({ ...selectedOrder, internalNote: drawerNote });
    } finally {
      setIsSavingDrawerNote(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Status Filter Controls Bar */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-4 sm:p-5 space-y-4">
        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9E8E98] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vyhľadávať podľa mena, telefónu, emailu alebo čísla zákazky (napr. HAN-2026-001)..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] text-sm text-[#261B24] placeholder-[#9E8E98] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9E8E98] hover:text-[#261B24]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#261B24] text-[#FAF8F5] shadow-xs font-semibold"
                : "bg-[#FAF8F5] text-[#6B5B65] hover:bg-[#F4EFE7] border border-[#EAE5DC]"
            }`}
          >
            <span>Všetky</span>
            <span className="ml-1.5 opacity-70 font-mono">({statusCounts.all || 0})</span>
          </button>

          {(["nova", "vyroba", "pripravena", "odovzdana", "zrusena"] as OrderStatus[]).map(
            (statusKey) => {
              const token = ORDER_STATUS_TOKENS[statusKey];
              const count = statusCounts[statusKey] || 0;
              const isSelected = statusFilter === statusKey;

              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setStatusFilter(statusKey)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? "bg-[#261B24] text-[#FAF8F5] border-[#261B24] shadow-xs font-semibold"
                      : "bg-[#FAF8F5] text-[#6B5B65] hover:bg-[#F4EFE7] border-[#EAE5DC]"
                  }`}
                >
                  <span
                    style={{ backgroundColor: token.dot }}
                    className="w-1.5 h-1.5 rounded-full"
                  />
                  <span>{token.label}</span>
                  <span className="opacity-70 font-mono">({count})</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Orders List Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] p-12 text-center shadow-xs">
          <Search className="w-10 h-10 text-[#DFD8CD] mx-auto mb-3" />
          <h4 className="font-serif text-lg font-semibold text-[#261B24]">
            Nenašli sa žiadne objednávky
          </h4>
          <p className="text-xs text-[#6B5B65] mt-1 max-w-sm mx-auto">
            Skontrolujte zadaný výraz vo vyhľadávaní alebo zvoľte iný filter stavu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const token = ORDER_STATUS_TOKENS[order.status];
            const nextStatus = STATUS_PROGRESSION[order.status];

            return (
              <div
                key={order.id}
                className="bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] hover:border-[#DFD8CD] p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Identification & Customer Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#a62891] px-2 py-0.5 bg-[#FAF1F8] border border-[#ECD9E8] rounded-md">
                      {order.orderNumber}
                    </span>
                    <span
                      style={{
                        backgroundColor: token.bg,
                        color: token.text,
                        borderColor: token.border,
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                    >
                      <span
                        style={{ backgroundColor: token.dot }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                      <span>{token.label}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="font-semibold text-sm text-[#261B24]">
                      {order.customer.name}
                    </span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="inline-flex items-center gap-1 text-[#6B5B65] hover:text-[#a62891]"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{order.customer.phone}</span>
                    </a>
                    {order.customer.email && (
                      <a
                        href={`mailto:${order.customer.email}`}
                        className="inline-flex items-center gap-1 text-[#6B5B65] hover:text-[#a62891] truncate max-w-[200px]"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{order.customer.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Order pickup timing & items summary */}
                  <div className="text-xs text-[#6B5B65] flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[#261B24] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#a62891]" />
                      <span>{order.pickupDate} o {order.pickupTime}</span>
                    </span>
                    <span>&bull;</span>
                    <span>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "položka" : "položiek"}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono font-bold text-[#261B24]">
                      {order.totalPrice.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onPrintReceipt(order)}
                    className="p-2 text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg border border-[#EAE5DC] transition-colors"
                    title="Vytlačiť bon"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDetail(order)}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFE7] text-[#261B24] text-xs font-medium rounded-lg border border-[#EAE5DC] transition-colors"
                  >
                    Detail
                  </button>

                  {/* 1-Click Status Progression */}
                  {nextStatus && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(order.id, nextStatus)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] text-xs font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>{NEXT_STATUS_BUTTON_LABELS[order.status]}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261B24]/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl border border-[#EAE5DC] shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DC]">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-[#a62891] px-2.5 py-1 bg-[#FAF1F8] border border-[#ECD9E8] rounded-md">
                  {selectedOrder.orderNumber}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#261B24]">
                  Detail objednávky
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-[#6B5B65] hover:text-[#261B24] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer Contact & Quick links */}
              <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65]">
                    Zákazník
                  </span>
                  <span className="font-mono text-xs text-[#9E8E98]">
                    Vytvorené: {new Date(selectedOrder.createdAt).toLocaleString("sk-SK")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-[#6B5B65] block">Meno a priezvisko:</span>
                    <span className="font-bold text-[#261B24]">{selectedOrder.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B5B65] block">Telefón:</span>
                    <a
                      href={`tel:${selectedOrder.customer.phone}`}
                      className="font-mono font-semibold text-[#a62891] hover:underline"
                    >
                      {selectedOrder.customer.phone}
                    </a>
                  </div>
                  {selectedOrder.customer.email && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-[#6B5B65] block">Email:</span>
                      <a
                        href={`mailto:${selectedOrder.customer.email}`}
                        className="font-mono text-[#261B24] hover:underline"
                      >
                        {selectedOrder.customer.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Pickup Time */}
                <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between text-xs">
                  <span className="text-[#6B5B65]">Termín prevzatia:</span>
                  <span className="font-mono font-bold text-sm text-[#261B24]">
                    {selectedOrder.pickupDate} o {selectedOrder.pickupTime}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
                  Zmeniť stav zákazky
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["nova", "vyroba", "pripravena", "odovzdana", "zrusena"] as OrderStatus[]).map(
                    (st) => {
                      const isCurrent = selectedOrder.status === st;
                      const tok = ORDER_STATUS_TOKENS[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await onUpdateStatus(selectedOrder.id, st);
                            setSelectedOrder({ ...selectedOrder, status: st });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[#261B24] text-[#FAF8F5] border-[#261B24] font-bold shadow-xs"
                              : "bg-[#FAF8F5] text-[#261B24] hover:bg-[#F4EFE7] border-[#EAE5DC]"
                          }`}
                        >
                          <span
                            style={{ backgroundColor: tok.dot }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                          <span>{tok.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65]">
                  Položky ({selectedOrder.items.length})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="border border-[#EAE5DC] rounded-xl p-4 bg-[#FFFFFF] shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-bold text-[#261B24]">
                          {it.name}
                        </span>
                        <span className="font-mono font-bold text-[#a62891]">
                          {it.quantity} ks &middot; {it.totalPrice} €
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[#6B5B65]">
                        {it.size && <div>Veľkosť: <span className="text-[#261B24] font-medium">{it.size}</span></div>}
                        {it.korpus && <div>Korpus: <span className="text-[#261B24] font-medium">{it.korpus}</span></div>}
                        {it.krem && <div>Krém: <span className="text-[#261B24] font-medium">{it.krem}</span></div>}
                        {it.doplnky && it.doplnky.length > 0 && (
                          <div className="sm:col-span-2">Doplnky: <span className="text-[#261B24] font-medium">{it.doplnky.join(", ")}</span></div>
                        )}
                        {it.diets && it.diets.length > 0 && (
                          <div className="sm:col-span-2 text-[#7A2E2E]">Diéty: <span className="font-semibold">{it.diets.join(", ")}</span></div>
                        )}
                        {it.zdobenie && it.zdobenie.length > 0 && (
                          <div className="sm:col-span-2">Zdobenie: <span className="text-[#261B24] font-medium">{it.zdobenie.join(", ")}</span></div>
                        )}
                        {it.cakeNote && (
                          <div className="sm:col-span-2 italic text-[#6E5335] bg-[#F8F4EE] p-2 rounded">
                            &bdquo;{it.cakeNote}&ldquo;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies / Notes */}
              {(selectedOrder.customer.allergies || selectedOrder.customer.notes) && (
                <div className="space-y-2 text-xs">
                  {selectedOrder.customer.allergies && selectedOrder.customer.allergies !== "Žiadne hlásené alergie" && (
                    <div className="bg-[#FBF2F2] border border-[#EDD5D5] rounded-xl p-3 text-[#7A2E2E] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{selectedOrder.customer.allergies}</span>
                    </div>
                  )}
                  {selectedOrder.customer.notes && (
                    <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE5DC]">
                      <span className="text-[#6B5B65] font-semibold block">Poznámka zákazníka:</span>
                      <p className="text-[#261B24] mt-0.5">{selectedOrder.customer.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Bakery Note Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
                  Interná poznámka pekárne
                </label>
                <textarea
                  rows={2}
                  value={drawerNote}
                  onChange={(e) => setDrawerNote(e.target.value)}
                  placeholder="Zapíšte si internú inštrukciu..."
                  className="w-full text-xs p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] text-[#261B24] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891]"
                />
                <button
                  type="button"
                  disabled={isSavingDrawerNote}
                  onClick={handleSaveDrawerNote}
                  className="px-3 py-1.5 bg-[#261B24] text-[#FAF8F5] hover:bg-[#3d2c3a] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {isSavingDrawerNote ? "Ukladám..." : "Uložiť poznámku"}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE5DC] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onPrintReceipt(selectedOrder)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFFFFF] hover:bg-[#F4EFE7] text-[#261B24] text-xs font-medium rounded-lg border border-[#EAE5DC] transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Vytlačiť bon</span>
              </button>
              <div className="text-right">
                <span className="text-xs text-[#6B5B65] block">Spolu k úhrade:</span>
                <span className="font-mono text-xl font-bold text-[#261B24]">
                  {selectedOrder.totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
