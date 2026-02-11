import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { currentPlanIdAtom } from '@/store/plan-atoms';
import { getSection, saveSection } from '@/lib/firestore';
import type { SectionSlug, BusinessPlanSection } from '@/types';

interface UseSectionReturn<T> {
  data: T;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateData: (updater: (prev: T) => T) => void;
  isLoading: boolean;
}

export function useSection<T extends BusinessPlanSection>(
  sectionSlug: SectionSlug,
  defaultData: T
): UseSectionReturn<T> {
  const planId = useAtomValue(currentPlanIdAtom);
  const [data, setData] = useState<T>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);

  // Keep dataRef in sync with state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load data from Firestore on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await getSection<T>(planId, sectionSlug);
        if (!cancelled && stored) {
          setData(stored);
        }
      } catch {
        // Firestore may not be available (no emulator) — use defaults silently
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
  }, [planId, sectionSlug]);

  // Debounced save to Firestore
  const debounceSave = useCallback(
    (newData: T) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          await saveSection(planId, sectionSlug, newData as Partial<BusinessPlanSection>);
        } catch {
          // Firestore may not be available — silently fail
        }
      }, 500);
    },
    [planId, sectionSlug]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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

  return { data, updateField, updateData, isLoading };
}
