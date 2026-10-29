import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const googleAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'google',
      },
    });

    const [eventsCount, tasksCount] = await Promise.all([
      prisma.event.count({ where: { userId: user.id } }),
      prisma.task.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      googleConnected: Boolean(googleAccount),
      googleAccountId: googleAccount?.accountId || null,
      stats: {
        eventsCount,
        tasksCount,
      },
    });
  } catch (error) {
    console.error('Failed to get account details:', error);
    return NextResponse.json({ error: 'Failed to get account information' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');

  try {
    if (action === 'clear-data') {
      // Clear all events and tasks for this user
      const [eventsDeleted, tasksDeleted] = await prisma.$transaction([
        prisma.event.deleteMany({ where: { userId: user.id } }),
        prisma.task.deleteMany({ where: { userId: user.id } }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'All calendar data cleared successfully',
        deletedEvents: eventsDeleted.count,
        deletedTasks: tasksDeleted.count,
      });
    }

    if (action === 'delete-account') {
      // Permanently delete user and all cascading relations
      await prisma.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Account and associated data deleted permanently',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "clear-data" or "delete-account"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Account operation failed:', error);
    return NextResponse.json({ error: 'Failed to perform account operation' }, { status: 500 });
  }
}
