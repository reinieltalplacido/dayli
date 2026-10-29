import { prisma } from '@/lib/prisma';
import { TaskItem } from '@/types/calendar';

export async function getUserTasks(userId: string): Promise<TaskItem[]> {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueDate: t.dueDate || undefined,
    categoryId: t.categoryId || undefined,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function createTask(
  userId: string,
  data: { title: string; dueDate?: string; categoryId?: string }
): Promise<TaskItem> {
  if (!data.title || !data.title.trim()) {
    throw new Error('Task title is required');
  }

  let matchingCalendarId: string | null = null;
  if (data.categoryId) {
    const matchingCalendar = await prisma.calendar.findFirst({
      where: {
        userId,
        OR: [{ id: data.categoryId }, { id: `${userId}_${data.categoryId}` }],
      },
    });
    matchingCalendarId = matchingCalendar?.id || null;
  }

  const created = await prisma.task.create({
    data: {
      title: data.title.trim(),
      dueDate: data.dueDate || null,
      categoryId: data.categoryId || null,
      calendarId: matchingCalendarId,
      completed: false,
      userId,
    },
  });

  return {
    id: created.id,
    title: created.title,
    completed: created.completed,
    dueDate: created.dueDate || undefined,
    categoryId: created.categoryId || undefined,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function toggleTask(userId: string, taskId: string): Promise<TaskItem> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error('Task not found or access denied');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      completed: !existing.completed,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    completed: updated.completed,
    dueDate: updated.dueDate || undefined,
    categoryId: updated.categoryId || undefined,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<TaskItem>
): Promise<TaskItem> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error('Task not found or access denied');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.completed !== undefined && { completed: updates.completed }),
      ...(updates.dueDate !== undefined && { dueDate: updates.dueDate || null }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId || null }),
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    completed: updated.completed,
    dueDate: updated.dueDate || undefined,
    categoryId: updated.categoryId || undefined,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error('Task not found or access denied');
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return true;
}
