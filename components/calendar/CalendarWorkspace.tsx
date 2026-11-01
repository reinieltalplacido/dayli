'use client';

import React from 'react';
import { CalendarCategory, CalendarEvent, CalendarView } from '@/types/calendar';
import { categoryService } from '@/services/categoryService';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { Eye } from 'lucide-react';

interface CalendarWorkspaceProps {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
  onVisibleMonthChange?: (date: Date) => void;
  weekStartsOn?: 0 | 1;
}

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
  currentDate,
  view,
  events,
  categories,
  onSelectEvent,
  onCreateEventOnDate,
  onCreateEventOnDateTime,
  onVisibleMonthChange,
  weekStartsOn = 0,
}) => {
  // Only show events whose category is currently enabled
  const enabledCategoryIds = React.useMemo(() => {
    return new Set(categories.filter((c) => c.enabled).map((c) => c.id));
  }, [categories]);

  const visibleEvents = React.useMemo(() => {
    return events.filter((evt) => enabledCategoryIds.has(evt.categoryId));
  }, [events, enabledCategoryIds]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121214] overflow-hidden relative h-full">
      {/* Indicator when events exist but are hidden because their categories are unchecked */}
      {events.length > 0 && visibleEvents.length === 0 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-[#1C1C1E]/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-[#1C1C1E] text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-white/10 dark:border-black/10">
          <Eye className="w-3.5 h-3.5 opacity-70" />
          <span>Calendars are unchecked in the sidebar.</span>
          <button
            type="button"
            onClick={() => {
              categories.forEach((cat) => {
                if (!cat.enabled) categoryService.toggle(cat.id);
              });
            }}
            className="underline font-semibold hover:opacity-80 ml-1"
          >
            Show All
          </button>
        </div>
      )}

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={visibleEvents}
          categories={categories}
          onSelectEvent={onSelectEvent}
          onCreateEventOnDate={onCreateEventOnDate}
          onVisibleMonthChange={onVisibleMonthChange}
          weekStartsOn={weekStartsOn}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={visibleEvents}
          categories={categories}
          onSelectEvent={onSelectEvent}
          onCreateEventOnDateTime={onCreateEventOnDateTime}
          weekStartsOn={weekStartsOn}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={visibleEvents}
          categories={categories}
          onSelectEvent={onSelectEvent}
          onCreateEventOnDateTime={onCreateEventOnDateTime}
        />
      )}
    </main>
  );
};
