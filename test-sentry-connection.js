#!/usr/bin/env node
// test-sentry-connection.js
// Test script to verify Sentry connection and send test events

require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing Sentry Connection');
console.log('============================');

// Test environment variables
console.log('\n1. Checking Environment Variables...');
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const environment = process.env.EXPO_PUBLIC_ENVIRONMENT;
const appVersion = process.env.EXPO_PUBLIC_APP_VERSION;

console.log(`   DSN: ${dsn ? '✅ Set' : '❌ Missing'}`);
console.log(`   Environment: ${environment || 'development'}`);
console.log(`   App Version: ${appVersion || '1.0.0'}`);

if (!dsn) {
  console.error('\n❌ EXPO_PUBLIC_SENTRY_DSN is not set!');
  process.exit(1);
}

// Test Sentry initialization
console.log('\n2. Testing Sentry Integration...');

try {
  // Import and initialize Sentry
  const Sentry = require('@sentry/react-native');

  console.log('   📦 Sentry package loaded successfully');

  // Initialize Sentry
  Sentry.init({
    dsn: dsn,
    environment: environment || 'development',
    debug: true,
    release: appVersion || '1.0.0',
  });

  console.log('   ✅ Sentry initialized successfully');

  // Test error capture
  console.log('\n3. Sending Test Events...');

  // Send test message
  const messageId = Sentry.captureMessage('Test message from error integration test', 'info');
  console.log(`   📨 Test message sent (ID: ${messageId})`);

  // Send test error
  const testError = new Error('Test error from integration test');
  testError.stack = `Error: Test error from integration test
    at testSentryConnection (test-sentry-connection.js:45:23)
    at Object.<anonymous> (test-sentry-connection.js:60:1)`;

  const errorId = Sentry.captureException(testError, {
    tags: {
      test: true,
      component: 'TestScript',
      severity: 'info',
    },
    extra: {
      testData: 'This is test data',
      timestamp: new Date().toISOString(),
    },
  });
  console.log(`   🐛 Test error sent (ID: ${errorId})`);

  // Add test breadcrumb
  Sentry.addBreadcrumb({
    message: 'Test breadcrumb',
    category: 'test',
    data: {
      action: 'connection_test',
      timestamp: Date.now(),
    },
    level: 'info',
  });
  console.log('   🍞 Test breadcrumb added');

  // Set test user
  Sentry.setUser({
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'test_user',
  });
  console.log('   👤 Test user context set');

  // Send another error with user context
  const userError = new Error('Test error with user context');
  const userErrorId = Sentry.captureException(userError, {
    tags: {
      test: true,
      userContext: true,
    },
  });
  console.log(`   👤🐛 User context error sent (ID: ${userErrorId})`);

  console.log('\n4. Flushing Events to Sentry...');

  // Flush events to Sentry
  Sentry.flush(5000).then(() => {
    console.log('   ✅ Events flushed successfully');
    console.log('\n🎉 Sentry connection test completed!');
    console.log('\n📋 Check your Sentry dashboard at:');
    console.log('   https://sentry.io/organizations/meal-master-ai/projects/meal-master-ai-react-native/');
    console.log('\n📧 You should see:');
    console.log('   • 1 info message: "Test message from error integration test"');
    console.log('   • 2 error events: "Test error from integration test" and "Test error with user context"');
    console.log('   • User context: test-user-123 (test@example.com)');
    console.log('   • Breadcrumb: "Test breadcrumb"');
    console.log('   • Tags: test=true, component=TestScript');

    process.exit(0);
  }).catch((error) => {
    console.error('   ❌ Failed to flush events:', error);
    console.log('\n⚠️  Events may still be sent in the background.');
    console.log('   Check your Sentry dashboard in a few minutes.');
    process.exit(1);
  });

} catch (error) {
  console.error('\n❌ Sentry integration test failed:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}