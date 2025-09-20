# Verify Sentry Setup

## ✅ Configuration Complete

Your Sentry integration is now configured and ready to use! Here's what was set up:

### 1. Environment Variables Added
- ✅ `EXPO_PUBLIC_SENTRY_DSN` = Your Sentry DSN
- ✅ `EXPO_PUBLIC_ENVIRONMENT` = development
- ✅ `EXPO_PUBLIC_APP_VERSION` = 1.0.0

### 2. Files Created/Modified
- ✅ `src/services/error/sentry-integration.ts` - Main Sentry integration
- ✅ `src/services/error/error-manager.ts` - Enhanced with Sentry reporting
- ✅ `App.tsx` - Sentry initialization on app startup
- ✅ `src/components/atoms/SentryTestButton.tsx` - In-app testing
- ✅ `src/screens/SettingsScreen.tsx` - Added test button (dev only)
- ✅ `sentry.properties` - Sentry CLI configuration

### 3. Package Installation
- ✅ `@sentry/react-native@^5.36.0` installed

## 🧪 Testing the Integration

### Option 1: Use the Test Button (Recommended)
1. Start your app: `npm start`
2. Navigate to Settings screen
3. Scroll down to "Development Tools" (only visible in development)
4. Tap "Test Sentry Connection"
5. Check console logs and your Sentry dashboard

### Option 2: Manual Testing
Create a test error anywhere in your app:
```typescript
import { errorManager } from '@/services/error/error-manager';

// This will automatically report to Sentry (medium+ severity)
const error = errorManager.createError(
  'Test error for Sentry',
  {
    userId: 'test-user',
    component: 'MyComponent',
    operation: 'test',
    timestamp: Date.now(),
  },
  {
    severity: 'high', // Will be sent to Sentry
    category: 'system',
  }
);
```

## 📊 Check Your Sentry Dashboard

Visit: https://sentry.io/organizations/meal-master-ai/projects/meal-master-ai-react-native/

You should see:
- **Issues**: Test errors and crashes
- **Performance**: Slow operations and API calls
- **User Feedback**: User context and sessions
- **Releases**: App version tracking

## 🔧 How It Works

1. **Automatic Reporting**: Errors with severity `medium` or higher are automatically sent to Sentry
2. **Rich Context**: Each error includes user ID, component, operation, and metadata
3. **Performance Monitoring**: Slow operations (>2s) are automatically tracked
4. **Crash Detection**: Native and JavaScript crashes are captured
5. **User Context**: User sessions and interactions are tracked
6. **Data Protection**: Sensitive data is automatically filtered

## 🚨 What Gets Reported to Sentry

### Automatically Reported:
- ✅ Medium severity errors and above
- ✅ Critical system failures
- ✅ API timeouts and failures
- ✅ Performance issues (>2s operations)
- ✅ Native and JavaScript crashes
- ✅ Food recognition failures
- ✅ Network connectivity issues

### NOT Reported (Stays Local):
- ❌ Low severity errors
- ❌ User validation errors
- ❌ Debug messages
- ❌ Sensitive user data (PII is filtered)

## 📱 Production Setup

For production deployment:
1. Set `EXPO_PUBLIC_ENVIRONMENT=production`
2. Update `EXPO_PUBLIC_APP_VERSION` with actual version
3. Ensure Sentry project is properly configured for production
4. Test error reporting in staging environment first

## 🛠️ Troubleshooting

### No Errors Appearing in Sentry?
1. Check that `EXPO_PUBLIC_SENTRY_DSN` is set correctly
2. Verify network connectivity
3. Ensure error severity is `medium` or higher
4. Check console logs for Sentry initialization messages

### Too Many Errors?
1. Adjust severity filtering in `error-manager.ts`
2. Update error categorization logic
3. Fine-tune circuit breaker thresholds

### Need More Context?
1. Add more telemetry data to error creation
2. Enhance user context with additional metadata
3. Increase breadcrumb frequency for debugging

## 🎯 Next Steps

1. **Test the integration** using the test button
2. **Monitor your dashboard** for incoming events
3. **Set up alerts** in Sentry for critical errors
4. **Configure release tracking** for production deployments
5. **Review error patterns** and improve error handling

Your Sentry integration is production-ready! 🎉