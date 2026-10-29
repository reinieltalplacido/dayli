/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  CheckSquare,
  Settings,
  CalendarDays,
  X,
  Cloud,
  LogOut,
  User,
  Moon,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';
import { UserProfile } from '@/types/auth';
import { MiniCalendar } from '../calendar/MiniCalendar';
import { DayliLogo } from '../ui/DayliLogo';
import { AddCategoryModal } from '../categories/AddCategoryModal';
import { SettingsTab } from '../settings/SettingsModal';
import { Clock, Shield, Laptop } from 'lucide-react';

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
  onOpenSettings: (tab?: SettingsTab) => void;
  weekStartsOn?: 0 | 1;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  user: UserProfile | null;
  isSyncing?: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
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
  weekStartsOn = 0,
  isOpenMobile,
  onCloseMobile,
  user,
  isSyncing = false,
  onOpenAuth,
  onSignOut,
}) => {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
              weekStartsOn={weekStartsOn}
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

        {/* Sidebar Footer: Account Sync & Integrated Settings */}
        <div className="p-3 border-t border-[#E5E5EA] space-y-2 bg-[#F5F5F7]">
          {/* User Account Capsule */}
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu((p) => !p)}
                className={`w-full flex items-center justify-between p-2 rounded-lg bg-white border text-left transition-all shadow-xs group ${
                  showUserMenu
                    ? 'border-[#0A84FF] ring-2 ring-[#0A84FF]/10'
                    : 'border-[#E5E5EA] hover:border-[#0A84FF]/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden ring-1 ring-black/5">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSyncing ? 'bg-[#0A84FF] animate-pulse' : 'bg-[#34C759]'
                        }`}
                      />
                      <span className="text-[10px] text-[#86868B] leading-none">
                        {isSyncing ? 'Syncing...' : 'Cloud Synced'}
                      </span>
                    </div>
                  </div>
                </div>
                <User className="w-3.5 h-3.5 text-[#86868B] group-hover:text-[#1D1D1F] shrink-0" />
              </button>

              {/* Integrated Account & Settings Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#1D1D1F]">
                  {/* Account Header */}
                  <div className="px-3 py-2 border-b border-[#E5E5EA]/70 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden ring-1 ring-black/5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#86868B] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Add Account Option */}
                  <div className="py-1 border-b border-[#E5E5EA]/70">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#86868B]" />
                      <span>Add account</span>
                    </button>
                  </div>

                  {/* Settings & Preferences Group */}
                  <div className="py-1 border-b border-[#E5E5EA]/70 space-y-0.5">
                    {/* Appearance */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('general');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-[#86868B]" />
                        <div>
                          <p className="text-xs font-medium text-[#1D1D1F] leading-none">
                            Appearance
                          </p>
                          <p className="text-[10px] text-[#86868B] leading-none mt-1">
                            Light
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Time & Regional */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('regional');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#86868B]" />
                        <div>
                          <p className="text-xs font-medium text-[#1D1D1F] leading-none">
                            Time & Regional
                          </p>
                          <p className="text-[10px] text-[#86868B] leading-none mt-1">
                            Time zone & clock
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Privacy & Data */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('privacy');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[#86868B]" />
                        <div>
                          <p className="text-xs font-medium text-[#1D1D1F] leading-none">
                            Privacy & Data
                          </p>
                          <p className="text-[10px] text-[#86868B] leading-none mt-1">
                            Export & Accounts
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Connected Devices */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('devices');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Laptop className="w-3.5 h-3.5 text-[#86868B]" />
                        <div>
                          <p className="text-xs font-medium text-[#1D1D1F] leading-none">
                            Connected Devices
                          </p>
                          <p className="text-[10px] text-[#86868B] leading-none mt-1">
                            Active sessions
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Help & Shortcuts */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('shortcuts');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-[#86868B]" />
                        <p className="text-xs font-medium text-[#1D1D1F]">
                          Help & Shortcuts
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#86868B] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-white/80 hover:bg-white border border-[#E5E5EA] hover:border-[#0A84FF]/40 text-left transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center shrink-0 group-hover:bg-[#0A84FF] group-hover:text-white transition-colors">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1D1D1F] leading-tight">
                    Sign in to Sync
                  </p>
                  <p className="text-[10px] text-[#86868B] leading-none mt-0.5">
                    Local Storage
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-[#0A84FF] group-hover:translate-x-0.5 transition-transform">
                Sign In
              </span>
            </button>
          )}

          {/* Quick Settings Shortcut (Available in all states) */}
          <button
            onClick={() => onOpenSettings('general')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Settings</span>
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
