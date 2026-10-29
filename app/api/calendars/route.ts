import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserCalendars, createCalendar } from '@/lib/db/calendars';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const calendars = await getUserCalendars(user.id);
    return NextResponse.json(calendars);
  } catch (error) {
    console.error('Failed to get calendars:', error);
    return NextResponse.json({ error: 'Failed to retrieve calendars' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const calendar = await createCalendar(user.id, body);
    return NextResponse.json(calendar, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create calendar:', error);
    const message = error instanceof Error ? error.message : 'Failed to create calendar';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
