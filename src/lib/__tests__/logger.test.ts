import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Logger tests
//
// The logger module captures console method references at import time in dev
// mode. In production mode (import.meta.env.DEV = false), it uses
// console.log(JSON.stringify(entry)). We test the production path by setting
// DEV to false via import.meta.env, which lets us spy on console.log cleanly.
// ---------------------------------------------------------------------------

describe('createLogger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubEnv('DEV', '')
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    consoleSpy.mockRestore()
    vi.resetModules()
  })

  async function getCreateLogger() {
    const mod = await import('@/lib/logger')
    return mod.createLogger
  }

  it('prefixes the event name with the domain', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('myDomain')
    log.info('myEvent')

    expect(consoleSpy).toHaveBeenCalledOnce()
    const output = consoleSpy.mock.calls[0][0] as string
    const parsed = JSON.parse(output)
    expect(parsed.event).toBe('myDomain.myEvent')
  })

  it('includes the correct level in the log entry', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('test')
    log.error('something')

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe('error')
  })

  it('includes data when provided', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('test')
    log.error('event', { key: 'value', count: 42 })

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(parsed.data).toEqual({ key: 'value', count: 42 })
  })

  it('does not include data field when no data is provided', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('test')
    log.info('event')

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(parsed.data).toBeUndefined()
  })

  it('includes a timestamp in ISO format', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('test')
    log.info('event')

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(parsed.timestamp).toBe('2026-01-15T12:00:00.000Z')
  })

  it('includes the version from __APP_VERSION__', async () => {
    const createLogger = await getCreateLogger()
    const log = createLogger('test')
    log.info('event')

    const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(parsed.version).toBe('test')
  })

  it.each(['debug', 'info', 'warn', 'error'] as const)(
    'supports the %s log level',
    async (level) => {
      const createLogger = await getCreateLogger()
      const log = createLogger('app')
      log[level]('action')

      expect(consoleSpy).toHaveBeenCalledOnce()
      const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(parsed.level).toBe(level)
      expect(parsed.event).toBe('app.action')
    },
  )
})
