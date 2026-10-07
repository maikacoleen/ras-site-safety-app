"use client";

import React from "react";
import { Calendar } from "lucide-react";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  min?: string;
  max?: string;
  disableFuture?: boolean;
  showTodayButton?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  min,
  max,
  disableFuture = false,
  showTodayButton = false,
  className = "",
  inputClassName = "",
  id,
  disabled = false,
  required = false,
}: DatePickerProps) {
  const getTodayLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayLocalDateString();

  // Enforce max boundary when disableFuture is set
  const computedMax = disableFuture
    ? max
      ? max < todayStr
        ? max
        : todayStr
      : todayStr
    : max;

  const handleTodayClick = () => {
    onChange(todayStr);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="date"
            value={value}
            min={min}
            max={computedMax}
            disabled={disabled}
            required={required}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs text-[#2a2829] focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50 ${inputClassName}`}
          />
        </div>

        {showTodayButton && (
          <button
            type="button"
            onClick={handleTodayClick}
            disabled={disabled}
            className="h-10 px-3.5 rounded-xl bg-emerald-50 text-[#045339] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" />
            Today
          </button>
        )}
      </div>
    </div>
  );
}
