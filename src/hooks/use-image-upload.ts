import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UseImageUploadReturn {
  upload: (file: File, path: string) => Promise<{ url: string; storagePath: string }>;
  remove: (storagePath: string) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File, path: string): Promise<{ url: string; storagePath: string }> => {
      setError(null);
      setProgress(0);

      if (!ALLOWED_TYPES.includes(file.type)) {
        const msg = `Invalid file type "${file.type}". Allowed types: JPEG, PNG, WebP.`;
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      if (file.size > MAX_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const msg = `File too large (${sizeMB} MB). Maximum size is 5 MB.`;
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      setIsUploading(true);

      return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(pct);
          },
          (err) => {
            setIsUploading(false);
            const msg = `Upload failed: ${err.message}`;
            setError(msg);
            reject(new Error(msg));
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              setProgress(100);
              resolve({ url, storagePath: path });
            } catch (err) {
              setIsUploading(false);
              const msg = `Failed to get download URL: ${err instanceof Error ? err.message : String(err)}`;
              setError(msg);
              reject(new Error(msg));
            }
          }
        );
      });
    },
    []
  );

  const remove = useCallback(async (storagePath: string): Promise<void> => {
    setError(null);
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      const msg = `Failed to delete image: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
    }
  }, []);

  return { upload, remove, isUploading, progress, error };
}
