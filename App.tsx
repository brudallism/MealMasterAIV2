// App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize mock Sentry integration for development stability
    try {
      const { sentryIntegration } = require('./src/services/error/sentry-integration');
      sentryIntegration.initialize({
        environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
        debug: __DEV__,
      });
      console.log('[App] Mock Sentry integration initialized for development');
    } catch (error) {
      console.warn('[App] Mock Sentry initialization failed:', error.message);
    }
  }, []);

  return <AppNavigator />;
}