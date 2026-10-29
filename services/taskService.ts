import { TaskItem } from '@/types/calendar';
import { STORAGE_KEYS } from '@/lib/constants';
import { format, addDays } from 'date-fns';

function generateSampleTasks(): TaskItem[] {
  const today = new Date();
  return [
    {
      id: 'task-1',
      title: 'Review CS 401 syllabus and required readings',
      completed: true,
      dueDate: format(today, 'yyyy-MM-dd'),
      categoryId: 'school',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Prepare slides for Dayli product architecture',
      completed: false,
      dueDate: format(today, 'yyyy-MM-dd'),
      categoryId: 'meetings',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Submit quarterly budget expense reports',
      completed: false,
      dueDate: format(addDays(today, 1), 'yyyy-MM-dd'),
      categoryId: 'deadlines',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Pick up organic groceries and coffee beans',
      completed: false,
      dueDate: format(addDays(today, 2), 'yyyy-MM-dd'),
      categoryId: 'personal',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Order replacement running shoes',
      completed: false,
      categoryId: 'personal',
      createdAt: new Date().toISOString(),
    },
  ];
}

const EMPTY_TASKS: TaskItem[] = [];
let cachedTasks: TaskItem[] | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export const taskService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): TaskItem[] {
    if (cachedTasks === null) {
      cachedTasks = taskService.getAll();
    }
    return cachedTasks;
  },

  getServerSnapshot(): TaskItem[] {
    return EMPTY_TASKS;
  },

  setTasks(tasks: TaskItem[]): void {
    cachedTasks = tasks;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
    notifyListeners();
  },

  getAll(): TaskItem[] {
    if (typeof window === 'undefined') return EMPTY_TASKS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!stored) {
        const initial = generateSampleTasks();
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initial));
        cachedTasks = initial;
        return initial;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        cachedTasks = parsed;
        return parsed;
      }
      cachedTasks = EMPTY_TASKS;
      return EMPTY_TASKS;
    } catch (e) {
      console.error('Failed to load tasks from storage:', e);
      cachedTasks = EMPTY_TASKS;
      return EMPTY_TASKS;
    }
  },

  async create(data: Omit<TaskItem, 'id' | 'createdAt'>): Promise<TaskItem> {
    const tempId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: TaskItem = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    const tasks = this.getAll();
    const updated = [newTask, ...tasks];
    cachedTasks = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    }
    notifyListeners();

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const persisted: TaskItem = await res.json();
        const current = this.getAll().map((t) => (t.id === tempId ? persisted : t));
        cachedTasks = current;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(current));
        }
        notifyListeners();
        return persisted;
      }
    } catch {
      // Fallback preserves optimistic update
    }

    return newTask;
  },

  async toggle(id: string): Promise<TaskItem> {
    const tasks = this.getAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found.`);
    }

    const updatedTask = {
      ...tasks[index],
      completed: !tasks[index].completed,
    };
    const nextTasks = [...tasks];
    nextTasks[index] = updatedTask;
    cachedTasks = nextTasks;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(nextTasks));
    }
    notifyListeners();

    try {
      await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggle: true }),
      });
    } catch {
      // Fallback
    }

    return updatedTask;
  },

  async delete(id: string): Promise<boolean> {
    const tasks = this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      cachedTasks = filtered;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      }
      notifyListeners();

      try {
        await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch {
        // Fallback
      }

      return true;
    }
    return false;
  },

  resetToSample(): TaskItem[] {
    const samples = generateSampleTasks();
    cachedTasks = samples;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(samples));
    }
    notifyListeners();
    return samples;
  },

  clearAll(): void {
    cachedTasks = EMPTY_TASKS;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
    }
    notifyListeners();
  },
};
