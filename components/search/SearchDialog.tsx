'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, CheckSquare } from 'lucide-react';
import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';
import { formatTime12h, parseDateString } from '@/lib/dateUtils';
import { format } from 'date-fns';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  tasks: TaskItem[];
  categories: CalendarCategory[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  events,
  tasks,
  categories,
  onSelectEvent,
}) => {
  const [query, setQuery] = useState('');

  const categoryMap = useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
    );
  }, [events, query]);

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden text-[#1D1D1F] flex flex-col max-h-[70vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E5EA]">
          <Search className="w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, notes, locations, tasks..."
            autoFocus
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-[#86868B]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#86868B] hover:text-[#1D1D1F] p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!query.trim() ? (
            <div className="p-6 text-center text-xs text-[#86868B]">
              Type a title, meeting attendee, or location to search your Dayli calendar.
            </div>
          ) : filteredEvents.length === 0 && filteredTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#86868B]">
              No events or tasks matching &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Event results */}
              {filteredEvents.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5 px-2">
                    Events ({filteredEvents.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredEvents.map((event) => {
                      const cat = categoryMap.get(event.categoryId);
                      return (
                        <div
                          key={event.id}
                          onClick={() => {
                            onClose();
                            onSelectEvent(event);
                          }}
                          className="flex items-start justify-between p-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer transition-colors border border-transparent hover:border-[#E5E5EA]"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: cat?.color || '#0A84FF' }}
                              />
                              <span className="text-xs font-semibold text-[#1D1D1F] truncate">
                                {event.title}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-[11px] text-[#86868B] truncate mt-0.5 ml-3.5">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-[10px] text-[#86868B] flex items-center gap-1 mt-0.5 ml-3.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{event.location}</span>
                              </p>
                            )}
                          </div>
                          <div className="text-right text-[11px] text-[#86868B] shrink-0">
                            <div>{format(parseDateString(event.startDate), 'MMM d')}</div>
                            <div className="text-[10px] tabular-nums">
                              {event.isAllDay ? 'All Day' : formatTime12h(event.startTime)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task results */}
              {filteredTasks.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5 px-2">
                    Tasks ({filteredTasks.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#F5F5F7]/50 text-xs text-[#1D1D1F]"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-[#0A84FF]" />
                        <span className={`truncate ${task.completed ? 'line-through text-[#86868B]' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
