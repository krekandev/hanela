"use client";

import React, { useState } from "react";
import {
  Ban,
  Calendar as CalendarIcon,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
} from "lucide-react";
import { BlockedDate } from "@/lib/types";

interface CapacityTabProps {
  blockedDates: BlockedDate[];
  onBlockDate: (date: string, reason: string) => Promise<void>;
  onUnblockDate: (date: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Plná kapacita výroby",
  "Dovolenka",
  "Sanitárny deň",
];

export function CapacityTab({
  blockedDates,
  onBlockDate,
  onUnblockDate,
}: CapacityTabProps) {
  const [mode, setMode] = useState<"single" | "range">("single");
  const [targetDate, setTargetDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("Plná kapacita výroby");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [unblockingDate, setUnblockingDate] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Minimum date allowed: today
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const activeReason = reason.trim() || "Plná kapacita výroby";

    if (mode === "single") {
      if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        setErrorMsg("Zadajte platný dátum v tvare YYYY-MM-DD.");
        return;
      }

      setIsSubmitting(true);
      try {
        await onBlockDate(targetDate, activeReason);
        setTargetDate("");
        setSuccessMsg(`Deň ${targetDate} bol úspešne zablokovaný.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Chyba pri blokovaní dňa";
        setErrorMsg(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Range mode
      if (!startDate || !endDate) {
        setErrorMsg("Vyberte začiatok aj koniec intervalu.");
        return;
      }
      if (startDate > endDate) {
        setErrorMsg("Dátum 'Od' musí byť pred alebo rovný dátumu 'Do'.");
        return;
      }

      // Generate all dates in range
      const datesToBlock: string[] = [];
      const curr = new Date(startDate);
      const last = new Date(endDate);

      while (curr <= last) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, "0");
        const d = String(curr.getDate()).padStart(2, "0");
        datesToBlock.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }

      if (datesToBlock.length > 90) {
        setErrorMsg("Maximálny rozsah na jedno zablokovanie je 90 dní.");
        return;
      }

      setIsSubmitting(true);
      try {
        for (const d of datesToBlock) {
          await onBlockDate(d, activeReason);
        }
        setStartDate("");
        setEndDate("");
        setSuccessMsg(`Úspešne bolo zablokovaných ${datesToBlock.length} dní.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Chyba pri blokovaní intervalu";
        setErrorMsg(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUnblock = async (date: string) => {
    setUnblockingDate(date);
    try {
      await onUnblockDate(date);
    } catch (err: unknown) {
      console.error("Failed to unblock date:", err);
    } finally {
      setUnblockingDate(null);
    }
  };

  // Sort blocked dates chronologically
  const sortedBlockedDates = [...blockedDates].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* FORM: Day / Range Blocking (5 cols on lg) */}
      <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-[#a62891]" />
            <h3 className="font-serif text-lg font-bold text-[#261B24]">
              Zablokovať termíny
            </h3>
          </div>
          <p className="text-xs text-[#6B5B65] mt-1 font-sans">
            Zablokované dni sa okamžite premietnu do zákazníckeho kalendára na
            stránke rezervácie.
          </p>
        </div>

        {/* Mode switch: Single day vs Date Range */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC]">
          <button
            type="button"
            onClick={() => { setMode("single"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "single"
                ? "bg-white text-[#261B24] shadow-xs border border-[#DFD8CD]"
                : "text-[#6B5B65] hover:text-[#261B24]"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#a62891]" />
            <span>Jeden deň</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode("range"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "range"
                ? "bg-white text-[#261B24] shadow-xs border border-[#DFD8CD]"
                : "text-[#6B5B65] hover:text-[#261B24]"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-[#a62891]" />
            <span>Rozsah (dovolenka)</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FBF2F2] border border-[#EDD5D5] text-[#7A2E2E] rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[#F3F6F3] border border-[#DCE4DC] text-[#345139] rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleBlockSubmit} className="space-y-4">
          {mode === "single" ? (
            /* Single Date Input */
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
                Dátum na zablokovanie
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] text-sm text-[#261B24] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-colors"
              />
            </div>
          ) : (
            /* Date Range Inputs */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
                    Od (prvý deň)
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] text-[#261B24] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
                    Do (posledný deň)
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] text-[#261B24] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-colors"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#6B5B65] font-sans">
                Ideálne na dovolenku, sviatky alebo odstávku. Všetky dni v intervale sa zablokujú naraz.
              </p>
            </div>
          )}

          {/* Preset Reason Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
              Rýchly výber dôvodu
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    reason === preset
                      ? "bg-[#FAF1F8] text-[#a62891] border-[#ECD9E8] font-semibold"
                      : "bg-[#FAF8F5] text-[#6B5B65] border-[#EAE5DC] hover:bg-[#F4EFE7]"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#6B5B65] block">
              Dôvod zablokovania (zobrazí sa majiteľke)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Napr. Súkromná oslava, sanitárny deň..."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] text-sm text-[#261B24] rounded-xl border border-[#EAE5DC] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#a62891] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (mode === "single" ? !targetDate : (!startDate || !endDate))}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#261B24] hover:bg-[#3d2c3a] text-[#FAF8F5] text-sm font-medium rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Zapisujem do Firestore..."
                : mode === "single"
                ? "Zablokovať vybraný deň"
                : "Zablokovať celý interval dní"}
            </span>
          </button>
        </form>
      </div>

      {/* LIST: Active Blocked Days (7 cols on lg) */}
      <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#EAE5DC] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#261B24]">
              Aktívne zablokované dni
            </h3>
            <p className="text-xs text-[#6B5B65] mt-0.5 font-sans">
              Zoznam termínov, ktoré sú momentálne nedostupné pre zákaznícke objednávky.
            </p>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-[#FAF8F5] border border-[#EAE5DC] rounded-lg text-[#261B24]">
            {sortedBlockedDates.length}
          </span>
        </div>

        {sortedBlockedDates.length === 0 ? (
          <div className="p-10 text-center text-[#6B5B65]">
            <CheckCircle2 className="w-10 h-10 text-[#345139] mx-auto mb-2 opacity-60" />
            <h4 className="font-serif text-base font-semibold text-[#261B24]">
              Všetky kapacity sú otvorené
            </h4>
            <p className="text-xs mt-1">
              Momentálne nemáte zablokovaný žiadny deň. Zákazníci si môžu vybrať
              ľubovoľný voľný termín.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {sortedBlockedDates.map((item) => {
              const isPast = item.date < todayStr;
              const formattedDate = (() => {
                try {
                  const [y, m, d] = item.date.split("-").map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("sk-SK", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                } catch {
                  return item.date;
                }
              })();

              return (
                <div
                  key={item.date}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isPast
                      ? "bg-[#FAF8F5]/60 border-[#EAE5DC]/60 opacity-60"
                      : "bg-[#FAF8F5] border-[#EAE5DC] hover:border-[#DFD8CD]"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#261B24]">
                        {item.date}
                      </span>
                      {isPast && (
                        <span className="text-[10px] uppercase font-bold text-[#9E8E98] px-1.5 py-0.2 bg-[#FAF8F5] border border-[#EAE5DC] rounded">
                          minulý
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B5B65] capitalize">
                      {formattedDate} &bull;{" "}
                      <span className="font-medium text-[#a62891]">
                        {item.reason}
                      </span>
                    </p>
                  </div>

                  {/* 1-Click Unblock Button */}
                  <button
                    type="button"
                    disabled={unblockingDate === item.date}
                    onClick={() => handleUnblock(item.date)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7A2E2E] hover:bg-[#FBF2F2] border border-[#EDD5D5] rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                    title="Odblokovať tento deň"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {unblockingDate === item.date ? "Odblokujem..." : "Odblokovať"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
