import { prisma } from '@/lib/prisma';
import { CalendarCategory } from '@/types/calendar';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export async function getUserCalendars(userId: string): Promise<CalendarCategory[]> {
  const calendars = await prisma.calendar.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (calendars.length === 0) {
    // Seed default categories for this user
    await prisma.calendar.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        id: `${userId}_${cat.id}`,
        name: cat.name,
        color: cat.color,
        lightBg: cat.lightBg,
        isDefault: cat.isDefault ?? false,
        enabled: cat.enabled,
        userId,
      })),
    });

    const seeded = await prisma.calendar.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return seeded.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      lightBg: c.lightBg,
      isDefault: c.isDefault,
      enabled: c.enabled,
    }));
  }

  return calendars.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    lightBg: c.lightBg,
    isDefault: c.isDefault,
    enabled: c.enabled,
  }));
}

export async function createCalendar(
  userId: string,
  data: { name: string; color: string; lightBg: string }
): Promise<CalendarCategory> {
  if (!data.name || !data.name.trim()) {
    throw new Error('Calendar name is required');
  }

  const created = await prisma.calendar.create({
    data: {
      name: data.name.trim(),
      color: data.color || '#0A84FF',
      lightBg: data.lightBg || 'rgba(10, 132, 255, 0.12)',
      enabled: true,
      isDefault: false,
      userId,
    },
  });

  return {
    id: created.id,
    name: created.name,
    color: created.color,
    lightBg: created.lightBg,
    isDefault: created.isDefault,
    enabled: created.enabled,
  };
}

export async function updateCalendar(
  userId: string,
  calendarId: string,
  updates: Partial<Pick<CalendarCategory, 'name' | 'color' | 'lightBg' | 'enabled'>>
): Promise<CalendarCategory> {
  const existing = await prisma.calendar.findFirst({
    where: { id: calendarId, userId },
  });

  if (!existing) {
    throw new Error('Calendar not found or access denied');
  }

  const updated = await prisma.calendar.update({
    where: { id: calendarId },
    data: {
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.lightBg !== undefined && { lightBg: updates.lightBg }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    color: updated.color,
    lightBg: updated.lightBg,
    isDefault: updated.isDefault,
    enabled: updated.enabled,
  };
}

export async function deleteCalendar(userId: string, calendarId: string): Promise<boolean> {
  const existing = await prisma.calendar.findFirst({
    where: { id: calendarId, userId },
  });

  if (!existing) {
    throw new Error('Calendar not found or access denied');
  }

  await prisma.calendar.delete({
    where: { id: calendarId },
  });

  return true;
}

