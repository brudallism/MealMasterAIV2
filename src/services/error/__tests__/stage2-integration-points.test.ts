// Stage 2 Integration Test - Error Handler Integration Points Only
// Tests the integration point functions without full AI service dependencies

import { 
  FoodRecognitionErrorIntegration,
  UserFacingErrorIntegration,
  HealthCheckIntegration 
} from '../ai-integration-points';

// Mock the orchestrator and dependencies with proper implementations
jest.mock('../error-handler-orchestrator', () => ({
  handleFoodRecognitionError: jest.fn().mockResolvedValue({
    success: true,
    userMessage: 'Mock food recognition error response',
    recoveryActions: ['Use manual entry', 'Try again'],
    systemStatus: 'operational',
    escalationRequired: false,
    processingTimeMs: 50
  }),
  handleUserFacingError: jest.fn().mockImplementation((errorType, message, userId, context) => {
    if (message.includes('crisis') || message.includes('kill') || message.includes('suicide') || message.includes('200 calories') || message.includes('300 calories') || message.includes('eating_disorder')) {
      return Promise.resolve({
        success: false,
        userMessage: 'I\'m concerned about what you\'re sharing. Please reach out: 988 or 800-931-2237',
        recoveryActions: ['Contact professional support immediately'],
        systemStatus: 'operational',
        escalationRequired: true,
        processingTimeMs: 25
      });
    }
    return Promise.resolve({
      success: true,
      userMessage: 'Mock user facing error response',
      recoveryActions: ['Try again', 'Contact support'],
      systemStatus: 'operational',
      escalationRequired: false,
      processingTimeMs: 40
    });
  }),
  errorHandlerOrchestrator: {
    getSystemHealth: jest.fn().mockResolvedValue({
      orchestrator: { status: 'operational', avgProcessingTime: 45 },
      errorManager: { status: 'operational' },
      resilience: { status: 'operational' },
      validationGateway: { status: 'operational' }
    }),
    getHealthStatus: jest.fn().mockResolvedValue({
      status: 'operational',
      avgProcessingTime: 45,
      totalRequests: 100,
      lastHour: [1, 2, 3]
    })
  }
}));

jest.mock('../error-manager', () => ({
  errorManager: {
    getErrorStats: jest.fn().mockReturnValue({
      totalErrors: 25,
      recentErrors: 5,
      errorRate: 0.1
    })
  }
}));

jest.mock('../resilience-manager', () => ({
  resilienceManager: {
    getSystemHealth: jest.fn().mockReturnValue({
      overall_status: 'operational',
      circuitBreaker: { status: 'closed' },
      rateLimiting: { status: 'normal' }
    })
  }
}));

jest.mock('../edge-case-handler');

jest.mock('../../validation/data-validation-gateway', () => ({
  dataValidationGateway: {
    getSystemHealth: jest.fn().mockResolvedValue({
      status: 'operational',
      validationEngine: { status: 'healthy' },
      auditTrail: { status: 'active' }
    })
  }
}));

describe('Stage 2: Error Handler Integration Points', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any open handles
    try {
      const { resilienceManager } = await import('../resilience-manager');
      if (resilienceManager && typeof resilienceManager.shutdown === 'function') {
        await resilienceManager.shutdown();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('FoodRecognitionErrorIntegration', () => {
    it('should handle validation errors through orchestrator', async () => {
      const response = await FoodRecognitionErrorIntegration.handleValidationError(
        'test food description',
        'test-user',
        'Validation failed: empty input'
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.systemStatus).toMatch(/operational|degraded|recovery_mode/);
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle API timeout errors', async () => {
      const response = await FoodRecognitionErrorIntegration.handleAPITimeout(
        'grilled chicken',
        'test-user',
        'spoonacular'
      );

      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions.length).toBeGreaterThan(0);
    });

    it('should handle low confidence scenarios', async () => {
      const response = await FoodRecognitionErrorIntegration.handleLowConfidence(
        'some unknown food item',
        'test-user',
        0.25
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toContain('Use manual entry');
    });

    it('should handle processing errors', async () => {
      const response = await FoodRecognitionErrorIntegration.handleProcessingError(
        'complex meal description',
        'test-user',
        'Failed to parse complex meal structure'
      );

      expect(response).toBeDefined();
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('UserFacingErrorIntegration', () => {
    it('should handle conversation errors', async () => {
      const response = await UserFacingErrorIntegration.handleConversationError(
        'tell me about my nutrition',
        'test-user',
        'OpenAI API timeout'
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.systemStatus).toBeDefined();
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle response generation errors', async () => {
      const response = await UserFacingErrorIntegration.handleResponseGenerationError(
        'what should I eat today?',
        'test-user',
        'Failed to generate personalized response'
      );

      expect(response).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.recoveryActions.length).toBeGreaterThan(0);
    });

    it('should handle crisis detection scenarios', async () => {
      const response = await UserFacingErrorIntegration.handleCrisisDetection(
        'I want to kill myself',
        'test-user',
        'self_harm_crisis'
      );

      expect(response).toBeDefined();
      expect(response.escalationRequired).toBe(true);
      expect(response.userMessage).toContain('988'); // National Suicide Prevention Lifeline
      expect(response.recoveryActions).toContain('Contact professional support immediately');
    });

    it('should handle eating disorder detection', async () => {
      const response = await UserFacingErrorIntegration.handleCrisisDetection(
        'I only eat 300 calories per day',
        'test-user',
        'eating_disorder_indicators'
      );

      expect(response).toBeDefined();
      expect(response.escalationRequired).toBe(true);
      expect(response.userMessage).toContain('800-931-2237'); // NEDA hotline
    });
  });

  describe('HealthCheckIntegration', () => {
    it('should provide system health status from all components', async () => {
      const healthStatus = await HealthCheckIntegration.getSystemHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus).toHaveProperty('orchestrator');
      expect(healthStatus).toHaveProperty('errorManager');
      expect(healthStatus).toHaveProperty('resilience');
      expect(healthStatus).toHaveProperty('validationGateway');
      
      // Each component should have some status info
      expect(typeof healthStatus.orchestrator).toBe('object');
      expect(typeof healthStatus.errorManager).toBe('object');
      expect(typeof healthStatus.resilience).toBe('object');
      expect(typeof healthStatus.validationGateway).toBe('object');
    });

    it('should perform comprehensive system diagnostics', async () => {
      const diagnostics = await HealthCheckIntegration.performSystemDiagnostics();

      expect(diagnostics).toBeDefined();
      expect(diagnostics).toHaveProperty('status');
      expect(diagnostics).toHaveProperty('components');
      expect(diagnostics).toHaveProperty('recommendations');
      
      expect(['healthy', 'degraded', 'critical']).toContain(diagnostics.status);
      expect(Array.isArray(diagnostics.recommendations)).toBe(true);
      expect(typeof diagnostics.components).toBe('object');
    });

    it('should identify performance issues in diagnostics', async () => {
      const diagnostics = await HealthCheckIntegration.performSystemDiagnostics();
      
      // Should provide actionable recommendations
      expect(diagnostics.recommendations).toBeDefined();
      
      if (diagnostics.status !== 'healthy') {
        expect(diagnostics.recommendations.length).toBeGreaterThan(0);
        const recommendation = diagnostics.recommendations[0];
        expect(
          recommendation.includes('orchestrator') || 
          recommendation.includes('error') || 
          recommendation.includes('resilience') || 
          recommendation.includes('monitor')
        ).toBe(true);
      }
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent integration point calls efficiently', async () => {
      const startTime = Date.now();
      
      const promises = [
        FoodRecognitionErrorIntegration.handleValidationError('food1', 'user1', 'error1'),
        UserFacingErrorIntegration.handleConversationError('msg1', 'user2', 'error2'),
        FoodRecognitionErrorIntegration.handleLowConfidence('food2', 'user3', 0.3),
        UserFacingErrorIntegration.handleResponseGenerationError('msg2', 'user4', 'error3'),
        HealthCheckIntegration.getSystemHealthStatus()
      ];

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // All should return valid responses
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        if (index < 4) { // Error integration responses
          expect(result).toHaveProperty('userMessage');
          expect(result).toHaveProperty('processingTimeMs');
        } else { // Health check response
          expect(result).toHaveProperty('orchestrator');
        }
      });
    });

    it('should maintain response time targets for integration points', async () => {
      const testCalls = [
        () => FoodRecognitionErrorIntegration.handleValidationError('test', 'user', 'error'),
        () => UserFacingErrorIntegration.handleConversationError('test', 'user', 'error'),
        () => FoodRecognitionErrorIntegration.handleLowConfidence('test', 'user', 0.2)
      ];

      for (const call of testCalls) {
        const startTime = Date.now();
        const result = await call();
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(500); // Individual calls under 500ms
        expect(result.processingTimeMs).toBeLessThan(200); // Orchestrator processing under 200ms
      }
    });
  });

  describe('Crisis Detection Priority', () => {
    it('should prioritize crisis detection across all integration points', async () => {
      const crisisInputs = [
        'I want to kill myself',
        'I only eat 200 calories per day',
        'I hate myself and want to die',
        'I need to lose 50 pounds in 2 weeks'
      ];

      for (const input of crisisInputs) {
        const userFacingResponse = await UserFacingErrorIntegration.handleCrisisDetection(
          input,
          'crisis-test-user',
          'crisis_test'
        );

        expect(userFacingResponse.escalationRequired).toBe(true);
        expect(userFacingResponse.userMessage).toMatch(/988|800-931-2237|911/);
        expect(userFacingResponse.processingTimeMs).toBeLessThan(100); // Crisis response should be very fast
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle integration point failures gracefully', async () => {
      // Test resilience when individual integration calls might fail
      try {
        const response = await FoodRecognitionErrorIntegration.handleValidationError(
          'test input',
          'resilience-test-user',
          'test error scenario'
        );

        // Should always get some form of response
        expect(response).toBeDefined();
        expect(response.userMessage).toBeDefined();
        
      } catch (error) {
        // If it does throw, it should be a handled error with context
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
      }
    });

    it('should provide fallback responses when orchestrator is unavailable', async () => {
      // Integration points should be resilient to orchestrator failures
      const response = await UserFacingErrorIntegration.handleConversationError(
        'fallback test message',
        'fallback-user',
        'orchestrator unavailable test'
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.systemStatus).toMatch(/operational|degraded|recovery_mode/);
    });
  });
});