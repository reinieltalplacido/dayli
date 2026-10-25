"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/lib/db/user";
import { CreateTaskSchema, CreateTaskInput } from "@/lib/validations/task";
import { revalidatePath } from "next/cache";

export async function getTasksAction() {
  try {
    const user = await getOrCreateCurrentUser();
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [
        { completed: "asc" },
        { scheduledTime: "asc" },
        { createdAt: "desc" },
      ],
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return { success: false, error: "Failed to load tasks from database." };
  }
}

export async function createTaskAction(rawInput: CreateTaskInput) {
  try {
    const validated = CreateTaskSchema.parse(rawInput);
    const user = await getOrCreateCurrentUser();

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: validated.title,
        notes: validated.notes || null,
        priority: validated.priority,
        category: validated.category,
        scheduledTime: validated.scheduledTime || null,
        durationMinutes: validated.durationMinutes,
        isLocked: validated.isLocked,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : new Date(),
      },
    });

    // If task has a scheduled time, record in SchedulingHistory
    if (task.scheduledTime) {
      await prisma.schedulingHistory.create({
        data: {
          userId: user.id,
          taskId: task.id,
          action: "SCHEDULED",
          newTime: task.scheduledTime,
          newDate: task.scheduledDate,
          reason: "User created task with scheduled time",
        },
      });
    }

    revalidatePath("/");
    return { success: true, task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task in database." };
  }
}

export async function toggleTaskAction(id: string) {
  try {
    const user = await getOrCreateCurrentUser();
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: "Task not found." };
    }

    const nextCompleted = !existing.completed;
    const updated = await prisma.task.update({
      where: { id },
      data: {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
    });

    // Record toggle in history
    await prisma.schedulingHistory.create({
      data: {
        userId: user.id,
        taskId: updated.id,
        action: nextCompleted ? "COMPLETED" : "UNCOMPLETED",
        reason: nextCompleted ? "User marked task complete" : "User reopened task",
      },
    });

    revalidatePath("/");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Failed to toggle task:", error);
    return { success: false, error: "Failed to update task state." };
  }
}

export async function deleteTaskAction(id: string) {
  try {
    const user = await getOrCreateCurrentUser();
    await prisma.task.deleteMany({
      where: { id, userId: user.id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task." };
  }
}

export async function updateTaskScheduleAction(
  id: string,
  scheduledTime: string,
  durationMinutes: number
) {
  try {
    const user = await getOrCreateCurrentUser();
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: "Task not found." };
    }

    if (existing.isLocked) {
      return {
        success: false,
        error: "This task is locked and cannot be automatically rescheduled.",
      };
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        scheduledTime,
        durationMinutes,
      },
    });

    await prisma.schedulingHistory.create({
      data: {
        userId: user.id,
        taskId: updated.id,
        action: "RESCHEDULED",
        previousTime: existing.scheduledTime,
        newTime: scheduledTime,
        reason: "User adjusted schedule time block",
      },
    });

    revalidatePath("/");
    return { success: true, task: updated };
  } catch (error) {
    console.error("Failed to reschedule task:", error);
    return { success: false, error: "Failed to update schedule block." };
  }
}
