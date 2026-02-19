type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  version: string;
  data?: Record<string, unknown>;
}

export interface Logger {
  debug(event: string, data?: Record<string, unknown>): void;
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
}

const isDev = import.meta.env.DEV;

const consoleMethods: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function emit(entry: LogEntry): void {
  if (isDev) {
    const method = consoleMethods[entry.level];
    method(`[${entry.level.toUpperCase()}] ${entry.event}`, entry.data ?? '');
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function createLogger(domain: string): Logger {
  const make =
    (level: LogLevel) =>
    (event: string, data?: Record<string, unknown>): void => {
      emit({
        level,
        event: `${domain}.${event}`,
        timestamp: new Date().toISOString(),
        version: __APP_VERSION__,
        data,
      });
    };

  return {
    debug: make('debug'),
    info: make('info'),
    warn: make('warn'),
    error: make('error'),
  };
}

export const logger = createLogger('app');
