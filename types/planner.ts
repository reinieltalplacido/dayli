export type Priority = 'low' | 'medium' | 'high';

export type Category = 'Deep Work' | 'Writing' | 'Planning' | 'Admin' | 'Personal' | 'Health';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  scheduledTime?: string; // e.g. "09:30" (24h) or "09:30 AM"
  durationMinutes: number; // e.g. 45
  completedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface DayFocus {
  focusText: string;
  dateStr: string;
}

export type NavTab = 'my-day' | 'upcoming' | 'calendar' | 'tasks' | 'settings';
