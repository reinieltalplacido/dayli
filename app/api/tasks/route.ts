import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserTasks, createTask } from '@/lib/db/tasks';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await getUserTasks(user.id);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json({ error: 'Failed to retrieve tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const task = await createTask(user.id, body);
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create task:', error);
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
