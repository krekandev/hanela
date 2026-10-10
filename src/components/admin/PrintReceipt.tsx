"use client";

import React from "react";
import { Printer, X, AlertTriangle } from "lucide-react";
import { Order } from "@/lib/types";

interface PrintReceiptProps {
  order: Order | null;
  onClose: () => void;
}

export function PrintReceipt({ order, onClose }: PrintReceiptProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261B24]/40 backdrop-blur-xs">
      {/* Container - only this part prints */}
      <div className="bg-[#FFFFFF] w-full max-w-xl rounded-2xl border border-[#EAE5DC] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls - hidden when printing */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DC] print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#a62891]" />
            <h3 className="font-serif text-lg font-semibold text-[#261B24]">
              Výrobný bon &mdash; {order.orderNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Vytlačiť</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B5B65] hover:text-[#261B24] hover:bg-[#FAF8F5] rounded-lg transition-colors"
              title="Zavrieť"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Kitchen Bon Body */}
        <div
          id="kitchen-receipt-content"
          className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#261B24] font-sans"
        >
          {/* Bon Header */}
          <div className="border-b border-dashed border-[#DFD8CD] pb-4 text-center">
            <p className="font-serif text-2xl font-bold tracking-tight text-[#261B24]">
              Cukráreň Hanela
            </p>
            <p className="text-xs uppercase tracking-widest text-[#6B5B65] mt-0.5">
              Výrobný bon do pekárne
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-[#FAF1F8] border border-[#ECD9E8] rounded-md">
              <span className="font-mono text-base font-bold text-[#a62891]">
                {order.orderNumber}
              </span>
            </div>
          </div>

          {/* Pickup Timing Highlight */}
          <div className="bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#6B5B65] uppercase font-semibold tracking-wider">
                Termín vyzdvihnutia
              </span>
              <p className="text-lg font-bold text-[#261B24] mt-0.5 font-mono">
                {order.pickupDate}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#6B5B65] uppercase font-semibold tracking-wider">
                Čas prevzatia
              </span>
              <p className="text-2xl font-black text-[#a62891] mt-0.5 font-mono">
                {order.pickupTime}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 text-xs pb-3 border-b border-[#EAE5DC]">
            <div>
              <span className="text-[#6B5B65] block font-medium">Zákazník:</span>
              <span className="font-semibold text-sm text-[#261B24] mt-0.5 block">
                {order.customer.name}
              </span>
            </div>
            <div>
              <span className="text-[#6B5B65] block font-medium">Telefón:</span>
              <span className="font-mono text-sm text-[#261B24] mt-0.5 block">
                {order.customer.phone}
              </span>
            </div>
          </div>

          {/* Allergy / Diet Alert if any */}
          {order.customer.allergies && order.customer.allergies !== "Žiadne hlásené alergie" && (
            <div className="bg-[#FBF2F2] border-2 border-[#EDD5D5] rounded-xl p-3 text-[#7A2E2E]">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4 text-[#7A2E2E]" />
                <span>Upozornenie: Alergie a špeciálne diéty</span>
              </div>
              <p className="text-sm font-semibold">{order.customer.allergies}</p>
            </div>
          )}

          {/* Ordered Items Breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] mb-3">
              Objednané položky výroby
            </h4>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="border border-[#EAE5DC] rounded-xl p-4 bg-[#FFFFFF] shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-serif text-base font-bold text-[#261B24]">
                        {item.name}
                      </span>
                      {item.size && (
                        <span className="ml-2 inline-block text-xs font-medium text-[#6B5B65] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE5DC]">
                          {item.size}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm px-2 py-0.5 bg-[#FAF1F8] text-[#a62891] rounded">
                      {item.quantity} ks
                    </span>
                  </div>

                  {/* Cake Customization Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#261B24] pt-2 border-t border-[#EAE5DC]/60">
                    {item.korpus && (
                      <div>
                        <span className="text-[#6B5B65]">Korpus: </span>
                        <span className="font-medium">{item.korpus}</span>
                      </div>
                    )}
                    {item.krem && (
                      <div>
                        <span className="text-[#6B5B65]">Krém: </span>
                        <span className="font-medium">{item.krem}</span>
                      </div>
                    )}
                    {item.doplnky && item.doplnky.length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="text-[#6B5B65]">Doplnky: </span>
                        <span className="font-medium">{item.doplnky.join(", ")}</span>
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
                        <span className="text-[#6B5B65]">Zdobenie: </span>
                        <span className="font-medium">{item.zdobenie.join(", ")}</span>
                      </div>
                    )}
                    {item.cakeNote && (
                      <div className="sm:col-span-2 italic text-[#6E5335] bg-[#F8F4EE] p-2 rounded border border-[#EADFCF]">
                        &bdquo;{item.cakeNote}&ldquo;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2 text-xs pt-2 border-t border-dashed border-[#DFD8CD]">
            {order.customer.notes && (
              <div>
                <span className="text-[#6B5B65] font-medium block">
                  Poznámka od zákazníka:
                </span>
                <p className="text-[#261B24] font-medium mt-0.5">
                  {order.customer.notes}
                </p>
              </div>
            )}
            {order.internalNote && (
              <div className="bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE5DC]">
                <span className="text-[#a62891] font-bold block">
                  Interná poznámka cukrárne:
                </span>
                <p className="text-[#261B24] mt-0.5 font-medium">
                  {order.internalNote}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-[#261B24]">
            <span className="text-xs uppercase font-bold tracking-wider text-[#6B5B65]">
              K úhrade pri prevzatí
            </span>
            <span className="font-mono text-xl font-bold text-[#261B24]">
              {order.totalPrice.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
