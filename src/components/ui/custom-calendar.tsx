"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CustomCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  blockedDates?: string[]; // Array of YYYY-MM-DD dates blocked by admin
  blockedReasonMap?: Record<string, string>; // Optional reason map
  className?: string;
}

const MONTH_NAMES = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December"
];

const DAY_NAMES = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

export function CustomCalendar({
  selectedDate,
  onSelectDate,
  blockedDates = [],
  blockedReasonMap = {},
  className = "",
}: CustomCalendarProps) {
  // Determine current viewing month/year from selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());

  // Today reference (normalize to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Min date: tomorrow (orders need at least 24h)
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 1);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // In JS: Sunday is 0, Monday is 1, ..., Saturday is 6.
  // We want Monday as index 0, ..., Sunday as index 6.
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Days array
  const calendarCells: Array<{
    day: number | null;
    dateString: string;
    isPast: boolean;
    isSunday: boolean;
    isSaturday: boolean;
    isBlocked: boolean;
    blockedReason?: string;
    isRecommended: boolean;
  }> = [];

  // Padding cells before the 1st
  for (let i = 0; i < startDay; i++) {
    calendarCells.push({
      day: null,
      dateString: "",
      isPast: true,
      isSunday: false,
      isSaturday: false,
      isBlocked: false,
      isRecommended: false,
    });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    cellDate.setHours(0, 0, 0, 0);

    const yearStr = currentYear.toString();
    const monthStr = (currentMonth + 1).toString().padStart(2, "0");
    const dayStr = d.toString().padStart(2, "0");
    const dateString = `${yearStr}-${monthStr}-${dayStr}`;

    const dayOfWeek = cellDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isRecommended = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6; // Thu, Fri, Sat
    const isPast = cellDate < minDate;
    const isBlocked = blockedDates.includes(dateString);
    const blockedReason = blockedReasonMap[dateString];

    calendarCells.push({
      day: d,
      dateString,
      isPast,
      isSunday,
      isSaturday,
      isBlocked,
      blockedReason,
      isRecommended,
    });
  }

  const handleCellClick = (cell: (typeof calendarCells)[0]) => {
    if (!cell.day || cell.isPast || cell.isSunday || cell.isBlocked) return;
    onSelectDate(cell.dateString);
  };

  return (
    <div className={`w-full max-w-sm bg-white rounded-2xl border border-[#DFD8CD] p-5 shadow-xs select-none ${className}`}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAE5DC]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#a62891]" />
          <span className="font-semibold text-sm sm:text-base text-[#261B24]">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-full border border-[#DFD8CD] hover:bg-[#F4EFE7] active:scale-95 flex items-center justify-center text-[#261B24]/70 hover:text-[#261B24] transition-all cursor-pointer"
            aria-label="Predchádzajúci mesiac"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-full border border-[#DFD8CD] hover:bg-[#F4EFE7] active:scale-95 flex items-center justify-center text-[#261B24]/70 hover:text-[#261B24] transition-all cursor-pointer"
            aria-label="Nasledujúci mesiac"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAY_NAMES.map((name, idx) => (
          <span
            key={name}
            className={`text-[11px] font-semibold uppercase tracking-wider py-1 ${
              idx === 6 ? "text-red-400" : idx === 5 ? "text-[#a62891]" : "text-[#261B24]/50"
            }`}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {calendarCells.map((cell, idx) => {
          if (!cell.day) {
            return <div key={`empty-${idx}`} className="h-9 w-full" />;
          }

          const isSelected = selectedDate === cell.dateString;
          const isDisabled = cell.isPast || cell.isSunday || cell.isBlocked;

          return (
            <button
              key={cell.dateString}
              type="button"
              disabled={isDisabled}
              onClick={() => handleCellClick(cell)}
              title={cell.isBlocked ? (cell.blockedReason || "Kapacita výroby naplnená") : undefined}
              className={`h-9 w-full rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all duration-150 ${
                isSelected
                  ? "bg-[#261B24] text-white shadow-md scale-105 ring-2 ring-[#a62891]"
                  : isDisabled
                  ? cell.isSunday
                    ? "text-[#261B24]/25 bg-[#F4EFE7]/50 cursor-not-allowed border border-dashed border-[#DFD8CD]/50"
                    : cell.isBlocked
                    ? "text-amber-800/50 bg-amber-50/70 cursor-not-allowed border border-amber-200/60"
                    : "text-[#261B24]/20 cursor-not-allowed bg-transparent"
                  : cell.isSaturday
                  ? "text-[#a62891] hover:bg-[#FAF1F8] border border-[#ECD9E8]/80 cursor-pointer"
                  : "text-[#261B24] hover:bg-[#F4EFE7] border border-transparent hover:border-[#DFD8CD] cursor-pointer"
              }`}
            >
              <span>{cell.day}</span>
              {cell.isSunday ? (
                <span className="text-[7px] text-red-500/80 -mt-0.5 leading-none font-normal">
                  Zatvorené
                </span>
              ) : cell.isBlocked ? (
                <span className="text-[7px] text-amber-700/80 -mt-0.5 leading-none font-medium">
                  Obsadené
                </span>
              ) : null}
              {!cell.isSunday && !cell.isBlocked && cell.isSaturday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#a62891] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / Status Note */}
      <div className="mt-4 pt-3 border-t border-[#EAE5DC] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#261B24]/65">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#a62891]" />
          <span>Sobota (doobeda)</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700/80">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Obsadené</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-500/70">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Zatvorené</span>
        </div>
      </div>
    </div>
  );
}
