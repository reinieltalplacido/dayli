import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';

export {
  format,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
};

/**
 * Returns a 35 or 42 day grid for month view
 */
export function getMonthDays(currentDate: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Guarantee either 35 or 42 cells for visual consistency
  if (days.length < 42 && days.length > 35) {
    const additionalNeeded = 42 - days.length;
    const lastDay = days[days.length - 1];
    for (let i = 1; i <= additionalNeeded; i++) {
      days.push(addDays(lastDay, i));
    }
  }

  return days;
}

/**
 * Returns the 7 days of the week containing currentDate
 */
export function getWeekDays(currentDate: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Formats date for input type="date" (YYYY-MM-DD)
 */
export function toInputDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses YYYY-MM-DD into a Date object safely
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats time 24h (HH:mm) into human friendly 12h time (e.g. 9:30 AM)
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const date = setMinutes(setHours(new Date(), hours), minutes);
  return format(date, 'h:mm a');
}

/**
 * Formats hour number (0-23) into label (e.g. "9 AM", "12 PM")
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

/**
 * Calculates vertical top percentage and height percentage in an hourly grid
 * for Week and Day views.
 */
export function getEventPosition(
  startTime: string,
  endTime: string,
  startHour: number = 0,
  totalHours: number = 24
): { topPercent: number; heightPercent: number } {
  const [startH, startM] = (startTime || '09:00').split(':').map(Number);
  const [endH, endM] = (endTime || '10:00').split(':').map(Number);

  const startMinutesTotal = (startH - startHour) * 60 + (startM || 0);
  let endMinutesTotal = (endH - startHour) * 60 + (endM || 0);

  if (endMinutesTotal <= startMinutesTotal) {
    endMinutesTotal = startMinutesTotal + 30; // minimum 30 min duration
  }

  const gridTotalMinutes = totalHours * 60;
  const topPercent = Math.max(0, Math.min(100, (startMinutesTotal / gridTotalMinutes) * 100));
  const heightPercent = Math.max(
    2.5, // minimum readable height
    Math.min(100 - topPercent, ((endMinutesTotal - startMinutesTotal) / gridTotalMinutes) * 100)
  );

  return { topPercent, heightPercent };
}
