"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentUser } from "@/lib/db/user";
import { UserSettingsSchema, UserSettingsInput } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";

export async function getUserSettingsAction() {
  try {
    const user = await getOrCreateCurrentUser();
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    return {
      success: true,
      settings: settings || {
        workStart: "09:00",
        workEnd: "17:30",
        bufferMinutes: 15,
        dailyFocus: "Complete Q4 strategy roadmap and preserve afternoon for uninterrupted architecture work.",
      },
    };
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return { success: false, error: "Failed to load settings from database." };
  }
}

export async function updateUserSettingsAction(rawInput: Partial<UserSettingsInput>) {
  try {
    const validated = UserSettingsSchema.partial().parse(rawInput);
    const user = await getOrCreateCurrentUser();

    const updated = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        workStart: validated.workStart || "09:00",
        workEnd: validated.workEnd || "17:30",
        bufferMinutes: validated.bufferMinutes ?? 15,
        dailyFocus: validated.dailyFocus || null,
      },
      update: {
        ...(validated.workStart && { workStart: validated.workStart }),
        ...(validated.workEnd && { workEnd: validated.workEnd }),
        ...(validated.bufferMinutes !== undefined && { bufferMinutes: validated.bufferMinutes }),
        ...(validated.dailyFocus !== undefined && { dailyFocus: validated.dailyFocus }),
      },
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true, settings: updated };
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return { success: false, error: "Failed to save settings to database." };
  }
}
