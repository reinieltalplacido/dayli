import { CalendarCategory } from '@/types/calendar';
import { DEFAULT_CATEGORIES, STORAGE_KEYS } from '@/lib/constants';

let cachedCategories: CalendarCategory[] | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export const categoryService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): CalendarCategory[] {
    if (cachedCategories === null) {
      cachedCategories = categoryService.getAll();
    }
    return cachedCategories;
  },

  getServerSnapshot(): CalendarCategory[] {
    return DEFAULT_CATEGORIES;
  },

  getAll(): CalendarCategory[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        cachedCategories = DEFAULT_CATEGORIES;
        return DEFAULT_CATEGORIES;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCategories = parsed;
        return parsed;
      }
      cachedCategories = DEFAULT_CATEGORIES;
      return DEFAULT_CATEGORIES;
    } catch (e) {
      console.error('Failed to load categories:', e);
      cachedCategories = DEFAULT_CATEGORIES;
      return DEFAULT_CATEGORIES;
    }
  },

  toggle(id: string): CalendarCategory[] {
    const categories = this.getAll();
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    );
    cachedCategories = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    notifyListeners();
    return updated;
  },

  create(name: string, color: string, lightBg: string): CalendarCategory {
    const categories = this.getAll();
    const newCategory: CalendarCategory = {
      id: `cat-${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: name.trim(),
      color,
      lightBg,
      enabled: true,
      isDefault: false,
    };

    const updated = [...categories, newCategory];
    cachedCategories = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    notifyListeners();
    return newCategory;
  },

  reset(): CalendarCategory[] {
    cachedCategories = DEFAULT_CATEGORIES;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    notifyListeners();
    return DEFAULT_CATEGORIES;
  },
};
