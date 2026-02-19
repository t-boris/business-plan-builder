import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

if (import.meta.env.DEV) {
  // Emulators are opt-in: set VITE_USE_FIRESTORE_EMULATOR=true in .env.local to enable.
  const useFirestoreEmulator = parseBooleanEnv(
    import.meta.env.VITE_USE_FIRESTORE_EMULATOR,
    false,
  );
  const useStorageEmulator = parseBooleanEnv(
    import.meta.env.VITE_USE_STORAGE_EMULATOR,
    false,
  );

  if (useFirestoreEmulator) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  if (useStorageEmulator) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }
}
