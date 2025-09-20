// test-simple-sentry.js
// Simple test to verify Sentry integration without React Native context

console.log('🔧 Testing Sentry Integration Components...');

try {
  // Test 1: Check if environment variables are loaded
  console.log('\n1. Environment Variables:');
  console.log('   DSN set:', !!process.env.EXPO_PUBLIC_SENTRY_DSN);
  console.log('   Environment:', process.env.EXPO_PUBLIC_ENVIRONMENT);

  // Test 2: Check if we can import the modules without errors
  console.log('\n2. Module Imports:');

  const { sentryIntegration } = require('./src/services/error/sentry-integration');
  console.log('   ✅ SentryIntegration imported successfully');

  const { errorManager } = require('./src/services/error/error-manager');
  console.log('   ✅ ErrorManager imported successfully');

  // Test 3: Check if Sentry integration can be initialized
  console.log('\n3. Initialization Test:');

  const status = sentryIntegration.getStatus();
  console.log('   Status:', status);

  // Test 4: Test creating an error without initialization
  console.log('\n4. Error Creation Test:');

  const testError = errorManager.createError(
    'Simple test error from Node.js',
    {
      component: 'TestScript',
      operation: 'simple_test',
      timestamp: Date.now(),
    },
    {
      severity: 'low', // Won't be sent to Sentry
      category: 'system',
    }
  );

  console.log('   ✅ Error created:', testError.id);
  console.log('   ✅ Severity:', testError.metadata.severity);
  console.log('   ✅ User message:', testError.userMessage);

  console.log('\n🎉 Basic integration test successful!');
  console.log('\nNext steps:');
  console.log('1. Run the app: npm start');
  console.log('2. Navigate to Settings > Development Tools');
  console.log('3. Use the "Test Sentry Connection" button');

} catch (error) {
  console.error('\n❌ Integration test failed:', error.message);
  console.error('Stack:', error.stack);

  if (error.message.includes('circular dependency')) {
    console.error('\n🔄 This appears to be a circular dependency issue.');
    console.error('   Please check the import statements in the error files.');
  }
}