import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserCalendars } from '@/lib/db/calendars';
import { getUserEvents } from '@/lib/db/events';
import { getUserTasks } from '@/lib/db/tasks';
import { prisma } from '@/lib/prisma';
import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [calendars, events, tasks] = await Promise.all([
      getUserCalendars(user.id),
      getUserEvents(user.id),
      getUserTasks(user.id),
    ]);

    return NextResponse.json({ calendars, events, tasks });
  } catch (error) {
    console.error('Failed to sync user data:', error);
    return NextResponse.json({ error: 'Failed to retrieve calendar data' }, { status: 500 });
  }
}

interface MigrationPayload {
  events?: CalendarEvent[];
  tasks?: TaskItem[];
  categories?: CalendarCategory[];
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: MigrationPayload = await req.json();
    const { events = [], tasks = [], categories = [] } = body;

    // 1. Ensure calendars exist in user's account
    const existingCalendars = await getUserCalendars(user.id);
    const existingNames = new Set(existingCalendars.map((c) => c.name.toLowerCase()));

    // Transfer any custom categories
    for (const cat of categories) {
      if (!cat.isDefault && !existingNames.has(cat.name.toLowerCase())) {
        await prisma.calendar.create({
          data: {
            name: cat.name,
            color: cat.color,
            lightBg: cat.lightBg,
            isDefault: false,
            enabled: cat.enabled,
            userId: user.id,
          },
        });
        existingNames.add(cat.name.toLowerCase());
      }
    }

    // 2. Transfer events (avoid duplicates by title + startDate + startTime)
    const existingEvents = await getUserEvents(user.id);
    const existingEventKey = new Set(
      existingEvents.map((e) => `${e.title.toLowerCase()}_${e.startDate}_${e.startTime}`)
    );

    const eventsToCreate = events.filter((e) => {
      const key = `${e.title.toLowerCase()}_${e.startDate}_${e.startTime}`;
      return !existingEventKey.has(key);
    });

    if (eventsToCreate.length > 0) {
      await prisma.event.createMany({
        data: eventsToCreate.map((e) => ({
          title: e.title.trim(),
          description: e.description?.trim() || null,
          startDate: e.startDate,
          endDate: e.endDate || e.startDate,
          startTime: e.startTime || '09:00',
          endTime: e.endTime || '10:00',
          isAllDay: Boolean(e.isAllDay),
          location: e.location?.trim() || null,
          categoryId: e.categoryId,
          userId: user.id,
        })),
      });
    }

    // 3. Transfer tasks (avoid duplicates by title)
    const existingTasks = await getUserTasks(user.id);
    const existingTaskTitles = new Set(existingTasks.map((t) => t.title.toLowerCase()));

    const tasksToCreate = tasks.filter((t) => !existingTaskTitles.has(t.title.toLowerCase()));

    if (tasksToCreate.length > 0) {
      await prisma.task.createMany({
        data: tasksToCreate.map((t) => ({
          title: t.title.trim(),
          completed: Boolean(t.completed),
          dueDate: t.dueDate || null,
          categoryId: t.categoryId || null,
          userId: user.id,
        })),
      });
    }

    // Return fresh state
    const [finalCalendars, finalEvents, finalTasks] = await Promise.all([
      getUserCalendars(user.id),
      getUserEvents(user.id),
      getUserTasks(user.id),
    ]);

    return NextResponse.json({
      success: true,
      migratedEventsCount: eventsToCreate.length,
      migratedTasksCount: tasksToCreate.length,
      calendars: finalCalendars,
      events: finalEvents,
      tasks: finalTasks,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Failed to migrate local data' }, { status: 500 });
  }
}
