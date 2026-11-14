import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { GoogleProfile } from 'better-auth/social-providers';
import { prisma } from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      birthday: {
        type: 'string',
        required: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'dev_secret_must_be_at_least_32_characters_long_12345',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      prompt: 'select_account',
      accessType: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.birthday.read',
      ],
      async getUserInfo(token) {
        if (!token.idToken) return null;
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(Buffer.from(token.idToken.split('.')[1], 'base64').toString());
        } catch {
          // ignore
        }

        let birthday: string | null = null;
        if (token.accessToken) {
          try {
            const res = await fetch(
              'https://people.googleapis.com/v1/people/me?personFields=birthdays',
              {
                headers: {
                  Authorization: `Bearer ${token.accessToken}`,
                  Accept: 'application/json',
                },
              }
            );
            if (res.ok) {
              const data = await res.json();
              const bday = data.birthdays?.[0]?.date;
              if (bday?.month && bday?.day) {
                const y = bday.year || 2000;
                const m = String(bday.month).padStart(2, '0');
                const d = String(bday.day).padStart(2, '0');
                birthday = `${y}-${m}-${d}`;
              }
            }
          } catch (err) {
            console.warn('Could not fetch Google birthday:', err);
          }
        }

        return {
          user: {
            name: (payload.name as string) || '',
            email: (payload.email as string) || '',
            image: (payload.picture as string) || undefined,
            emailVerified: Boolean(payload.email_verified),
            birthday: birthday || undefined,
          },
          data: payload as unknown as GoogleProfile,
        };
      },
    },
  },
});

