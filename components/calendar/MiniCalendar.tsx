'use client';

import React, { useState } from 'react';
import {
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthDays, toInputDateString } from '@/lib/dateUtils';
import { CalendarEvent } from '@/types/calendar';

interface MiniCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  weekStartsOn?: 0 | 1;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  onSelectDate,
  events,
  weekStartsOn = 0,
}) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(currentDate);
  const [prevCurrentDate, setPrevCurrentDate] = useState<Date>(currentDate);

  // Sync display month when currentDate prop changes during render
  if (prevCurrentDate !== currentDate) {
    setPrevCurrentDate(currentDate);
    setDisplayMonth(currentDate);
  }

  const days = React.useMemo(() => {
    return getMonthDays(displayMonth, weekStartsOn);
  }, [displayMonth, weekStartsOn]);

  // Set of dates with events
  const eventDateSet = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((evt) => {
      set.add(evt.startDate);
    });
    return set;
  }, [events]);

  const weekHeaders = React.useMemo(() => {
    return weekStartsOn === 1
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  }, [weekStartsOn]);

  return (
    <div className="w-full select-none">
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
          {format(displayMonth, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setDisplayMonth((prev) => subMonths(prev, 1))}
            className="p-1 rounded hover:bg-[#E5E5EA]/60 dark:hover:bg-[#2C2C2E] text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
            className="p-1 rounded hover:bg-[#E5E5EA]/60 dark:hover:bg-[#2C2C2E] text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Week Day Letters */}
      <div className="grid grid-cols-7 text-center mb-1">
        {weekHeaders.map((letter, idx) => (
          <span
            key={idx}
            className="text-[10px] font-medium text-[#86868B] dark:text-[#98989D] h-5 flex items-center justify-center"
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, idx) => {
          const dateStr = toInputDateString(day);
          const isSelected = isSameDay(day, currentDate);
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, displayMonth);
          const hasEvents = eventDateSet.has(dateStr);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`group relative h-6 w-6 mx-auto rounded-full flex flex-col items-center justify-center text-[11px] transition-colors ${
                isSelected
                  ? 'bg-[#0A84FF] text-white font-medium shadow-sm'
                  : isCurrentDay
                  ? 'text-[#0A84FF] font-semibold hover:bg-[#0A84FF]/10 dark:hover:bg-[#0A84FF]/20'
                  : isCurrentMonthDay
                  ? 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA]/70 dark:hover:bg-[#2C2C2E]'
                  : 'text-[#86868B]/40 dark:text-[#98989D]/40 hover:bg-[#E5E5EA]/40 dark:hover:bg-[#2C2C2E]/40'
              }`}
            >
              <span>{format(day, 'd')}</span>

              {/* Event indicator dot */}
              {hasEvents && !isSelected && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    isCurrentDay ? 'bg-[#0A84FF]' : 'bg-[#86868B] dark:bg-[#98989D]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
