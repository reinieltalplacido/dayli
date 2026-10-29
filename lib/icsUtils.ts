import { CalendarEvent } from '@/types/calendar';

/**
 * Format a Date or date string + time string into iCalendar date-time string
 * Format: YYYYMMDDTHHMMSS
 */
function toICSDateTime(dateStr: string, timeStr?: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return cleanDate;
  }
  const cleanTime = timeStr.replace(/:/g, '').padEnd(6, '0').slice(0, 6);
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Escape special iCalendar characters in text values
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Unescape special iCalendar characters
 */
function unescapeICSText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Export Dayli CalendarEvent list into RFC 5545 .ics iCalendar format
 */
export function exportToICS(events: CalendarEvent[], calendarTitle = 'Dayli Calendar'): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dayli//Dayli Calendar App 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarTitle)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id || `dayli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`}@dayli.app`);
    lines.push(`DTSTAMP:${nowStamp}`);

    if (event.isAllDay) {
      const dtStart = event.startDate.replace(/-/g, '');
      const dtEnd = (event.endDate || event.startDate).replace(/-/g, '');
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      const dtStart = toICSDateTime(event.startDate, event.startTime);
      const dtEnd = toICSDateTime(event.endDate || event.startDate, event.endTime || '23:59');
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }

    lines.push(`SUMMARY:${escapeICSText(event.title || 'Untitled Event')}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }

    if (event.categoryId) {
      lines.push(`CATEGORIES:${escapeICSText(event.categoryId)}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Parse an iCalendar (.ics) string into an array of Partial<CalendarEvent>
 */
export function parseICS(icsString: string): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
  // Handle folded lines: lines beginning with a single space or tab continue the previous line
  const unfolded = icsString.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const parsedEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  let inVEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inVEvent = true;
      currentEvent = {
        isAllDay: false,
        categoryId: 'personal',
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inVEvent && currentEvent.title && currentEvent.startDate) {
        parsedEvents.push({
          title: currentEvent.title || 'Imported Event',
          description: currentEvent.description || undefined,
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate || currentEvent.startDate,
          startTime: currentEvent.startTime || '09:00',
          endTime: currentEvent.endTime || '10:00',
          isAllDay: Boolean(currentEvent.isAllDay),
          location: currentEvent.location || undefined,
          categoryId: currentEvent.categoryId || 'personal',
        });
      }
      inVEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inVEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const rawKey = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    const key = rawKey.split(';')[0].toUpperCase();

    switch (key) {
      case 'SUMMARY':
        currentEvent.title = unescapeICSText(value);
        break;

      case 'DESCRIPTION':
        currentEvent.description = unescapeICSText(value);
        break;

      case 'LOCATION':
        currentEvent.location = unescapeICSText(value);
        break;

      case 'CATEGORIES': {
        const cat = unescapeICSText(value).toLowerCase().trim();
        if (['personal', 'school', 'deadlines', 'meetings', 'important'].includes(cat)) {
          currentEvent.categoryId = cat;
        }
        break;
      }

      case 'DTSTART': {
        const parsed = parseICSDateValue(value, rawKey);
        currentEvent.startDate = parsed.date;
        if (parsed.time) {
          currentEvent.startTime = parsed.time;
        }
        if (parsed.isAllDay) {
          currentEvent.isAllDay = true;
        }
        break;
      }

      case 'DTEND': {
        const parsed = parseICSDateValue(value, rawKey);
        currentEvent.endDate = parsed.date;
        if (parsed.time) {
          currentEvent.endTime = parsed.time;
        }
        break;
      }
    }
  }

  return parsedEvents;
}

/**
 * Parse an ICS date value like "20261029", "20261029T143000", or "20261029T143000Z"
 */
function parseICSDateValue(value: string, keyHeader: string): { date: string; time?: string; isAllDay: boolean } {
  const isAllDay = keyHeader.includes('VALUE=DATE') || value.length === 8;

  if (isAllDay || !value.includes('T')) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return {
      date: `${year}-${month}-${day}`,
      isAllDay: true,
    };
  }

  const parts = value.split('T');
  const d = parts[0];
  const t = parts[1];

  const year = d.slice(0, 4);
  const month = d.slice(4, 6);
  const day = d.slice(6, 8);

  const hours = t.slice(0, 2);
  const minutes = t.slice(2, 4);

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    isAllDay: false,
  };
}

/**
 * Triggers a client-side file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

