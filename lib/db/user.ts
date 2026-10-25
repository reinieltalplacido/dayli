import { prisma } from "@/lib/prisma";

export const DEFAULT_USER_EMAIL = "alex@dayli.app";

/**
 * Retrieves the primary user or creates a default user with initial settings.
 * In Phase 3, this will be integrated with Auth.js session user IDs.
 */
export async function getOrCreateCurrentUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    include: { settings: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEFAULT_USER_EMAIL,
        name: "Alex Mercer",
        settings: {
          create: {
            workStart: "09:00",
            workEnd: "17:30",
            bufferMinutes: 15,
            dailyFocus: "Complete Q4 strategy roadmap and preserve afternoon for uninterrupted architecture work.",
          },
        },
      },
      include: { settings: true },
    });
  }

  return user;
}
