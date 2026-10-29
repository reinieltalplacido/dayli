import { prisma } from '@/lib/prisma';
import { CalendarEvent } from '@/types/calendar';

export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }],
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    startDate: e.startDate,
    endDate: e.endDate,
    startTime: e.startTime,
    endTime: e.endTime,
    isAllDay: e.isAllDay,
    location: e.location || undefined,
    categoryId: e.categoryId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}

export async function createEvent(
  userId: string,
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CalendarEvent> {
  if (!data.title || !data.title.trim()) {
    throw new Error('Event title is required');
  }
  if (!data.startDate) {
    throw new Error('Event start date is required');
  }

  // Look up matching calendar if exists
  const matchingCalendar = await prisma.calendar.findFirst({
    where: {
      userId,
      OR: [{ id: data.categoryId }, { id: `${userId}_${data.categoryId}` }],
    },
  });

  const created = await prisma.event.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '10:00',
      isAllDay: Boolean(data.isAllDay),
      location: data.location?.trim() || null,
      categoryId: data.categoryId,
      calendarId: matchingCalendar?.id || null,
      userId,
    },
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description || undefined,
    startDate: created.startDate,
    endDate: created.endDate,
    startTime: created.startTime,
    endTime: created.endTime,
    isAllDay: created.isAllDay,
    location: created.location || undefined,
    categoryId: created.categoryId,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, userId },
  });

  if (!existing) {
    throw new Error('Event not found or access denied');
  }

  let matchingCalendarId = existing.calendarId;
  if (updates.categoryId && updates.categoryId !== existing.categoryId) {
    const matchingCalendar = await prisma.calendar.findFirst({
      where: {
        userId,
        OR: [{ id: updates.categoryId }, { id: `${userId}_${updates.categoryId}` }],
      },
    });
    matchingCalendarId = matchingCalendar?.id || null;
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && { description: updates.description ? updates.description.trim() : null }),
      ...(updates.startDate !== undefined && { startDate: updates.startDate }),
      ...(updates.endDate !== undefined && { endDate: updates.endDate }),
      ...(updates.startTime !== undefined && { startTime: updates.startTime }),
      ...(updates.endTime !== undefined && { endTime: updates.endTime }),
      ...(updates.isAllDay !== undefined && { isAllDay: updates.isAllDay }),
      ...(updates.location !== undefined && { location: updates.location ? updates.location.trim() : null }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      calendarId: matchingCalendarId,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description || undefined,
    startDate: updated.startDate,
    endDate: updated.endDate,
    startTime: updated.startTime,
    endTime: updated.endTime,
    isAllDay: updated.isAllDay,
    location: updated.location || undefined,
    categoryId: updated.categoryId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteEvent(userId: string, eventId: string): Promise<boolean> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, userId },
  });

  if (!existing) {
    throw new Error('Event not found or access denied');
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  return true;
}

