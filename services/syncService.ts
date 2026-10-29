import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';
import { eventService } from './eventService';
import { taskService } from './taskService';
import { categoryService } from './categoryService';
import { authService } from './authService';

let isSyncing = false;
let syncError: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const syncService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): { isSyncing: boolean; syncError: string | null } {
    return { isSyncing, syncError };
  },

  getServerSnapshot(): { isSyncing: boolean; syncError: string | null } {
    return { isSyncing: false, syncError: null };
  },

  async syncFromServer(): Promise<{
    calendars: CalendarCategory[];
    events: CalendarEvent[];
    tasks: TaskItem[];
  } | null> {
    const user = authService.getUser();
    if (!user) return null;

    isSyncing = true;
    syncError = null;
    notify();

    try {
      const res = await fetch('/api/sync');
      if (!res.ok) {
        if (res.status === 401) {
          // session expired or not authenticated
          return null;
        }
        throw new Error(`Sync error: ${res.statusText}`);
      }

      const data = await res.json();
      if (Array.isArray(data.calendars) && data.calendars.length > 0) {
        categoryService.setCategories(data.calendars);
      }
      if (Array.isArray(data.events)) {
        eventService.setEvents(data.events);
      }
      if (Array.isArray(data.tasks)) {
        taskService.setTasks(data.tasks);
      }
      return data;
    } catch (err: unknown) {
      console.warn('Could not sync data from server:', err);
      syncError = err instanceof Error ? err.message : 'Sync failed';
      return null;
    } finally {
      isSyncing = false;
      notify();
    }
  },

  async migrateLocalData(): Promise<{
    success: boolean;
    migratedEventsCount: number;
    migratedTasksCount: number;
  } | null> {
    const user = authService.getUser();
    if (!user) return null;

    const migrationKey = `dayli_migrated_v1_${user.id}`;
    if (typeof window !== 'undefined' && localStorage.getItem(migrationKey)) {
      return null;
    }

    const localEvents = eventService.getAll();
    const localTasks = taskService.getAll();
    const localCategories = categoryService.getAll();

    // If nothing to migrate
    if (localEvents.length === 0 && localTasks.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(migrationKey, 'true');
      }
      return null;
    }

    isSyncing = true;
    notify();

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: localEvents,
          tasks: localTasks,
          categories: localCategories,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(migrationKey, 'true');
        }
        if (Array.isArray(data.calendars)) {
          categoryService.setCategories(data.calendars);
        }
        if (Array.isArray(data.events)) {
          eventService.setEvents(data.events);
        }
        if (Array.isArray(data.tasks)) {
          taskService.setTasks(data.tasks);
        }
      }
      return data;
    } catch (err) {
      console.error('Migration failed:', err);
      return null;
    } finally {
      isSyncing = false;
      notify();
    }
  },

  async forceMigration(): Promise<boolean> {
    const user = authService.getUser();
    if (!user) return false;

    const localEvents = eventService.getAll();
    const localTasks = taskService.getAll();
    const localCategories = categoryService.getAll();

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: localEvents,
          tasks: localTasks,
          categories: localCategories,
        }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.calendars)) categoryService.setCategories(data.calendars);
        if (Array.isArray(data.events)) eventService.setEvents(data.events);
        if (Array.isArray(data.tasks)) taskService.setTasks(data.tasks);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
