'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  format,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { toInputDateString } from '@/lib/dateUtils';
import { EventCard } from './EventCard';
import { Plus, X, Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onVisibleMonthChange?: (date: Date) => void;
  weekStartsOn?: 0 | 1;
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
  weekStartsOn = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Month ranges for continuous window
  const [range, setRange] = useState({ pastMonths: 3, futureMonths: 8 });
  const [overflowDate, setOverflowDate] = useState<Date | null>(null);
  const [mobileSelectedDate, setMobileSelectedDate] = useState<Date | null>(null);

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

      const leadingBlanks = (monthStart.getDay() - weekStartsOn + 7) % 7;
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
  }, [anchorDate, range.pastMonths, range.futureMonths, weekStartsOn]);

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

  const weekDayNames = useMemo(() => {
    return weekStartsOn === 1
      ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }, [weekStartsOn]);

  // Scroll to a specific date smoothly
  const scrollToDate = useCallback((date: Date, behavior: ScrollBehavior = 'smooth') => {
    const monthKey = format(date, 'yyyy-MM');
    const divider = document.getElementById(`month-divider-${monthKey}`);
    const dayStr = toInputDateString(date);
    const dayCell = document.getElementById(`day-cell-${dayStr}`);

    if (containerRef.current) {
      isProgrammaticScrollRef.current = true;

      // Scroll to the month header so the full month starts cleanly at the top
      if (divider) {
        divider.scrollIntoView({ behavior, block: 'start' });
      } else if (dayCell) {
        dayCell.scrollIntoView({ behavior, block: 'center' });
      }

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

  // Sync scroll when currentDate changes from toolbar navigation or Jump to Today
  const prevDateStrRef = useRef(toInputDateString(currentDate));
  const prevDateTimeRef = useRef(currentDate.getTime());
  const lastReportedMonthRef = useRef<string | null>(null);

  useEffect(() => {
    const currentStr = toInputDateString(currentDate);
    const currentTime = currentDate.getTime();
    const currentMonthStr = format(currentDate, 'yyyy-MM');

    // If date changed or user explicitly clicked Jump to Today
    const dateChanged = prevDateStrRef.current !== currentStr;
    const timeRefreshed = Math.abs(currentTime - prevDateTimeRef.current) > 10;

    if (dateChanged || timeRefreshed) {
      prevDateStrRef.current = currentStr;
      prevDateTimeRef.current = currentTime;

      // If this month change came from the user's continuous scroll, don't jerk/anchor the scroll position
      if (lastReportedMonthRef.current === currentMonthStr && !timeRefreshed) {
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

    // Detect currently visible month using month dividers
    if (!isProgrammaticScrollRef.current && onVisibleMonthChange) {
      const dividers = container.querySelectorAll<HTMLElement>('[id^="month-divider-"]');
      const containerRect = container.getBoundingClientRect();
      let bestMonthKey: string | null = null;

      dividers.forEach((divider) => {
        const rect = divider.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        if (relativeTop <= containerRect.height * 0.45) {
          bestMonthKey = divider.id.replace('month-divider-', '');
        }
      });

      if (!bestMonthKey && dividers.length > 0) {
        bestMonthKey = dividers[0].id.replace('month-divider-', '');
      }

      if (bestMonthKey && lastReportedMonthRef.current !== bestMonthKey) {
        lastReportedMonthRef.current = bestMonthKey;
        const [year, month] = (bestMonthKey as string).split('-').map(Number);
        onVisibleMonthChange(new Date(year, month - 1, 1));
      }
    }
  }, [onVisibleMonthChange]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#121214] overflow-hidden relative h-full">
      {/* Sticky Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/95 dark:bg-[#18181A]/95 backdrop-blur-md shrink-0 sticky top-0 z-30">
        {weekDayNames.map((name, idx) => (
          <div
            key={idx}
            className="py-2.5 text-center text-[11px] font-semibold tracking-wider text-[#86868B] dark:text-[#98989D]"
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
              className="px-4 py-2 bg-[#F5F5F7] dark:bg-[#1A1A1C] border-y border-[#E5E5EA] dark:border-[#28282A] select-none"
            >
              <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                {section.label}
              </span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-[#E5E5EA] dark:divide-[#28282A]">
              {section.days.map((day, dIdx) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${section.monthKey}-${dIdx}`}
                      className="min-h-[58px] sm:min-h-[135px] p-1 sm:p-2 bg-[#F5F5F7]/30 dark:bg-[#161618]/30 border-b border-[#E5E5EA] dark:border-[#28282A]"
                    />
                  );
                }

                const dateStr = toInputDateString(day);
                const dayEvents = eventsByDate.get(dateStr) || [];
                const isCurrentDay = isToday(day);
                const isSelectedMobile =
                  mobileSelectedDate !== null && isSameDay(mobileSelectedDate, day);
                const maxVisible = 3;
                const visibleEvents = dayEvents.slice(0, maxVisible);
                const overflowCount = dayEvents.length - maxVisible;

                return (
                  <div
                    key={dateStr}
                    id={`day-cell-${dateStr}`}
                    data-date={dateStr}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        setMobileSelectedDate((prev) =>
                          prev && isSameDay(prev, day) ? null : day
                        );
                      } else {
                        onCreateEventOnDate(day);
                      }
                    }}
                    className={`group min-h-[58px] sm:min-h-[135px] p-1 sm:p-2 flex flex-col border-b border-[#E5E5EA] dark:border-[#28282A] relative transition-colors cursor-pointer hover:bg-[#F5F5F7]/50 dark:hover:bg-[#1C1C1E]/50 bg-white dark:bg-[#121214] ${
                      isSelectedMobile
                        ? 'bg-[#0A84FF]/[0.06] dark:bg-[#0A84FF]/[0.1]'
                        : ''
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between sm:mb-1.5 shrink-0">
                      <span
                        className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full transition-colors ${
                          isCurrentDay
                            ? 'bg-[#0A84FF] text-white shadow-xs'
                            : isSelectedMobile
                            ? 'bg-[#0A84FF]/20 text-[#0A84FF] ring-2 ring-[#0A84FF]'
                            : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Quick Add Event Hover Button (Desktop only) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateEventOnDate(day);
                        }}
                        className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#86868B] dark:text-[#98989D] hover:text-[#0A84FF] hover:bg-white dark:hover:bg-[#28282A] transition-all shadow-2xs"
                        title="Add event"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mobile Category Dots */}
                    <div className="flex sm:hidden items-center justify-center gap-1 mt-1 flex-wrap">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <span
                          key={evt.id}
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              categoryMap.get(evt.categoryId)?.color || '#0A84FF',
                          }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#86868B] dark:bg-[#98989D] shrink-0" />
                      )}
                    </div>

                    {/* Desktop Event Cards List */}
                    <div className="hidden sm:block flex-1 space-y-1 overflow-hidden">
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

      {/* Mobile Agenda Sheet (When a day is selected on mobile) */}
      {mobileSelectedDate && (
        <div className="sm:hidden fixed inset-x-0 bottom-14 z-30 bg-white dark:bg-[#1C1C1E] border-t border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-2xl max-h-[46vh] flex flex-col animate-modal">
          {/* Handle bar & Header */}
          <div className="px-4 py-2.5 border-b border-[#E5E5EA] dark:border-[#28282A] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {format(mobileSelectedDate, 'd')}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {format(mobileSelectedDate, 'EEEE, MMM d')}
                </h4>
                <p className="text-[10px] text-[#86868B] dark:text-[#98989D]">
                  {(eventsByDate.get(toInputDateString(mobileSelectedDate)) || []).length}{' '}
                  events scheduled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onCreateEventOnDate(mobileSelectedDate)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-[#0A84FF] active:bg-[#0071E3] rounded-md shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileSelectedDate(null)}
                className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(() => {
              const selectedDayEvents =
                eventsByDate.get(toInputDateString(mobileSelectedDate)) || [];
              if (selectedDayEvents.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-[#86868B] dark:text-[#98989D]">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#86868B]" />
                    <p>No events scheduled for this day</p>
                    <button
                      type="button"
                      onClick={() => onCreateEventOnDate(mobileSelectedDate)}
                      className="mt-2 text-[#0A84FF] font-medium text-xs hover:underline"
                    >
                      + Tap here to add an event
                    </button>
                  </div>
                );
              }

              return selectedDayEvents.map((evt) => {
                const cat = categoryMap.get(evt.categoryId);
                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-2.5 rounded-lg border border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/50 dark:bg-[#202022] active:bg-[#E5E5EA]/70 dark:active:bg-[#28282A] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || '#0A84FF' }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#86868B] dark:text-[#98989D] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {evt.isAllDay
                              ? 'All Day'
                              : `${evt.startTime} – ${evt.endTime}`}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{evt.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{
                        backgroundColor: cat?.lightBg || '#0A84FF15',
                        color: cat?.color || '#0A84FF',
                      }}
                    >
                      {cat?.name || 'General'}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Overflow Date Popover Modal */}
      {overflowDate && (
        <div
          onClick={() => setOverflowDate(null)}
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[4px] flex items-center justify-center p-4 animate-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl border border-[#E5E5EA] dark:border-[#38383A] overflow-hidden animate-modal"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {format(overflowDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setOverflowDate(null)}
                className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]"
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
