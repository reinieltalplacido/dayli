'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import {
  CalendarEvent,
  CalendarView,
  ToastNotification,
} from '@/types/calendar';
import { Calendar, CalendarDays, Columns, CheckSquare, Plus } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { taskService } from '@/services/taskService';
import { categoryService } from '@/services/categoryService';
import { authService } from '@/services/authService';
import { authClient } from '@/lib/auth-client';
import { syncService } from '@/services/syncService';
import { holidayService } from '@/services/holidayService';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeaderToolbar } from '@/components/layout/HeaderToolbar';
import { CalendarWorkspace } from '@/components/calendar/CalendarWorkspace';
import { TasksPanel } from '@/components/tasks/TasksPanel';
import { EventModal } from '@/components/events/EventModal';
import { SmartScheduleModal } from '@/components/ai/SmartScheduleModal';
import { SearchDialog } from '@/components/search/SearchDialog';
import { SettingsModal, SettingsTab } from '@/components/settings/SettingsModal';
import { useSettings } from '@/services/settingsService';
import { AuthModal } from '@/components/auth/AuthModal';
import { ToastContainer } from '@/components/ui/Toast';
import { DayliChatbot } from '@/components/ai/DayliChatbot';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { startDayliTour } from '@/services/tourService';

export function DayliCalendarApp() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [view, setView] = useState<CalendarView>('month');

  // Reactive stores using useSyncExternalStore
  const events = useSyncExternalStore(
    eventService.subscribe,
    eventService.getSnapshot,
    eventService.getServerSnapshot
  );

  const tasks = useSyncExternalStore(
    taskService.subscribe,
    taskService.getSnapshot,
    taskService.getServerSnapshot
  );

  const categories = useSyncExternalStore(
    categoryService.subscribe,
    categoryService.getSnapshot,
    categoryService.getServerSnapshot
  );

  const user = useSyncExternalStore(
    authService.subscribe,
    authService.getSnapshot,
    authService.getServerSnapshot
  );

  const settings = useSettings();

  const syncState = useSyncExternalStore(
    syncService.subscribe,
    syncService.getSnapshot,
    syncService.getServerSnapshot
  );

  const holidays = useSyncExternalStore(
    holidayService.subscribe,
    holidayService.getSnapshot,
    holidayService.getServerSnapshot
  );

  // Load official public holidays for current, previous, and next year for seamless navigation
  useEffect(() => {
    const year = currentDate.getFullYear();
    const country = settings.holidayCountry || 'PH';
    holidayService.loadHolidays(country, [year - 1, year, year + 1]);
  }, [currentDate, settings.holidayCountry]);

  // Combine user events with national public holidays when the holidays category is active
  const allEvents = React.useMemo(() => {
    const isHolidaysEnabled = categories.some((c) => c.id === 'holidays' && c.enabled);
    return isHolidaysEnabled ? [...events, ...holidays] : events;
  }, [events, holidays, categories]);

  // Only events from categories checked/enabled in the sidebar
  const enabledCategoryIds = React.useMemo(() => {
    return new Set(categories.filter((c) => c.enabled).map((c) => c.id));
  }, [categories]);

  const visibleEvents = React.useMemo(() => {
    return allEvents.filter((evt) => enabledCategoryIds.has(evt.categoryId));
  }, [allEvents, enabledCategoryIds]);

  const { data: authSession } = authClient.useSession();

  useEffect(() => {
    if (authSession?.user?.email) {
      const current = authService.getUser();
      const userImage = authSession.user.image || undefined;
      if (
        !current ||
        current.email !== authSession.user.email ||
        current.avatarUrl !== userImage
      ) {
        authService.signIn(
          authSession.user.email,
          authSession.user.name || undefined,
          userImage ? 'google' : 'email',
          userImage
        );
      }
    }
  }, [authSession]);

  // UI Panels state
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<Date | undefined>(undefined);
  const [modalDefaultHour, setModalDefaultHour] = useState<number | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSmartScheduleOpen, setIsSmartScheduleOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast feedback helper
  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync and observe dark mode theme setting
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Sync data with backend when user is authenticated
  useEffect(() => {
    if (user) {
      syncService.syncFromServer();
      syncService.migrateLocalData().then((migrated) => {
        if (migrated && (migrated.migratedEventsCount > 0 || migrated.migratedTasksCount > 0)) {
          addToast(
            `Transferred ${migrated.migratedEventsCount + migrated.migratedTasksCount} items from local storage to your cloud account!`,
            'success'
          );
        }
      });
    }
  }, [user, addToast]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 1));
    }
  }, [view]);

  const handleNext = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  }, [view]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleVisibleMonthChange = useCallback((date: Date) => {
    setCurrentDate((prev) => {
      if (prev.getFullYear() === date.getFullYear() && prev.getMonth() === date.getMonth()) {
        return prev;
      }
      return date;
    });
  }, []);

  // Event modal openers
  const handleOpenCreateEvent = useCallback(() => {
    setSelectedEvent(null);
    setModalDefaultDate(currentDate);
    setModalDefaultHour(undefined);
    setIsEventModalOpen(true);
  }, [currentDate]);

  const handleCreateOnDate = useCallback((date: Date) => {
    setSelectedEvent(null);
    setModalDefaultDate(date);
    setModalDefaultHour(undefined);
    setIsEventModalOpen(true);
  }, []);

  const handleCreateOnDateTime = useCallback((date: Date, hour: number) => {
    setSelectedEvent(null);
    setModalDefaultDate(date);
    setModalDefaultHour(hour);
    setIsEventModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalDefaultDate(undefined);
    setModalDefaultHour(undefined);
    setIsEventModalOpen(true);
  }, []);

  // Event mutations
  const handleSaveEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const created = await eventService.create(eventData);

        // If the event's category was disabled/unchecked in the sidebar, auto-enable it so the user sees it immediately
        if (eventData.categoryId) {
          const allCats = categoryService.getAll();
          const targetCat = allCats.find((c) => c.id === eventData.categoryId);
          if (targetCat && !targetCat.enabled) {
            categoryService.toggle(targetCat.id);
          }
        }

        addToast(`Event "${created.title}" created`, 'success');
      } catch {
        addToast('Failed to create event', 'error');
      }
    },
    [addToast]
  );

  const handleUpdateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      try {
        const updated = await eventService.update(id, updates);
        addToast(`Updated "${updated.title}"`, 'success');
      } catch {
        addToast('Failed to update event', 'error');
      }
    },
    [addToast]
  );

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      try {
        const target = events.find((e) => e.id === id);
        const success = await eventService.delete(id);
        if (success) {
          addToast(target ? `Deleted "${target.title}"` : 'Event deleted', 'info');
        }
      } catch {
        addToast('Failed to delete event', 'error');
      }
    },
    [events, addToast]
  );

  // Task mutations
  const handleAddTask = useCallback(
    async (title: string, dueDate?: string, categoryId?: string) => {
      try {
        await taskService.create({
          title,
          completed: false,
          dueDate,
          categoryId,
        });
        addToast(`Task added`, 'success');
      } catch {
        addToast('Failed to add task', 'error');
      }
    },
    [addToast]
  );

  const handleToggleTask = useCallback(async (id: string) => {
    try {
      await taskService.toggle(id);
    } catch {
      // ignore
    }
  }, []);

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        await taskService.delete(id);
        addToast('Task deleted', 'info');
      } catch {
        addToast('Failed to delete task', 'error');
      }
    },
    [addToast]
  );

  // Category mutations
  const handleToggleCategory = useCallback(async (id: string) => {
    await categoryService.toggle(id);
  }, []);

  const handleAddCategory = useCallback(
    async (name: string, color: string, lightBg: string) => {
      try {
        const newCat = await categoryService.create(name, color, lightBg);
        addToast(`Added calendar "${newCat.name}"`, 'success');
      } catch {
        addToast('Failed to add calendar', 'error');
      }
    },
    [addToast]
  );

  // Auth actions
  const handleAuthSuccess = useCallback(
    (email: string, name?: string, provider?: 'google' | 'email') => {
      const loggedUser = authService.signIn(email, name, provider);
      addToast(`Welcome, ${loggedUser.name}! Cloud sync is now active.`, 'success');
    },
    [addToast]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    authService.signOut();
    addToast('Signed out. Local storage mode active.', 'info');
  }, [addToast]);

  const handleOpenSettings = useCallback((tab: SettingsTab = 'general') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);

  const handleClearData = useCallback(() => {
    eventService.clearAll();
    taskService.clearAll();
    addToast('All calendar and task data cleared', 'info');
  }, [addToast]);

  const handleImportEvents = useCallback(
    (newEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      const count = eventService.importMultiple(newEvents);
      addToast(`Successfully imported ${count} events`, 'success');
      return count;
    },
    [addToast]
  );

  const handleImportData = useCallback(
    (jsonStr: string) => {
      const ok = eventService.importJSON(jsonStr);
      if (ok) {
        addToast('Events imported successfully', 'success');
        return true;
      }
      addToast('Failed to import events', 'error');
      return false;
    },
    [addToast]
  );

  // Interactive Guided Tour handler
  const handleStartTour = useCallback(() => {
    setIsTutorialOpen(false);
    setIsSettingsOpen(false);
    setIsSidebarMobileOpen(false);
    setIsSearchOpen(false);
    setIsSmartScheduleOpen(false);
    setIsEventModalOpen(false);
    setTimeout(() => {
      startDayliTour();
    }, 120);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setView('month');
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setView('week');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setView('day');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenCreateEvent();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setIsSmartScheduleOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        handleStartTour();
      } else if (e.key === 'Escape') {
        setIsEventModalOpen(false);
        setIsSmartScheduleOpen(false);
        setIsTutorialOpen(false);
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToday, handleOpenCreateEvent, handleStartTour]);

  return (
    <div className="h-[100dvh] w-screen flex overflow-hidden bg-[#F5F5F7] dark:bg-[#121214] text-[#1D1D1F] dark:text-[#F5F5F7] relative">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar */}
      <Sidebar
        currentDate={currentDate}
        onSelectDate={setCurrentDate}
        onToday={handleToday}
        categories={categories}
        onToggleCategory={handleToggleCategory}
        onAddCategory={handleAddCategory}
        events={allEvents}
        tasks={tasks}
        isTasksOpen={isTasksOpen}
        onToggleTasks={() => setIsTasksOpen((prev) => !prev)}
        onOpenSettings={handleOpenSettings}
        onOpenSmartSchedule={() => setIsSmartScheduleOpen(true)}
        onOpenTutorial={handleStartTour}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
        user={user}
        isSyncing={syncState.isSyncing}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        weekStartsOn={settings.weekStartsOn}
      />

      {/* Main Area: Top Toolbar + Calendar Workspace + Tasks Panel + Mobile Nav */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Toolbar */}
        <HeaderToolbar
          currentDate={currentDate}
          view={view}
          onChangeView={setView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onOpenCreateEvent={handleOpenCreateEvent}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleTasks={() => setIsTasksOpen((prev) => !prev)}
          isTasksOpen={isTasksOpen}
          onToggleMobileMenu={() => setIsSidebarMobileOpen(true)}
        />

        {/* Workspace and Tasks layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <CalendarWorkspace
            currentDate={currentDate}
            view={view}
            events={allEvents}
            categories={categories}
            onSelectEvent={handleSelectEvent}
            onCreateEventOnDate={handleCreateOnDate}
            onCreateEventOnDateTime={handleCreateOnDateTime}
            onVisibleMonthChange={handleVisibleMonthChange}
            weekStartsOn={settings.weekStartsOn}
          />

          {/* Tasks & Reminders Drawer */}
          <TasksPanel
            isOpen={isTasksOpen}
            onClose={() => setIsTasksOpen(false)}
            tasks={tasks}
            categories={categories}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        {/* Mobile Floating Action Button (FAB) for Instant Event Creation */}
        <button
          id="tour-fab-new"
          type="button"
          onClick={handleOpenCreateEvent}
          className="md:hidden fixed right-4 bottom-18 z-40 w-13 h-13 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] active:scale-90 text-white shadow-[0_4px_16px_rgba(10,132,255,0.45)] flex items-center justify-center transition-transform duration-150"
          aria-label="New Event"
        >
          <Plus className="w-6 h-6 stroke-[2.4]" />
        </button>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          id="tour-views-mobile"
          className="md:hidden shrink-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-md border-t border-[#E5E5EA] dark:border-[#28282A] px-2 py-1 flex items-center justify-around z-30 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => {
              setView('day');
              setIsTasksOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] transition-colors ${
              view === 'day' && !isTasksOpen
                ? 'text-[#0A84FF]'
                : 'text-[#86868B] dark:text-[#98989D]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Day</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setView('week');
              setIsTasksOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] transition-colors ${
              view === 'week' && !isTasksOpen
                ? 'text-[#0A84FF]'
                : 'text-[#86868B] dark:text-[#98989D]'
            }`}
          >
            <Columns className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Week</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setView('month');
              setIsTasksOpen(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] transition-colors ${
              view === 'month' && !isTasksOpen
                ? 'text-[#0A84FF]'
                : 'text-[#86868B] dark:text-[#98989D]'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Month</span>
          </button>

          <button
            id="tour-tasks-mobile"
            type="button"
            onClick={() => setIsTasksOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[56px] relative transition-colors ${
              isTasksOpen
                ? 'text-[#0A84FF]'
                : 'text-[#86868B] dark:text-[#98989D]'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5" />
              {tasks.filter((t) => !t.completed).length > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-[#0A84FF] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-0.5">Tasks</span>
          </button>
        </nav>
      </div>

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Event Creation & Edit Modal */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleSaveEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          initialEvent={selectedEvent}
          defaultDate={modalDefaultDate}
          defaultHour={modalDefaultHour}
          categories={categories}
        />
      )}

      {/* Smart AI Scheduling Modal */}
      {isSmartScheduleOpen && (
        <SmartScheduleModal
          isOpen={isSmartScheduleOpen}
          onClose={() => setIsSmartScheduleOpen(false)}
          onEventCreated={handleSaveEvent}
          onOpenDetailedModal={(prefilled) => {
            setSelectedEvent(prefilled as CalendarEvent);
            setIsEventModalOpen(true);
          }}
          categories={categories}
          currentDate={currentDate}
          userTimezone={settings.timeZone}
        />
      )}

      {/* Quick Search Dialog */}
      {isSearchOpen && (
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          events={visibleEvents}
          tasks={tasks}
          categories={categories}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {/* Settings Modal with Tabs */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          events={events}
          onImportEvents={handleImportEvents}
          onImportJSON={handleImportData}
          onClearAllData={handleClearData}
          onSignOut={handleSignOut}
          isUserSignedIn={Boolean(user)}
          initialTab={settingsTab}
          onOpenTutorial={handleStartTour}
        />
      )}

      {/* Interactive Tutorial & Feature Tour Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenSmartSchedule={() => setIsSmartScheduleOpen(true)}
        onStartInteractiveTour={handleStartTour}
      />

      {/* Dayli AI Assistant Floating Chatbot */}
      <DayliChatbot
        events={visibleEvents}
        tasks={tasks}
        categories={categories}
        currentDate={currentDate}
        userTimezone={settings.timeZone}
        onSaveEvent={handleSaveEvent}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
