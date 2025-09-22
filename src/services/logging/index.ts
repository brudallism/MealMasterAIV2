// src/services/logging/index.ts
// Simple logging service for MealMasterAI

interface LogContext {
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: string, data?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${dataStr}`;
  }

  debug(message: string, context?: string, data?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context, data));
    }
  }

  info(message: string, context?: string, data?: LogContext): void {
    console.log(this.formatMessage('info', message, context, data));
  }

  warn(message: string, context?: string, data?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context, data));
  }

  error(message: string, context?: string, data?: LogContext): void {
    console.error(this.formatMessage('error', message, context, data));
  }
}

export const logger = new Logger();
export default logger;