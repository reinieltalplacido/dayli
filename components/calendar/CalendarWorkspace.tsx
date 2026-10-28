'use client';

import React from 'react';
import { CalendarCategory, CalendarEvent, CalendarView } from '@/types/calendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';

interface CalendarWorkspaceProps {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onCreateEventOnDateTime: (date: Date, hour: number) => void;
  onVisibleMonthChange?: (date: Date) => void;
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
}) => {
  // Only show events whose category is currently enabled
  const enabledCategoryIds = React.useMemo(() => {
    return new Set(categories.filter((c) => c.enabled).map((c) => c.id));
  }, [categories]);

  const visibleEvents = React.useMemo(() => {
    return events.filter((evt) => enabledCategoryIds.has(evt.categoryId));
  }, [events, enabledCategoryIds]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative h-full">
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={visibleEvents}
          categories={categories}
          onSelectEvent={onSelectEvent}
          onCreateEventOnDate={onCreateEventOnDate}
          onVisibleMonthChange={onVisibleMonthChange}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={visibleEvents}
          categories={categories}
          onSelectEvent={onSelectEvent}
          onCreateEventOnDateTime={onCreateEventOnDateTime}
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
