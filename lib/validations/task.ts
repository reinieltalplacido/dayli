import { z } from "zod";

export const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const CategorySchema = z.enum([
  "DEEP_WORK",
  "WRITING",
  "PLANNING",
  "ADMIN",
  "PERSONAL",
  "HEALTH",
]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().max(1000).optional(),
  priority: PrioritySchema.default("MEDIUM"),
  category: CategorySchema.default("DEEP_WORK"),
  scheduledDate: z.string().optional(), // ISO date string YYYY-MM-DD
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
    .optional()
    .or(z.literal("")),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  isLocked: z.boolean().default(false),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().min(1),
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
