import { z } from "zod";

export const UserSettingsSchema = z.object({
  workStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").default("09:00"),
  workEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").default("17:30"),
  bufferMinutes: z.number().int().min(0).max(120).default(15),
  dailyFocus: z.string().max(300).optional(),
});

export type UserSettingsInput = z.infer<typeof UserSettingsSchema>;
