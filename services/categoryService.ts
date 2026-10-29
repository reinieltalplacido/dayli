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

  setCategories(categories: CalendarCategory[]): void {
    cachedCategories = categories;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
    notifyListeners();
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

  async toggle(id: string): Promise<CalendarCategory[]> {
    const categories = this.getAll();
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    );
    cachedCategories = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    notifyListeners();

    const target = updated.find((c) => c.id === id);
    if (target) {
      try {
        await fetch(`/api/calendars/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: target.enabled }),
        });
      } catch {
        // Fallback
      }
    }

    return updated;
  },

  async create(name: string, color: string, lightBg: string): Promise<CalendarCategory> {
    const tempId = `cat-${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const newCategory: CalendarCategory = {
      id: tempId,
      name: name.trim(),
      color,
      lightBg,
      enabled: true,
      isDefault: false,
    };

    const categories = this.getAll();
    const updated = [...categories, newCategory];
    cachedCategories = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    notifyListeners();

    try {
      const res = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, lightBg }),
      });

      if (res.ok) {
        const persisted: CalendarCategory = await res.json();
        const current = this.getAll().map((c) => (c.id === tempId ? persisted : c));
        cachedCategories = current;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(current));
        }
        notifyListeners();
        return persisted;
      }
    } catch {
      // Fallback preserves optimistic category
    }

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
