'use client';

import React, { useState } from 'react';
import {
  format,
  isToday,
  isSameMonth,
} from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { getMonthDays, toInputDateString } from '@/lib/dateUtils';
import { EventCard } from './EventCard';
import { Plus, X } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  categories,
  onSelectEvent,
  onCreateEventOnDate,
}) => {
  const [overflowDate, setOverflowDate] = useState<Date | null>(null);

  const days = React.useMemo(() => {
    return getMonthDays(currentDate, 0);
  }, [currentDate]);

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Group events by YYYY-MM-DD
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((evt) => {
      const list = map.get(evt.startDate) || [];
      list.push(evt);
      map.set(evt.startDate, list);
    });
    return map;
  }, [events]);

  const weekDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-[#E5E5EA] bg-[#F5F5F7]/40 shrink-0">
        {weekDayNames.map((name, idx) => (
          <div
            key={idx}
            className="py-2 text-center text-[11px] font-semibold tracking-wider text-[#86868B]"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 border-b border-[#E5E5EA] divide-y divide-[#E5E5EA] overflow-hidden">
        {days.map((day, idx) => {
          const dateStr = toInputDateString(day);
          const dayEvents = eventsByDate.get(dateStr) || [];
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const overflowCount = dayEvents.length - maxVisible;

          return (
            <div
              key={idx}
              onClick={() => onCreateEventOnDate(day)}
              className={`group min-h-[85px] sm:min-h-[100px] p-1.5 flex flex-col border-r border-[#E5E5EA] relative transition-colors cursor-pointer hover:bg-[#F5F5F7]/60 ${
                !isCurrentMonth ? 'bg-[#F5F5F7]/30' : 'bg-white'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full transition-colors ${
                    isCurrentDay
                      ? 'bg-[#0A84FF] text-white shadow-xs'
                      : isCurrentMonth
                      ? 'text-[#1D1D1F]'
                      : 'text-[#86868B]/50'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Quick Add Event Hover Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEventOnDate(day);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#86868B] hover:text-[#0A84FF] hover:bg-white transition-all"
                  title="Add event"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Cards List */}
              <div className="flex-1 overflow-hidden space-y-0.5">
                {visibleEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    category={categoryMap.get(evt.categoryId)}
                    view="month"
                    onClick={onSelectEvent}
                  />
                ))}

                {overflowCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowDate(day);
                    }}
                    className="w-full text-left text-[10px] font-medium text-[#0A84FF] hover:underline px-1 py-0.5"
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Date Popover Modal */}
      {overflowDate && (
        <div
          onClick={() => setOverflowDate(null)}
          className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4 backdrop-blur-[1px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#E5E5EA] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                {format(overflowDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setOverflowDate(null)}
                className="p-1 rounded-md text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto space-y-1">
              {(eventsByDate.get(toInputDateString(overflowDate)) || []).map(
                (evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    category={categoryMap.get(evt.categoryId)}
                    view="month"
                    onClick={(event) => {
                      setOverflowDate(null);
                      onSelectEvent(event);
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
