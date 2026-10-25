import { PrismaClient, Priority, Category } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Dayli database...");

  const user = await prisma.user.upsert({
    where: { email: "alex@dayli.app" },
    update: {},
    create: {
      email: "alex@dayli.app",
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
  });

  const taskCount = await prisma.task.count({ where: { userId: user.id } });

  if (taskCount === 0) {
    console.log("Creating initial tasks...");
    await prisma.task.createMany({
      data: [
        {
          userId: user.id,
          title: "Draft Q4 product roadmap and strategic themes",
          completed: false,
          priority: Priority.HIGH,
          category: Category.DEEP_WORK,
          scheduledTime: "09:30",
          durationMinutes: 90,
          notes: "Focus on clarity and 3 core milestones rather than long feature lists.",
        },
        {
          userId: user.id,
          title: "Editorial review of new onboarding copy",
          completed: true,
          completedAt: new Date(),
          priority: Priority.MEDIUM,
          category: Category.WRITING,
          scheduledTime: "11:30",
          durationMinutes: 45,
        },
        {
          userId: user.id,
          title: "Review team sync notes & unblock calendar invites",
          completed: false,
          priority: Priority.LOW,
          category: Category.ADMIN,
          scheduledTime: "13:30",
          durationMinutes: 30,
        },
        {
          userId: user.id,
          title: "Architecture breakdown for task rescheduling logic",
          completed: false,
          priority: Priority.HIGH,
          category: Category.PLANNING,
          scheduledTime: "14:30",
          durationMinutes: 60,
          notes: "Ensure safe boundary validation and prevent modifying locked events.",
        },
        {
          userId: user.id,
          title: "Afternoon brisk walk & screen break",
          completed: true,
          completedAt: new Date(),
          priority: Priority.LOW,
          category: Category.HEALTH,
          scheduledTime: "16:00",
          durationMinutes: 20,
        },
      ],
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
