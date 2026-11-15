import { CalendarEvent } from '@/types/calendar';
import { STORAGE_KEYS } from '@/lib/constants';

const EMPTY_EVENTS: CalendarEvent[] = [];
let cachedEvents: CalendarEvent[] | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export const eventService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): CalendarEvent[] {
    if (cachedEvents === null) {
      cachedEvents = eventService.getAll();
    }
    return cachedEvents;
  },

  getServerSnapshot(): CalendarEvent[] {
    return EMPTY_EVENTS;
  },

  setEvents(events: CalendarEvent[]): void {
    cachedEvents = events;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }
    notifyListeners();
  },

  getAll(): CalendarEvent[] {
    if (typeof window === 'undefined') return EMPTY_EVENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!stored) {
        cachedEvents = EMPTY_EVENTS;
        return EMPTY_EVENTS;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        cachedEvents = parsed;
        return parsed;
      }
      cachedEvents = EMPTY_EVENTS;
      return EMPTY_EVENTS;
    } catch (e) {
      console.error('Failed to load events from storage:', e);
      cachedEvents = EMPTY_EVENTS;
      return EMPTY_EVENTS;
    }
  },

  getById(id: string): CalendarEvent | null {
    const events = this.getSnapshot();
    return events.find((evt) => evt.id === id) || null;
  },

  async create(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const tempId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEvent: CalendarEvent = {
      ...eventData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const events = this.getAll();
    const updated = [...events, newEvent];
    cachedEvents = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
    }
    notifyListeners();

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        const persisted: CalendarEvent = await res.json();
        const current = this.getAll().map((e) => (e.id === tempId ? persisted : e));
        cachedEvents = current;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(current));
        }
        notifyListeners();
        return persisted;
      }
    } catch {
      // Offline / guest fallback preserves local change
    }

    return newEvent;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const events = this.getAll();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Event with id ${id} not found.`);
    }

    const updatedEvent: CalendarEvent = {
      ...events[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    const nextEvents = [...events];
    nextEvents[index] = updatedEvent;
    cachedEvents = nextEvents;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(nextEvents));
    }
    notifyListeners();

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const persisted: CalendarEvent = await res.json();
        const current = this.getAll().map((e) => (e.id === id ? persisted : e));
        cachedEvents = current;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(current));
        }
        notifyListeners();
        return persisted;
      }
    } catch {
      // Offline / guest fallback preserves local change
    }

    return updatedEvent;
  },

  async delete(id: string): Promise<boolean> {
    const events = this.getAll();
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length !== events.length) {
      cachedEvents = filtered;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));
      }
      notifyListeners();

      try {
        await fetch(`/api/events/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch {
        // Offline / guest fallback preserves local change
      }
      return true;
    }
    return false;
  },

  resetToSample(): CalendarEvent[] {
    cachedEvents = EMPTY_EVENTS;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
    notifyListeners();
    return EMPTY_EVENTS;
  },

  clearAll(): void {
    cachedEvents = EMPTY_EVENTS;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
    notifyListeners();
  },

  importMultiple(
    newEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]
  ): number {
    if (!newEvents.length) return 0;

    const current = this.getSnapshot();
    const created: CalendarEvent[] = newEvents.map((item, idx) => ({
      ...item,
      id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const combined = [...current, ...created];
    cachedEvents = combined;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(combined));
    }
    notifyListeners();

    // Asynchronously sync new events to backend if online/authenticated
    Promise.allSettled(
      created.map((evt) =>
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt),
        })
      )
    ).catch(() => {
      // offline fallback
    });

    return created.length;
  },

  exportJSON(): string {
    const events = this.getSnapshot();
    return JSON.stringify(events, null, 2);
  },

  importJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        cachedEvents = parsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(parsed));
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
