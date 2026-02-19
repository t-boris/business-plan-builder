import { describe, it, expect, vi, afterEach } from 'vitest'
import { withRetry } from '@/lib/retry'

// Mock the logger to suppress console output during tests
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the result on first try (no retries needed)', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { baseDelay: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries once after failure then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered')

    const result = await withRetry(fn, { baseDelay: 1, maxRetries: 3 })

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws the last error after all retries are exhausted', async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      throw new Error('persistent failure')
    })

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 1 }),
    ).rejects.toThrow('persistent failure')

    // initial attempt + 2 retries = 3 calls
    expect(callCount).toBe(3)
  })

  it('respects the maxRetries option', async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      throw new Error('fail')
    })

    await expect(
      withRetry(fn, { maxRetries: 1, baseDelay: 1 }),
    ).rejects.toThrow('fail')

    // initial attempt + 1 retry = 2 calls
    expect(callCount).toBe(2)
  })

  it('uses defaults when no options are provided', async () => {
    const fn = vi.fn().mockResolvedValue(42)
    const result = await withRetry(fn)
    expect(result).toBe(42)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('succeeds on the last allowed retry', async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      if (callCount < 3) throw new Error(`fail${callCount}`)
      return 'finally'
    })

    const result = await withRetry(fn, { maxRetries: 2, baseDelay: 1 })

    expect(result).toBe('finally')
    expect(callCount).toBe(3)
  })

  it('successful function is called exactly once', async () => {
    const fn = vi.fn().mockResolvedValue('done')
    await withRetry(fn, { baseDelay: 1 })
    expect(fn).toHaveBeenCalledOnce()
  })
})
