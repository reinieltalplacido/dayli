import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { updateEvent, deleteEvent } from '@/lib/db/events';

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
    const updated = await updateEvent(user.id, id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Failed to update event:', error);
    const message = error instanceof Error ? error.message : 'Failed to update event';
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
    await deleteEvent(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete event:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete event';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
