'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  MapPin,
  AlignLeft,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { toInputDateString } from '@/lib/dateUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (id: string, event: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
  categories: CalendarCategory[];
  initialEvent?: CalendarEvent | null;
  defaultDate?: Date;
  defaultHour?: number;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  categories,
  initialEvent,
  defaultDate,
  defaultHour,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isReadOnly = Boolean(initialEvent?.isHoliday || initialEvent?.isReadOnly);

  // Sync form state when modal opens or initial values change
  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setStartDate(initialEvent.startDate);
      setStartTime(initialEvent.startTime);
      setEndDate(initialEvent.endDate);
      setEndTime(initialEvent.endTime);
      setIsAllDay(initialEvent.isAllDay);
      setCategoryId(initialEvent.categoryId);
      setLocation(initialEvent.location || '');
      setDescription(initialEvent.description || '');
    } else {
      const baseDate = defaultDate ? toInputDateString(defaultDate) : toInputDateString(new Date());
      const hour = defaultHour !== undefined ? defaultHour : 9;
      const hourStr = hour.toString().padStart(2, '0');
      const nextHourStr = ((hour + 1) % 24).toString().padStart(2, '0');

      setTitle('');
      setStartDate(baseDate);
      setStartTime(`${hourStr}:00`);
      setEndDate(baseDate);
      setEndTime(`${nextHourStr}:00`);
      setIsAllDay(false);
      setCategoryId(categories[0]?.id || 'personal');
      setLocation('');
      setDescription('');
    }
    setError('');
    setShowDeleteConfirm(false);
  }, [initialEvent, defaultDate, defaultHour, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      onClose();
      return;
    }

    if (!title.trim()) {
      setError('Please provide an event title');
      return;
    }

    const eventPayload = {
      title: title.trim(),
      startDate,
      startTime: isAllDay ? '00:00' : startTime,
      endDate: endDate || startDate,
      endTime: isAllDay ? '23:59' : endTime,
      isAllDay,
      categoryId: categoryId || categories[0]?.id || 'personal',
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (initialEvent && onUpdate) {
      onUpdate(initialEvent.id, eventPayload);
    } else {
      onSave(eventPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialEvent && onDelete && !isReadOnly) {
      onDelete(initialEvent.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[4px] animate-backdrop">
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#E5E5EA] dark:border-[#38383A] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col max-h-[88vh] sm:max-h-[90vh] pb-safe animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-10 h-1 bg-[#86868B]/30 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            {isReadOnly ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF2D55]" />
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Public Holiday
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20">
                  Official
                </span>
              </>
            ) : (
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {initialEvent ? 'Edit Event' : 'New Event'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isReadOnly && initialEvent && onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="px-5 py-2.5 bg-[#FF3B30]/10 border-b border-[#FF3B30]/20 flex items-center justify-between">
            <span className="text-xs font-medium text-[#FF3B30]">
              Delete this event permanently?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs rounded bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#E5E5EA] dark:border-[#38383A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-2.5 py-1 text-xs rounded bg-[#FF3B30] text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Read-Only Notice Banner for Public Holidays */}
        {isReadOnly && (
          <div className="px-5 py-3 bg-[#FF2D55]/5 border-b border-[#FF2D55]/15 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#FF2D55] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-[#FF2D55]">Official National Holiday</p>
              <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-0.5 leading-relaxed">
                This is a verified public holiday synchronized with your regional calendar. You can show or hide holidays anytime via the sidebar under &ldquo;MY CALENDARS&rdquo;.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs font-medium text-[#FF3B30]">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              disabled={isReadOnly}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Event Title..."
              autoFocus={!isReadOnly}
              className={`w-full text-base sm:text-lg font-semibold px-3 py-2 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/50 dark:placeholder-[#98989D]/50 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all ${
                isReadOnly ? 'opacity-90 cursor-default' : ''
              }`}
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1.5">
              Calendar
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    categoryId === cat.id
                      ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/25 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                      : 'border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#98989D] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A]'
                  } ${isReadOnly ? 'cursor-default opacity-85' : ''}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">All-Day Event</span>
            <label className={`relative inline-flex items-center ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={isAllDay}
                disabled={isReadOnly}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-[#E5E5EA] dark:bg-[#38383A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A84FF]"></div>
            </label>
          </div>

          {/* Date & Time Row */}
          <div className="space-y-3 bg-[#F5F5F7]/50 dark:bg-[#242426]/50 p-3 rounded-xl border border-[#E5E5EA] dark:border-[#38383A]">
            {/* Start */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] dark:text-[#98989D] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full text-base sm:text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] disabled:opacity-85"
                />
              </div>

              {!isAllDay && (
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] dark:text-[#98989D] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    disabled={isReadOnly}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] disabled:opacity-85"
                  />
                </div>
              )}
            </div>

            {/* End */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] dark:text-[#98989D] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  disabled={isReadOnly}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-base sm:text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] disabled:opacity-85"
                />
              </div>

              {!isAllDay && (
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] dark:text-[#98989D] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>End Time</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    disabled={isReadOnly}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] disabled:opacity-85"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location / Region</span>
            </label>
            <input
              type="text"
              value={location}
              disabled={isReadOnly}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Hall 102 or Zoom link"
              className="w-full text-base sm:text-xs px-3 py-1.5 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/50 dark:placeholder-[#98989D]/50 focus:outline-none focus:ring-1 focus:ring-[#0A84FF] disabled:opacity-85"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Notes</span>
            </label>
            <textarea
              value={description}
              disabled={isReadOnly}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, agenda items, or notes..."
              rows={3}
              className="w-full text-base sm:text-xs px-3 py-2 rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/50 dark:placeholder-[#98989D]/50 focus:outline-none focus:ring-1 focus:ring-[#0A84FF] resize-none disabled:opacity-85"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-md shadow-sm transition-colors"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-md shadow-sm transition-colors"
                >
                  {initialEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
