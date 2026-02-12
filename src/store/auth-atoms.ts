import { atom } from 'jotai';
import type { User } from 'firebase/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

export const authStateAtom = atom<AuthState>({
  status: 'loading',
  user: null,
});

export const authStatusAtom = atom((get) => get(authStateAtom).status);
export const authUserAtom = atom((get) => get(authStateAtom).user);
