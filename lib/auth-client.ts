import { createAuthClient } from 'better-auth/react';

// In browser environments, always use window.location.origin so requests stay on the current origin (e.g. https://daylicalendar.vercel.app)
// and never attempt cross-origin requests to localhost.
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://daylicalendar.vercel.app';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;

