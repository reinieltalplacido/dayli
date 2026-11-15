'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  CheckSquare,
  Tag,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { addDays } from 'date-fns';
import { TaskItem, CalendarCategory } from '@/types/calendar';
import { toInputDateString } from '@/lib/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: { title: string; dueDate?: string; categoryId?: string }) => void;
  onUpdate?: (id: string, updates: Partial<TaskItem>) => void;
  onDelete?: (id: string) => void;
  categories: CalendarCategory[];
  initialTask?: TaskItem | null;
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  categories,
  initialTask,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        if (initialTask) {
          setTitle(initialTask.title);
          setDueDate(initialTask.dueDate || '');
          setCategoryId(initialTask.categoryId || '');
          setCompleted(initialTask.completed);
        } else {
          setTitle('');
          setDueDate(defaultDate || '');
          setCategoryId('');
          setCompleted(false);
        }
        setError('');
        setShowDeleteConfirm(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, initialTask, defaultDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title');
      return;
    }

    if (initialTask && onUpdate) {
      onUpdate(initialTask.id, {
        title: title.trim(),
        dueDate: dueDate || undefined,
        categoryId: categoryId || undefined,
        completed,
      });
    } else {
      onSave({
        title: title.trim(),
        dueDate: dueDate || undefined,
        categoryId: categoryId || undefined,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialTask && onDelete) {
      onDelete(initialTask.id);
      onClose();
    }
  };

  const todayStr = toInputDateString(new Date());
  const tomorrowStr = toInputDateString(addDays(new Date(), 1));
  const nextWeekStr = toInputDateString(addDays(new Date(), 7));

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[4px] animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#E5E5EA] dark:border-[#38383A] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col max-h-[88vh] sm:max-h-[90vh] pb-safe animate-modal"
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#86868B]/30 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <CheckSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {initialTask ? 'Edit Task' : 'New Task'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {initialTask && onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="px-5 py-2.5 bg-[#FF3B30]/10 border-b border-[#FF3B30]/20 flex items-center justify-between">
            <span className="text-xs font-medium text-[#FF3B30]">
              Delete this task permanently?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs rounded bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#E5E5EA] dark:border-[#38383A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-2.5 py-1 text-xs rounded bg-[#FF3B30] text-white font-medium cursor-pointer"
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

          {/* Task Title */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1.5">
              Task Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="What needs to be done?..."
              autoFocus
              className="w-full text-base sm:text-sm font-medium px-3.5 py-2.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/50 dark:placeholder-[#98989D]/50 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all shadow-xs"
            />
          </div>

          {/* Due Date Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] dark:text-[#98989D]">
                <CalendarIcon className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Due Date</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] transition-colors cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDueDate(todayStr)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  dueDate === todayStr
                    ? 'bg-[#0A84FF] text-white shadow-xs'
                    : 'bg-[#F5F5F7] dark:bg-[#242426] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDueDate(tomorrowStr)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  dueDate === tomorrowStr
                    ? 'bg-[#0A84FF] text-white shadow-xs'
                    : 'bg-[#F5F5F7] dark:bg-[#242426] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDueDate(nextWeekStr)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  dueDate === nextWeekStr
                    ? 'bg-[#0A84FF] text-white shadow-xs'
                    : 'bg-[#F5F5F7] dark:bg-[#242426] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                }`}
              >
                Next Week
              </button>
            </div>

            {/* Date input */}
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] transition-all cursor-pointer shadow-xs"
              />
            </div>
          </div>

          {/* Category / Calendar Section */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1.5">
              <Tag className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Calendar Category</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId('')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  !categoryId
                    ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] shadow-xs'
                    : 'bg-[#F5F5F7] dark:bg-[#242426] text-[#86868B] dark:text-[#98989D] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                }`}
              >
                No list
              </button>
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer border"
                    style={{
                      backgroundColor: isSelected ? cat.color : cat.lightBg,
                      color: isSelected ? '#FFFFFF' : cat.color,
                      borderColor: isSelected ? cat.color : 'transparent',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : cat.color }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completion state toggle (if editing) */}
          {initialTask && (
            <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer"
              >
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#0A84FF] fill-[#0A84FF]/10" />
                ) : (
                  <Circle className="w-4 h-4 text-[#86868B]" />
                )}
                <span>{completed ? 'Marked as completed' : 'Mark as completed'}</span>
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-md shadow-xs transition-colors cursor-pointer"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
