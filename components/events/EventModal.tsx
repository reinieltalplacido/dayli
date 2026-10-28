'use client';

import React, { useState } from 'react';
import { X, Trash2, Calendar, Clock, MapPin, AlignLeft, Tag } from 'lucide-react';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';
import { toInputDateString } from '@/lib/dateUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
  initialEvent?: CalendarEvent | null;
  defaultDate?: Date;
  defaultHour?: number;
  categories: CalendarCategory[];
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialEvent,
  defaultDate,
  defaultHour,
  categories,
}) => {
  const baseDate = defaultDate || new Date();
  const baseDateStr = toInputDateString(baseDate);
  const hour = defaultHour !== undefined ? defaultHour : 9;
  const padHour = (h: number) => String(h).padStart(2, '0');

  const [title, setTitle] = useState(() => initialEvent?.title || '');
  const [description, setDescription] = useState(() => initialEvent?.description || '');
  const [startDate, setStartDate] = useState(() => initialEvent?.startDate || baseDateStr);
  const [endDate, setEndDate] = useState(() => initialEvent?.endDate || baseDateStr);
  const [startTime, setStartTime] = useState(
    () => initialEvent?.startTime || `${padHour(hour)}:00`
  );
  const [endTime, setEndTime] = useState(
    () => initialEvent?.endTime || `${padHour(Math.min(23, hour + 1))}:00`
  );
  const [isAllDay, setIsAllDay] = useState(() => initialEvent?.isAllDay || false);
  const [categoryId, setCategoryId] = useState(
    () => initialEvent?.categoryId || categories[0]?.id || 'personal'
  );
  const [location, setLocation] = useState(() => initialEvent?.location || '');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!startDate) {
      setError('Start date is required');
      return;
    }

    // Validate times if not all day
    if (!isAllDay && startDate === endDate) {
      if (startTime >= endTime) {
        setError('End time must be after start time');
        return;
      }
    }

    const eventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate: endDate || startDate,
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime,
      isAllDay,
      categoryId: categoryId || categories[0]?.id || 'personal',
      location: location.trim() || undefined,
    };

    if (initialEvent && onUpdate) {
      onUpdate(initialEvent.id, eventPayload);
    } else {
      onSave(eventPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialEvent && onDelete) {
      onDelete(initialEvent.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden text-[#1D1D1F] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA]">
          <h3 className="text-sm font-semibold text-[#1D1D1F]">
            {initialEvent ? 'Edit Event' : 'New Event'}
          </h3>
          <div className="flex items-center gap-1">
            {initialEvent && onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
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
                className="px-2.5 py-1 text-xs rounded bg-white text-[#1D1D1F] border border-[#E5E5EA]"
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
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Event Title"
              autoFocus
              className="w-full text-base font-semibold px-3 py-2 rounded-lg border border-[#E5E5EA] placeholder:text-[#86868B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Calendar Category</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    categoryId === cat.id
                      ? 'border-[#0A84FF] bg-[#0A84FF]/10 font-semibold text-[#1D1D1F] shadow-xs'
                      : 'border-[#E5E5EA] text-[#86868B] hover:bg-[#F5F5F7]'
                  }`}
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
            <span className="text-xs font-medium text-[#1D1D1F]">All-Day Event</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A84FF]"></div>
            </label>
          </div>

          {/* Date & Time Row */}
          <div className="space-y-3 bg-[#F5F5F7]/50 p-3 rounded-xl border border-[#E5E5EA]">
            {/* Start */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] bg-white focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
                />
              </div>

              {!isAllDay && (
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] bg-white focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
                  />
                </div>
              )}
            </div>

            {/* End */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] bg-white focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
                />
              </div>

              {!isAllDay && (
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-[#86868B] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>End Time</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5EA] bg-white focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location or Video Link</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Hall 102 or Zoom link"
              className="w-full text-xs px-3 py-1.5 rounded-md border border-[#E5E5EA] focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
            />
          </div>

          {/* Description / Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] mb-1">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Notes</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, agenda items, or notes..."
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5E5EA] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-md shadow-sm transition-colors"
            >
              {initialEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
