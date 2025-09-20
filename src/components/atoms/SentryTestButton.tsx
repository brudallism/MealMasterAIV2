// src/components/atoms/SentryTestButton.tsx
// Test component to verify Sentry integration in the app

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export const SentryTestButton: React.FC = () => {
  const testSentryConnection = () => {
    try {
      console.log('🔧 Testing Sentry Integration...');

      // Dynamic imports to avoid circular dependency issues
      const { sentryIntegration } = require('../../services/error/sentry-integration');
      const { errorManager } = require('../../services/error/error-manager');

      // Test 1: Check if Sentry is initialized
      const status = sentryIntegration.getStatus();
      console.log('Sentry Status:', status);

      // Test 2: Set user context
      sentryIntegration.setUserContext('test-user-123', {
        email: 'test@mealmaster.ai',
        plan: 'test',
        testSession: true,
      });
      console.log('✅ User context set');

      // Test 3: Add breadcrumb
      sentryIntegration.addBreadcrumb(
        'Sentry test button clicked',
        'user_interaction',
        {
          component: 'SentryTestButton',
          timestamp: Date.now(),
          testData: true,
        }
      );
      console.log('✅ Breadcrumb added');

      // Test 4: Report a test error through ErrorManager
      const testError = errorManager.createError(
        'Test error from Sentry test button',
        {
          userId: 'test-user-123',
          component: 'SentryTestButton',
          operation: 'test_error_reporting',
          timestamp: Date.now(),
          appVersion: '1.0.0-test',
        },
        {
          severity: 'medium', // Will be reported to Sentry
          category: 'system',
          retryable: false,
          userFacing: true,
          actionRequired: false,
          telemetryData: {
            testRun: true,
            buttonClick: true,
          },
        }
      );
      console.log('✅ Test error created and reported:', testError.id);

      // Test 5: Test high severity error
      const criticalError = errorManager.createError(
        new Error('Critical test error for Sentry verification'),
        {
          userId: 'test-user-123',
          component: 'SentryTestButton',
          operation: 'critical_test',
          timestamp: Date.now(),
        },
        {
          severity: 'critical',
          category: 'system',
          retryable: false,
          userFacing: true,
          actionRequired: true,
        }
      );
      console.log('✅ Critical error created and reported:', criticalError.id);

      // Test 6: Report performance issue
      sentryIntegration.reportPerformanceIssue(
        'test_slow_operation',
        3500, // 3.5 seconds
        {
          component: 'SentryTestButton',
          operation: 'performance_test',
          userId: 'test-user-123',
        }
      );
      console.log('✅ Performance issue reported');

      // Test 7: Test crash reporting
      sentryIntegration.reportCrash(
        new Error('Test crash simulation'),
        {
          component: 'SentryTestButton',
          operation: 'crash_test',
          userId: 'test-user-123',
        }
      );
      console.log('✅ Crash simulation reported');

      // Test 8: Flush events
      sentryIntegration.flush(5000).then((success) => {
        console.log(`✅ Events flushed: ${success ? 'SUCCESS' : 'FAILED'}`);

        Alert.alert(
          'Sentry Test Complete',
          `Test completed! Check your Sentry dashboard for:\n\n` +
          `• Test error (medium severity)\n` +
          `• Critical error\n` +
          `• Performance issue\n` +
          `• Crash simulation\n` +
          `• User context: test-user-123\n` +
          `• Breadcrumb trail\n\n` +
          `Status: ${status.initialized ? 'Connected' : 'Not Connected'}`,
          [{ text: 'OK' }]
        );
      });

    } catch (error) {
      console.error('❌ Sentry test failed:', error);
      Alert.alert(
        'Sentry Test Failed',
        `Error: ${error.message}\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    }
  };

  const testErrorManagerOnly = () => {
    try {
      console.log('🔧 Testing Error Manager (without Sentry)...');

      // Dynamic import to avoid circular dependency
      const { errorManager } = require('../../services/error/error-manager');

      // Test error manager functionality
      const error1 = errorManager.createError(
        'Low severity test - should not go to Sentry',
        {
          component: 'SentryTestButton',
          operation: 'low_severity_test',
          timestamp: Date.now(),
        },
        {
          severity: 'low', // Should NOT be reported to Sentry
          category: 'user',
        }
      );

      const error2 = errorManager.handleFoodRecognitionError(
        'Could not recognize test food',
        'test-user-123',
        'mysterious test blob',
        'validation'
      );

      const error3 = errorManager.handleAPIError(
        new Error('Test API error'),
        'openai',
        '/test/endpoint',
        'test-user-123'
      );

      const stats = errorManager.getErrorStats();

      Alert.alert(
        'Error Manager Test Complete',
        `Created 3 test errors:\n\n` +
        `• Low severity (local only)\n` +
        `• Food recognition error\n` +
        `• API error\n\n` +
        `Total errors in queue: ${stats.totalErrors}\n` +
        `Check console for details.`,
        [{ text: 'OK' }]
      );

      console.log('✅ Error Manager test completed');
      console.log('Error Statistics:', stats);

    } catch (error) {
      console.error('❌ Error Manager test failed:', error);
      Alert.alert(
        'Error Manager Test Failed',
        `Error: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentry Integration Test</Text>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={testSentryConnection}
      >
        <Text style={styles.buttonText}>Test Sentry Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={testErrorManagerOnly}
      >
        <Text style={styles.buttonText}>Test Error Manager</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        1. Tap "Test Sentry Connection" to send test events to your Sentry dashboard{'\n'}
        2. Check the console logs for detailed results{'\n'}
        3. Check your Sentry dashboard at sentry.io
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SentryTestButton;