import chalk from 'chalk';

// ============================================================================
// Log Levels
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Logger Configuration
// ============================================================================

interface LoggerConfig {
  level: LogLevel;
  quiet: boolean;
  json: boolean;
}

let config: LoggerConfig = {
  level: 'info',
  quiet: false,
  json: false,
};

export function configureLogger(options: Partial<LoggerConfig>): void {
  config = { ...config, ...options };
}

// ============================================================================
// Logger Implementation
// ============================================================================

function shouldLog(level: LogLevel): boolean {
  if (config.quiet && level !== 'error') {
    return false;
  }
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
}

function formatMessage(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): string {
  if (config.json) {
    return JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = `[${timestamp}]`;

  switch (level) {
    case 'debug':
      return chalk.gray(`${prefix} ${message}`);
    case 'info':
      return `${prefix} ${message}`;
    case 'warn':
      return chalk.yellow(`${prefix} ⚠ ${message}`);
    case 'error':
      return chalk.red(`${prefix} ✗ ${message}`);
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, data));
    }
  },

  success(message: string): void {
    if (!config.quiet) {
      console.log(chalk.green(`✓ ${message}`));
    }
  },

  progress(current: number, total: number, message: string): void {
    if (!config.quiet && !config.json) {
      const percent = Math.round((current / total) * 100);
      const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
      process.stdout.write(`\r[${bar}] ${percent}% ${message}`);
      if (current === total) {
        console.log();
      }
    }
  },
};

// ============================================================================
// Timing Utilities
// ============================================================================

export function createTimer(): {
  elapsed: () => number;
  format: () => string;
} {
  const start = performance.now();

  return {
    elapsed(): number {
      return performance.now() - start;
    },
    format(): string {
      const ms = this.elapsed();
      if (ms < 1000) {
        return `${ms.toFixed(0)}ms`;
      }
      return `${(ms / 1000).toFixed(1)}s`;
    },
  };
}
