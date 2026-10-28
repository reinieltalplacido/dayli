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
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  onSelectDate,
  events,
}) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(currentDate);
  const [prevCurrentDate, setPrevCurrentDate] = useState<Date>(currentDate);

  // Sync display month when currentDate prop changes during render
  if (prevCurrentDate !== currentDate) {
    setPrevCurrentDate(currentDate);
    setDisplayMonth(currentDate);
  }

  const days = React.useMemo(() => {
    return getMonthDays(displayMonth, 0);
  }, [displayMonth]);

  // Set of dates with events
  const eventDateSet = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((evt) => {
      set.add(evt.startDate);
    });
    return set;
  }, [events]);

  const weekHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full select-none">
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-[#1D1D1F] tracking-tight">
          {format(displayMonth, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setDisplayMonth((prev) => subMonths(prev, 1))}
            className="p-1 rounded hover:bg-[#E5E5EA]/60 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
            className="p-1 rounded hover:bg-[#E5E5EA]/60 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
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
            className="text-[10px] font-medium text-[#86868B] h-5 flex items-center justify-center"
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
                  ? 'text-[#0A84FF] font-semibold hover:bg-[#0A84FF]/10'
                  : isCurrentMonthDay
                  ? 'text-[#1D1D1F] hover:bg-[#E5E5EA]/70'
                  : 'text-[#86868B]/40 hover:bg-[#E5E5EA]/40'
              }`}
            >
              <span>{format(day, 'd')}</span>

              {/* Event indicator dot */}
              {hasEvents && !isSelected && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    isCurrentDay ? 'bg-[#0A84FF]' : 'bg-[#86868B]'
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
