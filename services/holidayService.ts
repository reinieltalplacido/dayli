import { CalendarEvent } from '@/types/calendar';

export interface RawHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Built-in offline fallback data for instant rendering without network lag
const PREBAKED_HOLIDAYS_PH_2026: RawHoliday[] = [
  { date: '2026-01-01', localName: 'Bagong Taon', name: "New Year's Day", countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-01-02', localName: 'Special non-working holiday', name: 'Special non-working day', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-02-17', localName: 'Bagong Taong Tsino', name: 'Chinese New Year', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-02-25', localName: 'Araw ng Rebolusyon ng EDSA', name: 'People Power Anniversary', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Observance'] },
  { date: '2026-03-20', localName: 'Eidul-Fitr', name: 'Eidul-Fitr', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-04-02', localName: 'Huwebes Santo', name: 'Maundy Thursday', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-04-03', localName: 'Biyernes Santo', name: 'Good Friday', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-04-04', localName: 'Sabado de Gloria', name: 'Black Saturday', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-04-09', localName: 'Araw ng Kagitingan', name: 'Day of Valor', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-05-01', localName: 'Araw ng Manggagawa', name: 'Labor Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-05-27', localName: 'Eid al-Adha', name: 'Eid al-Adha', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-06-12', localName: 'Araw ng Kalayaan', name: 'Independence Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-08-21', localName: 'Araw ng Ninoy Aquino', name: 'Ninoy Aquino Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-08-31', localName: 'Araw ng mga Bayani', name: 'National Heroes Day', countryCode: 'PH', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-11-01', localName: 'Araw ng mga Patay', name: "All Saints' Day", countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-11-02', localName: 'Araw ng mga Kaluluwa', name: "All Souls' Day", countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-11-30', localName: 'Araw ni Bonifacio', name: 'Bonifacio Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-08', localName: 'Kapistahan ng Immaculada Concepcion', name: 'Feast of the Immaculate Conception', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-24', localName: 'Bisperas ng Pasko', name: 'Christmas Eve', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-25', localName: 'Araw ng Pasko', name: 'Christmas Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-30', localName: 'Araw ni Rizal', name: 'Rizal Day', countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-31', localName: 'Huling Araw ng Taon', name: "New Year's Eve", countryCode: 'PH', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
];

const PREBAKED_HOLIDAYS_US_2026: RawHoliday[] = [
  { date: '2026-01-01', localName: "New Year's Day", name: "New Year's Day", countryCode: 'US', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-01-19', localName: 'Martin Luther King, Jr. Day', name: 'Martin Luther King, Jr. Day', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-02-16', localName: "Washington's Birthday", name: "Presidents' Day", countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-05-25', localName: 'Memorial Day', name: 'Memorial Day', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-06-19', localName: 'Juneteenth National Independence Day', name: 'Juneteenth', countryCode: 'US', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-07-03', localName: 'Independence Day (Observed)', name: 'Independence Day (Observed)', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-07-04', localName: 'Independence Day', name: 'Independence Day', countryCode: 'US', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-09-07', localName: 'Labor Day', name: 'Labor Day', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-10-12', localName: 'Columbus Day', name: 'Columbus Day', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-11-11', localName: 'Veterans Day', name: 'Veterans Day', countryCode: 'US', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-11-26', localName: 'Thanksgiving Day', name: 'Thanksgiving Day', countryCode: 'US', fixed: false, global: true, counties: null, launchYear: null, types: ['Public'] },
  { date: '2026-12-25', localName: 'Christmas Day', name: 'Christmas Day', countryCode: 'US', fixed: true, global: true, counties: null, launchYear: null, types: ['Public'] },
];

function holidayToEvent(holiday: RawHoliday): CalendarEvent {
  const isDiffName = holiday.localName && holiday.localName !== holiday.name;
  const displayTitle = isDiffName ? `${holiday.name} (${holiday.localName})` : holiday.name;

  return {
    id: `holiday-${holiday.countryCode}-${holiday.date}-${holiday.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    title: holiday.name,
    startDate: holiday.date,
    endDate: holiday.date,
    startTime: '00:00',
    endTime: '23:59',
    isAllDay: true,
    categoryId: 'holidays',
    location: holiday.countryCode,
    description: `Official Public Holiday in ${holiday.countryCode}${isDiffName ? ` • ${holiday.localName}` : ''}`,
    isHoliday: true,
    isReadOnly: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

let cachedEvents: CalendarEvent[] = [];
let loadedCountry = '';
let loadedYears = new Set<number>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const holidayService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): CalendarEvent[] {
    if (cachedEvents.length === 0 && typeof window !== 'undefined') {
      // Initialize with prebaked 2026 data
      const prebaked = PREBAKED_HOLIDAYS_PH_2026.map(holidayToEvent);
      cachedEvents = prebaked;
    }
    return cachedEvents;
  },

  getServerSnapshot(): CalendarEvent[] {
    return PREBAKED_HOLIDAYS_PH_2026.map(holidayToEvent);
  },

  /**
   * Loads holidays for the given country and years (e.g. current year, year - 1, year + 1).
   * Checks localStorage cache first; falls back to Nager.Date API; falls back to prebaked data.
   */
  async loadHolidays(countryCode: string = 'PH', years: number[] = [2025, 2026, 2027]): Promise<CalendarEvent[]> {
    const code = countryCode.toUpperCase();
    const needsFullReload = loadedCountry !== code;

    if (needsFullReload) {
      loadedCountry = code;
      loadedYears.clear();
      cachedEvents = [];
    }

    const missingYears = years.filter((y) => !loadedYears.has(y));
    if (missingYears.length === 0 && cachedEvents.length > 0) {
      return cachedEvents;
    }

    const results: CalendarEvent[] = [...cachedEvents];

    for (const year of missingYears) {
      const storageKey = `dayli_holidays_${code}_${year}`;
      let yearHolidays: RawHoliday[] | null = null;

      // 1. Try local storage cache
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            yearHolidays = JSON.parse(cached);
          }
        } catch {
          // ignore cache read error
        }
      }

      // 2. Fetch from Nager.Date public API
      if (!yearHolidays) {
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`);
          if (res.ok) {
            const data: RawHoliday[] = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              yearHolidays = data;
              if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify(data));
              }
            }
          }
        } catch {
          // Network failure or offline
        }
      }

      // 3. Fallback to pre-baked data if network fails
      if (!yearHolidays && year === 2026) {
        if (code === 'PH') {
          yearHolidays = PREBAKED_HOLIDAYS_PH_2026;
        } else if (code === 'US') {
          yearHolidays = PREBAKED_HOLIDAYS_US_2026;
        }
      }

      if (yearHolidays && yearHolidays.length > 0) {
        const eventsForYear = yearHolidays.map(holidayToEvent);
        // Avoid duplicate IDs
        const existingIds = new Set(results.map((e) => e.id));
        eventsForYear.forEach((evt) => {
          if (!existingIds.has(evt.id)) {
            results.push(evt);
            existingIds.add(evt.id);
          }
        });
      }

      loadedYears.add(year);
    }

    cachedEvents = results;
    notify();
    return cachedEvents;
  },
};
