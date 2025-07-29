/**
 * Production-safe logging utility
 * Provides structured logging with environment-aware output levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Sanitizes sensitive data from log output
   */
  private sanitize(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential API keys, passwords, etc.
      return data
        .replace(/sk-[a-zA-Z0-9]{32,}/g, '[API_KEY_REDACTED]')
        .replace(/"password":\s*"[^"]*"/g, '"password": "[REDACTED]"')
        .replace(/password[=:]\s*[^,\s}]*/gi, 'password=[REDACTED]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>;
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'key'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Formats log message with timestamp and level
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  error(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.DEBUG && this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Special method for development-only logging
   * These logs never appear in production
   */
  dev(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEV', message, context));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Legacy console wrappers for easy migration
export const log = {
  error: (message: string, context?: LogContext) => logger.error(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  dev: (message: string, context?: LogContext) => logger.dev(message, context),
};