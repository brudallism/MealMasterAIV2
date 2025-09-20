// quick-sentry-test.js
// Quick test to verify the modules can be loaded

console.log('🔧 Quick Sentry Module Test');
console.log('============================');

try {
  // Test environment setup
  require('dotenv').config({ path: '.env.local' });

  console.log('✅ Environment loaded');
  console.log('   DSN available:', !!process.env.EXPO_PUBLIC_SENTRY_DSN);

  // Test if we can at least load the basic React Native modules
  console.log('\n📦 Testing basic dependencies...');

  try {
    require('@sentry/react-native');
    console.log('✅ @sentry/react-native can be loaded');
  } catch (e) {
    console.log('❌ @sentry/react-native failed:', e.message);
  }

  console.log('\n🎉 Basic module test completed!');
  console.log('\nTo test the full integration:');
  console.log('1. Start the app: npm start');
  console.log('2. Check the console for "[App] Sentry integration initialized"');
  console.log('3. Navigate to Settings > Development Tools');
  console.log('4. Use the test buttons to verify functionality');

} catch (error) {
  console.error('❌ Test failed:', error.message);
}