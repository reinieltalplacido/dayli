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

  create(data: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const tasks = this.getAll();
    const newTask: TaskItem = {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    cachedTasks = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    }
    notifyListeners();
    return newTask;
  },

  toggle(id: string): TaskItem {
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
    return updatedTask;
  },

  delete(id: string): boolean {
    const tasks = this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      cachedTasks = filtered;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      }
      notifyListeners();
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
