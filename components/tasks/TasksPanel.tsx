'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { format, isToday, isBefore, startOfToday } from 'date-fns';
import { TaskItem, CalendarCategory } from '@/types/calendar';
import { toInputDateString, parseDateString } from '@/lib/dateUtils';

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  categories: CalendarCategory[];
  onAddTask: (title: string, dueDate?: string, categoryId?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  isOpen,
  onClose,
  tasks,
  categories,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [isAddingDue, setIsAddingDue] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask(
      newTaskTitle.trim(),
      newDueDate || undefined,
      newCategoryId || undefined
    );

    setNewTaskTitle('');
    setNewDueDate('');
    setNewCategoryId('');
    setIsAddingDue(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const categoryMap = new Map<string, CalendarCategory>();
  categories.forEach((c) => {
    categoryMap.set(c.id, c);
    if (c.id.includes('_')) {
      categoryMap.set(c.id.split('_').slice(1).join('_'), c);
    }
  });

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/25 dark:bg-black/50 backdrop-blur-xs sm:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Tasks & Reminders Slide Panel */}
      <aside
        aria-label="Tasks and Reminders"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className={`fixed sm:relative top-0 bottom-0 right-0 z-40 h-full bg-white dark:bg-[#161618] flex flex-col pb-safe transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden shrink-0 ${
          isOpen
            ? 'w-full sm:w-80 translate-x-0 opacity-100 border-l border-[#E5E5EA] dark:border-[#28282A] shadow-2xl sm:shadow-none pointer-events-auto'
            : 'w-full sm:w-0 translate-x-full sm:translate-x-0 sm:opacity-0 sm:border-l-0 pointer-events-none shadow-none'
        }`}
      >
        <div
          className={`w-full sm:w-80 min-w-[320px] h-full flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-4'
          }`}
        >
          {/* Panel Header */}
          <div className="h-13 px-4 flex items-center justify-between border-b border-[#E5E5EA] dark:border-[#28282A] pt-safe sm:pt-0 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Tasks & Reminders
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F5F7] dark:bg-[#242426] text-[#86868B] dark:text-[#98989D] border border-[#E5E5EA] dark:border-[#38383A]">
                {tasks.filter((t) => !t.completed).length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] transition-colors cursor-pointer"
              title="Close tasks"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-[#F5F5F7]/40 dark:bg-[#1C1C1E]/60 border-b border-[#E5E5EA] dark:border-[#28282A] shrink-0">
            {(['all', 'pending', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-1 text-xs font-medium capitalize rounded-md transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                    : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleCreate} className="p-3 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/20 dark:bg-[#1A1A1C]/50 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add new task..."
                className="w-full text-base sm:text-xs pl-3 pr-8 py-2 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/60 dark:placeholder-[#98989D]/60 focus:outline-none focus:ring-1 focus:ring-[#0A84FF] shadow-xs"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="absolute right-1.5 top-1.5 p-1 rounded text-white bg-[#0A84FF] disabled:opacity-40 disabled:hover:bg-[#0A84FF] hover:bg-[#0071E3] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Due Date & Category toggles for quick add */}
            <div className="flex items-center gap-2 mt-2">
              {!isAddingDue ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingDue(true);
                    setNewDueDate(toInputDateString(new Date()));
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#86868B] dark:text-[#98989D] hover:text-[#0A84FF] px-2 py-0.5 rounded border border-dashed border-[#E5E5EA] dark:border-[#38383A] hover:border-[#0A84FF]/40 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Add Due Date</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="text-[11px] px-1.5 py-0.5 rounded border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] text-[#1D1D1F] dark:text-[#F5F5F7]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDue(false);
                      setNewDueDate('');
                    }}
                    className="text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Category selection */}
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="text-[11px] px-1.5 py-0.5 rounded border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] text-[#86868B] dark:text-[#98989D] focus:outline-none cursor-pointer"
              >
                <option value="">No list</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Task Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredTasks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-[#86868B]/30 dark:text-[#98989D]/30 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {filter === 'completed' ? 'No completed tasks' : 'All clear!'}
                </p>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-0.5">
                  {filter === 'completed'
                    ? 'Tasks you check off will appear here.'
                    : 'No pending reminders for your schedule.'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const taskCategory = task.categoryId
                  ? categoryMap.get(task.categoryId)
                  : null;
                const isDueToday = task.dueDate
                  ? isToday(parseDateString(task.dueDate))
                  : false;
                const isOverdue =
                  task.dueDate && !task.completed
                    ? isBefore(parseDateString(task.dueDate), startOfToday())
                    : false;

                return (
                  <div
                    key={task.id}
                    className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#202022] border border-transparent hover:border-[#E5E5EA] dark:hover:border-[#38383A] transition-all"
                  >
                    {/* Circular checkbox */}
                    <button
                      onClick={() => onToggleTask(task.id)}
                      aria-label="Toggle task completion"
                      className="mt-0.5 text-[#86868B] dark:text-[#98989D] hover:text-[#0A84FF] transition-colors shrink-0 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0A84FF] fill-[#0A84FF]/10" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#86868B]/70 dark:text-[#98989D]/70 hover:text-[#0A84FF]" />
                      )}
                    </button>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug break-words ${
                          task.completed
                            ? 'line-through text-[#86868B] dark:text-[#98989D]'
                            : 'text-[#1D1D1F] dark:text-[#F5F5F7] font-medium'
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-0.5 font-medium px-1.5 py-0.2 rounded ${
                              isOverdue
                                ? 'text-[#FF3B30] bg-[#FF3B30]/10'
                                : isDueToday
                                ? 'text-[#0A84FF] bg-[#0A84FF]/10'
                                : 'text-[#86868B] dark:text-[#98989D] bg-[#F5F5F7] dark:bg-[#242426]'
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            <span>
                              {isDueToday
                                ? 'Today'
                                : format(parseDateString(task.dueDate), 'MMM d')}
                            </span>
                          </span>
                        )}

                        {taskCategory && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: taskCategory.lightBg,
                              color: taskCategory.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: taskCategory.color }}
                            />
                            <span>{taskCategory.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#86868B] dark:text-[#98989D] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all shrink-0 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
