import { useSyncExternalStore } from 'react';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type WeekStartsOn = 0 | 1; // 0 = Sunday, 1 = Monday
export type ClockFormat = '12h' | '24h';
export type ThemePreference = 'light' | 'system' | 'dark';

export interface HolidayCountry {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_HOLIDAY_COUNTRIES: HolidayCountry[] = [
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
];

export interface UserSettings {
  theme: ThemePreference;
  timeZone: string;
  dateFormat: DateFormat;
  weekStartsOn: WeekStartsOn;
  clockFormat: ClockFormat;
  holidayCountry: string; // e.g. 'PH', 'US'
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

export function detectCountryFromTimezone(timeZone: string): string {
  if (!timeZone) return 'PH';
  if (timeZone.includes('Manila')) return 'PH';
  if (timeZone.startsWith('America/')) return 'US';
  if (timeZone.includes('London')) return 'GB';
  if (timeZone.includes('Toronto') || timeZone.includes('Vancouver') || timeZone.includes('Montreal')) return 'CA';
  if (timeZone.startsWith('Australia/')) return 'AU';
  if (timeZone.includes('Singapore')) return 'SG';
  if (timeZone.includes('Tokyo')) return 'JP';
  if (timeZone.includes('Kolkata')) return 'IN';
  if (timeZone.includes('Berlin')) return 'DE';
  if (timeZone.includes('Paris')) return 'FR';
  if (timeZone.includes('Auckland')) return 'NZ';
  if (timeZone.includes('Seoul')) return 'KR';
  if (timeZone.includes('Sao_Paulo')) return 'BR';
  return 'PH'; // Default to Philippines
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  timeZone: 'UTC', // Overwritten on client mount
  dateFormat: 'MM/DD/YYYY',
  weekStartsOn: 0,
  clockFormat: '12h',
  holidayCountry: 'PH',
};

let cachedSettings: UserSettings = {
  ...DEFAULT_SETTINGS,
  timeZone: typeof window !== 'undefined' ? getDefaultTimeZone() : 'UTC',
  holidayCountry: typeof window !== 'undefined' ? detectCountryFromTimezone(getDefaultTimeZone()) : 'PH',
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
        const detectedTz = getDefaultTimeZone();
        const detectedCountry = detectCountryFromTimezone(detectedTz);

        if (stored) {
          const parsed = JSON.parse(stored);
          cachedSettings = {
            ...DEFAULT_SETTINGS,
            timeZone: detectedTz,
            holidayCountry: detectedCountry,
            ...parsed,
          };
        } else {
          cachedSettings = {
            ...DEFAULT_SETTINGS,
            timeZone: detectedTz,
            holidayCountry: detectedCountry,
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
    const tz = getDefaultTimeZone();
    const fresh: UserSettings = {
      ...DEFAULT_SETTINGS,
      timeZone: tz,
      holidayCountry: detectCountryFromTimezone(tz),
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
