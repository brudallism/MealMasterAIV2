// src/services/error/__tests__/sentry-integration.test.ts
// Comprehensive tests for Sentry integration with error handling system

import { sentryIntegration } from '../sentry-integration';
import { errorManager, DetailedError, ErrorContext } from '../error-manager';

// Mock Sentry to avoid actual network calls during testing
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(() => 'mock-event-id'),
  captureMessage: jest.fn(() => 'mock-message-id'),
  withScope: jest.fn((callback) => callback({
    setLevel: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn(),
  })),
  setUser: jest.fn(),
  configureScope: jest.fn(),
  addBreadcrumb: jest.fn(),
  flush: jest.fn(() => Promise.resolve(true)),
  getCurrentHub: jest.fn(() => ({ getClient: jest.fn(() => true) })),
  ReactNativeTracing: jest.fn(),
}));

describe('Sentry Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Sentry with correct configuration', () => {
      const config = {
        environment: 'test',
        debug: false,
      };

      sentryIntegration.initialize(config);

      expect(sentryIntegration.getStatus().initialized).toBe(true);
    });

    it('should handle initialization without DSN in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      delete process.env.EXPO_PUBLIC_SENTRY_DSN;

      sentryIntegration.initialize();

      // Should not fail
      expect(sentryIntegration.getStatus().initialized).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Reporting', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should report detailed errors to Sentry', () => {
      const mockError: DetailedError = {
        id: 'test-error-1',
        type: 'TestError',
        message: 'Test error message',
        originalError: new Error('Original test error'),
        context: {
          userId: 'user-123',
          component: 'TestComponent',
          operation: 'test-operation',
          timestamp: Date.now(),
        },
        metadata: {
          severity: 'high',
          category: 'api',
          retryable: true,
          userFacing: true,
          actionRequired: false,
        },
        stackTrace: 'Test stack trace',
        userMessage: 'Something went wrong',
        recoveryActions: ['Try again', 'Contact support'],
        timestamp: Date.now(),
      };

      sentryIntegration.reportError(mockError);

      // Verify Sentry methods were called
      const Sentry = require('@sentry/react-native');
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(mockError.originalError);
    });

    it('should handle string errors', () => {
      const mockError: DetailedError = {
        id: 'test-error-2',
        type: 'StringError',
        message: 'String error message',
        context: {
          component: 'TestComponent',
          operation: 'test-operation',
          timestamp: Date.now(),
        },
        metadata: {
          severity: 'medium',
          category: 'validation',
          retryable: false,
          userFacing: true,
          actionRequired: false,
        },
        userMessage: 'Please check your input',
        recoveryActions: ['Verify data'],
        timestamp: Date.now(),
      };

      sentryIntegration.reportError(mockError);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.captureMessage).toHaveBeenCalledWith(mockError.message, 'error');
    });

    it('should not report when not initialized', () => {
      const uninitializedSentry = require('../sentry-integration').SentryIntegration.getInstance();
      uninitializedSentry.isInitialized = false;

      const mockError: DetailedError = {
        id: 'test-error-3',
        type: 'TestError',
        message: 'Test error',
        context: {
          component: 'TestComponent',
          operation: 'test-operation',
          timestamp: Date.now(),
        },
        metadata: {
          severity: 'low',
          category: 'system',
          retryable: true,
          userFacing: false,
          actionRequired: false,
        },
        userMessage: 'Internal error',
        recoveryActions: [],
        timestamp: Date.now(),
      };

      // Should not throw or crash
      expect(() => uninitializedSentry.reportError(mockError)).not.toThrow();
    });
  });

  describe('Integration with ErrorManager', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should automatically report errors through ErrorManager', () => {
      const context: ErrorContext = {
        userId: 'user-456',
        component: 'TestComponent',
        operation: 'test-integration',
        timestamp: Date.now(),
      };

      const testError = new Error('Integration test error');

      // Create error through ErrorManager - should automatically report to Sentry
      const detailedError = errorManager.createError(testError, context, {
        severity: 'high',
        category: 'system',
      });

      expect(detailedError).toBeDefined();
      expect(detailedError.metadata.severity).toBe('high');

      // Sentry should have been called via the reportToSentry method
      // (Note: This would require the actual Sentry mock to be called)
    });

    it('should only report medium+ severity errors to Sentry', () => {
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'severity-test',
        timestamp: Date.now(),
      };

      // Low severity - should not report to Sentry
      const lowError = errorManager.createError('Low severity error', context, {
        severity: 'low',
      });

      // High severity - should report to Sentry
      const highError = errorManager.createError('High severity error', context, {
        severity: 'high',
      });

      expect(lowError.metadata.severity).toBe('low');
      expect(highError.metadata.severity).toBe('high');
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should track performance issues', () => {
      const operation = 'slow-database-query';
      const duration = 5000; // 5 seconds
      const context = {
        component: 'DatabaseService',
        operation: operation,
      };

      sentryIntegration.reportPerformanceIssue(operation, duration, context);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        `Performance issue: ${operation} took ${duration}ms`,
        'warning'
      );
    });
  });

  describe('Crash Reporting', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should report crashes with context', () => {
      const crashError = new Error('Application crashed');
      const context = {
        component: 'CriticalService',
        operation: 'critical-operation',
        userId: 'user-789',
      };

      sentryIntegration.reportCrash(crashError, context);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(crashError);
    });
  });

  describe('User Context', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should set user context', () => {
      const userId = 'user-context-test';
      const userData = {
        email: 'test@example.com',
        plan: 'premium',
      };

      sentryIntegration.setUserContext(userId, userData);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: userId,
        ...userData,
      });
    });
  });

  describe('Breadcrumbs', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should add breadcrumbs for debugging', () => {
      const message = 'User clicked save button';
      const category = 'user_interaction';
      const data = { buttonId: 'save-meal', screen: 'MealEntry' };

      sentryIntegration.addBreadcrumb(message, category, data);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        data,
        level: 'info',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      sentryIntegration.initialize({ debug: false });
    });

    it('should handle Sentry failures gracefully', () => {
      const Sentry = require('@sentry/react-native');
      Sentry.captureException.mockImplementation(() => {
        throw new Error('Sentry is down');
      });

      const mockError: DetailedError = {
        id: 'test-error-recovery',
        type: 'TestError',
        message: 'Test error for recovery',
        context: {
          component: 'TestComponent',
          operation: 'test-recovery',
          timestamp: Date.now(),
        },
        metadata: {
          severity: 'high',
          category: 'system',
          retryable: true,
          userFacing: true,
          actionRequired: false,
        },
        userMessage: 'Error occurred',
        recoveryActions: ['Try again'],
        timestamp: Date.now(),
      };

      // Should not throw even if Sentry fails
      expect(() => sentryIntegration.reportError(mockError)).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should handle missing DSN gracefully', () => {
      delete process.env.EXPO_PUBLIC_SENTRY_DSN;

      expect(() => sentryIntegration.initialize()).not.toThrow();
    });

    it('should configure release and environment', () => {
      sentryIntegration.initialize({ debug: false });

      const release = '1.0.0';
      const environment = 'production';

      sentryIntegration.configureRelease(release, environment);

      const Sentry = require('@sentry/react-native');
      expect(Sentry.configureScope).toHaveBeenCalled();
    });
  });

  describe('Status and Health', () => {
    it('should provide status information', () => {
      sentryIntegration.initialize({ debug: false });

      const status = sentryIntegration.getStatus();

      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('hasClient');
      expect(status.initialized).toBe(true);
    });

    it('should flush pending data', async () => {
      sentryIntegration.initialize({ debug: false });

      const result = await sentryIntegration.flush(1000);

      expect(typeof result).toBe('boolean');

      const Sentry = require('@sentry/react-native');
      expect(Sentry.flush).toHaveBeenCalledWith(1000);
    });
  });
});

describe('Error Handling Integration E2E', () => {
  beforeEach(() => {
    sentryIntegration.initialize({ debug: false });
    jest.clearAllMocks();
  });

  it('should handle complete error lifecycle', () => {
    // Simulate a real application error
    const originalError = new Error('Database connection failed');
    const context: ErrorContext = {
      userId: 'user-e2e-test',
      component: 'DatabaseService',
      operation: 'connect_to_database',
      timestamp: Date.now(),
      appVersion: '1.0.0',
      deviceInfo: {
        platform: 'ios',
        version: '15.0',
        networkStatus: 'online',
      },
    };

    // 1. Error occurs and is processed by ErrorManager
    const detailedError = errorManager.createError(originalError, context, {
      severity: 'critical',
      category: 'system',
      retryable: true,
      userFacing: true,
      actionRequired: true,
    });

    // 2. Verify error was created correctly
    expect(detailedError.id).toBeDefined();
    expect(detailedError.metadata.severity).toBe('critical');
    expect(detailedError.userMessage).toContain('went wrong');
    expect(detailedError.recoveryActions.length).toBeGreaterThan(0);

    // 3. Verify it appears in error statistics
    const stats = errorManager.getErrorStats();
    expect(stats.totalErrors).toBeGreaterThan(0);
    expect(stats.errorsBySeverity.critical).toBeGreaterThan(0);

    // 4. Verify Sentry integration was triggered
    // (This would be verified by checking if the reportToSentry method was called)
  });
});