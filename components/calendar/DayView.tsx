'use client';

import React, { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import {
  toInputDateString,
  formatHourLabel,
  getEventPosition,
} from '@/lib/dateUtils';
import { EventCard } from './EventCard';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  categories,
  onSelectEvent,
  onCreateEventOnDateTime,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateStr = toInputDateString(currentDate);
  const [currentTimeTopPercent, setCurrentTimeTopPercent] = useState<number | null>(null);

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

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Filter events for this specific day
  const dayEvents = React.useMemo(() => {
    return events.filter((e) => e.startDate === dateStr);
  }, [events, dateStr]);

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);

  const isCurrentDay = isToday(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Auto scroll to 8 AM
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 448; // 8 * 56px
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#121214] overflow-hidden">
      {/* Day Header Banner */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/30 dark:bg-[#18181A]/30 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center font-bold text-sm ${
              isCurrentDay
                ? 'bg-[#0A84FF] text-white shadow-xs'
                : 'bg-white dark:bg-[#202022] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7]'
            }`}
          >
            <span className="text-[10px] uppercase font-semibold leading-none -mt-0.5">
              {format(currentDate, 'EEE')}
            </span>
            <span className="text-base leading-none mt-0.5">
              {format(currentDate, 'd')}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}{' '}
              scheduled
            </p>
          </div>
        </div>
      </div>

      {/* All-Day Events Strip */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[64px_1fr] border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/15 dark:bg-[#18181A]/15 p-2 shrink-0">
          <div className="text-right pr-3 text-[11px] font-medium text-[#86868B] dark:text-[#98989D] self-center">
            All-day
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allDayEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="px-2.5 py-1 rounded-md text-xs font-medium border border-black/5 dark:border-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor:
                    categoryMap.get(evt.categoryId)?.lightBg || '#0A84FF1A',
                  borderLeftColor:
                    categoryMap.get(evt.categoryId)?.color || '#0A84FF',
                  borderLeftWidth: '3.5px',
                }}
              >
                <span>{evt.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 24-Hour Schedule Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative grid grid-cols-[64px_1fr] select-none"
      >
        {/* Time column */}
        <div className="border-r border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/25 dark:bg-[#161618]/25">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-14 border-b border-[#E5E5EA]/60 dark:border-[#28282A]/60 pr-3 pt-1 text-right text-[11px] font-medium text-[#86868B] dark:text-[#98989D] tabular-nums"
            >
              {hour !== 0 && formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {/* Day Column */}
        <div className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => onCreateEventOnDateTime(currentDate, hour)}
              className="h-14 border-b border-[#E5E5EA]/60 dark:border-[#28282A]/60 hover:bg-[#F5F5F7]/50 dark:hover:bg-[#1C1C1E]/50 cursor-pointer transition-colors relative group"
            >
              {/* Half hour divider */}
              <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[#E5E5EA]/40 dark:border-[#28282A]/40" />
            </div>
          ))}

          {/* Current time red indicator line */}
          {isCurrentDay && currentTimeTopPercent !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${currentTimeTopPercent}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] -ml-1.25 shadow-xs" />
              <div className="h-[2px] flex-1 bg-[#FF3B30]" />
            </div>
          )}

          {/* Timed Events */}
          <div className="absolute inset-0 pointer-events-none">
            {timedEvents.map((evt) => {
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
                    left: '8px',
                    right: '8px',
                  }}
                >
                  <EventCard
                    event={evt}
                    category={categoryMap.get(evt.categoryId)}
                    view="day"
                    onClick={onSelectEvent}
                    style={{ height: '100%' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
