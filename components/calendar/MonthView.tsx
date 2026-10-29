'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { toInputDateString } from '@/lib/dateUtils';
import { EventCard } from './EventCard';
import { Plus, X } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onVisibleMonthChange?: (date: Date) => void;
}

interface MonthSection {
  monthDate: Date;
  monthKey: string;
  label: string;
  days: (Date | null)[];
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  categories,
  onSelectEvent,
  onCreateEventOnDate,
  onVisibleMonthChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Month ranges for continuous window
  const [range, setRange] = useState({ pastMonths: 3, futureMonths: 8 });
  const [overflowDate, setOverflowDate] = useState<Date | null>(null);

  // Base anchor date for range calculation
  const anchorDate = useMemo(() => new Date(2026, 9, 1), []);

  // Generate month sections with proper leading/trailing blank cells and dividers
  const monthSections = useMemo<MonthSection[]>(() => {
    const sections: MonthSection[] = [];
    const totalMonths = range.pastMonths + range.futureMonths + 1;

    for (let i = 0; i < totalMonths; i++) {
      const monthOffset = i - range.pastMonths;
      const monthDate = addMonths(startOfMonth(anchorDate), monthOffset);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const leadingBlanks = monthStart.getDay(); // 0 is Sunday
      const totalCells = leadingBlanks + daysInMonth.length;
      const trailingBlanks = (7 - (totalCells % 7)) % 7;

      const days: (Date | null)[] = [
        ...Array(leadingBlanks).fill(null),
        ...daysInMonth,
        ...Array(trailingBlanks).fill(null),
      ];

      sections.push({
        monthDate,
        monthKey: format(monthDate, 'yyyy-MM'),
        label: format(monthDate, 'MMMM yyyy'),
        days,
      });
    }

    return sections;
  }, [anchorDate, range.pastMonths, range.futureMonths]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((evt) => {
      const list = map.get(evt.startDate) || [];
      list.push(evt);
      map.set(evt.startDate, list);
    });
    return map;
  }, [events]);

  const weekDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Scroll to a specific date smoothly
  const scrollToDate = useCallback((date: Date, behavior: ScrollBehavior = 'smooth') => {
    const dateStr = toInputDateString(date);
    const element = document.getElementById(`day-cell-${dateStr}`);
    if (element && containerRef.current) {
      isProgrammaticScrollRef.current = true;
      element.scrollIntoView({ behavior, block: 'start' });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
    }
  }, []);

  // Initial scroll to currentDate on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToDate(currentDate, 'auto');
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync scroll when currentDate changes from toolbar navigation
  const prevDateStrRef = useRef(toInputDateString(currentDate));
  const lastReportedMonthRef = useRef<string | null>(null);

  useEffect(() => {
    const currentStr = toInputDateString(currentDate);
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    if (prevDateStrRef.current !== currentStr) {
      prevDateStrRef.current = currentStr;
      // If this month change came from the user's continuous scroll, don't jerk/anchor the scroll position
      if (lastReportedMonthRef.current === currentMonthStr) {
        lastReportedMonthRef.current = null;
        return;
      }
      if (!isProgrammaticScrollRef.current) {
        scrollToDate(currentDate, 'smooth');
      }
    }
  }, [currentDate, scrollToDate]);

  // Handle scroll events: continuous loading and active month detection
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Infinite load upwards (past months)
    if (scrollTop < 180) {
      const previousScrollHeight = scrollHeight;
      setRange((prev) => ({ ...prev, pastMonths: prev.pastMonths + 3 }));
      requestAnimationFrame(() => {
        if (container) {
          const heightDiff = container.scrollHeight - previousScrollHeight;
          container.scrollTop = scrollTop + heightDiff;
        }
      });
    }

    // Infinite load downwards (future months)
    if (scrollTop + clientHeight > scrollHeight - 300) {
      setRange((prev) => ({ ...prev, futureMonths: prev.futureMonths + 4 }));
    }

    // Detect currently visible month without forcing anchor scroll
    if (!isProgrammaticScrollRef.current && onVisibleMonthChange) {
      const checkY = container.getBoundingClientRect().top + 75;
      const checkX = container.getBoundingClientRect().left + 80;
      const element = document.elementFromPoint(checkX, checkY);
      const cell = element?.closest('[data-date]') as HTMLElement | null;
      if (cell && cell.dataset.date) {
        const [year, month] = cell.dataset.date.split('-').map(Number);
        const cellMonth = new Date(year, month - 1, 1);
        const monthStr = format(cellMonth, 'yyyy-MM');
        if (lastReportedMonthRef.current !== monthStr) {
          lastReportedMonthRef.current = monthStr;
          onVisibleMonthChange(cellMonth);
        }
      }
    }
  }, [onVisibleMonthChange]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative h-full">
      {/* Sticky Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-[#E5E5EA] bg-[#F5F5F7]/95 backdrop-blur-md shrink-0 sticky top-0 z-30">
        {weekDayNames.map((name, idx) => (
          <div
            key={idx}
            className="py-2.5 text-center text-[11px] font-semibold tracking-wider text-[#86868B]"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Continuous Scrollable Months Grid */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative select-none"
      >
        {monthSections.map((section) => (
          <div key={section.monthKey} className="relative">
            {/* New Month Divider Header */}
            <div
              id={`month-divider-${section.monthKey}`}
              className="px-4 py-2 bg-[#F5F5F7] border-y border-[#E5E5EA] select-none"
            >
              <span className="text-xs font-semibold text-[#1D1D1F] tracking-tight">
                {section.label}
              </span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-[#E5E5EA]">
              {section.days.map((day, dIdx) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${section.monthKey}-${dIdx}`}
                      className="min-h-[115px] sm:min-h-[135px] p-2 bg-[#F5F5F7]/30 border-b border-[#E5E5EA]"
                    />
                  );
                }

                const dateStr = toInputDateString(day);
                const dayEvents = eventsByDate.get(dateStr) || [];
                const isCurrentDay = isToday(day);
                const maxVisible = 3;
                const visibleEvents = dayEvents.slice(0, maxVisible);
                const overflowCount = dayEvents.length - maxVisible;

                return (
                  <div
                    key={dateStr}
                    id={`day-cell-${dateStr}`}
                    data-date={dateStr}
                    onClick={() => onCreateEventOnDate(day)}
                    className="group min-h-[115px] sm:min-h-[135px] p-2 flex flex-col border-b border-[#E5E5EA] relative transition-colors cursor-pointer hover:bg-[#F5F5F7]/50 bg-white"
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-1.5 shrink-0">
                      <span
                        className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full transition-colors ${
                          isCurrentDay
                            ? 'bg-[#0A84FF] text-white shadow-xs'
                            : 'text-[#1D1D1F]'
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
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#86868B] hover:text-[#0A84FF] hover:bg-white transition-all shadow-2xs"
                        title="Add event"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Event Cards List */}
                    <div className="flex-1 space-y-1 overflow-hidden">
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
                          type="button"
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
          </div>
        ))}
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
