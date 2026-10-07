"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  allLabel = "All",
  className = "",
  disabled = false,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      opt.id.toLowerCase().includes(q)
    );
  });

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-[#2a2829] shadow-sm flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#045339] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">
          {selectedOption ? (
            <span className="font-semibold text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 text-gray-400 shrink-0 ml-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 min-w-[220px]">
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-[#2a2829] focus:outline-none placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {/* All / Reset item */}
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                !value
                  ? "bg-emerald-50 text-[#045339] font-bold"
                  : "text-gray-700 hover:bg-gray-50 font-medium"
              }`}
            >
              <span>{allLabel}</span>
              {!value && <Check className="w-3.5 h-3.5 text-[#045339]" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No matching results found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-emerald-50 text-[#045339] font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-gray-400 font-normal truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#045339] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
