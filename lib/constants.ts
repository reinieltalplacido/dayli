import { CalendarCategory } from '@/types/calendar';

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#0A84FF',
    lightBg: 'rgba(10, 132, 255, 0.12)',
    isDefault: true,
    enabled: true,
  },
  {
    id: 'school',
    name: 'School',
    color: '#34C759',
    lightBg: 'rgba(52, 199, 89, 0.12)',
    isDefault: true,
    enabled: true,
  },
  {
    id: 'deadlines',
    name: 'Deadlines',
    color: '#FF9500',
    lightBg: 'rgba(255, 149, 0, 0.12)',
    isDefault: true,
    enabled: true,
  },
  {
    id: 'meetings',
    name: 'Meetings',
    color: '#AF52DE',
    lightBg: 'rgba(175, 82, 222, 0.12)',
    isDefault: true,
    enabled: true,
  },
  {
    id: 'important',
    name: 'Important',
    color: '#FF3B30',
    lightBg: 'rgba(255, 59, 48, 0.12)',
    isDefault: true,
    enabled: true,
  },
];

export const CATEGORY_COLOR_PRESETS = [
  { name: 'Blue', color: '#0A84FF', lightBg: 'rgba(10, 132, 255, 0.12)' },
  { name: 'Green', color: '#34C759', lightBg: 'rgba(52, 199, 89, 0.12)' },
  { name: 'Orange', color: '#FF9500', lightBg: 'rgba(255, 149, 0, 0.12)' },
  { name: 'Purple', color: '#AF52DE', lightBg: 'rgba(175, 82, 222, 0.12)' },
  { name: 'Red', color: '#FF3B30', lightBg: 'rgba(255, 59, 48, 0.12)' },
  { name: 'Teal', color: '#30B0C7', lightBg: 'rgba(48, 176, 199, 0.12)' },
  { name: 'Pink', color: '#FF2D55', lightBg: 'rgba(255, 45, 85, 0.12)' },
  { name: 'Indigo', color: '#5856D6', lightBg: 'rgba(88, 86, 214, 0.12)' },
];

export const STORAGE_KEYS = {
  EVENTS: 'dayli_events_v1',
  TASKS: 'dayli_tasks_v1',
  CATEGORIES: 'dayli_categories_v1',
  SETTINGS: 'dayli_settings_v1',
};

