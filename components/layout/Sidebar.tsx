'use client';

import React, { useState } from 'react';
import {
  Plus,
  CheckSquare,
  Settings,
  CalendarDays,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';
import { MiniCalendar } from '../calendar/MiniCalendar';
import { DayliLogo } from '../ui/DayliLogo';
import { AddCategoryModal } from '../categories/AddCategoryModal';

interface SidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
  categories: CalendarCategory[];
  onToggleCategory: (id: string) => void;
  onAddCategory: (name: string, color: string, lightBg: string) => void;
  events: CalendarEvent[];
  tasks: TaskItem[];
  isTasksOpen: boolean;
  onToggleTasks: () => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDate,
  onSelectDate,
  onToday,
  categories,
  onToggleCategory,
  onAddCategory,
  events,
  tasks,
  isTasksOpen,
  onToggleTasks,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#F5F5F7] border-r border-[#E5E5EA] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-13 px-4 flex items-center justify-between border-b border-[#E5E5EA]/70">
          <div className="flex items-center gap-2.5">
            <DayliLogo size={26} />
            <span className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
              Dayli
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-[#86868B] hover:text-[#1D1D1F] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Today Quick Jump Card */}
          <button
            onClick={() => {
              onToday();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/80 hover:bg-white border border-[#E5E5EA] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-left transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center font-semibold text-xs group-hover:bg-[#0A84FF] group-hover:text-white transition-colors">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F]">
                  Jump to Today
                </p>
                <p className="text-[11px] text-[#86868B]">
                  {format(currentDate, 'EEEE, MMM d')}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-[#0A84FF] group-hover:translate-x-0.5 transition-transform">
              Today
            </span>
          </button>

          {/* Mini Calendar Widget */}
          <div className="p-2.5 bg-white rounded-lg border border-[#E5E5EA] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <MiniCalendar
              currentDate={currentDate}
              onSelectDate={(d) => {
                onSelectDate(d);
                if (isOpenMobile) onCloseMobile();
              }}
              events={events}
            />
          </div>

          {/* Tasks Drawer Toggle Shortcut */}
          <div>
            <button
              onClick={() => {
                onToggleTasks();
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isTasksOpen
                  ? 'bg-white border border-[#E5E5EA] text-[#0A84FF] shadow-xs'
                  : 'text-[#1D1D1F] hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#0A84FF]" />
                <span>Tasks & Reminders</span>
              </div>
              {pendingTasksCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0A84FF] text-white">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          </div>

          {/* My Calendars Section */}
          <div className="pt-1">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                My Calendars
              </span>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="p-1 rounded text-[#86868B] hover:text-[#0A84FF] hover:bg-white transition-colors"
                title="Add new calendar"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {categories.map((category) => {
                const categoryEventCount = events.filter(
                  (e) => e.categoryId === category.id
                ).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => onToggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/70 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox circle */}
                      <div
                        className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-all ${
                          category.enabled
                            ? 'border-transparent text-white'
                            : 'border-[#86868B]/40 bg-transparent'
                        }`}
                        style={{
                          backgroundColor: category.enabled
                            ? category.color
                            : 'transparent',
                        }}
                      >
                        {category.enabled && (
                          <svg
                            className="w-2.5 h-2.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          category.enabled
                            ? 'text-[#1D1D1F] font-medium'
                            : 'text-[#86868B] line-through decoration-transparent'
                        }`}
                      >
                        {category.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-[#86868B] opacity-70 group-hover:opacity-100 tabular-nums">
                      {categoryEventCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Settings & Info */}
        <div className="p-3 border-t border-[#E5E5EA]">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Data</span>
          </button>
        </div>

        {/* Add Category Dialog */}
        <AddCategoryModal
          isOpen={isAddCategoryOpen}
          onClose={() => setIsAddCategoryOpen(false)}
          onAddCategory={onAddCategory}
        />
      </aside>
    </>
  );
};
