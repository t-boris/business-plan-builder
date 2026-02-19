import { describe, it, expect } from 'vitest'
import { getSyncSummary } from '@/lib/sync-status'
import type { SyncEntry, SyncState } from '@/lib/sync-status'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entry(domain: string, state: SyncState): SyncEntry {
  return { domain, state }
}

// ---------------------------------------------------------------------------
// getSyncSummary
// ---------------------------------------------------------------------------

describe('getSyncSummary', () => {
  it('returns idle for an empty array', () => {
    expect(getSyncSummary([])).toBe('idle')
  })

  it('returns idle when all entries are idle', () => {
    const entries = [entry('section', 'idle'), entry('scenario', 'idle')]
    expect(getSyncSummary(entries)).toBe('idle')
  })

  it('returns saved for a mix of idle and saved', () => {
    const entries = [entry('section', 'idle'), entry('scenario', 'saved')]
    expect(getSyncSummary(entries)).toBe('saved')
  })

  it('returns saving when any entry is saving', () => {
    const entries = [
      entry('section', 'idle'),
      entry('scenario', 'saving'),
      entry('variables', 'saved'),
    ]
    expect(getSyncSummary(entries)).toBe('saving')
  })

  it('returns error when any entry has error, even if others are saving', () => {
    const entries = [
      entry('section', 'saving'),
      entry('scenario', 'error'),
      entry('variables', 'saved'),
    ]
    expect(getSyncSummary(entries)).toBe('error')
  })

  it('returns offline when any entry is offline (higher priority than saving)', () => {
    const entries = [
      entry('section', 'saving'),
      entry('scenario', 'offline'),
      entry('variables', 'idle'),
    ]
    expect(getSyncSummary(entries)).toBe('offline')
  })

  it('returns error over offline (error is highest priority)', () => {
    const entries = [
      entry('section', 'offline'),
      entry('scenario', 'error'),
    ]
    expect(getSyncSummary(entries)).toBe('error')
  })

  // Single entries of each type
  it.each<SyncState>(['idle', 'saved', 'saving', 'offline', 'error'])(
    'returns %s for a single entry with state %s',
    (state) => {
      expect(getSyncSummary([entry('test', state)])).toBe(state)
    },
  )

  it('handles all states present at once, returns error as worst', () => {
    const entries: SyncEntry[] = [
      entry('a', 'idle'),
      entry('b', 'saved'),
      entry('c', 'saving'),
      entry('d', 'offline'),
      entry('e', 'error'),
    ]
    expect(getSyncSummary(entries)).toBe('error')
  })
})
