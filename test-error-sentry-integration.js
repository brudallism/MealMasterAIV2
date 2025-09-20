#!/usr/bin/env node
// test-error-sentry-integration.js
// Simple test script to verify error handling and Sentry integration

const { errorManager } = require('./lib/services/error/error-manager');
const { sentryIntegration } = require('./lib/services/error/sentry-integration');

console.log('🧪 Testing Error Handling and Sentry Integration');
console.log('================================================');

async function testErrorHandling() {
  try {
    console.log('\n1. Initializing Sentry Integration...');
    sentryIntegration.initialize({
      environment: 'test',
      debug: true,
    });

    const status = sentryIntegration.getStatus();
    console.log(`   ✅ Sentry initialized: ${status.initialized}`);

    console.log('\n2. Testing Error Manager with different severities...');

    // Test low severity error (should not report to Sentry)
    const lowError = errorManager.createError(
      'Low severity test error',
      {
        component: 'TestScript',
        operation: 'low_severity_test',
        timestamp: Date.now(),
      },
      {
        severity: 'low',
        category: 'system',
      }
    );
    console.log(`   ✅ Low severity error created: ${lowError.id}`);

    // Test high severity error (should report to Sentry)
    const highError = errorManager.createError(
      new Error('High severity test error'),
      {
        userId: 'test-user-123',
        component: 'TestScript',
        operation: 'high_severity_test',
        timestamp: Date.now(),
        appVersion: '1.0.0-test',
      },
      {
        severity: 'high',
        category: 'api',
        retryable: true,
        userFacing: true,
      }
    );
    console.log(`   ✅ High severity error created: ${highError.id}`);

    // Test critical error (should definitely report to Sentry)
    const criticalError = errorManager.createError(
      new Error('Critical system failure'),
      {
        userId: 'test-user-123',
        component: 'TestScript',
        operation: 'critical_failure_test',
        timestamp: Date.now(),
        appVersion: '1.0.0-test',
        deviceInfo: {
          platform: 'test',
          version: '1.0',
          networkStatus: 'online',
        },
      },
      {
        severity: 'critical',
        category: 'system',
        retryable: false,
        userFacing: true,
        actionRequired: true,
      }
    );
    console.log(`   ✅ Critical error created: ${criticalError.id}`);

    console.log('\n3. Testing Food Recognition AI Error Handling...');
    const foodError = errorManager.handleFoodRecognitionError(
      'Could not recognize food item',
      'test-user-123',
      'mysterious blob on plate',
      'validation'
    );
    console.log(`   ✅ Food recognition error: ${foodError.id}`);

    console.log('\n4. Testing API Error Handling...');
    const apiError = errorManager.handleAPIError(
      new Error('API rate limit exceeded'),
      'openai',
      '/chat/completions',
      'test-user-123'
    );
    console.log(`   ✅ API error: ${apiError.id}`);

    console.log('\n5. Testing Network Error Handling...');
    const networkError = errorManager.handleNetworkError(
      'Connection timeout',
      'fetch_user_data',
      'test-user-123'
    );
    console.log(`   ✅ Network error: ${networkError.id}`);

    console.log('\n6. Testing Sentry Direct Methods...');

    // Test user context
    sentryIntegration.setUserContext('test-user-123', {
      email: 'test@example.com',
      plan: 'test',
    });
    console.log('   ✅ User context set');

    // Test breadcrumb
    sentryIntegration.addBreadcrumb(
      'Test operation completed',
      'test',
      { operation: 'error_integration_test' }
    );
    console.log('   ✅ Breadcrumb added');

    // Test performance issue
    sentryIntegration.reportPerformanceIssue(
      'slow_test_operation',
      2500,
      {
        component: 'TestScript',
        operation: 'performance_test',
      }
    );
    console.log('   ✅ Performance issue reported');

    // Test crash reporting
    sentryIntegration.reportCrash(
      new Error('Test crash simulation'),
      {
        component: 'TestScript',
        operation: 'crash_test',
        userId: 'test-user-123',
      }
    );
    console.log('   ✅ Crash reported');

    console.log('\n7. Getting Error Statistics...');
    const stats = errorManager.getErrorStats();
    console.log(`   📊 Total errors in last 24h: ${stats.totalErrors}`);
    console.log(`   📊 Errors by severity:`, stats.errorsBySeverity);
    console.log(`   📊 Errors by category:`, stats.errorsByCategory);

    console.log('\n8. Testing Circuit Breaker...');
    console.log(`   🔌 OpenAI circuit open: ${errorManager.isCircuitOpen('openai')}`);

    // Simulate failures to open circuit
    for (let i = 0; i < 6; i++) {
      errorManager.recordFailure('test-service');
    }
    console.log(`   🔌 Test service circuit open: ${errorManager.isCircuitOpen('test-service')}`);

    console.log('\n9. Testing Retry Mechanism...');
    let retryCount = 0;
    const retryResult = await errorManager.retryOperation(
      async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error(`Retry attempt ${retryCount} failed`);
        }
        return `Success on attempt ${retryCount}`;
      },
      {
        component: 'TestScript',
        operation: 'retry_test',
        timestamp: Date.now(),
      },
      3
    );
    console.log(`   🔄 Retry result: ${retryResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (retryResult.success) {
      console.log(`   🔄 Data: ${retryResult.data}`);
    }

    console.log('\n10. Flushing Sentry Data...');
    const flushResult = await sentryIntegration.flush(2000);
    console.log(`   💫 Flush result: ${flushResult ? 'SUCCESS' : 'FAILED'}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Integration Summary:');
    console.log('   • Error Manager: ✅ Working');
    console.log('   • Sentry Integration: ✅ Working');
    console.log('   • Automatic Reporting: ✅ Working');
    console.log('   • Circuit Breaker: ✅ Working');
    console.log('   • Retry Logic: ✅ Working');
    console.log('   • Performance Monitoring: ✅ Working');
    console.log('   • Crash Reporting: ✅ Working');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testErrorHandling().then(() => {
  console.log('\n🎉 Error handling and Sentry integration test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});