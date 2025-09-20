// src/services/error/error-manager.ts
// Comprehensive error handling and monitoring system for production
// Enhanced with Sentry integration for crash reporting and error monitoring

export interface ErrorContext {
  userId?: string;
  component: string;
  operation: string;
  timestamp: number;
  sessionId?: string;
  appVersion?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    networkStatus: 'online' | 'offline' | 'slow';
  };
}

export interface ErrorMetadata {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'api' | 'validation' | 'system' | 'user' | 'performance';
  retryable: boolean;
  userFacing: boolean;
  actionRequired: boolean;
  telemetryData?: Record<string, any>;
}

export interface DetailedError {
  id: string;
  type: string;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  metadata: ErrorMetadata;
  stackTrace?: string;
  userMessage: string;
  recoveryActions: string[];
  timestamp: number;
}

export class ErrorManager {
  private static instance: ErrorManager;
  private errorQueue: DetailedError[] = [];
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Progressive backoff
  private sentryIntegration?: any; // Will be lazy-loaded to avoid circular dependency

  private constructor() {}

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  // Create a comprehensive error from basic error information
  createError(
    error: Error | string,
    context: ErrorContext,
    metadata: Partial<ErrorMetadata> = {}
  ): DetailedError {
    const errorId = this.generateErrorId();
    const originalError = error instanceof Error ? error : new Error(error);
    const message = originalError.message;

    const fullMetadata: ErrorMetadata = {
      severity: metadata.severity || this.determineSeverity(message, context),
      category: metadata.category || this.categorizeError(message, context),
      retryable: metadata.retryable ?? this.isRetryable(message, context),
      userFacing: metadata.userFacing ?? true,
      actionRequired: metadata.actionRequired ?? false,
      telemetryData: metadata.telemetryData || {}
    };

    const detailedError: DetailedError = {
      id: errorId,
      type: originalError.name || 'ApplicationError',
      message,
      originalError,
      context,
      metadata: fullMetadata,
      stackTrace: originalError.stack,
      userMessage: this.generateUserMessage(message, fullMetadata),
      recoveryActions: this.generateRecoveryActions(message, fullMetadata),
      timestamp: Date.now()
    };

    this.logError(detailedError);
    this.queueError(detailedError);
    this.reportToSentry(detailedError);

    return detailedError;
  }

  // Food Recognition AI specific error handling
  handleFoodRecognitionError(
    error: Error | string,
    userId: string,
    foodDescription: string,
    operation: 'validation' | 'processing' | 'caching' | 'api_call'
  ): DetailedError {
    const context: ErrorContext = {
      userId,
      component: 'FoodRecognitionAI',
      operation,
      timestamp: Date.now(),
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || 'unknown'
    };

    const metadata: Partial<ErrorMetadata> = {
      telemetryData: {
        foodDescription: foodDescription.substring(0, 100), // Limit PII
        operationType: operation
      }
    };

    return this.createError(error, context, metadata);
  }

  // API Client error handling
  handleAPIError(
    error: Error | string,
    apiProvider: 'openai' | 'spoonacular' | 'usda',
    endpoint: string,
    userId?: string
  ): DetailedError {
    const context: ErrorContext = {
      userId,
      component: `${apiProvider}Client`,
      operation: `api_call_${endpoint}`,
      timestamp: Date.now()
    };

    const metadata: Partial<ErrorMetadata> = {
      category: 'api',
      retryable: true,
      telemetryData: {
        apiProvider,
        endpoint,
        networkTimestamp: Date.now()
      }
    };

    return this.createError(error, context, metadata);
  }

  // Cache system error handling
  handleCacheError(
    error: Error | string,
    cacheType: 'user' | 'global' | 'database',
    operation: 'read' | 'write' | 'clear',
    userId: string
  ): DetailedError {
    const context: ErrorContext = {
      userId,
      component: 'FoodCacheManager',
      operation: `${cacheType}_cache_${operation}`,
      timestamp: Date.now()
    };

    const metadata: Partial<ErrorMetadata> = {
      category: 'system',
      severity: cacheType === 'database' ? 'medium' : 'low',
      retryable: operation === 'write',
      actionRequired: cacheType === 'database',
      telemetryData: {
        cacheType,
        operation
      }
    };

    return this.createError(error, context, metadata);
  }

  // Network and connectivity error handling
  handleNetworkError(
    error: Error | string,
    operation: string,
    userId?: string
  ): DetailedError {
    const context: ErrorContext = {
      userId,
      component: 'NetworkLayer',
      operation,
      timestamp: Date.now(),
      deviceInfo: {
        platform: 'mobile', // Would be dynamically determined
        version: '1.0.0',
        networkStatus: 'offline' // Would be dynamically determined
      }
    };

    const metadata: Partial<ErrorMetadata> = {
      category: 'network',
      severity: 'high',
      retryable: true,
      userFacing: true,
      telemetryData: {
        networkOperation: operation
      }
    };

    return this.createError(error, context, metadata);
  }

  // Retry mechanism with exponential backoff
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3
  ): Promise<{ success: boolean; data?: T; error?: DetailedError }> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await operation();
        
        // Log successful retry if not first attempt
        if (attempt > 0) {
          console.log(`[ErrorManager] Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return { success: true, data };
        
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          const detailedError = this.createError(
            error instanceof Error ? error : new Error(String(error)),
            { ...context, operation: `${context.operation}_retry_${attempt}` },
            { severity: 'high', actionRequired: true }
          );
          
          return { success: false, error: detailedError };
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.RETRY_DELAYS[Math.min(attempt, this.RETRY_DELAYS.length - 1)];
        console.log(`[ErrorManager] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    // Should never reach here, but TypeScript requires it
    const fallbackError = this.createError(
      'Maximum retries exceeded',
      context,
      { severity: 'critical' }
    );
    return { success: false, error: fallbackError };
  }

  // Circuit breaker pattern for API failures
  private circuitBreakerStates = new Map<string, {
    failures: number;
    lastFailTime: number;
    state: 'closed' | 'open' | 'half-open';
  }>();

  isCircuitOpen(service: string): boolean {
    const state = this.circuitBreakerStates.get(service);
    if (!state) return false;

    if (state.state === 'open') {
      // Check if enough time has passed to try half-open
      if (Date.now() - state.lastFailTime > 60000) { // 1 minute
        state.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  recordSuccess(service: string): void {
    const state = this.circuitBreakerStates.get(service);
    if (state) {
      state.failures = 0;
      state.state = 'closed';
    }
  }

  recordFailure(service: string): void {
    const state = this.circuitBreakerStates.get(service) || {
      failures: 0,
      lastFailTime: 0,
      state: 'closed' as const
    };

    state.failures++;
    state.lastFailTime = Date.now();

    if (state.failures >= 5) {
      state.state = 'open';
      console.log(`[ErrorManager] Circuit breaker opened for ${service}`);
    }

    this.circuitBreakerStates.set(service, state);
  }

  // Generate user-friendly error messages
  private generateUserMessage(message: string, metadata: ErrorMetadata): string {
    if (!metadata.userFacing) return 'An internal error occurred';

    switch (metadata.category) {
      case 'network':
        return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
      
      case 'api':
        return "We're experiencing issues with our food database. Please try again in a few moments.";
      
      case 'validation':
        return "Please check your input and try again. Make sure you've provided a valid food description.";
      
      case 'performance':
        return "The app is running slowly. We're working to improve performance.";
      
      case 'system':
        return metadata.severity === 'critical' 
          ? "Something went wrong. Please restart the app and try again."
          : "We encountered a minor issue. Please try again.";
      
      default:
        return "Something went wrong. Please try again or contact support if the problem persists.";
    }
  }

  // Generate recovery action suggestions
  private generateRecoveryActions(message: string, metadata: ErrorMetadata): string[] {
    const actions: string[] = [];

    switch (metadata.category) {
      case 'network':
        actions.push('Check your internet connection');
        actions.push('Try switching between WiFi and mobile data');
        actions.push('Wait a moment and try again');
        break;
      
      case 'api':
        if (metadata.retryable) {
          actions.push('Wait a few moments and try again');
          actions.push('Check your internet connection');
        }
        actions.push('Contact support if the issue persists');
        break;
      
      case 'validation':
        actions.push('Double-check your food description');
        actions.push('Try describing the food differently');
        actions.push('Make sure you\'ve entered a recognizable food item');
        break;
      
      case 'system':
        if (metadata.severity === 'critical') {
          actions.push('Restart the app');
          actions.push('Update to the latest version');
          actions.push('Clear app cache');
        } else {
          actions.push('Try again');
        }
        break;
    }

    if (metadata.actionRequired) {
      actions.push('Contact support with error details');
    }

    return actions;
  }

  // Error categorization logic
  private categorizeError(message: string, context: ErrorContext): ErrorMetadata['category'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout') || 
        lowerMessage.includes('connection') || lowerMessage.includes('fetch')) {
      return 'network';
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('openai') || 
        lowerMessage.includes('spoonacular') || lowerMessage.includes('usda')) {
      return 'api';
    }
    
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
        lowerMessage.includes('required') || lowerMessage.includes('missing')) {
      return 'validation';
    }
    
    if (lowerMessage.includes('slow') || lowerMessage.includes('timeout') ||
        lowerMessage.includes('performance')) {
      return 'performance';
    }
    
    if (context.component === 'FoodCacheManager' || lowerMessage.includes('cache')) {
      return 'system';
    }
    
    return 'system';
  }

  // Severity determination logic
  private determineSeverity(message: string, context: ErrorContext): ErrorMetadata['severity'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') ||
        lowerMessage.includes('crash') || lowerMessage.includes('corrupt')) {
      return 'critical';
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('network') ||
        lowerMessage.includes('database') || context.operation.includes('api')) {
      return 'high';
    }
    
    if (lowerMessage.includes('cache') || lowerMessage.includes('performance') ||
        lowerMessage.includes('slow')) {
      return 'medium';
    }
    
    return 'low';
  }

  // Check if error is retryable
  private isRetryable(message: string, context: ErrorContext): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Non-retryable errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
        lowerMessage.includes('permission') || lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden')) {
      return false;
    }
    
    // Retryable errors
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout') ||
        lowerMessage.includes('api') || lowerMessage.includes('server') ||
        lowerMessage.includes('connection')) {
      return true;
    }
    
    // Cache errors are usually retryable
    if (context.component === 'FoodCacheManager') {
      return true;
    }
    
    return false;
  }

  // Utility methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(error: DetailedError): void {
    const logLevel = error.metadata.severity === 'critical' ? 'error' : 
                    error.metadata.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel](`[ErrorManager] ${error.id}:`, {
      message: error.message,
      component: error.context.component,
      operation: error.context.operation,
      severity: error.metadata.severity,
      category: error.metadata.category,
      userId: error.context.userId
    });
  }

  private queueError(error: DetailedError): void {
    this.errorQueue.push(error);
    
    // Maintain queue size
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue = this.errorQueue.slice(-this.MAX_QUEUE_SIZE);
    }
  }

  // Get error statistics for monitoring
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: DetailedError[];
  } {
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentErrors = this.errorQueue.filter(err => err.timestamp > last24Hours);
    
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    recentErrors.forEach(error => {
      errorsByCategory[error.metadata.category] = (errorsByCategory[error.metadata.category] || 0) + 1;
      errorsBySeverity[error.metadata.severity] = (errorsBySeverity[error.metadata.severity] || 0) + 1;
    });
    
    return {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    };
  }

  // Clear old errors (called periodically)
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.errorQueue = this.errorQueue.filter(error => error.timestamp > cutoff);
  }

  // Report error to Sentry (lazy-loaded to avoid circular dependency)
  private reportToSentry(detailedError: DetailedError): void {
    try {
      if (!this.sentryIntegration) {
        // Lazy load Sentry integration to avoid circular dependency
        this.sentryIntegration = require('./sentry-integration').sentryIntegration;
      }

      // Only report to Sentry if severity is medium or higher
      if (detailedError.metadata.severity === 'medium' ||
          detailedError.metadata.severity === 'high' ||
          detailedError.metadata.severity === 'critical') {

        this.sentryIntegration?.reportError?.(detailedError);
      }
    } catch (error) {
      // Never let Sentry reporting break the error manager
      console.warn('[ErrorManager] Failed to report to Sentry:', error);
    }
  }
}

// Export singleton instance
export const errorManager = ErrorManager.getInstance();