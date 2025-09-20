// src/services/error/sentry-integration.ts
// Enhanced Sentry integration with error categorization and performance monitoring
// Currently using mock implementation for development stability

// import * as Sentry from '@sentry/react-native'; // Temporarily disabled for development
import { Platform } from 'react-native';
import { DetailedError, ErrorContext, ErrorMetadata } from './error-manager';

// Mock Sentry for development - prevents native client issues
const Sentry = {
  setTag: () => {},
  captureException: (error: any, options?: any) => {
    const id = 'mock-id-' + Date.now();
    console.log(`[Mock Sentry] Captured exception [${id}]:`, error.message || error);
    if (options?.tags) console.log(`[Mock Sentry] Tags:`, options.tags);
    return id;
  },
  captureMessage: (message: string, options?: any) => {
    const id = 'mock-id-' + Date.now();
    console.log(`[Mock Sentry] Captured message [${id}]:`, message);
    if (options?.level) console.log(`[Mock Sentry] Level:`, options.level);
    return id;
  },
  addBreadcrumb: (breadcrumb: any) => {
    console.log(`[Mock Sentry] Breadcrumb:`, breadcrumb.message);
  },
  setUser: (user: any) => {
    console.log(`[Mock Sentry] User set:`, user.id);
  },
  flush: async () => {
    console.log(`[Mock Sentry] Flush completed`);
    return true;
  },
  lastEventId: () => 'mock-id-' + Date.now(),
  nativeCrash: () => {
    console.log(`[Mock Sentry] Native crash simulation (mock)`);
  },
  init: (config: any) => {
    console.log(`[Mock Sentry] Initialized with environment:`, config?.environment || 'unknown');
  },
  withScope: (callback: (scope: any) => void) => {
    const mockScope = {
      setLevel: (level: string) => console.log(`[Mock Sentry] Scope level:`, level),
      setTag: (key: string, value: any) => console.log(`[Mock Sentry] Scope tag ${key}:`, value),
      setContext: (key: string, context: any) => console.log(`[Mock Sentry] Scope context ${key}:`, Object.keys(context)),
      setUser: (user: any) => console.log(`[Mock Sentry] Scope user:`, user.id)
    };
    callback(mockScope);
  }
};

export type ErrorCategory =
  | 'api_error'
  | 'network_error'
  | 'validation_error'
  | 'ai_processing_error'
  | 'cache_error'
  | 'authentication_error'
  | 'ui_error'
  | 'system_error'
  | 'unknown_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EnhancedErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  component?: string;
  operation?: string;
  userId?: string;
  userAgent?: string;
  appVersion?: string;
  buildVersion?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  tags?: Record<string, string>;
  data?: Record<string, any>;
}

export class SentryIntegration {
  private static instance: SentryIntegration;
  private isInitialized = false;
  private performanceTransactions = new Map<string, any>();

  private constructor() {
    // Mock initialization - no circular dependencies
  }

  static getInstance(): SentryIntegration {
    if (!SentryIntegration.instance) {
      SentryIntegration.instance = new SentryIntegration();
    }
    return SentryIntegration.instance;
  }

  // Initialize mock Sentry
  initialize(config?: { environment?: string; debug?: boolean }): void {
    try {
      console.log('[SentryIntegration] Initializing mock Sentry integration...');

      Sentry.init({
        environment: config?.environment || 'development',
        debug: config?.debug || false
      });

      this.setupMockConfiguration();
      this.isInitialized = true;

      console.log(`[SentryIntegration] Mock Sentry initialized successfully for ${config?.environment || 'development'}`);
      console.log('[SentryIntegration] Using mock implementation for development stability');
      console.log('[SentryIntegration] All errors will be logged to console with mock IDs');

    } catch (error) {
      console.error('[SentryIntegration] Failed to initialize mock Sentry:', error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
    }
  }

  private setupMockConfiguration(): void {
    Sentry.setTag('app_component', 'meal_master_ai');
    Sentry.setTag('platform', Platform.OS);
    Sentry.setTag('mock_mode', 'true');

    console.log('[SentryIntegration] Mock configuration applied');
  }

  // Report detailed error (called by ErrorManager)
  reportError(detailedError: DetailedError): void {
    if (!this.isInitialized) {
      console.warn('[SentryIntegration] Not initialized, skipping error report');
      return;
    }

    try {
      Sentry.withScope((scope) => {
        scope.setLevel(this.mapSeverityToLevel(detailedError.metadata.severity));
        scope.setTag('error_category', detailedError.metadata.category);
        scope.setTag('component', detailedError.context.component);
        scope.setTag('operation', detailedError.context.operation);
        scope.setTag('retryable', detailedError.metadata.retryable);
        scope.setTag('user_facing', detailedError.metadata.userFacing);

        scope.setContext('error_details', {
          errorId: detailedError.id,
          userMessage: detailedError.userMessage,
          recoveryActions: detailedError.recoveryActions,
          actionRequired: detailedError.metadata.actionRequired
        });

        scope.setContext('app_context', {
          appVersion: detailedError.context.appVersion,
          platform: Platform.OS,
          sessionId: detailedError.context.sessionId,
          deviceInfo: detailedError.context.deviceInfo
        });

        if (detailedError.context.userId) {
          scope.setUser({ id: detailedError.context.userId });
        }

        if (detailedError.originalError) {
          Sentry.captureException(detailedError.originalError);
        } else {
          Sentry.captureMessage(detailedError.message, { level: 'error' });
        }
      });

    } catch (sentryError) {
      console.error('[SentryIntegration] Failed to report error to mock Sentry:', sentryError);
    }
  }

  // Report performance issues
  reportPerformanceIssue(
    operation: string,
    duration: number,
    context: Partial<ErrorContext> = {}
  ): void {
    if (!this.isInitialized) return;

    try {
      Sentry.withScope((scope) => {
        scope.setTag('performance_issue', true);
        scope.setTag('operation', operation);
        scope.setTag('duration_ms', duration);

        scope.setContext('performance_context', {
          operation,
          duration,
          component: context.component,
          userId: context.userId,
          timestamp: Date.now()
        });

        Sentry.captureMessage(`Performance issue: ${operation} took ${duration}ms`, { level: 'warning' });
      });
    } catch (error) {
      console.error('[SentryIntegration] Failed to report performance issue:', error);
    }
  }

  // Report crash scenarios
  reportCrash(error: Error, context: Partial<ErrorContext> = {}): void {
    if (!this.isInitialized) return;

    try {
      Sentry.withScope((scope) => {
        scope.setLevel('fatal');
        scope.setTag('crash', true);
        scope.setTag('component', context.component || 'unknown');

        scope.setContext('crash_context', {
          component: context.component,
          operation: context.operation,
          userId: context.userId,
          platform: Platform.OS,
          timestamp: Date.now()
        });

        Sentry.captureException(error);
      });
    } catch (sentryError) {
      console.error('[SentryIntegration] Failed to report crash:', sentryError);
    }
  }

  // Set user context
  setUserContext(userId: string, userData?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser({
        id: userId,
        ...userData
      });
    } catch (error) {
      console.error('[SentryIntegration] Failed to set user context:', error);
    }
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data: data || undefined,
        level: 'info',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('[SentryIntegration] Failed to add breadcrumb:', error);
    }
  }

  // Enhanced error capture with categorization
  captureError(
    error: Error | string,
    context: EnhancedErrorContext,
    extra?: Record<string, any>
  ): string | null {
    try {
      if (!this.isInitialized) {
        console.warn('[SentryIntegration] Not initialized, falling back to console');
        console.error('[SentryIntegration] Error:', typeof error === 'string' ? error : error.message);
        return null;
      }

      const errorId = Sentry.captureException(
        typeof error === 'string' ? new Error(error) : error,
        {
          level: this.mapSeverityToSentryLevel(context.severity),
          tags: {
            category: context.category,
            severity: context.severity,
            component: context.component || 'unknown',
            operation: context.operation || 'unknown',
          },
          extra: {
            timestamp: context.timestamp || Date.now(),
            additionalData: context.additionalData,
            ...extra,
          },
          user: context.userId ? { id: context.userId } : undefined,
        }
      );

      return errorId;
    } catch (captureError) {
      console.error('[SentryIntegration] Failed to capture error:', captureError);
      console.error('[SentryIntegration] Original error was:', error);
      return null;
    }
  }

  private mapSeverityToLevel(severity: ErrorMetadata['severity']): 'fatal' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'error';
    }
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): 'fatal' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }

  // Performance monitoring
  startPerformanceTracking(
    operationName: string,
    op: string = 'function',
    tags?: Record<string, string>
  ): string {
    const transactionId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.performanceTransactions.set(transactionId, {
      transaction: null, // Mock transaction
      operationName,
      startTime: Date.now(),
    });

    console.log(`[Mock Sentry] Started performance tracking for ${operationName} [${transactionId}]`);
    return transactionId;
  }

  finishPerformanceTracking(
    transactionId: string,
    success: boolean = true,
    errorMessage?: string,
    additionalData?: Record<string, any>
  ): PerformanceMetrics | null {
    const transactionData = this.performanceTransactions.get(transactionId);
    if (!transactionData) {
      console.warn(`[Mock Sentry] Performance transaction ${transactionId} not found`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - transactionData.startTime;

    this.performanceTransactions.delete(transactionId);

    const metrics: PerformanceMetrics = {
      operationName: transactionData.operationName,
      startTime: transactionData.startTime,
      endTime,
      duration,
      success,
      errorMessage,
      data: additionalData,
    };

    console.log(`[Mock Sentry] Performance: ${transactionData.operationName} completed in ${duration}ms [${success ? 'SUCCESS' : 'FAILED'}]`);

    return metrics;
  }

  // API call performance tracking
  async trackApiCall<T>(
    apiName: string,
    operation: () => Promise<T>,
    context?: Partial<EnhancedErrorContext>
  ): Promise<T> {
    const transactionId = this.startPerformanceTracking(`api_${apiName}`, 'http.client', {
      api_name: apiName,
      component: context?.component || 'api',
    });

    try {
      const result = await operation();
      this.finishPerformanceTracking(transactionId, true, undefined, { api_name: apiName });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.finishPerformanceTracking(transactionId, false, errorMessage, { api_name: apiName });

      // Capture the API error
      this.captureError(error instanceof Error ? error : new Error(errorMessage), {
        category: 'api_error',
        severity: 'high',
        component: context?.component || 'ApiClient',
        operation: `api_${apiName}`,
        additionalData: { apiName, ...context?.additionalData },
      });

      throw error;
    }
  }

  // User interaction tracking
  trackUserInteraction(
    interactionName: string,
    screen: string,
    additionalData?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message: `User interaction: ${interactionName}`,
      category: 'user_interaction',
      data: {
        interaction: interactionName,
        screen,
        ...additionalData,
      },
      level: 'info',
    });
  }

  // Get current Sentry status
  getStatus(): { initialized: boolean; hasClient: boolean; environment: string; mode: string } {
    return {
      initialized: this.isInitialized,
      hasClient: this.isInitialized,
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
      mode: 'mock'
    };
  }

  // Manual flush for critical errors
  async flush(timeout: number = 5000): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await Sentry.flush();
      return true;
    } catch (error) {
      console.error('[SentryIntegration] Failed to flush:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sentryIntegration = SentryIntegration.getInstance();

// Export convenience functions for easy integration
export const reportError = (error: DetailedError) => sentryIntegration.reportError(error);
export const reportCrash = (error: Error, context?: Partial<ErrorContext>) =>
  sentryIntegration.reportCrash(error, context);
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) =>
  sentryIntegration.addBreadcrumb(message, category, data);
export const setUserContext = (userId: string, userData?: Record<string, any>) =>
  sentryIntegration.setUserContext(userId, userData);

// Convenience functions for enhanced error tracking
export const captureError = (error: Error | string, context: EnhancedErrorContext, extra?: Record<string, any>) =>
  sentryIntegration.captureError(error, context, extra);

export const trackApiCall = <T>(apiName: string, operation: () => Promise<T>, context?: Partial<EnhancedErrorContext>) =>
  sentryIntegration.trackApiCall(apiName, operation, context);

export const trackUserInteraction = (interaction: string, screen: string, data?: Record<string, any>) =>
  sentryIntegration.trackUserInteraction(interaction, screen, data);