import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { updateCalendar, deleteCalendar } from '@/lib/db/calendars';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await updateCalendar(user.id, id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Failed to update calendar:', error);
    const message = error instanceof Error ? error.message : 'Failed to update calendar';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteCalendar(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete calendar:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete calendar';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
