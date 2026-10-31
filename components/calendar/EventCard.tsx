'use client';

import React from 'react';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { formatTime12h } from '@/lib/dateUtils';
import { MapPin, Clock } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
  category?: CalendarCategory;
  view: 'month' | 'week' | 'day';
  onClick: (event: CalendarEvent) => void;
  style?: React.CSSProperties;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  category,
  view,
  onClick,
  style,
}) => {
  const catColor = category?.color || '#0A84FF';
  const catBg = category?.lightBg || 'rgba(10, 132, 255, 0.12)';

  if (view === 'month') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(event);
        }}
        className="w-full text-left px-1.5 py-0.5 mb-1 rounded-[4px] text-[11px] font-medium leading-tight truncate flex items-center gap-1.5 transition-all hover:brightness-95 active:scale-[0.99] border border-black/5 dark:border-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]"
        style={{
          backgroundColor: catBg,
          borderLeftColor: catColor,
          borderLeftWidth: '3px',
          ...style,
        }}
        title={`${event.title} (${event.isAllDay ? 'All Day' : formatTime12h(event.startTime)})`}
      >
        {!event.isAllDay && (
          <span className="text-[10px] text-[#86868B] dark:text-[#98989D] shrink-0 tabular-nums">
            {formatTime12h(event.startTime)}
          </span>
        )}
        <span className="truncate font-medium">{event.title}</span>
      </button>
    );
  }

  if (view === 'week') {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick(event);
        }}
        className="absolute inset-x-0.5 rounded-md p-1.5 cursor-pointer overflow-hidden border border-black/5 dark:border-white/10 transition-transform hover:scale-[1.01] hover:z-20 shadow-xs text-[#1D1D1F] dark:text-[#F5F5F7]"
        style={{
          backgroundColor: catBg,
          borderLeftColor: catColor,
          borderLeftWidth: '3.5px',
          ...style,
        }}
      >
        <p className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug truncate">
          {event.title}
        </p>
        {!event.isAllDay && (
          <p className="text-[10px] text-[#86868B] dark:text-[#98989D] flex items-center gap-1 mt-0.5 tabular-nums">
            <span>
              {formatTime12h(event.startTime)} – {formatTime12h(event.endTime)}
            </span>
          </p>
        )}
        {event.location && (
          <p className="text-[9px] text-[#86868B] dark:text-[#98989D] truncate flex items-center gap-0.5 mt-0.5">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span>{event.location}</span>
          </p>
        )}
      </div>
    );
  }

  // Day view
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="absolute inset-x-2 rounded-lg p-2.5 cursor-pointer overflow-hidden border border-black/5 dark:border-white/10 transition-transform hover:scale-[1.01] hover:z-20 shadow-sm text-[#1D1D1F] dark:text-[#F5F5F7]"
      style={{
        backgroundColor: catBg,
        borderLeftColor: catColor,
        borderLeftWidth: '4px',
        ...style,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight truncate">
          {event.title}
        </h4>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 text-white"
          style={{ backgroundColor: catColor }}
        >
          {category?.name || 'Event'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#86868B] dark:text-[#98989D]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="tabular-nums">
            {event.isAllDay
              ? 'All Day'
              : `${formatTime12h(event.startTime)} – ${formatTime12h(event.endTime)}`}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="text-xs text-[#1D1D1F]/80 dark:text-[#F5F5F7]/80 line-clamp-2 mt-2 leading-relaxed">
          {event.description}
        </p>
      )}
    </div>
  );
};
