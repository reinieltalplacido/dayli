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
  const isCategoryEnabled = React.useCallback(
    (categoryId?: string) => {
      if (!categoryId) return true;
      return categories.some((c) => {
        if (!c.enabled) return false;
        if (c.id === categoryId) return true;
        const normC = c.id.includes('_') ? c.id.split('_').slice(1).join('_') : c.id;
        const normEvt = categoryId.includes('_') ? categoryId.split('_').slice(1).join('_') : categoryId;
        return normC === normEvt;
      });
    },
    [categories]
  );

  const visibleEvents = React.useMemo(() => {
    return events.filter((evt) => isCategoryEnabled(evt.categoryId));
  }, [events, isCategoryEnabled]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121214] overflow-hidden relative h-full">
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
