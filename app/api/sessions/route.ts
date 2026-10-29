import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/server-auth';

function parseDevice(userAgent?: string | null): { browser: string; os: string; type: 'desktop' | 'mobile' | 'tablet' } {
  if (!userAgent) {
    return { browser: 'Unknown Browser', os: 'Unknown OS', type: 'desktop' };
  }

  const ua = userAgent.toLowerCase();
  let browser = 'Browser';
  let os = 'Unknown OS';
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  // Detect OS
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) {
    os = 'Android';
    type = 'mobile';
  } else if (ua.includes('iphone')) {
    os = 'iOS (iPhone)';
    type = 'mobile';
  } else if (ua.includes('ipad')) {
    os = 'iPadOS';
    type = 'tablet';
  }

  // Detect Browser
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';

  return { browser, os, type };
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const headersList = await headers();
    const currentSession = await auth.api.getSession({
      headers: headersList,
    });

    const currentSessionId = currentSession?.session?.id;
    const currentToken = currentSession?.session?.token;

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = sessions.map((s) => {
      const isCurrent = Boolean(
        (currentSessionId && s.id === currentSessionId) ||
        (currentToken && s.token === currentToken)
      );
      const parsed = parseDevice(s.userAgent);

      return {
        id: s.id,
        isCurrent,
        browser: parsed.browser,
        os: parsed.os,
        type: parsed.type,
        ipAddress: s.ipAddress || 'Localhost / 127.0.0.1',
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      };
    });

    // Ensure current device is at the top
    formatted.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to retrieve active sessions:', error);
    return NextResponse.json({ error: 'Failed to retrieve sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionId = req.nextUrl.searchParams.get('id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found or already revoked' }, { status: 404 });
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}

