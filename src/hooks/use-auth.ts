import { useAtomValue } from 'jotai';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { authStatusAtom, authUserAtom } from '@/store/auth-atoms';

export function useAuth() {
  const status = useAtomValue(authStatusAtom);
  const user = useAtomValue(authUserAtom);

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return { status, user, signInWithEmail, signInWithGoogle, signOut };
}
