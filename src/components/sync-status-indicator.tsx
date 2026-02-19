import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { syncSummaryAtom, syncEntriesAtom, updateSyncAtom } from '@/store/sync-atoms';
import type { SyncState } from '@/lib/sync-status';

// ---------------------------------------------------------------------------
// useOnlineStatus — tracks navigator.onLine and dispatches sync entries
// ---------------------------------------------------------------------------

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const updateSync = useSetAtom(updateSyncAtom);

  const handleOnline = useCallback(() => {
    setOnline(true);
    // Clear the network offline entry
    updateSync({ domain: 'network', state: 'idle' });
  }, [updateSync]);

  const handleOffline = useCallback(() => {
    setOnline(false);
    updateSync({ domain: 'network', state: 'offline' });
  }, [updateSync]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state if already offline
    if (!navigator.onLine) {
      updateSync({ domain: 'network', state: 'offline' });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, updateSync]);

  return online;
}

// ---------------------------------------------------------------------------
// Label / style mapping
// ---------------------------------------------------------------------------

const STATE_CONFIG: Record<
  SyncState,
  { label: string; className: string; visible: boolean }
> = {
  idle: { label: '', className: '', visible: false },
  saving: {
    label: 'Saving\u2026',
    className: 'text-muted-foreground animate-pulse',
    visible: true,
  },
  saved: {
    label: 'Saved',
    className: 'text-muted-foreground',
    visible: true,
  },
  error: {
    label: 'Save failed',
    className: 'text-destructive cursor-pointer',
    visible: true,
  },
  offline: {
    label: 'Offline',
    className: 'text-yellow-600 dark:text-yellow-400',
    visible: true,
  },
};

// ---------------------------------------------------------------------------
// SyncStatusIndicator
// ---------------------------------------------------------------------------

export function SyncStatusIndicator() {
  const summary = useAtomValue(syncSummaryAtom);
  const entries = useAtomValue(syncEntriesAtom);
  useOnlineStatus();

  // Fade-out timer for the "saved" state
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (summary === 'saved') {
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 2000);
    } else if (summary === 'idle') {
      setVisible(false);
    } else {
      setVisible(true);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [summary]);

  const config = STATE_CONFIG[summary];
  if (!config.visible || !visible) return null;

  // Build error tooltip content
  const errorDetails =
    summary === 'error'
      ? Object.values(entries)
          .filter((e) => e.state === 'error')
          .map((e) => `${e.domain}: ${e.error ?? 'unknown error'}`)
          .join(', ')
      : undefined;

  return (
    <span
      className={`text-xs select-none transition-opacity duration-300 ${config.className}`}
      title={errorDetails}
      role="status"
      aria-live="polite"
    >
      {config.label}
    </span>
  );
}
