export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  lightBg: string;
  borderClass?: string;
  isDefault?: boolean;
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  isAllDay: boolean;
  categoryId: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  categoryId?: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

