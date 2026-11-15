'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  format,
  parseISO,
  isValid,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  setMonth,
  setYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { getMonthDays, toInputDateString } from '@/lib/dateUtils';

interface DatePickerPopoverProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  accentColor?: 'pink' | 'blue';
  icon?: React.ReactNode;
  placeholder?: string;
  fullWidth?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  value,
  onChange,
  disabled = false,
  accentColor = 'pink',
  icon,
  placeholder = 'Select date...',
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial date parse
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const d = parseISO(value);
    return isValid(d) ? d : null;
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(() => parsedValue || new Date());
  const [prevParsedValue, setPrevParsedValue] = useState<Date | null>(parsedValue);

  if (parsedValue !== prevParsedValue) {
    setPrevParsedValue(parsedValue);
    if (parsedValue) {
      setViewDate(parsedValue);
    }
  }

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Month days grid
  const days = useMemo(() => {
    return getMonthDays(viewDate, 0);
  }, [viewDate]);

  // Years array for quick year jumping (e.g. from 1920 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 1920; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const handleSelectDay = (day: Date) => {
    const dateStr = toInputDateString(day);
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const isPink = accentColor === 'pink';
  const activeBg = isPink ? 'bg-[#FF2D55]' : 'bg-[#0A84FF]';
  const activeRing = isPink ? 'ring-[#FF2D55]/30' : 'ring-[#0A84FF]/30';

  return (
    <div className={`relative ${fullWidth ? 'w-full block' : 'inline-block'} text-left`} ref={containerRef}>
      {/* Trigger Button */}
      <div className={`flex items-center gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
            fullWidth ? 'w-full justify-between' : ''
          } ${
            isOpen
              ? isPink
                ? 'border-[#FF2D55] bg-[#FF2D55]/5 text-[#FF2D55]'
                : 'border-[#0A84FF] bg-[#0A84FF]/5 text-[#0A84FF]'
              : 'border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] hover:border-[#86868B]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 truncate">
            {icon || <CalendarIcon className={`w-3.5 h-3.5 ${isPink ? 'text-[#FF2D55]' : 'text-[#0A84FF]'}`} />}
            <span className="font-medium truncate">
              {parsedValue ? format(parsedValue, 'MMMM d, yyyy') : placeholder}
            </span>
          </div>
        </button>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear date"
            className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-[#E5E5EA] dark:border-[#38383A] p-3 animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Header Month / Year Selectors and Prev / Next */}
          <div className="flex items-center justify-between gap-1 pb-2.5 mb-2 border-b border-[#E5E5EA]/70 dark:border-[#2C2C2E]">
            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(setMonth(viewDate, parseInt(e.target.value, 10)))}
                className="bg-[#F5F5F7] dark:bg-[#28282A] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] py-1 px-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] cursor-pointer focus:outline-none"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-white dark:bg-[#1C1C1E]">
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(setYear(viewDate, parseInt(e.target.value, 10)))}
                className="bg-[#F5F5F7] dark:bg-[#28282A] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] py-1 px-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] cursor-pointer focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-[#1C1C1E]">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Month arrows */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewDate((prev) => subMonths(prev, 1))}
                className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate((prev) => addMonths(prev, 1))}
                className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span
                key={d}
                className="text-[10px] font-semibold text-[#86868B] dark:text-[#98989D] h-6 flex items-center justify-center uppercase tracking-wider"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const inCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = parsedValue ? isSameDay(day, parsedValue) : false;
              const currentIsToday = isToday(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto rounded-full text-xs flex items-center justify-center transition-all cursor-pointer font-medium ${
                    isSelected
                      ? `${activeBg} text-white font-semibold shadow-xs`
                      : inCurrentMonth
                      ? 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10'
                      : 'text-[#86868B]/35 dark:text-[#98989D]/35 hover:bg-black/5 dark:hover:bg-white/5'
                  } ${currentIsToday && !isSelected ? `ring-1.5 ${activeRing} font-bold` : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E5E5EA]/70 dark:border-[#2C2C2E] text-xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                handleSelectDay(today);
              }}
              className="text-[11px] font-semibold text-[#0A84FF] hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-[#FF3B30] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
