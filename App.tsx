// App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import PrivacyConsentModal from './src/components/molecules/PrivacyConsentModal';
import { useUserStore } from './src/stores/user-store';
import { useMealStore } from './src/stores/meal-store';
import { useMicronutrientsStore } from './src/stores/micronutrients-store';

export default function App() {
  const { needsPrivacyConsent, setPrivacyConsents } = useUserStore();
  const { initializeMockData } = useMealStore();
  const { initialize } = useMicronutrientsStore();

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
      console.warn('[App] Mock Sentry initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Initialize mock data for testing
    try {
      initialize(); // Initialize micronutrients store with default selection
      initializeMockData(); // Initialize meal data with realistic nutrition values
      console.log('[App] Mock data initialization completed');
    } catch (error) {
      console.warn('[App] Mock data initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [initialize, initializeMockData]);

  const handlePrivacyDecline = () => {
    // For now, just log the decline - in production you might want to exit the app
    // or show limited functionality
    console.warn('[App] User declined privacy consent');
    // TODO: Handle privacy decline (exit app, limited mode, etc.)
  };

  return (
    <>
      <AppNavigator />
      <PrivacyConsentModal
        visible={needsPrivacyConsent}
        onAccept={(consents) => {
          console.log('[App] Privacy consents accepted:', consents);
          setPrivacyConsents(consents);
        }}
        onDecline={handlePrivacyDecline}
        isFirstTime={true}
      />
    </>
  );
}