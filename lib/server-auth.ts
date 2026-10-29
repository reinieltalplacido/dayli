import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };
  } catch (error) {
    console.error('Error verifying server session:', error);
    return null;
  }
}

