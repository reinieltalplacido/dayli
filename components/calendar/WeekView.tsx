'use client';

import React, { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import {
  getWeekDays,
  toInputDateString,
  formatHourLabel,
  getEventPosition,
} from '@/lib/dateUtils';
import { EventCard } from './EventCard';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
  weekStartsOn?: 0 | 1;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  categories,
  onSelectEvent,
  onCreateEventOnDateTime,
  weekStartsOn = 0,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimeTopPercent, setCurrentTimeTopPercent] = useState<number | null>(null);

  // Keep current time bar updated live
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeTopPercent((currentMinutes / (24 * 60)) * 100);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 7 days of the current week
  const weekDays = React.useMemo(() => {
    return getWeekDays(currentDate, weekStartsOn);
  }, [currentDate, weekStartsOn]);

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Separate all-day events vs timed events
  const { allDayEventsByDate, timedEventsByDate } = React.useMemo(() => {
    const allDayMap = new Map<string, CalendarEvent[]>();
    const timedMap = new Map<string, CalendarEvent[]>();

    events.forEach((evt) => {
      if (evt.isAllDay) {
        const list = allDayMap.get(evt.startDate) || [];
        list.push(evt);
        allDayMap.set(evt.startDate, list);
      } else {
        const list = timedMap.get(evt.startDate) || [];
        list.push(evt);
        timedMap.set(evt.startDate, list);
      }
    });

    return { allDayEventsByDate: allDayMap, timedEventsByDate: timedMap };
  }, [events]);

  // Auto scroll to 8 AM on mount or week change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 448;
    }
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#121214] overflow-hidden">
      {/* Header Row: Days of Week */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/40 dark:bg-[#18181A]/40 shrink-0">
        <div className="border-r border-[#E5E5EA] dark:border-[#28282A] py-2 text-center text-[10px] text-[#86868B] dark:text-[#98989D] font-medium">
          GMT
        </div>
        {weekDays.map((day, idx) => {
          const isCurrentDay = isToday(day);
          return (
            <div
              key={idx}
              className={`py-2 px-1 text-center border-r border-[#E5E5EA] dark:border-[#28282A] flex flex-col items-center justify-center ${
                isCurrentDay ? 'bg-[#0A84FF]/5' : ''
              }`}
            >
              <span className="text-[10px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase">
                {format(day, 'EEE')}
              </span>
              <span
                className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isCurrentDay
                    ? 'bg-[#0A84FF] text-white shadow-xs'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                }`}
              >
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-Day Events Section (if any) */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/20 dark:bg-[#18181A]/20 shrink-0 min-h-[32px]">
        <div className="border-r border-[#E5E5EA] dark:border-[#28282A] p-1.5 text-right text-[10px] font-medium text-[#86868B] dark:text-[#98989D]">
          All-day
        </div>
        {weekDays.map((day, idx) => {
          const dateStr = toInputDateString(day);
          const dayAllDayEvents = allDayEventsByDate.get(dateStr) || [];
          return (
            <div
              key={idx}
              className="border-r border-[#E5E5EA] dark:border-[#28282A] p-1 space-y-1 min-h-[32px]"
            >
              {dayAllDayEvents.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 border border-black/5 dark:border-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]"
                  style={{
                    backgroundColor:
                      categoryMap.get(evt.categoryId)?.lightBg || '#0A84FF1A',
                    borderLeftColor:
                      categoryMap.get(evt.categoryId)?.color || '#0A84FF',
                    borderLeftWidth: '3px',
                  }}
                >
                  <span className="truncate">{evt.title}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* 24-Hour Scrollable Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative grid grid-cols-[56px_repeat(7,1fr)] select-none"
      >
        {/* Time Labels Column */}
        <div className="border-r border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/30 dark:bg-[#161618]/30">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-14 border-b border-[#E5E5EA]/60 dark:border-[#28282A]/60 pr-2 pt-1 text-right text-[10px] font-medium text-[#86868B] dark:text-[#98989D] tabular-nums"
            >
              {hour !== 0 && formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {/* 7 Day Columns */}
        {weekDays.map((day, dayIdx) => {
          const dateStr = toInputDateString(day);
          const dayEvents = timedEventsByDate.get(dateStr) || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dayIdx}
              className={`relative border-r border-[#E5E5EA] dark:border-[#28282A] ${
                isCurrentDay ? 'bg-[#0A84FF]/[0.015]' : ''
              }`}
            >
              {/* Hour Slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => onCreateEventOnDateTime(day, hour)}
                  className="h-14 border-b border-[#E5E5EA]/60 dark:border-[#28282A]/60 hover:bg-[#F5F5F7]/50 dark:hover:bg-[#1C1C1E]/50 cursor-pointer transition-colors relative group"
                >
                  {/* Subtle half-hour divider */}
                  <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[#E5E5EA]/40 dark:border-[#28282A]/40" />
                </div>
              ))}

              {/* Red current time line if today */}
              {isCurrentDay && currentTimeTopPercent !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${currentTimeTopPercent}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] -ml-1.25 shadow-xs" />
                  <div className="h-[2px] flex-1 bg-[#FF3B30]" />
                </div>
              )}

              {/* Events positioned absolutely */}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.map((evt) => {
                  const { topPercent, heightPercent } = getEventPosition(
                    evt.startTime,
                    evt.endTime,
                    0,
                    24
                  );

                  return (
                    <div
                      key={evt.id}
                      className="pointer-events-auto"
                      style={{
                        position: 'absolute',
                        top: `${topPercent}%`,
                        height: `${heightPercent}%`,
                        left: '2px',
                        right: '2px',
                      }}
                    >
                      <EventCard
                        event={evt}
                        category={categoryMap.get(evt.categoryId)}
                        view="week"
                        onClick={onSelectEvent}
                        style={{ height: '100%' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
