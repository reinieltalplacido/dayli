import { useSyncExternalStore } from 'react';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type WeekStartsOn = 0 | 1; // 0 = Sunday, 1 = Monday
export type ClockFormat = '12h' | '24h';
export type ThemePreference = 'light' | 'system' | 'dark';

export interface UserSettings {
  theme: ThemePreference;
  timeZone: string;
  dateFormat: DateFormat;
  weekStartsOn: WeekStartsOn;
  clockFormat: ClockFormat;
}

const STORAGE_KEY = 'dayli_settings_v1';

function getDefaultTimeZone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }
  return 'UTC';
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  timeZone: 'UTC', // Overwritten on client mount
  dateFormat: 'MM/DD/YYYY',
  weekStartsOn: 0,
  clockFormat: '12h',
};

let cachedSettings: UserSettings = {
  ...DEFAULT_SETTINGS,
  timeZone: typeof window !== 'undefined' ? getDefaultTimeZone() : 'UTC',
};

let hasInitialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const settingsService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): UserSettings {
    if (!hasInitialized && typeof window !== 'undefined') {
      hasInitialized = true;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedSettings = {
            ...DEFAULT_SETTINGS,
            timeZone: getDefaultTimeZone(),
            ...parsed,
          };
        } else {
          cachedSettings = {
            ...DEFAULT_SETTINGS,
            timeZone: getDefaultTimeZone(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSettings));
        }
      } catch (err) {
        console.error('Failed to load settings from storage', err);
      }
    }
    return cachedSettings;
  },

  getServerSnapshot(): UserSettings {
    return DEFAULT_SETTINGS;
  },

  getSettings(): UserSettings {
    return this.getSnapshot();
  },

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getSnapshot();
    const updated: UserSettings = {
      ...current,
      ...updates,
    };
    cachedSettings = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save settings to storage', err);
      }
    }
    notify();
    return updated;
  },

  resetDefaults(): UserSettings {
    const fresh: UserSettings = {
      ...DEFAULT_SETTINGS,
      timeZone: getDefaultTimeZone(),
    };
    cachedSettings = fresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    notify();
    return fresh;
  },
};

export function useSettings(): UserSettings {
  return useSyncExternalStore(
    settingsService.subscribe,
    settingsService.getSnapshot,
    settingsService.getServerSnapshot
  );
}

