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
import { eventService } from '@/services/eventService';
import { taskService } from '@/services/taskService';
import { categoryService } from '@/services/categoryService';
import { authService } from '@/services/authService';
import { authClient } from '@/lib/auth-client';
import { syncService } from '@/services/syncService';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeaderToolbar } from '@/components/layout/HeaderToolbar';
import { CalendarWorkspace } from '@/components/calendar/CalendarWorkspace';
import { TasksPanel } from '@/components/tasks/TasksPanel';
import { EventModal } from '@/components/events/EventModal';
import { SearchDialog } from '@/components/search/SearchDialog';
import { SettingsModal, SettingsTab } from '@/components/settings/SettingsModal';
import { useSettings } from '@/services/settingsService';
import { AuthModal } from '@/components/auth/AuthModal';
import { ToastContainer } from '@/components/ui/Toast';

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
      } else if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsEventModalOpen(false);
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToday, handleOpenCreateEvent]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F7] text-[#1D1D1F]">
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
        events={events}
        tasks={tasks}
        isTasksOpen={isTasksOpen}
        onToggleTasks={() => setIsTasksOpen((prev) => !prev)}
        onOpenSettings={handleOpenSettings}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
        user={user}
        isSyncing={syncState.isSyncing}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        weekStartsOn={settings.weekStartsOn}
      />

      {/* Main Area: Top Toolbar + Calendar Workspace + Tasks Panel */}
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
            events={events}
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

      {/* Quick Search Dialog */}
      {isSearchOpen && (
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          events={events}
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
        />
      )}
    </div>
  );
}
