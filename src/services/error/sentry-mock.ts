// src/services/error/sentry-mock.ts
// Mock Sentry implementation for development/testing when Sentry package has issues

export const MockSentry = {
  init: (config: any) => {
    console.log('[MockSentry] Initialized with config:', {
      dsn: config.dsn ? '***configured***' : 'not set',
      environment: config.environment,
      debug: config.debug,
    });
  },

  captureException: (error: Error, options?: any) => {
    const eventId = `mock-error-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log('[MockSentry] Captured exception:', {
      eventId,
      message: error.message,
      tags: options?.tags,
      extra: options?.extra,
      user: options?.user,
    });
    return eventId;
  },

  captureMessage: (message: string, level?: string, options?: any) => {
    const eventId = `mock-message-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log('[MockSentry] Captured message:', {
      eventId,
      message,
      level,
      tags: options?.tags,
      extra: options?.extra,
    });
    return eventId;
  },

  withScope: (callback: (scope: any) => void) => {
    const mockScope = {
      setLevel: (level: string) => console.log('[MockSentry] Set level:', level),
      setTag: (key: string, value: any) => console.log('[MockSentry] Set tag:', key, '=', value),
      setContext: (key: string, context: any) => console.log('[MockSentry] Set context:', key, context),
      setUser: (user: any) => console.log('[MockSentry] Set user:', user),
    };
    callback(mockScope);
  },

  setUser: (user: any) => {
    console.log('[MockSentry] Set user globally:', user);
  },

  addBreadcrumb: (breadcrumb: any) => {
    console.log('[MockSentry] Added breadcrumb:', breadcrumb);
  },

  flush: async (timeout?: number) => {
    console.log('[MockSentry] Flushing events (timeout:', timeout, 'ms)');
    return true;
  },
};

// Detect if we should use mock or real Sentry
let shouldUseMock = false;

try {
  require('@sentry/react-native');
  shouldUseMock = false;
} catch (error) {
  console.warn('[Sentry] Using mock implementation due to package issues:', error.message);
  shouldUseMock = true;
}

export { shouldUseMock };