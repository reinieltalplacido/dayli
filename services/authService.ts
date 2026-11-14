import { UserProfile } from '@/types/auth';

const STORAGE_KEY = 'dayli_user_v1';
let cachedUser: UserProfile | null = null;
let hasInitialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export const authService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): UserProfile | null {
    if (!hasInitialized) {
      hasInitialized = true;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            cachedUser = JSON.parse(stored);
          }
        } catch (e) {
          console.error('Failed to load user session from storage', e);
        }
      }
    }
    return cachedUser;
  },

  getServerSnapshot(): UserProfile | null {
    return null;
  },

  getUser(): UserProfile | null {
    return this.getSnapshot();
  },

  signIn(
    email: string,
    name?: string,
    provider: 'google' | 'email' = 'google',
    avatarUrl?: string,
    birthday?: string
  ): UserProfile {
    const defaultName = name || email.split('@')[0];
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      email,
      provider,
      avatarUrl,
      birthday,
    };

    cachedUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    notifyListeners();
    return user;
  },

  setBirthday(birthday: string | null): void {
    if (cachedUser) {
      cachedUser = { ...cachedUser, birthday: birthday || undefined };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedUser));
      }
      notifyListeners();
    }
  },

  signOut(): void {
    cachedUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    notifyListeners();
  },
};

