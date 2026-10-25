import { Task as DbTask, Category as DbCategory } from "@prisma/client";
import { Task, Priority, Category } from "@/types/planner";

export const CATEGORY_DB_TO_CLIENT: Record<DbCategory, Category> = {
  DEEP_WORK: "Deep Work",
  WRITING: "Writing",
  PLANNING: "Planning",
  ADMIN: "Admin",
  PERSONAL: "Personal",
  HEALTH: "Health",
};

export const CATEGORY_CLIENT_TO_DB: Record<Category, DbCategory> = {
  "Deep Work": "DEEP_WORK",
  Writing: "WRITING",
  Planning: "PLANNING",
  Admin: "ADMIN",
  Personal: "PERSONAL",
  Health: "HEALTH",
};

export function dbTaskToClient(task: DbTask): Task {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    priority: task.priority.toLowerCase() as Priority,
    category: CATEGORY_DB_TO_CLIENT[task.category] || "Deep Work",
    scheduledTime: task.scheduledTime || undefined,
    durationMinutes: task.durationMinutes,
    completedAt: task.completedAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    notes: task.notes || undefined,
  };
}
