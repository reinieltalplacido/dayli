'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Globe, X } from 'lucide-react';

interface TimezoneOption {
  value: string;
  label: string;
}

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  timezones: TimezoneOption[];
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  timezones,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Filter timezones by label or value
  const filteredTimezones = useMemo(() => {
    if (!search.trim()) return timezones;
    const query = search.toLowerCase().trim();
    return timezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query)
    );
  }, [timezones, search]);

  const selectedOption = useMemo(() => {
    return timezones.find((tz) => tz.value === value) || {
      value,
      label: value,
    };
  }, [timezones, value]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] hover:border-[#0A84FF]/60 dark:hover:border-[#0A84FF]/60 focus:outline-hidden focus:ring-2 focus:ring-[#0A84FF]/20 text-[#1D1D1F] dark:text-[#F5F5F7] transition-all shadow-2xs group text-left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Globe className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
          <span className="truncate font-medium">
            {selectedOption.label} <span className="opacity-60 font-normal">({selectedOption.value})</span>
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#86868B] dark:text-[#98989D] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#0A84FF]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] shadow-2xl overflow-hidden flex flex-col text-xs animate-modal">
          {/* Search Header */}
          <div className="p-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/50 dark:bg-[#1A1A1C]/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#86868B] dark:text-[#98989D] absolute left-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city, region, or time zone..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/60 dark:placeholder-[#98989D]/60 focus:outline-hidden focus:ring-1 focus:ring-[#0A84FF]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Timezone Options List */}
          <div
            role="listbox"
            className="max-h-56 overflow-y-auto p-1 space-y-0.5 select-none"
          >
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-[#86868B] dark:text-[#98989D]">
                No time zones matching &quot;{search}&quot;
              </div>
            ) : (
              filteredTimezones.map((tz) => {
                const isSelected = tz.value === value;
                return (
                  <button
                    key={tz.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(tz.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF] font-semibold'
                        : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs leading-tight">{tz.label}</p>
                      <p className="text-[10px] text-[#86868B] dark:text-[#98989D] truncate mt-0.5 font-mono">
                        {tz.value}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0A84FF] shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

