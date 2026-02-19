import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import { getSectionData, saveSectionData } from '@/lib/business-firestore';
import { useCanEdit } from '@/hooks/use-business-role';
import { createLogger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { updateSyncAtom } from '@/store/sync-atoms';
import type { SectionSlug, BusinessPlanSection } from '@/types';

const log = createLogger('section');

/** Shallow-merge each nested object so new fields from defaults are preserved. */
function mergeWithDefaults<T>(stored: T, defaults: T): T {
  const result = { ...defaults, ...stored };
  for (const key of Object.keys(defaults as object) as (keyof T)[]) {
    const def = defaults[key];
    const val = stored[key];
    if (def && val && typeof def === 'object' && !Array.isArray(def) && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = { ...(def as object), ...(val as object) } as T[keyof T];
    }
  }
  return result;
}

interface UseSectionReturn<T> {
  data: T;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateData: (updater: (prev: T) => T) => void;
  isLoading: boolean;
  canEdit: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaved: number | null;
}

export function useSection<T extends BusinessPlanSection>(
  sectionSlug: SectionSlug,
  defaultData: T
): UseSectionReturn<T> {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const canEdit = useCanEdit();
  const setSync = useSetAtom(updateSyncAtom);
  const [data, setData] = useState<T>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);

  // Keep dataRef in sync with state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load data from Firestore when businessId changes
  useEffect(() => {
    // No business selected — use defaults, skip Firestore
    if (!businessId) {
      setData(defaultData);
      setIsLoading(false);
      return;
    }

    // Reset to defaults before loading new business data (clear stale data)
    setData(defaultData);
    setIsLoading(true);

    let cancelled = false;

    async function load() {
      try {
        const stored = await getSectionData<T>(businessId!, sectionSlug);
        if (!cancelled && stored) {
          setData(mergeWithDefaults(stored, defaultData));
        }
      } catch (err) {
        log.warn('load.failed', {
          businessId: businessId!,
          section: sectionSlug,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, sectionSlug]);

  // Debounced save to Firestore
  const debounceSave = useCallback(
    (newData: T) => {
      if (!businessId || !canEdit) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        setIsSaving(true);
        setSaveError(null);
        setSync({ domain: 'section', state: 'saving' });
        try {
          await withRetry(() => saveSectionData(businessId, sectionSlug, newData));
          const now = Date.now();
          setLastSaved(now);
          setSync({ domain: 'section', state: 'saved', lastSaved: now });
          log.info('saved', { businessId, section: sectionSlug });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Save failed';
          setSaveError(message);
          setSync({ domain: 'section', state: 'error', error: message });
          log.error('save.failed', { businessId, section: sectionSlug, error: message });
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [businessId, sectionSlug, canEdit, setSync]
  );

  // Flush pending save on unmount (don't lose unsaved changes on tab switch)
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        // Save current data immediately (best-effort, log on failure)
        if (businessId) {
          saveSectionData(businessId, sectionSlug, dataRef.current).catch(
            (err) =>
              log.warn('flush.failed', {
                businessId,
                section: sectionSlug,
                error: err instanceof Error ? err.message : 'Unknown error',
              })
          );
        }
      }
    };
  }, [businessId, sectionSlug]);

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setData((prev) => {
        const next = { ...prev, [field]: value };
        debounceSave(next);
        return next;
      });
    },
    [debounceSave]
  );

  const updateData = useCallback(
    (updater: (prev: T) => T) => {
      setData((prev) => {
        const next = updater(prev);
        debounceSave(next);
        return next;
      });
    },
    [debounceSave]
  );

  return { data, updateField, updateData, isLoading, canEdit, isSaving, saveError, lastSaved };
}
