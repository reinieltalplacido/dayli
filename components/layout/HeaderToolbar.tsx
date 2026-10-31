'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckSquare,
  Menu,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { CalendarView } from '@/types/calendar';

interface HeaderToolbarProps {
  currentDate: Date;
  view: CalendarView;
  onChangeView: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenCreateEvent: () => void;
  onOpenSearch: () => void;
  onToggleTasks: () => void;
  isTasksOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  currentDate,
  view,
  onChangeView,
  onPrev,
  onNext,
  onToday,
  onOpenCreateEvent,
  onOpenSearch,
  onToggleTasks,
  isTasksOpen,
  onToggleMobileMenu,
}) => {
  // Format title based on active view
  const formattedTitle = React.useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
    // Week view
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    if (isSameMonth(weekStart, weekEnd)) {
      return `${format(weekStart, 'MMMM d')} – ${format(weekEnd, 'd, yyyy')}`;
    }
    return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
  }, [currentDate, view]);

  return (
    <header className="h-13 bg-white dark:bg-[#161618] border-b border-[#E5E5EA] dark:border-[#28282A] px-3 sm:px-5 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left side: Mobile menu toggle + Date navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#242426] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Today button */}
        <button
          onClick={onToday}
          className="px-2.5 py-1 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#242426] border border-[#E5E5EA] dark:border-[#38383A] rounded-md transition-colors shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
        >
          Today
        </button>

        {/* Prev / Next controls */}
        <div className="flex items-center rounded-md border border-[#E5E5EA] dark:border-[#38383A] p-0.5 bg-[#F5F5F7]/60 dark:bg-[#202022]">
          <button
            onClick={onPrev}
            className="p-1 rounded text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white dark:hover:bg-[#2C2C2E] hover:shadow-xs transition-all"
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="p-1 rounded text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white dark:hover:bg-[#2C2C2E] hover:shadow-xs transition-all"
            title="Next"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-sm sm:text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight truncate ml-1">
          {formattedTitle}
        </h2>
      </div>

      {/* Right side: View selector + Search + Tasks + New Event */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Segmented Control for Views */}
        <div className="flex items-center bg-[#F5F5F7] dark:bg-[#202022] p-0.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A]">
          <button
            onClick={() => onChangeView('day')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              view === 'day'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onChangeView('week')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              view === 'week'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onChangeView('month')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              view === 'month'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            Month
          </button>
        </div>

        {/* Quick Search */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] bg-[#F5F5F7] dark:bg-[#202022] hover:bg-[#E5E5EA]/70 dark:hover:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] rounded-md transition-colors"
          title="Search events (/)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden lg:inline text-[10px] bg-white dark:bg-[#18181A] border border-[#E5E5EA] dark:border-[#38383A] px-1 py-0.2 rounded text-[#86868B] dark:text-[#98989D]">
            /
          </kbd>
        </button>

        {/* Tasks Toggle */}
        <button
          onClick={onToggleTasks}
          className={`p-1.5 rounded-md border text-xs transition-colors hidden sm:flex items-center gap-1 ${
            isTasksOpen
              ? 'bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 border-[#0A84FF]/30 dark:border-[#0A84FF]/40 text-[#0A84FF]'
              : 'border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#202022]'
          }`}
          title="Toggle Tasks panel"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        {/* Create Event Button */}
        <button
          onClick={onOpenCreateEvent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] active:bg-[#0062C4] rounded-md shadow-[0_1px_2px_rgba(10,132,255,0.25)] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>
    </header>
  );
};
