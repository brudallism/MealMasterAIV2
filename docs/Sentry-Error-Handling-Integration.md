# Sentry Error Handling Integration

## Overview

This document describes the comprehensive error handling and crash reporting system that integrates Sentry with the existing error management infrastructure in MealMasterAI.

## Architecture

### Components

1. **ErrorManager** (`src/services/error/error-manager.ts`)
   - Core error handling with circuit breakers, retry logic, and categorization
   - Automatically reports medium+ severity errors to Sentry
   - Provides comprehensive error context and user-friendly messages

2. **SentryIntegration** (`src/services/error/sentry-integration.ts`)
   - Modern Sentry integration for React Native/Expo
   - Handles crash reporting, performance monitoring, and user context
   - Filters sensitive data and provides graceful fallbacks

3. **App Initialization** (`App.tsx`)
   - Initializes Sentry on app startup
   - Configures environment-specific settings

### Integration Flow

```
Error Occurs → ErrorManager.createError() → reportToSentry() → SentryIntegration.reportError() → Sentry Cloud
```

## Features

### Error Management
- **Automatic Categorization**: Network, API, validation, system, performance errors
- **Severity Levels**: Low, medium, high, critical
- **Circuit Breaker Pattern**: Prevents cascade failures
- **Retry Logic**: Exponential backoff for transient errors
- **Recovery Actions**: User-friendly guidance for error resolution

### Sentry Integration
- **Crash Reporting**: Native and JavaScript crashes
- **Performance Monitoring**: API calls and slow operations
- **User Context**: User ID and metadata tracking
- **Breadcrumbs**: Debug trail for error investigation
- **Environment Awareness**: Development vs production settings

### Data Protection
- **Sensitive Data Filtering**: Removes PII and secrets from reports
- **Conditional Reporting**: Only medium+ severity errors sent to Sentry
- **Graceful Degradation**: Error handling never breaks the app

## Configuration

### Environment Variables

```bash
# Required for production
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional configuration
EXPO_PUBLIC_ENVIRONMENT=production|development|staging
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1
```

### Sentry Project Setup

1. **Create Sentry Project**
   - Organization: `meal-master-ai`
   - Project: `meal-master-ai-react-native`
   - Platform: React Native

2. **Configuration Files**
   - `sentry.properties`: Project configuration
   - Contains org, project, and CLI settings

## Usage Examples

### Basic Error Handling

```typescript
import { errorManager } from '@/services/error/error-manager';

// Create a detailed error
const error = errorManager.createError(
  'Database connection failed',
  {
    userId: 'user-123',
    component: 'DatabaseService',
    operation: 'connect',
    timestamp: Date.now(),
  },
  {
    severity: 'high',
    category: 'system',
    retryable: true,
  }
);
// This automatically reports to Sentry if severity >= medium
```

### Specialized Error Handlers

```typescript
// Food Recognition AI errors
const foodError = errorManager.handleFoodRecognitionError(
  'Could not recognize food item',
  'user-123',
  'mysterious blob',
  'validation'
);

// API errors with circuit breaker
const apiError = errorManager.handleAPIError(
  new Error('Rate limit exceeded'),
  'openai',
  '/chat/completions',
  'user-123'
);

// Network errors with device context
const networkError = errorManager.handleNetworkError(
  'Connection timeout',
  'fetch_user_data',
  'user-123'
);
```

### Direct Sentry Usage

```typescript
import { sentryIntegration } from '@/services/error/sentry-integration';

// Set user context
sentryIntegration.setUserContext('user-123', {
  email: 'user@example.com',
  plan: 'premium',
});

// Add breadcrumbs for debugging
sentryIntegration.addBreadcrumb(
  'User clicked save button',
  'user_interaction',
  { screen: 'MealEntry', mealType: 'lunch' }
);

// Report performance issues
sentryIntegration.reportPerformanceIssue(
  'slow_database_query',
  3000,
  { component: 'MealStore', operation: 'save_meal' }
);

// Report crashes
sentryIntegration.reportCrash(
  new Error('Critical failure'),
  { component: 'CoreService', userId: 'user-123' }
);
```

### Retry Logic with Circuit Breaker

```typescript
// Automatic retry with exponential backoff
const result = await errorManager.retryOperation(
  async () => {
    return await apiCall();
  },
  {
    component: 'APIClient',
    operation: 'api_call',
    userId: 'user-123',
  },
  3 // max retries
);

if (result.success) {
  console.log('Operation succeeded:', result.data);
} else {
  console.error('Operation failed after retries:', result.error);
}
```

## Error Categories and Severities

### Categories
- **`network`**: Connection issues, timeouts
- **`api`**: External API failures, rate limits
- **`validation`**: Data validation, user input errors
- **`system`**: Database, cache, internal system errors
- **`performance`**: Slow operations, memory issues
- **`user`**: User-caused errors, invalid actions

### Severities
- **`low`**: Minor issues, logged locally only
- **`medium`**: Notable issues, sent to Sentry
- **`high`**: Serious problems affecting functionality
- **`critical`**: System failures requiring immediate attention

## Monitoring and Analytics

### Error Statistics

```typescript
const stats = errorManager.getErrorStats();
console.log('Total errors (24h):', stats.totalErrors);
console.log('By severity:', stats.errorsBySeverity);
console.log('By category:', stats.errorsByCategory);
console.log('Recent errors:', stats.recentErrors);
```

### Circuit Breaker Status

```typescript
// Check if service is available
const isOpenAIAvailable = !errorManager.isCircuitOpen('openai');

// Manually record success/failure
errorManager.recordSuccess('custom-service');
errorManager.recordFailure('custom-service');
```

### Sentry Integration Status

```typescript
const status = sentryIntegration.getStatus();
console.log('Sentry initialized:', status.initialized);
console.log('Has client:', status.hasClient);

// Flush pending events
await sentryIntegration.flush(5000);
```

## Testing

### Running Tests

```bash
# Run Sentry integration tests
npm test src/services/error/__tests__/sentry-integration.test.ts

# Run comprehensive integration test
node test-error-sentry-integration.js
```

### Test Coverage

The test suite covers:
- ✅ Sentry initialization and configuration
- ✅ Error reporting with different severities
- ✅ Integration with ErrorManager
- ✅ Performance monitoring
- ✅ Crash reporting
- ✅ User context management
- ✅ Breadcrumb functionality
- ✅ Error recovery and graceful degradation

## Production Deployment

### Pre-deployment Checklist

1. **Environment Configuration**
   - [ ] Set `EXPO_PUBLIC_SENTRY_DSN`
   - [ ] Configure `EXPO_PUBLIC_ENVIRONMENT=production`
   - [ ] Set proper app version and build number

2. **Sentry Project Setup**
   - [ ] Create production Sentry project
   - [ ] Configure release tracking
   - [ ] Set up alerts and notifications

3. **Testing**
   - [ ] Verify error reporting in staging
   - [ ] Test crash reporting
   - [ ] Validate performance monitoring

### Release Management

```typescript
// Configure release information
sentryIntegration.configureRelease('1.0.0', 'production');

// Track deployment
sentryIntegration.addBreadcrumb(
  'App deployed',
  'deployment',
  { version: '1.0.0', environment: 'production' }
);
```

## Troubleshooting

### Common Issues

1. **Sentry Not Reporting**
   - Check DSN configuration
   - Verify network connectivity
   - Ensure severity is medium or higher

2. **Performance Impact**
   - Monitoring is lightweight by design
   - Circuit breakers prevent cascade failures
   - Graceful degradation if Sentry is unavailable

3. **Development Mode**
   - Sentry skips initialization without DSN
   - Debug mode provides verbose logging
   - Mock integration for testing

### Debug Mode

```typescript
// Enable debug mode in development
sentryIntegration.initialize({
  debug: __DEV__,
  environment: 'development',
});
```

## Security Considerations

### Data Protection
- PII is automatically filtered from error reports
- Sensitive keys and tokens are removed
- Stack traces are sanitized
- File paths are truncated

### Network Security
- All communication with Sentry is encrypted
- DSN can be restricted by domain
- Rate limiting prevents abuse

## Maintenance

### Regular Tasks
1. **Review Error Patterns**: Weekly analysis of error trends
2. **Update Filters**: Adjust sensitive data filters as needed
3. **Performance Monitoring**: Track and optimize slow operations
4. **Circuit Breaker Tuning**: Adjust thresholds based on service reliability

### Error Queue Management
```typescript
// Clear old errors (runs automatically)
errorManager.clearOldErrors(24 * 60 * 60 * 1000); // 24 hours
```

## Future Enhancements

### Planned Features
- **Behavioral Error Analysis**: ML-powered error pattern recognition
- **Predictive Error Prevention**: Proactive error prevention
- **Enhanced Performance Monitoring**: Detailed transaction tracing
- **Custom Error Dashboards**: Real-time error monitoring UI

### Integration Roadmap
- **Version 0.2**: Behavioral-aware error handling
- **Version 0.3**: Predictive error prevention
- **Version 1.0**: Full production monitoring suite

## Support

For issues with the error handling system:
1. Check the error logs in development mode
2. Review Sentry dashboard for production issues
3. Consult the test suite for usage examples
4. Reference the implementation guides in `/docs`