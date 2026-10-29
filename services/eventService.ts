import { CalendarEvent } from '@/types/calendar';
import { STORAGE_KEYS } from '@/lib/constants';
import { addDays, format, subDays } from 'date-fns';

function generateSampleEvents(): CalendarEvent[] {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
  const inTwoDaysStr = format(addDays(today, 2), 'yyyy-MM-dd');
  const inThreeDaysStr = format(addDays(today, 3), 'yyyy-MM-dd');
  const inFourDaysStr = format(addDays(today, 4), 'yyyy-MM-dd');

  return [
    {
      id: 'evt-1',
      title: 'Morning Yoga & Meditation',
      description: 'Focus session and light stretching at the fitness center.',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '07:30',
      endTime: '08:30',
      isAllDay: false,
      categoryId: 'personal',
      location: 'Studio 4B',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-2',
      title: 'CS 401: Distributed Systems Lecture',
      description: 'Discussion on Raft consensus algorithm and Byzantine fault tolerance.',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '10:00',
      endTime: '11:30',
      isAllDay: false,
      categoryId: 'school',
      location: 'Science Hall 102',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-3',
      title: 'Design Review: Dayli macOS Interface',
      description: 'Finalize navigation tokens, typography hierarchy, and week view layout.',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '13:00',
      endTime: '14:00',
      isAllDay: false,
      categoryId: 'meetings',
      location: 'Conference Room Alpha / Google Meet',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-4',
      title: 'Project Milestone 1 Delivery',
      description: 'Submit repository code, test results, and release notes before EOD.',
      startDate: todayStr,
      endDate: todayStr,
      startTime: '17:00',
      endTime: '18:00',
      isAllDay: false,
      categoryId: 'deadlines',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-5',
      title: 'Quarterly Planning Session',
      description: 'All-day workshop reviewing product roadmap and quarterly milestones.',
      startDate: tomorrowStr,
      endDate: tomorrowStr,
      startTime: '09:00',
      endTime: '17:00',
      isAllDay: true,
      categoryId: 'meetings',
      location: 'Main Auditorium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-6',
      title: 'Flight check-in & Travel prep',
      description: 'Ensure passport, boarding documents, and hotel confirmations are ready.',
      startDate: inTwoDaysStr,
      endDate: inTwoDaysStr,
      startTime: '08:00',
      endTime: '09:00',
      isAllDay: false,
      categoryId: 'important',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-7',
      title: 'Algorithm Study Group',
      description: 'Dynamic programming problems and graph traversal patterns.',
      startDate: inThreeDaysStr,
      endDate: inThreeDaysStr,
      startTime: '14:30',
      endTime: '16:00',
      isAllDay: false,
      categoryId: 'school',
      location: 'Campus Library 3rd Floor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-8',
      title: 'Coffee with Sarah',
      description: 'Catch up on weekend plans and design systems discussion.',
      startDate: yesterdayStr,
      endDate: yesterdayStr,
      startTime: '11:00',
      endTime: '12:00',
      isAllDay: false,
      categoryId: 'personal',
      location: 'Artisan Roastery',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'evt-9',
      title: 'Annual Health Checkup',
      description: 'Comprehensive wellness review and vitals test.',
      startDate: inFourDaysStr,
      endDate: inFourDaysStr,
      startTime: '09:00',
      endTime: '10:30',
      isAllDay: false,
      categoryId: 'important',
      location: 'City Health Clinic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

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
        const initial = generateSampleEvents();
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initial));
        cachedEvents = initial;
        return initial;
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
    const samples = generateSampleEvents();
    cachedEvents = samples;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(samples));
    }
    notifyListeners();
    return samples;
  },

  clearAll(): void {
    cachedEvents = EMPTY_EVENTS;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
    notifyListeners();
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
