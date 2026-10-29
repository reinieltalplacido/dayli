import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { updateTask, deleteTask, toggleTask } from '@/lib/db/tasks';

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
    if (body.toggle) {
      const updated = await toggleTask(user.id, id);
      return NextResponse.json(updated);
    }
    const updated = await updateTask(user.id, id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Failed to update task:', error);
    const message = error instanceof Error ? error.message : 'Failed to update task';
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
    await deleteTask(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete task:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
