import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserEvents, createEvent } from '@/lib/db/events';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await getUserEvents(user.id);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to get events:', error);
    return NextResponse.json({ error: 'Failed to retrieve events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const event = await createEvent(user.id, body);
    return NextResponse.json(event, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create event:', error);
    const message = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
